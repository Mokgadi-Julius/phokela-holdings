require('dotenv').config();
const { sequelize } = require('./src/config/database-mysql');

async function checkExpenditures() {
  try {
    const [results] = await sequelize.query("DESCRIBE expenditures");
    console.log('Expenditures Table Schema:');
    console.log(JSON.stringify(results, null, 2));
    
    const [count] = await sequelize.query("SELECT COUNT(*) as count FROM expenditures");
    console.log('Total Expenditures:', count[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkExpenditures();
