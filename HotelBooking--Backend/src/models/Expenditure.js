const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-mysql');

const Expenditure = sequelize.define('Expenditure', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  category: {
    type: DataTypes.ENUM('supplies', 'maintenance', 'salaries', 'utilities', 'marketing', 'other'),
    allowNull: false,
    defaultValue: 'other',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Invoice number or receipt reference',
  },
}, {
  tableName: 'expenditures',
  timestamps: true,
  indexes: [
    { fields: ['category'] },
    { fields: ['date'] },
  ],
});

module.exports = Expenditure;
