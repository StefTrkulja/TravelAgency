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

async function testOperatorPerformance() {
  try {
    console.log('\n========================================');
    console.log('TEST: Operator Performance Report');
    console.log('========================================\n');

    // Test 1: Check how many CLOSED complaints exist
    const [closedComplaints] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM complaints c
      INNER JOIN statuses s ON s.id = c."statusId"
      WHERE s.code = 'CLOSED';
    `);
    console.log(`CLOSED complaints: ${closedComplaints[0].total}`);

    // Test 2: Check how many satisfaction records exist
    const [satisfactionCount] = await sequelize.query(`
      SELECT COUNT(*) as total FROM customer_satisfaction;
    `);
    console.log(`Customer satisfaction records: ${satisfactionCount[0].total}`);

    // Test 3: Check satisfaction for closed complaints
    const [closedWithSatisfaction] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_closed,
        COUNT(DISTINCT cs.id) as with_satisfaction,
        AVG(cs.rating) as avg_rating
      FROM complaints c
      INNER JOIN statuses s ON s.id = c."statusId"
      LEFT JOIN customer_satisfaction cs ON cs.complaint_id = c.id
      WHERE s.code = 'CLOSED';
    `);
    console.log(`\nClosed complaints analysis:`);
    console.log(`  Total closed: ${closedWithSatisfaction[0].total_closed}`);
    console.log(`  With satisfaction: ${closedWithSatisfaction[0].with_satisfaction}`);
    console.log(`  Average rating: ${closedWithSatisfaction[0].avg_rating || 'N/A'}`);

    // Test 4: Run the PL/pgSQL function
    console.log('\n========================================');
    console.log('Running PL/pgSQL Function:');
    console.log('========================================\n');

    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const results = await sequelize.query(`
      SELECT * FROM generate_operator_performance_report(
        $1::TIMESTAMP,
        $2::TIMESTAMP
      )
      ORDER BY performance_score DESC;
    `, {
      bind: [startDate, endDate],
      type: sequelize.QueryTypes.SELECT
    });

    console.log('Operator Performance Results:');
    console.table(results);

    // Test 5: Manual calculation for ana123
    console.log('\n========================================');
    console.log('Manual Calculation for ana123:');
    console.log('========================================\n');

    const [manualCalc] = await sequelize.query(`
      WITH operator_complaints AS (
        SELECT 
          c.id,
          c."statusId",
          c."createdAt",
          s.code as status_code
        FROM complaints c
        INNER JOIN statuses s ON s.id = c."statusId"
        WHERE c."assigneeUsername" = 'ana123'
          AND c."createdAt" >= NOW() - INTERVAL '30 days'
      )
      SELECT
        COUNT(DISTINCT oc.id) as total_complaints,
        COUNT(DISTINCT CASE 
          WHEN oc.status_code = 'CLOSED' 
          THEN oc.id 
        END) as closed_complaints,
        COUNT(DISTINCT cs.id) as satisfaction_count,
        AVG(cs.rating) as avg_satisfaction,
        STRING_AGG(DISTINCT cs.rating::TEXT, ', ') as all_ratings
      FROM operator_complaints oc
      LEFT JOIN customer_satisfaction cs ON cs.complaint_id = oc.id;
    `);

    console.log('Manual stats for ana123:');
    console.table(manualCalc);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

testOperatorPerformance();
