require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');

// Direktno kreiranje Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

async function demonstrateIndexUsage() {
  try {
    console.log('\n========================================');
    console.log('DEMONSTRACIJA INDEKSA: sla_tracking');
    console.log('========================================\n');

    // Proveri broj redova u tabeli
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total FROM sla_tracking;
    `);
    console.log(`Broj redova u sla_tracking: ${countResult[0].total}\n`);

    // Test query - specificniji WHERE da PostgreSQL koristi indeks
    const testQuery = `
      SELECT id, "responseBreached", "resolutionBreached", "responseDueAt", "resolutionDueAt"
      FROM sla_tracking 
      WHERE "responseBreached" = TRUE 
        AND "resolutionBreached" = FALSE
      ORDER BY "responseDueAt"
      LIMIT 1;
    `;

    console.log('Test query:');
    console.log(testQuery);
    console.log('\n========================================');
    console.log('1. UCITAVANJE SA INDEKSOM');
    console.log('========================================\n');
    
    const [withIndex] = await sequelize.query(`
      EXPLAIN (ANALYZE, BUFFERS, TIMING) 
      ${testQuery}
    `);
    withIndex.forEach(row => console.log(row['QUERY PLAN']));

    console.log('\n========================================');
    console.log('2. UCITAVANJE BEZ INDEKSA');
    console.log('========================================\n');
    
    // Drop indeks
    console.log('Dropping index idx_sla_tracking_analytics...\n');
    await sequelize.query(`DROP INDEX IF EXISTS idx_sla_tracking_analytics;`);
    
    const [withoutIndex] = await sequelize.query(`
      EXPLAIN (ANALYZE, BUFFERS, TIMING) 
      ${testQuery}
    `);
    withoutIndex.forEach(row => console.log(row['QUERY PLAN']));

    // Vrati indeks nazad
    console.log('\n========================================');
    console.log('Vracam indeks nazad...');
    console.log('========================================\n');
    await sequelize.query(`
      CREATE INDEX idx_sla_tracking_analytics 
      ON sla_tracking("responseBreached", "resolutionBreached", "responseDueAt", "resolutionDueAt");
    `);
    console.log('Indeks idx_sla_tracking_analytics kreiran.\n');

    // DODATNA DEMONSTRACIJA: Pokazi razliku u cost-u
    console.log('========================================');
    console.log('DODATNA DEMONSTRACIJA: COST POREDJENJE');
    console.log('========================================\n');

    console.log('SA indeksom:');
    const [costWithIndex] = await sequelize.query(`
      EXPLAIN 
      SELECT * FROM sla_tracking 
      WHERE "responseBreached" = TRUE 
        AND "resolutionBreached" = FALSE;
    `);
    costWithIndex.forEach(row => console.log(row['QUERY PLAN']));

    await sequelize.query(`DROP INDEX IF EXISTS idx_sla_tracking_analytics;`);
    
    console.log('\nBEZ indeksa:');
    const [costWithoutIndex] = await sequelize.query(`
      EXPLAIN 
      SELECT * FROM sla_tracking 
      WHERE "responseBreached" = TRUE 
        AND "resolutionBreached" = FALSE;
    `);
    costWithoutIndex.forEach(row => console.log(row['QUERY PLAN']));

    // Vrati indeks nazad
    await sequelize.query(`
      CREATE INDEX idx_sla_tracking_analytics 
      ON sla_tracking("responseBreached", "resolutionBreached", "responseDueAt", "resolutionDueAt");
    `);

    console.log('\n========================================');
    console.log('NAPOMENA:');
    console.log('========================================');
    console.log('PostgreSQL koristi Seq Scan za male tabele (<10000 redova)');
    console.log('jer je brze procitati celu tabelu nego koristiti indeks.');
    console.log('Indeks se koristi kada:');
    console.log('  1. Tabela ima vise redova (>10000)');
    console.log('  2. WHERE filteruje mali procenat redova (<5%)');
    console.log('  3. Query je specificniji (vise uslova)');
    console.log('\nZa demonstraciju na odbrani:');
    console.log('  - Objasniti kada PostgreSQL koristi indeks');
    console.log('  - Pokazati EXPLAIN ANALYZE output');
    console.log('  - Uporediti cost= vrednosti SA i BEZ indeksa\n');

    console.log('========================================');
    console.log('DEMONSTRACIJA ZAVRSENA');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\nError:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    process.exit(1);
  }
}

demonstrateIndexUsage();
