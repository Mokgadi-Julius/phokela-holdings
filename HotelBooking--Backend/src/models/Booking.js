const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database-mysql');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  bookingReference: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
    defaultValue: null,
    validate: {
      notNull: false
    }
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'services',
      key: 'id',
    },
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'rooms',
      key: 'id',
    },
  },
  roomQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
    },
    comment: 'Number of rooms booked',
  },
  serviceSnapshot: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  primaryGuest: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  additionalGuests: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  bookingDetails: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  pricing: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  specialRequests: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no-show'),
    defaultValue: 'pending',
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'deposit-paid', 'fully-paid', 'refunded'),
    defaultValue: 'pending',
  },
  paymentDetails: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  communication: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  notes: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  source: {
    type: DataTypes.ENUM('website', 'phone', 'email', 'walk-in', 'referral'),
    defaultValue: 'website',
  },
}, {
  tableName: 'bookings',
  timestamps: true,
  indexes: [
    { fields: ['status', 'createdAt'] },
    { fields: ['bookingReference'], unique: true },
  ],
  hooks: {
    beforeValidate: async (booking) => {
      if (!booking.bookingReference) {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const count = await Booking.count({
          where: {
            createdAt: {
              [Op.gte]: today,
              [Op.lt]: tomorrow,
            },
          },
        });

        const sequence = (count + 1).toString().padStart(3, '0');
        booking.bookingReference = `PH${year}${month}${day}${sequence}`;
      }
    },
  },
});

// Class methods
Booking.findByDateRange = async function(startDate, endDate, category) {
  const whereClause = {
    status: { [Op.in]: ['confirmed', 'pending'] },
  };

  if (category) {
    whereClause['serviceSnapshot.category'] = category;
  }

  return this.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
  });
};

module.exports = Booking;
