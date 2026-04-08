const { sequelize } = require('../config/database-mysql');
const Service = require('../models/Service');

const servicesData = [
  // Catering Services
  {
    name: 'Wedding Catering Package',
    category: 'catering',
    description: 'Exquisite wedding catering with customized menus, professional service staff, and elegant presentation. Includes appetizers, main course, desserts, and beverages.',
    price: 350.00,
    priceUnit: 'per person',
    maxPerson: 200,
    size: 0,
    facilities: ['Buffet Setup', 'Table Service', 'Bar Service', 'Custom Menu', 'Dietary Options', 'Dessert Bar', 'Coffee Station'],
    featured: true,
    availability: true,
    images: {
      thumbnail: '',
      large: '',
      gallery: []
    },
    tags: ['wedding', 'luxury', 'customizable'],
    seo: {
      metaTitle: 'Wedding Catering Package - Phokela Guest House',
      metaDescription: 'Professional wedding catering services with customized menus and elegant presentation',
      keywords: ['wedding catering', 'luxury catering', 'Phokela']
    }
  },
  {
    name: 'Corporate Lunch Catering',
    category: 'catering',
    description: 'Professional catering services for corporate events, business meetings, and conferences. Includes a variety of meal options and dietary accommodations.',
    price: 180.00,
    priceUnit: 'per person',
    maxPerson: 100,
    size: 0,
    facilities: ['Buffet Setup', 'Custom Menu', 'Dietary Options', 'Coffee Station'],
    featured: false,
    availability: true,
    images: {
      thumbnail: '',
      large: '',
      gallery: []
    },
    tags: ['corporate', 'business', 'professional'],
    seo: {
      metaTitle: 'Corporate Catering Services - Phokela Guest House',
      metaDescription: 'Professional catering for corporate events and business meetings',
      keywords: ['corporate catering', 'business lunch', 'Phokela']
    }
  },
  {
    name: 'Traditional African Menu',
    category: 'catering',
    description: 'Authentic South African cuisine featuring traditional dishes, local flavors, and cultural presentation. Perfect for celebrations and special events.',
    price: 250.00,
    priceUnit: 'per person',
    maxPerson: 150,
    size: 0,
    facilities: ['Buffet Setup', 'Table Service', 'Custom Menu', 'Food Stations'],
    featured: false,
    availability: true,
    images: {
      thumbnail: '',
      large: '',
      gallery: []
    },
    tags: ['traditional', 'african', 'cultural'],
    seo: {
      metaTitle: 'Traditional African Catering - Phokela Guest House',
      metaDescription: 'Authentic South African cuisine for your special events',
      keywords: ['traditional african food', 'south african catering', 'Phokela']
    }
  },

  // Conference Services
  {
    name: 'Executive Conference Room',
    category: 'conference',
    description: 'State-of-the-art conference facility with modern audiovisual equipment, high-speed WiFi, and comfortable seating. Perfect for business meetings and presentations.',
    price: 2500.00,
    priceUnit: 'per day',
    maxPerson: 50,
    size: 120,
    facilities: ['Projector', 'Screen', 'Whiteboard', 'Sound System', 'Microphones', 'Video Conferencing', 'WiFi', 'Air Conditioning', 'Podium'],
    featured: true,
    availability: true,
    images: {
      thumbnail: '',
      large: '',
      gallery: []
    },
    tags: ['conference', 'business', 'executive', 'technology'],
    seo: {
      metaTitle: 'Executive Conference Room - Phokela Guest House',
      metaDescription: 'Professional conference facility with modern technology and amenities',
      keywords: ['conference room', 'business meeting', 'Phokela']
    }
  },
  {
    name: 'Boardroom Meeting Package',
    category: 'conference',
    description: 'Intimate boardroom setting ideal for executive meetings, strategy sessions, and small group discussions. Includes refreshments and basic AV equipment.',
    price: 1500.00,
    priceUnit: 'per day',
    maxPerson: 20,
    size: 60,
    facilities: ['Projector', 'Screen', 'Whiteboard', 'WiFi', 'Air Conditioning'],
    featured: false,
    availability: true,
    images: {
      thumbnail: '',
      large: '',
      gallery: []
    },
    tags: ['boardroom', 'executive', 'small meeting'],
    seo: {
      metaTitle: 'Boardroom Meeting Package - Phokela Guest House',
      metaDescription: 'Intimate boardroom for executive meetings and strategy sessions',
      keywords: ['boardroom', 'executive meeting', 'Phokela']
    }
  },
  {
    name: 'Training Workshop Venue',
    category: 'conference',
    description: 'Spacious training room with flexible seating arrangements, training materials support, and all necessary equipment for workshops and seminars.',
    price: 3000.00,
    priceUnit: 'per day',
    maxPerson: 80,
    size: 150,
    facilities: ['Projector', 'Screen', 'Whiteboard', 'Sound System', 'WiFi', 'Air Conditioning'],
    featured: false,
    availability: true,
    images: {
      thumbnail: '',
      large: '',
      gallery: []
    },
    tags: ['training', 'workshop', 'seminar', 'education'],
    seo: {
      metaTitle: 'Training Workshop Venue - Phokela Guest House',
      metaDescription: 'Professional training facility for workshops and seminars',
      keywords: ['training venue', 'workshop space', 'Phokela']
    }
  },

  // Events Services
  {
    name: 'Premium Wedding Venue Package',
    category: 'events',
    description: 'Complete wedding venue package including indoor and outdoor spaces, decoration setup, sound system, lighting, and professional event coordination.',
    price: 25000.00,
    priceUnit: 'per event',
    maxPerson: 250,
    size: 500,
    facilities: ['Dance Floor', 'Stage', 'Sound System', 'Lighting', 'Decorations', 'Photography', 'Security', 'Parking'],
    featured: true,
    availability: true,
    images: {
      thumbnail: '',
      large: '',
      gallery: []
    },
    tags: ['wedding', 'luxury', 'complete package'],
    seo: {
      metaTitle: 'Premium Wedding Venue - Phokela Guest House',
      metaDescription: 'Complete wedding venue with professional services and beautiful spaces',
      keywords: ['wedding venue', 'wedding package', 'Phokela']
    }
  },
  {
    name: 'Birthday Party Package',
    category: 'events',
    description: 'Fun and memorable birthday celebration package with decoration, entertainment options, and party coordination. Suitable for all ages.',
    price: 8000.00,
    priceUnit: 'per event',
    maxPerson: 100,
    size: 200,
    facilities: ['Sound System', 'Lighting', 'Decorations', 'DJ', 'Security', 'Parking'],
    featured: false,
    availability: true,
    images: {
      thumbnail: '',
      large: '',
      gallery: []
    },
    tags: ['birthday', 'party', 'celebration'],
    seo: {
      metaTitle: 'Birthday Party Package - Phokela Guest House',
      metaDescription: 'Memorable birthday celebrations with complete party services',
      keywords: ['birthday party', 'celebration venue', 'Phokela']
    }
  },
  {
    name: 'Corporate Event Venue',
    category: 'events',
    description: 'Professional venue for corporate events, product launches, and gala dinners. Includes full technical support and event management.',
    price: 15000.00,
    priceUnit: 'per event',
    maxPerson: 200,
    size: 400,
    facilities: ['Stage', 'Sound System', 'Lighting', 'Decorations', 'Security', 'Parking'],
    featured: false,
    availability: true,
    images: {
      thumbnail: '',
      large: '',
      gallery: []
    },
    tags: ['corporate', 'professional', 'gala'],
    seo: {
      metaTitle: 'Corporate Event Venue - Phokela Guest House',
      metaDescription: 'Professional venue for corporate events and gala dinners',
      keywords: ['corporate event', 'gala venue', 'Phokela']
    }
  },
  {
    name: 'Traditional Ceremony Venue',
    category: 'events',
    description: 'Authentic cultural venue for traditional ceremonies, including customary weddings, coming of age celebrations, and cultural events.',
    price: 12000.00,
    priceUnit: 'per event',
    maxPerson: 180,
    size: 350,
    facilities: ['Sound System', 'Lighting', 'Decorations', 'Parking', 'Security'],
    featured: false,
    availability: true,
    images: {
      thumbnail: '',
      large: '',
      gallery: []
    },
    tags: ['traditional', 'cultural', 'ceremony'],
    seo: {
      metaTitle: 'Traditional Ceremony Venue - Phokela Guest House',
      metaDescription: 'Authentic venue for traditional and cultural ceremonies',
      keywords: ['traditional ceremony', 'cultural venue', 'Phokela']
    }
  }
];

async function seedServices() {
  try {
    console.log('🌱 Starting services seeding...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if services already exist
    const existingCount = await Service.count();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing services. Clearing...`);
      await Service.destroy({ where: {} });
    }

    // Insert seed data
    console.log('📝 Inserting service data...');
    const services = await Service.bulkCreate(servicesData);

    console.log(`✅ Successfully seeded ${services.length} services!`);
    console.log('\n📊 Services breakdown:');
    console.log(`   - Catering: ${services.filter(s => s.category === 'catering').length}`);
    console.log(`   - Conference: ${services.filter(s => s.category === 'conference').length}`);
    console.log(`   - Events: ${services.filter(s => s.category === 'events').length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding services:', error);
    process.exit(1);
  }
}

// Run the seed function
seedServices();
