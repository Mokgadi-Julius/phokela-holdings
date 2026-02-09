const { Sequelize } = require('sequelize');

// MySQL configuration from environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || 'phokela_guest_house',
  process.env.DB_USER || 'phokela_user',
  process.env.DB_PASSWORD || 'phokela_pass_2025',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database Connected Successfully');
    console.log(`📁 Database: ${process.env.DB_NAME || 'phokela_guest_house'}`);
    console.log(`🔗 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);

    // Initialize all models with relationships


    // Sync all models
    // Using alter: true ensures that schema changes (like adding columns) are applied to the database
    // This is critical for fixing the bookings table schema (adding roomId, nullifying serviceId)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database models synchronized');

    return sequelize;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    console.error('💡 Make sure Docker MySQL container is running: docker-compose up -d');
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️  Continuing without database connection in development mode');
      return sequelize;
    }
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await sequelize.close();
  console.log('📊 MySQL connection closed through app termination');
  process.exit(0);
});

module.exports = { sequelize, connectDB };
