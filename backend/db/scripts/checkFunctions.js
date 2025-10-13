require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');

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

async function checkFunctions() {
  try {
    console.log('\n========================================');
    console.log('CHECKING PL/pgSQL FUNCTIONS');
    console.log('========================================\n');

    // Check if operator performance function exists
    const [functions] = await sequelize.query(`
      SELECT 
        proname as function_name,
        pg_get_function_arguments(oid) as arguments,
        pg_get_function_result(oid) as return_type
      FROM pg_proc 
      WHERE proname LIKE '%operator%' OR proname LIKE '%generate%';
    `);

    console.log('Found functions:');
    console.table(functions);

    if (functions.length === 0) {
      console.log('\n⚠️  No PL/pgSQL functions found!');
      console.log('\nRun this command to install them:');
      console.log('  node db/scripts/runPlpgsql.js\n');
    } else {
      console.log(`\n✓ Found ${functions.length} functions\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkFunctions();
