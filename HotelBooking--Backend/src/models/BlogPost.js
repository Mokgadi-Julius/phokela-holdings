const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-mysql');

const BlogPost = sequelize.define('BlogPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  featuredImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  author: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Phokela Guest House',
  },
  source: {
    type: DataTypes.ENUM('manual'),
    allowNull: false,
    defaultValue: 'manual',
  },
  status: {
    type: DataTypes.ENUM('published', 'draft', 'hidden'),
    allowNull: false,
    defaultValue: 'draft',
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  seo: {
    type: DataTypes.JSON,
    defaultValue: {
      metaTitle: '',
      metaDescription: '',
      keywords: '',
    },
  },
}, {
  tableName: 'blog_posts',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['slug'] },
    { fields: ['status', 'publishedAt'] },
    { fields: ['category'] },
  ],
});

module.exports = BlogPost;
