const { connectDB } = require('../config/database-mysql');
const { Service } = require('../models');

const seedData = async () => {
  try {
    await connectDB();

    console.log('🌱 Seeding MySQL database...');

    // Check if data already exists
    const existingServices = await Service.count();
    if (existingServices > 0) {
      console.log(`⚠️  Database already has ${existingServices} services. Skipping seed.`);
      console.log('   To re-seed, run: docker-compose down -v && docker-compose up -d');
      process.exit(0);
    }

    // Seed services
    const services = await Service.bulkCreate([
      {
        name: 'Comfort Room',
        description: 'Perfect for business travelers and couples seeking a peaceful retreat. Our comfort rooms feature modern amenities and tasteful décor, providing everything you need for a restful stay at Phokela Guest House.',
        category: 'accommodation',
        facilities: JSON.stringify([
          { name: 'Free WiFi', icon: 'FaWifi' },
          { name: 'Tea & Coffee', icon: 'FaCoffee' },
          { name: 'Private Bathroom', icon: 'FaBath' },
          { name: 'Secure Parking', icon: 'FaParking' },
          { name: 'Garden Access', icon: 'FaSwimmingPool' },
          { name: 'Breakfast Included', icon: 'FaHotdog' },
          { name: 'Laundry Service', icon: 'FaStopwatch' },
          { name: 'Welcome Refreshments', icon: 'FaCocktail' },
        ]),
        size: 25,
        maxPerson: 2,
        price: 850,
        priceUnit: 'per night',
        images: JSON.stringify({
          thumbnail: '/uploads/rooms/room1.jpg',
          large: '/uploads/rooms/room1-lg.jpg',
          gallery: [],
        }),
        availability: true,
        featured: true,
      },
      {
        name: 'Executive Suite',
        description: 'Spacious and elegantly appointed, our Executive Suites offer enhanced comfort for extended stays or special occasions. Ideal for business executives and families, featuring separate living areas and premium amenities.',
        category: 'accommodation',
        facilities: JSON.stringify([
          { name: 'Free WiFi', icon: 'FaWifi' },
          { name: 'Tea & Coffee Station', icon: 'FaCoffee' },
          { name: 'Ensuite Bathroom', icon: 'FaBath' },
          { name: 'Secure Parking', icon: 'FaParking' },
          { name: 'Garden Views', icon: 'FaSwimmingPool' },
          { name: 'Continental Breakfast', icon: 'FaHotdog' },
          { name: 'Daily Housekeeping', icon: 'FaStopwatch' },
          { name: 'Mini Bar', icon: 'FaCocktail' },
        ]),
        size: 45,
        maxPerson: 3,
        price: 1250,
        priceUnit: 'per night',
        images: JSON.stringify({
          thumbnail: '/uploads/rooms/room2.jpg',
          large: '/uploads/rooms/room2-lg.jpg',
          gallery: [],
        }),
        availability: true,
        featured: true,
      },
      {
        name: 'Conference Package',
        description: 'Professional meeting space with state-of-the-art audio-visual equipment. Perfect for corporate meetings, workshops, and seminars.',
        category: 'conference',
        facilities: JSON.stringify([
          { name: 'High-Speed WiFi', icon: 'FaWifi' },
          { name: 'Tea & Coffee Breaks', icon: 'FaCoffee' },
          { name: 'Private Restrooms', icon: 'FaBath' },
          { name: 'Ample Parking', icon: 'FaParking' },
          { name: 'Breakout Areas', icon: 'FaSwimmingPool' },
          { name: 'Catered Lunch', icon: 'FaHotdog' },
          { name: 'AV Equipment', icon: 'FaStopwatch' },
          { name: 'Welcome Drinks', icon: 'FaCocktail' },
        ]),
        size: 60,
        maxPerson: 25,
        price: 2500,
        priceUnit: 'per day',
        images: JSON.stringify({
          thumbnail: '/uploads/rooms/room3.jpg',
          large: '/uploads/rooms/room3-lg.jpg',
          gallery: [],
        }),
        availability: true,
        featured: true,
      },
      {
        name: 'Event Hosting Package',
        description: 'Make your special occasions memorable with our comprehensive event hosting services. From intimate gatherings to grand celebrations.',
        category: 'events',
        facilities: JSON.stringify([
          { name: 'Event WiFi', icon: 'FaWifi' },
          { name: 'Full Catering', icon: 'FaCoffee' },
          { name: 'Guest Facilities', icon: 'FaBath' },
          { name: 'Valet Parking', icon: 'FaParking' },
          { name: 'Garden Venue', icon: 'FaSwimmingPool' },
          { name: 'Menu Planning', icon: 'FaHotdog' },
          { name: 'Event Coordination', icon: 'FaStopwatch' },
          { name: 'Bar Service', icon: 'FaCocktail' },
        ]),
        size: 150,
        maxPerson: 80,
        price: 15000,
        priceUnit: 'per event',
        images: JSON.stringify({
          thumbnail: '/uploads/rooms/room4.jpg',
          large: '/uploads/rooms/room4-lg.jpg',
          gallery: [],
        }),
        availability: true,
        featured: true,
      },
      {
        name: 'Catering Services',
        description: 'Professional catering for all occasions. Our experienced chefs prepare delicious meals using fresh, local ingredients.',
        category: 'catering',
        facilities: JSON.stringify([
          { name: 'Menu Consultation', icon: 'FaWifi' },
          { name: 'Fresh Ingredients', icon: 'FaCoffee' },
          { name: 'Kitchen Facilities', icon: 'FaBath' },
          { name: 'Delivery Service', icon: 'FaParking' },
          { name: 'Outdoor Catering', icon: 'FaSwimmingPool' },
          { name: 'Custom Menus', icon: 'FaHotdog' },
          { name: 'Professional Staff', icon: 'FaStopwatch' },
          { name: 'Beverage Service', icon: 'FaCocktail' },
        ]),
        size: 0,
        maxPerson: 100,
        price: 350,
        priceUnit: 'per person',
        images: JSON.stringify({
          thumbnail: '/uploads/rooms/room5.jpg',
          large: '/uploads/rooms/room5-lg.jpg',
          gallery: [],
        }),
        availability: true,
        featured: false,
      },
    ]);

    console.log(`✅ Successfully seeded ${services.length} services!`);
    console.log('\n📊 Services created:');
    services.forEach(s => {
      console.log(`   - ${s.name} (${s.category}) - R${s.price} ${s.priceUnit}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error('💡 Make sure MySQL Docker container is running: docker-compose up -d');
    process.exit(1);
  }
};

seedData();
