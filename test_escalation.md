# Test slučajevi za eskalaciju

## Backend validacije:
1. ✅ `await` je dodat na `ComplaintService.transition()` 
2. ✅ Proverava da li već postoji eskalacija za ticket pre kreiranja nove
3. ✅ `ComplaintService.transition()` proverava status transitions 
4. ✅ Dodane status transitions za ESCALATED iz PENDING i WAITING_INFO

## Frontend validacije:
1. ✅ `isEscalated` computed property proverava status
2. ✅ Dugme za eskalaciju je disabled ako je ticket već eskaliran
3. ✅ `handleEscalate()` proverava `isEscalated` pre slanja zahteva
4. ✅ Vizuelni indikator (badge) da je ticket eskaliran
5. ✅ Status chip je disabled ako je eskaliran
6. ✅ Refresh ticket, history i manager messages nakon eskalacije

## Potrebno testirati:
1. Eskalacija iz PENDING stanja
2. Eskalacija iz IN_PROGRESS stanja  
3. Eskalacija iz WAITING_INFO stanja
4. Pokušaj duple eskalacije (trebalo bi da se spreči)
5. Refresh stranice nakon eskalacije (status se zadržava)

## Status transitions koje treba dodati u bazu:
```sql
INSERT INTO status_transitions (id, fromStatusId, toStatusId) VALUES 
(15, 1, 4), -- PENDING → ESCALATED
(16, 3, 4); -- WAITING_INFO → ESCALATED
```

Ili pokrenite seeder:
```bash
npx sequelize-cli db:seed --seed 04-seed-statusTransitions.js
```