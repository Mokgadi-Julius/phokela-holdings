/**
 * Database Setup Script
 * Initializes all database tables using Sequelize models
 * Run this with: node setup-database.js
 */

require('dotenv').config();
const { sequelize, connectDB } = require('./src/config/database-mysql');
const { Service, Booking, Contact, Room, User } = require('./src/models');

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connection established\n');

    // Force sync all models (WARNING: This drops existing tables!)
    const shouldForceSync = process.argv.includes('--force');

    if (shouldForceSync) {
      console.log('⚠️  FORCE SYNC ENABLED - This will DROP all existing tables!');
      console.log('⏳ Waiting 3 seconds... Press Ctrl+C to cancel\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('📋 Syncing database models...');
    await sequelize.sync({ force: shouldForceSync, alter: !shouldForceSync });
    console.log('✅ Database models synchronized\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const [results] = await sequelize.query("SHOW TABLES");
    console.log('📊 Tables in database:');
    results.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`   ✓ ${tableName}`);
    });

    // Check if services exist
    const serviceCount = await Service.count();
    const roomCount = await Room.count();
    console.log(`\n📈 Current data:`);
    console.log(`   Services: ${serviceCount}`);
    console.log(`   Rooms: ${roomCount}`);
    console.log(`   Bookings: ${await Booking.count()}`);
    console.log(`   Contacts: ${await Contact.count()}`);
    console.log(`   Users: ${await User.count()}`);

    if (serviceCount === 0) {
      console.log('\n💡 No services found. Run seed commands to add initial data:');
      console.log('   - POST /api/admin/seed (for services)');
      console.log('   - POST /api/admin/seed-rooms (for rooms)');
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('🎉 You can now start the server with: npm start\n');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure Docker MySQL container is running:');
    console.error('      docker-compose up -d');
    console.error('   2. Check your .env file has correct database credentials');
    console.error('   3. Verify MySQL connection: mysql -u phokela_user -p\n');
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run setup
setupDatabase();
