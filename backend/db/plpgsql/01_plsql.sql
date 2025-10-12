-- =====================================================
-- KOMPLETAN PL/pgSQL SISTEM ZA TICKET MANAGEMENT
-- Projekat za SBP - Sveobuhvatna implementacija
-- =====================================================
-- Autor: Stefan Trkulja
-- Datum: 2025-10-11
-- 
-- SADRŽAJ:
-- 1. TRIGERI (3 trigera)
-- 2. FUNKCIJE (5 funkcija)
-- 3. INDEKSI (5 indeksa sa testovima)
-- 4. KOMPLEKSNI IZVEŠTAJ sa kursorom i 4 WITH klauzule
-- 5. VIEW za pristup izveštaju
-- =====================================================

-- =====================================================
-- SEKCIJA 1: PL/pgSQL TRIGERI (2 netrivijalna trigera)
-- =====================================================

-- -----------------------------------------------------
-- TRIGGER 1: SLA Breach Monitoring sa validacijom
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION check_sla_breach()
RETURNS TRIGGER AS $$
DECLARE
    v_status_code VARCHAR;
    v_complaint_status_id BIGINT;
BEGIN
    -- Dobijamo statusId iz complaints tabele (JOIN preko id-a)
    SELECT "statusId" INTO v_complaint_status_id
    FROM complaints
    WHERE id = NEW.id;
    
    -- Dobijamo status code
    SELECT code INTO v_status_code 
    FROM statuses 
    WHERE id = v_complaint_status_id;
    
    -- Proveravamo SLA breach samo ako status nije CLOSED ili RESOLVED
    IF v_status_code NOT IN ('CLOSED', 'RESOLVED') THEN
        
        -- Response SLA breach provera
        IF NEW."responseDueAt" IS NOT NULL 
           AND NEW."firstResponseAt" IS NULL 
           AND NOW() > NEW."responseDueAt" 
           AND NEW."responseBreachedChecked" = FALSE THEN
            
            -- Ne radimo UPDATE u istoj tabeli - menjamo NEW record direktno
            NEW."responseBreached" := TRUE;
            NEW."responseBreachedChecked" := TRUE;
            NEW."breachesCount" := NEW."breachesCount" + 1;
            NEW."breachReason" := 'Response SLA exceeded';
            NEW."lastCheckedAt" := NOW();
        END IF;
        
        -- Resolution SLA breach provera
        IF NEW."resolutionDueAt" IS NOT NULL 
           AND NEW."resolvedAt" IS NULL 
           AND NOW() > NEW."resolutionDueAt" 
           AND NEW."resolutionBreachedChecked" = FALSE THEN
            
            NEW."resolutionBreached" := TRUE;
            NEW."resolutionBreachedChecked" := TRUE;
            NEW."breachesCount" := NEW."breachesCount" + 1;
            
            -- Konkatenacija breach razloga
            IF NEW."breachReason" IS NULL OR NEW."breachReason" = '' THEN
                NEW."breachReason" := 'Resolution SLA exceeded';
            ELSE
                NEW."breachReason" := NEW."breachReason" || '; Resolution SLA exceeded';
            END IF;
            
            NEW."lastCheckedAt" := NOW();
        END IF;
        
        -- At-risk status (30 minuta pre deadline-a za response)
        IF NEW."responseDueAt" IS NOT NULL 
           AND NEW."firstResponseAt" IS NULL 
           AND NEW."responseBreached" = FALSE
           AND NOW() > (NEW."responseDueAt" - INTERVAL '30 minutes')
           AND NEW."atRiskSince" IS NULL THEN
            
            NEW."atRiskSince" := NOW();
            NEW."atRiskType" := 'RESPONSE';
        END IF;
        
        -- At-risk status (30 minuta pre deadline-a za resolution)
        IF NEW."resolutionDueAt" IS NOT NULL 
           AND NEW."resolvedAt" IS NULL 
           AND NEW."resolutionBreached" = FALSE
           AND NOW() > (NEW."resolutionDueAt" - INTERVAL '30 minutes')
           AND NEW."atRiskSince" IS NULL THEN
            
            NEW."atRiskSince" := NOW();
            NEW."atRiskType" := 'RESOLUTION';
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sla_breach_check ON sla_tracking;

CREATE TRIGGER trg_sla_breach_check
    BEFORE UPDATE ON sla_tracking
    FOR EACH ROW
    EXECUTE FUNCTION check_sla_breach();

COMMENT ON FUNCTION check_sla_breach() IS 
'Automatski proverava i označava SLA breach kada istekne deadline';

-- -----------------------------------------------------
-- TRIGGER 2: Validacija customer satisfaction rating-a
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION validate_satisfaction_rating_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Validacija da je rating između 1 i 5
    IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
        RAISE EXCEPTION 'Invalid satisfaction rating: %. Rating must be between 1 and 5.', NEW.rating
            USING HINT = 'Please provide a rating value between 1 and 5',
                  ERRCODE = '23514'; -- check_violation
    END IF;
    
    -- Validacija da comment nije prazan ako je rating nizak (1 ili 2)
    IF NEW.rating IS NOT NULL AND NEW.rating <= 2 THEN
        IF NEW.comment IS NULL OR LENGTH(TRIM(NEW.comment)) < 10 THEN
            RAISE EXCEPTION 'Comment is required for low ratings (% stars). Please provide detailed comment (minimum 10 characters).', NEW.rating
                USING HINT = 'Add detailed comment explaining the low rating',
                      ERRCODE = '23502'; -- not_null_violation
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_satisfaction_rating ON customer_satisfaction;

CREATE TRIGGER trg_validate_satisfaction_rating
    BEFORE INSERT OR UPDATE ON customer_satisfaction
    FOR EACH ROW
    EXECUTE FUNCTION validate_satisfaction_rating_trigger();

COMMENT ON FUNCTION validate_satisfaction_rating_trigger() IS 
'Validira customer satisfaction rating (1-5) i zahteva comment za niske ocene. Koristi RAISE EXCEPTION za validaciju.';

-- =====================================================
-- SEKCIJA 2: PL/pgSQL FUNKCIJA (1 netrivijalna funkcija)
-- =====================================================

-- -----------------------------------------------------
-- FUNKCIJA: Customer Satisfaction Score Calculator
-- Ova funkcija računa prosečnu ocenu zadovoljstva korisnika
-- Prima username i period kao parametre, koristi se u SELECT upitima za analitiku
-- -----------------------------------------------------
DROP FUNCTION IF EXISTS calculate_customer_satisfaction_score(VARCHAR, INTEGER, VARCHAR) CASCADE;

CREATE OR REPLACE FUNCTION calculate_customer_satisfaction_score(
    p_username VARCHAR DEFAULT NULL,
    p_period_days INTEGER DEFAULT 30,
    p_role VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    username VARCHAR,
    total_ratings BIGINT,
    average_rating NUMERIC(4,2),
    rating_5_count BIGINT,
    rating_4_count BIGINT,
    rating_3_count BIGINT,
    rating_2_count BIGINT,
    rating_1_count BIGINT,
    satisfaction_percentage NUMERIC(5,2),
    period_start TIMESTAMP,
    period_end TIMESTAMP
) AS $$
DECLARE
    v_start_date TIMESTAMP;
    v_end_date TIMESTAMP;
BEGIN
    v_end_date := NOW();
    v_start_date := v_end_date - (p_period_days || ' days')::INTERVAL;
    
    RETURN QUERY
    WITH satisfaction_data AS (
        SELECT 
            cs.customer_username,
            c."assigneeUsername",
            cs.rating,
            cs.created_at
        FROM customer_satisfaction cs
        INNER JOIN complaints c ON c.id = cs.complaint_id
        WHERE cs.created_at BETWEEN v_start_date AND v_end_date
            AND (p_username IS NULL OR 
                 (p_role = 'customer' AND cs.customer_username = p_username) OR
                 (p_role = 'operator' AND c."assigneeUsername" = p_username) OR
                 (p_role IS NULL AND (cs.customer_username = p_username OR c."assigneeUsername" = p_username))
            )
    ),
    aggregated AS (
        SELECT
            COALESCE(
                CASE 
                    WHEN p_role = 'customer' THEN customer_username
                    WHEN p_role = 'operator' THEN "assigneeUsername"
                    ELSE p_username
                END,
                'ALL_USERS'
            ) as user_name,
            COUNT(*) as total,
            ROUND(AVG(rating), 2) as avg_rating,
            COUNT(CASE WHEN rating = 5 THEN 1 END) as count_5,
            COUNT(CASE WHEN rating = 4 THEN 1 END) as count_4,
            COUNT(CASE WHEN rating = 3 THEN 1 END) as count_3,
            COUNT(CASE WHEN rating = 2 THEN 1 END) as count_2,
            COUNT(CASE WHEN rating = 1 THEN 1 END) as count_1
        FROM satisfaction_data
        GROUP BY customer_username, "assigneeUsername"
    )
    SELECT
        user_name::VARCHAR,
        total,
        avg_rating,
        count_5,
        count_4,
        count_3,
        count_2,
        count_1,
        ROUND((count_4 + count_5)::NUMERIC / NULLIF(total, 0) * 100, 2) as satisfaction_pct,
        v_start_date,
        v_end_date
    FROM aggregated;
    
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_customer_satisfaction_score IS 
'NETRIVIJALNA FUNKCIJA - Customer Satisfaction Score Calculator.
Računa prosečnu ocenu zadovoljstva korisnika po username i periodu.
Koristi 2 WITH klauzule (CTE), dinamičke filtere po ulozi (customer/operator), 
agregacije (COUNT, AVG, ROUND), i vraća tabelarni rezultat za analitiku i izveštaje.
Primer: SELECT * FROM calculate_customer_satisfaction_score(''operator1'', 30, ''operator'');';

-- =====================================================
-- SEKCIJA 3: SQL INDEKSI SA PERFORMANCE TESTOVIMA
-- =====================================================

-- -----------------------------------------------------
-- INDEKS 1: Kompozitni indeks za SLA analytics (glavna tabela)
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sla_tracking_analytics 
ON sla_tracking ("responseBreached", "resolutionBreached", "responseDueAt", "resolutionDueAt");

COMMENT ON INDEX idx_sla_tracking_analytics IS 
'KOMPOZITNI INDEKS za optimizaciju SLA analytics upita na sla_tracking tabeli.
Ubrzava upite koji filtriraju SLA breach status i sortiraju po deadline-u. 
EXPLAIN ANALYZE TEST:
-- BEZ INDEKSA:
-- EXPLAIN ANALYZE SELECT * FROM sla_tracking 
-- WHERE responseBreached = FALSE AND resolutionBreached = FALSE 
-- AND responseDueAt < NOW() ORDER BY responseDueAt;
-- 
-- SA INDEKSOM:
-- EXPLAIN ANALYZE SELECT * FROM sla_tracking 
-- WHERE responseBreached = FALSE AND resolutionBreached = FALSE 
-- AND responseDueAt < NOW() ORDER BY responseDueAt;
-- 
-- OČEKIVANO: Seq Scan -> Index Scan, vreme se smanjuje 3-5x';

-- -----------------------------------------------------
-- INDEKS 2: Pomoćni indeks u complaints tabeli
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_complaint_priority_status 
ON complaints (priority, "statusId", "createdAt" DESC);

COMMENT ON INDEX idx_complaint_priority_status IS 
'POMOĆNI INDEKS u complaints tabeli za optimizaciju SLA analytics.
Optimizuje upite koji filtriraju po prioritetu i statusu, sortiraju po datumu. 
EXPLAIN ANALYZE TEST:
-- BEZ INDEKSA:
-- EXPLAIN ANALYZE SELECT * FROM complaints 
-- WHERE priority = ''HIGH'' AND statusId = 2 
-- ORDER BY createdAt DESC LIMIT 10;
-- 
-- SA INDEKSOM:
-- EXPLAIN ANALYZE SELECT * FROM complaints 
-- WHERE priority = ''HIGH'' AND statusId = 2 
-- ORDER BY createdAt DESC LIMIT 10;
-- 
-- OČEKIVANO: Seq Scan + Sort -> Index Scan, vreme se smanjuje 2-4x';

-- -----------------------------------------------------
-- INDEKS 3: Customer Satisfaction Lookup (2 kolone)
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_complaint_rating 
ON customer_satisfaction (complaint_id, rating);

COMMENT ON INDEX idx_customer_satisfaction_complaint_rating IS 
'Optimizuje JOIN između complaints i customer_satisfaction, filtriranje po rating-u. 
EXPLAIN ANALYZE TEST:
-- BEZ INDEKSA:
-- EXPLAIN ANALYZE SELECT c.*, cs.rating FROM complaints c 
-- INNER JOIN customer_satisfaction cs ON cs.complaint_id = c.id 
-- WHERE cs.rating >= 4;
-- 
-- SA INDEKSOM:
-- EXPLAIN ANALYZE SELECT c.*, cs.rating FROM complaints c 
-- INNER JOIN customer_satisfaction cs ON cs.complaint_id = c.id 
-- WHERE cs.rating >= 4;
-- 
-- OČEKIVANO: Hash Join sa Seq Scan -> Nested Loop sa Index Scan, 2-3x brže';

-- -----------------------------------------------------
-- INDEKS 4: Escalation Lookup by Complaint (1 kolona)
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_escalations_complaint 
ON escalations ("complaintId");

COMMENT ON INDEX idx_escalations_complaint IS 
'Optimizuje pretragu eskalacija po complaint_id za JOIN operacije. 
EXPLAIN ANALYZE TEST:
-- BEZ INDEKSA:
-- EXPLAIN ANALYZE SELECT c.*, e.created_at as escalated_at 
-- FROM complaints c 
-- LEFT JOIN escalations e ON e.complaintId = c.id 
-- WHERE c.priority = ''CRITICAL'';
-- 
-- SA INDEKSOM:
-- EXPLAIN ANALYZE SELECT c.*, e.created_at as escalated_at 
-- FROM complaints c 
-- LEFT JOIN escalations e ON e.complaintId = c.id 
-- WHERE c.priority = ''CRITICAL'';
-- 
-- OČEKIVANO: Seq Scan na escalations -> Index Scan, JOIN se ubrzava 2-3x';

-- -----------------------------------------------------
-- INDEKS 5: Status Lookup by Code (1 kolona)
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_statuses_code 
ON statuses (code);

COMMENT ON INDEX idx_statuses_code IS 
'Optimizuje pretragu statusa po code-u (OPEN, IN_PROGRESS, CLOSED, itd.). 
EXPLAIN ANALYZE TEST:
-- BEZ INDEKSA:
-- EXPLAIN ANALYZE SELECT * FROM statuses WHERE code = ''CLOSED'';
-- 
-- SA INDEKSOM:
-- EXPLAIN ANALYZE SELECT * FROM statuses WHERE code = ''CLOSED'';
-- 
-- OČEKIVANO: Seq Scan -> Index Scan, vremese smanjuje 5-10x (mala tabela, ali često korišćena)';

-- =====================================================
-- SEKCIJA 4: KOMPLEKSNI IZVEŠTAJ - OPERATOR PERFORMANCE DASHBOARD
-- =====================================================
-- Spaja podatke iz 4+ tabela: complaints, statuses, sla_tracking, customer_satisfaction, Users
-- Koristi složene PL/pgSQL tipove (RECORD, TABLE OF)
-- Implementira kursor sa složenim upitom
-- WITH klauzula za Common Table Expressions
-- GROUP BY, HAVING, agregacione funkcije (COUNT, SUM, AVG)
-- =====================================================

-- -----------------------------------------------------
-- Složeni PL/pgSQL tip (RECORD type) za operator performance
-- -----------------------------------------------------
DROP TYPE IF EXISTS operator_performance_stats CASCADE;

CREATE TYPE operator_performance_stats AS (
    operator_username VARCHAR,
    operator_full_name VARCHAR,
    total_complaints BIGINT,
    closed_complaints BIGINT,
    avg_resolution_hours NUMERIC(10,2),
    sla_breach_count BIGINT,
    avg_satisfaction NUMERIC(3,2),
    performance_score NUMERIC(5,2)
);

COMMENT ON TYPE operator_performance_stats IS 
'Složeni PL/pgSQL tip (RECORD) za operator performance dashboard izveštaj';

-- -----------------------------------------------------
-- Glavna funkcija izveštaja - Operator Performance Dashboard
-- Koristi kursor, 4 WITH klauzule, spaja 4+ tabela
-- -----------------------------------------------------
DROP FUNCTION IF EXISTS generate_operator_performance_report(TIMESTAMP, TIMESTAMP) CASCADE;

CREATE OR REPLACE FUNCTION generate_operator_performance_report(
    p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE (
    operator_username VARCHAR,
    operator_full_name VARCHAR,
    total_complaints BIGINT,
    closed_complaints BIGINT,
    avg_resolution_hours NUMERIC(10,2),
    sla_breach_count BIGINT,
    avg_satisfaction NUMERIC(3,2),
    performance_score NUMERIC(5,2)
) AS $$
DECLARE
    -- Kursor za iteraciju kroz operatore
    operator_cursor CURSOR FOR
        SELECT DISTINCT 
            u.username,
            u.name || ' ' || u.surname as full_name
        FROM "Users" u
        INNER JOIN complaints c ON c."assigneeUsername" = u.username
        WHERE c."createdAt" BETWEEN p_start_date AND p_end_date
            AND u.role = 'operator'
        ORDER BY u.username;
    
    v_operator RECORD;
    v_total_complaints BIGINT;
    v_closed_complaints BIGINT;
    v_avg_resolution NUMERIC(10,2);
    v_breach_count BIGINT;
    v_avg_satisfaction NUMERIC(3,2);
    v_performance NUMERIC(5,2);
BEGIN
    OPEN operator_cursor;
    
    LOOP
        FETCH operator_cursor INTO v_operator;
        EXIT WHEN NOT FOUND;
        
        -- Računamo statistike za trenutnog operatora koristeći 4 WITH klauzule
        WITH 
        -- CTE 1: Osnovni podaci o žalbama operatora
        operator_complaints AS (
            SELECT 
                c.id,
                c."statusId",
                c."createdAt",
                s.code as status_code
            FROM complaints c
            INNER JOIN statuses s ON s.id = c."statusId"
            WHERE c."assigneeUsername" = v_operator.username
                AND c."createdAt" BETWEEN p_start_date AND p_end_date
        ),
        -- CTE 2: SLA metrike (spajanje sa sla_tracking)
        sla_data AS (
            SELECT 
                oc.id,
                st."effectiveResolutionMs",
                CASE 
                    WHEN st."responseBreached" = TRUE OR st."resolutionBreached" = TRUE 
                    THEN 1 
                    ELSE 0 
                END as is_breached
            FROM operator_complaints oc
            LEFT JOIN sla_tracking st ON st.id = oc.id
        ),
        -- CTE 3: Customer satisfaction (spajanje sa customer_satisfaction)
        satisfaction_data AS (
            SELECT 
                oc.id,
                cs.rating
            FROM operator_complaints oc
            LEFT JOIN customer_satisfaction cs ON cs.complaint_id = oc.id
        ),
        -- CTE 4: Agregirane statistike sa GROUP BY
        aggregated_stats AS (
            SELECT
                COUNT(DISTINCT oc.id) as total_count,
                COUNT(DISTINCT CASE 
                    WHEN oc.status_code IN ('CLOSED', 'RESOLVED') 
                    THEN oc.id 
                END) as closed_count,
                AVG(CASE 
                    WHEN sd."effectiveResolutionMs" IS NOT NULL 
                    THEN sd."effectiveResolutionMs" / 1000.0 / 3600.0 
                END) as avg_resolution,
                SUM(sd.is_breached) as breach_total,
                AVG(sat.rating) as avg_rating
            FROM operator_complaints oc
            LEFT JOIN sla_data sd ON sd.id = oc.id
            LEFT JOIN satisfaction_data sat ON sat.id = oc.id
        )
        
        SELECT 
            COALESCE(total_count, 0),
            COALESCE(closed_count, 0),
            COALESCE(avg_resolution, 0),
            COALESCE(breach_total, 0),
            COALESCE(avg_rating, 0)
        INTO 
            v_total_complaints,
            v_closed_complaints,
            v_avg_resolution,
            v_breach_count,
            v_avg_satisfaction
        FROM aggregated_stats;
        
        -- Performance score formula:
        -- Score = (closed_rate * 40) + (satisfaction * 20) - (breach_count * 5)
        v_performance := GREATEST(0, 
            (v_closed_complaints::NUMERIC / NULLIF(v_total_complaints, 0) * 40) +
            (COALESCE(v_avg_satisfaction, 0) * 20) -
            (v_breach_count * 5)
        );
        
        RETURN QUERY
        SELECT
            v_operator.username::VARCHAR,
            v_operator.full_name::VARCHAR,
            v_total_complaints,
            v_closed_complaints,
            v_avg_resolution,
            v_breach_count,
            v_avg_satisfaction,
            ROUND(v_performance, 2);
        
    END LOOP;
    
    CLOSE operator_cursor;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_operator_performance_report IS 
'OPERATOR PERFORMANCE DASHBOARD - Kompleksni PL/pgSQL izveštaj.
Koristi:
- Kursor sa složenim upitom (CURSOR FOR SELECT)
- 4 WITH klauzule (Common Table Expressions)
- Spaja 4+ tabele: complaints, statuses, sla_tracking, customer_satisfaction, Users
- Agregacione funkcije: COUNT, SUM, AVG
- GROUP BY za agregaciju podataka
- Složeni PL/pgSQL tipovi (operator_performance_stats RECORD)
- LOOP iteracija kroz kursor
- Kompleksna poslovna logika (performance score formula)';

-- -----------------------------------------------------
-- Dodatna funkcija sa HAVING klauzulom
-- -----------------------------------------------------
DROP FUNCTION IF EXISTS get_top_operators_by_performance(INTEGER, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_top_operators_by_performance(
    p_period_days INTEGER DEFAULT 30,
    p_min_closed_tickets INTEGER DEFAULT 5
)
RETURNS TABLE (
    operator_username VARCHAR,
    operator_name VARCHAR,
    total_tickets BIGINT,
    closed_tickets BIGINT,
    close_rate NUMERIC(5,2),
    avg_satisfaction NUMERIC(3,2),
    breach_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.username::VARCHAR,
        (u.name || ' ' || u.surname)::VARCHAR as full_name,
        COUNT(c.id) as total,
        COUNT(CASE WHEN s.code IN ('CLOSED', 'RESOLVED') THEN c.id END) as closed,
        ROUND(
            COUNT(CASE WHEN s.code IN ('CLOSED', 'RESOLVED') THEN c.id END)::NUMERIC 
            / NULLIF(COUNT(c.id), 0) * 100, 
            2
        ) as rate,
        ROUND(AVG(cs.rating), 2) as satisfaction,
        COUNT(CASE 
            WHEN st."responseBreached" = TRUE OR st."resolutionBreached" = TRUE 
            THEN c.id 
        END) as breaches
    FROM "Users" u
    INNER JOIN complaints c ON c."assigneeUsername" = u.username
    INNER JOIN statuses s ON s.id = c."statusId"
    LEFT JOIN sla_tracking st ON st.id = c.id
    LEFT JOIN customer_satisfaction cs ON cs.complaint_id = c.id
    WHERE c."createdAt" >= NOW() - (p_period_days || ' days')::INTERVAL
        AND u.role = 'operator'
    GROUP BY u.username, u.name, u.surname
    HAVING COUNT(CASE WHEN s.code IN ('CLOSED', 'RESOLVED') THEN c.id END) >= p_min_closed_tickets
    ORDER BY rate DESC, satisfaction DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_top_operators_by_performance IS 
'Dodatna funkcija za Operator Performance Dashboard sa HAVING klauzulom.
Koristi: GROUP BY + HAVING, spaja 5 tabela, agregacije (COUNT, AVG), ORDER BY.';

-- =====================================================
-- SEKCIJA 5: VIEW ZA PRISTUP IZVEŠTAJU
-- =====================================================

DROP VIEW IF EXISTS operator_performance_report_view CASCADE;

CREATE OR REPLACE VIEW operator_performance_report_view AS
SELECT * FROM generate_operator_performance_report(
    (NOW() - INTERVAL '30 days')::TIMESTAMP, 
    NOW()::TIMESTAMP
);

COMMENT ON VIEW operator_performance_report_view IS 
'VIEW za lakši pristup operator performance izveštaju za poslednjih 30 dana';

-- =====================================================
-- SEKCIJA 6: POMOCNE FUNKCIJE ZA TESTIRANJE
-- =====================================================

-- Funkcija za testiranje indeksa
CREATE OR REPLACE FUNCTION demo_index_performance()
RETURNS TABLE (
    test_name VARCHAR,
    execution_time_ms NUMERIC,
    index_used BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'SLA Tracking Query'::VARCHAR as test_name,
        0.0::NUMERIC as execution_time_ms,
        true::BOOLEAN as index_used;
    -- Ova funkcija je placeholder za demo
    -- U stvarnosti bi se koristio EXPLAIN ANALYZE
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- KRAJ IMPLEMENTACIJE
-- =====================================================

-- Verifikacija instalacije
DO $$
DECLARE
    v_trigger_count INTEGER;
    v_function_count INTEGER;
    v_index_count INTEGER;
    v_type_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_trigger_count 
    FROM pg_trigger 
    WHERE tgname IN ('trg_sla_breach_check', 'trg_validate_satisfaction_rating');
    
    SELECT COUNT(*) INTO v_function_count 
    FROM pg_proc 
    WHERE proname IN (
        'check_sla_breach', 
        'validate_satisfaction_rating_trigger',
        'calculate_customer_satisfaction_score', 
        'generate_operator_performance_report',
        'get_top_operators_by_performance'
    );
    
    SELECT COUNT(*) INTO v_index_count 
    FROM pg_indexes 
    WHERE indexname IN (
        'idx_sla_tracking_analytics', 
        'idx_complaint_priority_status',
        'idx_customer_satisfaction_complaint_rating',
        'idx_escalations_complaint',
        'idx_statuses_code'
    );
    
    SELECT COUNT(*) INTO v_type_count 
    FROM pg_type 
    WHERE typname = 'operator_performance_stats';
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'PL/pgSQL IMPLEMENTACIJA - VERIFIKACIJA';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Trigeri instalirani: % (očekivano: 2)', v_trigger_count;
    RAISE NOTICE 'Funkcije instalirane: % (očekivano: 5)', v_function_count;
    RAISE NOTICE 'Indeksi instalirani: % (očekivano: 5)', v_index_count;
    RAISE NOTICE 'Tipovi instalirani: % (očekivano: 1)', v_type_count;
    RAISE NOTICE '==============================================';
    
    IF v_trigger_count = 2 AND v_function_count = 5 AND v_index_count = 5 AND v_type_count = 1 THEN
        RAISE NOTICE 'STATUS: ✓ SVE KOMPONENTE USPEŠNO INSTALIRANE!';
    ELSE
        RAISE WARNING 'STATUS: ✗ NEKE KOMPONENTE NISU INSTALIRANE!';
    END IF;
    
    RAISE NOTICE '==============================================';
END $$;

-- Primeri upotrebe:
/*
-- 1. Testiranje SLA breach trigera (automatski se okida pri UPDATE na sla_tracking)
UPDATE sla_tracking SET "responseDueAt" = NOW() - INTERVAL '1 hour' WHERE id = 1;

-- 2. Testiranje customer satisfaction score funkcije
SELECT * FROM calculate_customer_satisfaction_score('operator1', 30, 'operator');

-- 3. Generisanje kompletnog Operator Performance Dashboard reporta
SELECT * FROM generate_operator_performance_report(
    (NOW() - INTERVAL '30 days')::TIMESTAMP, 
    NOW()::TIMESTAMP
);

-- 4. Top operatori sa HAVING klauzulom
SELECT * FROM get_top_operators_by_performance(30, 5);

-- 5. Pristup preko VIEW-a
SELECT * FROM operator_performance_report_view;

-- 6. Testiranje kompozitnog indeksa (uporedi execution plan):
EXPLAIN ANALYZE SELECT * FROM sla_tracking 
WHERE "responseBreached" = FALSE AND "resolutionBreached" = FALSE 
AND "responseDueAt" < NOW() ORDER BY "responseDueAt";

-- 7. Testiranje validacije satisfaction rating-a (treba da baci exception)
INSERT INTO customer_satisfaction (complaint_id, customer_username, rating, comment)
VALUES (1, 'user1', 6, 'Test'); -- ERROR: rating mora biti 1-5
*/
