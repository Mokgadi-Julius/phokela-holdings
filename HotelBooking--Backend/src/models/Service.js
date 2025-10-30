const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-mysql');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('accommodation', 'conference', 'catering', 'events'),
    allowNull: false,
  },
  facilities: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  size: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  maxPerson: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  priceUnit: {
    type: DataTypes.ENUM('per night', 'per day', 'per person', 'per event', 'per hour'),
    defaultValue: 'per night',
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: {
      thumbnail: '',
      large: '',
      gallery: [],
    },
  },
  availability: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  minimumBooking: {
    type: DataTypes.JSON,
    defaultValue: {
      people: 1,
      hours: 1,
    },
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  seo: {
    type: DataTypes.JSON,
    defaultValue: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
    },
  },
  // Additional content fields for frontend pages
  content: {
    type: DataTypes.JSON,
    defaultValue: {
      // For catering services
      menuCategories: [],
      cateringPackages: [],
      // For conference services  
      conferenceRooms: [],
      conferencePackages: [],
      // For event services
      eventTypes: [],
      eventPackages: [],
      // Common fields
      heroSection: {
        title: '',
        description: '',
        backgroundImage: '',
      },
      introduction: {
        title: '',
        description: '',
      },
      features: [],
      testimonials: [],
      callToAction: {
        text: '',
        link: '',
      },
    },
  },
}, {
  tableName: 'services',
  timestamps: true,
  indexes: [
    { fields: ['category', 'availability'] },
    { fields: ['price'] },
    { fields: ['featured', 'availability'] },
  ],
});

// Class methods
Service.findByCategory = async function(category) {
  return this.findAll({
    where: {
      category,
      availability: true,
    },
    order: [
      ['featured', 'DESC'],
      ['price', 'ASC'],
    ],
  });
};

Service.search = async function(query, filters = {}) {
  const whereClause = {
    availability: true,
    ...filters,
  };

  if (query) {
    whereClause[sequelize.Sequelize.Op.or] = [
      { name: { [sequelize.Sequelize.Op.like]: `%${query}%` } },
      { description: { [sequelize.Sequelize.Op.like]: `%${query}%` } },
    ];
  }

  return this.findAll({
    where: whereClause,
    order: [['featured', 'DESC']],
    limit: 20,
  });
};

// Hooks
Service.beforeSave = async (service) => {
  if (!service.seo || !service.seo.metaTitle) {
    service.seo = service.seo || {};
    service.seo.metaTitle = `${service.name} - Phokela Guest House`;
  }

  if (!service.seo.metaDescription && service.description) {
    service.seo.metaDescription = service.description.substring(0, 160);
  }
};

module.exports = Service;
