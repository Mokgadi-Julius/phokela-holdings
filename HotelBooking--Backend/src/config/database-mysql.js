const { Sequelize } = require('sequelize');

// Support both individual variables and Railway's MYSQL_URL/MYSQL_PRIVATE_URL
const dbUrl = process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL || null;
let sequelize;

if (dbUrl) {
  console.log('✅ Found database URL in environment variables');
  sequelize = new Sequelize(dbUrl, {
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
  });
} else {
  console.log('ℹ️ Using individual database environment variables');
  sequelize = new Sequelize(
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
}

const connectDB = async () => {
  try {
    console.log('🔍 Attempting to connect to MySQL database...');
    await sequelize.authenticate();
    console.log('✅ MySQL Database Connected Successfully');
    
    if (dbUrl) {
      // Mask password in logs
      const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
      console.log(`🔗 Connected via URL: ${maskedUrl}`);
    } else {
      console.log(`📁 Database: ${process.env.DB_NAME || 'phokela_guest_house'}`);
      console.log(`🔗 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    }

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');

    return sequelize;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️  Continuing without database connection in development mode');
      return sequelize;
    }
    // In production, we want to retry or exit
    console.error('💥 Critical: Database connection required in production');
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
