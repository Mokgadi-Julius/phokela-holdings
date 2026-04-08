const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-mysql');

const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  group: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  }
}, {
  tableName: 'settings',
  timestamps: true,
});

module.exports = Setting;
