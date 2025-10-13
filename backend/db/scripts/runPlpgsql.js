require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

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

async function runPlpgsql() {
  try {
    console.log('\n========================================');
    console.log('Installing PL/pgSQL Functions');
    console.log('========================================\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, '../plpgsql/01_plsql.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing 01_plsql.sql...\n');

    // Execute SQL
    await sequelize.query(sql);

    console.log('✓ PL/pgSQL script executed successfully!\n');

    // Verify installation
    console.log('Verifying installation...\n');

    const [functions] = await sequelize.query(`
      SELECT proname as function_name
      FROM pg_proc 
      WHERE proname IN (
        'check_sla_breach',
        'calculate_customer_satisfaction_score',
        'generate_operator_performance_report',
        'get_top_operators_by_performance',
        'demo_index_performance'
      );
    `);

    console.log('Installed functions:');
    functions.forEach(f => console.log(`  ✓ ${f.function_name}`));

    const [triggers] = await sequelize.query(`
      SELECT tgname as trigger_name
      FROM pg_trigger
      WHERE tgname LIKE 'trg_%';
    `);

    console.log('\nInstalled triggers:');
    triggers.forEach(t => console.log(`  ✓ ${t.trigger_name}`));

    const [indexes] = await sequelize.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE indexname LIKE 'idx_%';
    `);

    console.log('\nInstalled indexes:');
    indexes.forEach(i => console.log(`  ✓ ${i.indexname}`));

    console.log('\n========================================');
    console.log('Installation Complete!');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runPlpgsql();
