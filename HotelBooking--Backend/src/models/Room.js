const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-mysql');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200],
    },
  },
  type: {
    type: DataTypes.ENUM('standard', 'deluxe', 'suite', 'family', 'executive'),
    allowNull: false,
    defaultValue: 'standard',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
  size: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
    comment: 'Room size in square meters',
  },
  beds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
  amenities: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'List of room amenities',
  },
  mainImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Main/cover image URL - displayed as primary image',
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of additional image URLs (toilet, TV, amenities, etc.)',
  },
  availability: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Floor number',
  },
  roomNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    comment: 'Unique room number',
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'reserved'),
    defaultValue: 'available',
  },
  viewType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'e.g., Sea View, Garden View, City View',
  },
  smokingAllowed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  petFriendly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  totalQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 0,
    },
    comment: 'Total number of rooms of this type available',
  },
  bookedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
    comment: 'Number of rooms currently booked',
  },
  seo: {
    type: DataTypes.JSON,
    defaultValue: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
    },
  },
}, {
  tableName: 'rooms',
  timestamps: true,
  indexes: [
    { fields: ['type', 'availability'] },
    { fields: ['price'] },
    { fields: ['capacity'] },
    { fields: ['featured', 'availability'] },
    { fields: ['status'] },
    { fields: ['roomNumber'], unique: true },
  ],
});

// Class methods
Room.findByType = async function(type) {
  return this.findAll({
    where: {
      type,
      availability: true,
    },
    order: [
      ['featured', 'DESC'],
      ['price', 'ASC'],
    ],
  });
};

Room.findAvailable = async function(capacity = null) {
  const whereClause = {
    availability: true,
    status: 'available',
  };

  if (capacity) {
    whereClause.capacity = {
      [sequelize.Sequelize.Op.gte]: capacity,
    };
  }

  return this.findAll({
    where: whereClause,
    order: [
      ['featured', 'DESC'],
      ['price', 'ASC'],
    ],
  });
};

Room.search = async function(query, filters = {}) {
  const whereClause = {
    availability: true,
    ...filters,
  };

  if (query) {
    whereClause[sequelize.Sequelize.Op.or] = [
      { name: { [sequelize.Sequelize.Op.like]: `%${query}%` } },
      { description: { [sequelize.Sequelize.Op.like]: `%${query}%` } },
      { type: { [sequelize.Sequelize.Op.like]: `%${query}%` } },
    ];
  }

  return this.findAll({
    where: whereClause,
    order: [
      ['featured', 'DESC'],
      ['price', 'ASC'],
    ],
    limit: 20,
  });
};

Room.getFeaturedRooms = async function(limit = 6) {
  return this.findAll({
    where: {
      featured: true,
      availability: true,
      status: 'available',
    },
    order: [['price', 'ASC']],
    limit,
  });
};

// Instance methods
Room.prototype.toggleAvailability = async function() {
  this.availability = !this.availability;
  return this.save();
};

Room.prototype.updateStatus = async function(newStatus) {
  const validStatuses = ['available', 'occupied', 'maintenance', 'reserved'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  this.status = newStatus;
  return this.save();
};

Room.prototype.getAvailableQuantity = function() {
  return Math.max(0, this.totalQuantity - this.bookedQuantity);
};

Room.prototype.isAvailable = function(requestedQuantity = 1) {
  return this.availability &&
         this.status === 'available' &&
         this.getAvailableQuantity() >= requestedQuantity;
};

Room.prototype.bookRooms = async function(quantity = 1) {
  if (!this.isAvailable(quantity)) {
    throw new Error('Insufficient rooms available');
  }
  this.bookedQuantity += quantity;
  if (this.bookedQuantity >= this.totalQuantity) {
    this.status = 'occupied';
  }
  return this.save();
};

Room.prototype.releaseRooms = async function(quantity = 1) {
  this.bookedQuantity = Math.max(0, this.bookedQuantity - quantity);
  if (this.bookedQuantity < this.totalQuantity) {
    this.status = 'available';
  }
  return this.save();
};

// Hooks
Room.beforeSave = async (room) => {
  // Auto-generate SEO data if not provided
  if (!room.seo || !room.seo.metaTitle) {
    room.seo = room.seo || {};
    room.seo.metaTitle = `${room.name} - Phokela Guest House`;
  }

  if (!room.seo.metaDescription && room.description) {
    room.seo.metaDescription = room.description.substring(0, 160);
  }

  // Auto-generate keywords from amenities and type
  if (!room.seo.keywords || room.seo.keywords.length === 0) {
    const keywords = [room.type, 'room', 'accommodation'];
    if (room.amenities && Array.isArray(room.amenities)) {
      keywords.push(...room.amenities.slice(0, 5));
    }
    room.seo.keywords = keywords;
  }
};

module.exports = Room;
