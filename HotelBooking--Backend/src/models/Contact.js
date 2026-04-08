const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-mysql');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('new', 'in-progress', 'resolved'),
    defaultValue: 'new',
  },
  response: {
    type: DataTypes.TEXT,
  },
  respondedAt: {
    type: DataTypes.DATE,
  },
  respondedBy: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'contacts',
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = Contact;
