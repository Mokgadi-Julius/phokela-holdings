const Service = require('./Service');
const Booking = require('./Booking');
const Contact = require('./Contact');
const Room = require('./Room');

// Define relationships
Service.hasMany(Booking, { foreignKey: 'serviceId', as: 'bookings' });
Booking.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

Room.hasMany(Booking, { foreignKey: 'roomId', as: 'bookings' });
Booking.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

const User = require('./User');

module.exports = {
  Service,
  Booking,
  Contact,
  Room,
  User,
};
