require('dotenv').config();
const { sequelize } = require('../config/database-mysql');
const { Booking } = require('../models');

async function updateSchema() {
    console.log('🚀 Starting schema update...');
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        // This will alter the table to match the model (adding roomId, etc.)
        await Booking.sync({ alter: true });
        console.log('✅ Booking table schema updated successfully!');

    } catch (err) {
        console.error('❌ Schema update failed:', err);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

updateSchema();
