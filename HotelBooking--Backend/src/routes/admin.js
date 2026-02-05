const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const { Service, Booking, Contact, Room } = require('../models');
const { sequelize } = require('../config/database-mysql');
const auth = require('../middleware/auth');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Quick stats
    const [
      totalServices,
      totalBookings,
      totalContacts,
      todayBookings,
      thisWeekBookings,
      pendingBookings,
      newContacts
    ] = await Promise.all([
      Service.count({ where: { availability: true } }),
      Booking.count(),
      Contact.count(),
      Booking.count({ where: { createdAt: { [Op.gte]: startOfToday } } }),
      Booking.count({ where: { createdAt: { [Op.gte]: startOfWeek } } }),
      Booking.count({ where: { status: 'pending' } }),
      Contact.count({ where: { status: 'new' } })
    ]);

    // Fetch all confirmed/completed bookings for the last 7 months to calculate revenue in JS
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
    sevenMonthsAgo.setDate(1);

    const revenueBookings = await Booking.findAll({
      where: {
        createdAt: { [Op.gte]: sevenMonthsAgo },
        status: { [Op.in]: ['confirmed', 'completed'] }
      },
      attributes: ['id', 'pricing', 'createdAt']
    });

    // Calculate this month revenue
    let thisMonthRevenue = 0;
    const monthlyOverviewMap = {};

    revenueBookings.forEach(booking => {
      const pricing = booking.pricing;
      const amount = parseFloat(pricing?.totalAmount || 0);
      const bookingDate = new Date(booking.createdAt);
      
      // Add to this month revenue if applicable
      if (bookingDate >= startOfMonth) {
        thisMonthRevenue += amount;
      }

      // Add to monthly overview
      const monthKey = bookingDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const monthSortKey = bookingDate.toISOString().substring(0, 7); // YYYY-MM

      if (!monthlyOverviewMap[monthKey]) {
        monthlyOverviewMap[monthKey] = { month: monthKey, bookings: 0, revenue: 0, sortKey: monthSortKey };
      }
      monthlyOverviewMap[monthKey].bookings += 1;
      monthlyOverviewMap[monthKey].revenue += amount;
    });

    // Convert map to sorted array
    const monthlyOverview = Object.values(monthlyOverviewMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ month, bookings, revenue }) => ({ month, bookings, revenue }));

    // Recent bookings
    const recentBookings = await Booking.findAll({
      include: [
        { model: Service, as: 'service', attributes: ['name', 'category'] },
        { model: Room, as: 'room', attributes: ['name', 'type'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Upcoming bookings (next 7 days)
    const upcomingBookings = await Booking.findAll({
        where: {
            [Op.or]: [
                { 'bookingDetails.checkIn': { [Op.between]: [startOfToday, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] } },
                { 'bookingDetails.eventDate': { [Op.between]: [startOfToday, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] } }
            ],
            status: { [Op.in]: ['confirmed', 'pending'] }
        },
        include: [{ model: Service, as: 'service', attributes: ['name', 'category'] }],
        order: [['bookingDetails.checkIn', 'ASC'], ['bookingDetails.eventDate', 'ASC']],
        limit: 10
    });


    // Revenue by category (this month) - skip for now to avoid JSON extraction issues
    const revenueByCategory = [];


    res.json({
      success: true,
      data: {
        stats: {
          totalServices,
          totalBookings,
          totalContacts,
          todayBookings,
          thisWeekBookings,
          thisMonthRevenue: thisMonthRevenue || 0,
          pendingBookings,
          newContacts
        },
        recentBookings,
        upcomingBookings,
        revenueByCategory,
        monthlyOverview
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/admin/reports/bookings
// @desc    Get booking reports
// @access  Private
router.get('/reports/bookings', async (req, res) => {
  try {
    const { period = 'month', year, month, category } = req.query;

    let matchQuery = {};

    // Date filtering
    if (period === 'month' && year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      matchQuery.createdAt = { [Op.gte]: startDate, [Op.lte]: endDate };
    } else if (period === 'year' && year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year) + 1, 0, 0);
      matchQuery.createdAt = { [Op.gte]: startDate, [Op.lte]: endDate };
    }

    // Category filtering
    if (category) {
      matchQuery['serviceSnapshot.category'] = category;
    }

    // Bookings by status
    const bookingsByStatus = await Booking.findAll({
        attributes: [
            'status',
            [fn('COUNT', col('id')), 'count'],
            [fn('SUM', literal("CASE WHEN status IN ('confirmed', 'completed') THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(pricing, '$.totalAmount')) AS DECIMAL(10, 2)) ELSE 0 END")), 'revenue']
        ],
        where: matchQuery,
        group: ['status']
    });


    // Bookings over time (skip for now - no bookings yet)
    const bookingsOverTime = [];

    // Top services (skip for now - no bookings yet)
    const topServices = [];


    res.json({
      success: true,
      data: {
        bookingsByStatus,
        bookingsOverTime,
        topServices
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while generating booking reports',
      error: error.message
    });
  }
});

// @route   GET /api/admin/reports/revenue
// @desc    Get revenue reports
// @access  Private
router.get('/reports/revenue', auth, async (req, res) => {
  try {
    const { period = 'month', year, month } = req.query;

    let matchQuery = {
      status: { [Op.in]: ['confirmed', 'completed'] }
    };

    // Date filtering
    if (period === 'month' && year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      matchQuery.createdAt = { [Op.gte]: startDate, [Op.lte]: endDate };
    } else if (period === 'year' && year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year) + 1, 0, 0);
      matchQuery.createdAt = { [Op.gte]: startDate, [Op.lte]: endDate };
    }

    // Revenue by category (skip for now - no bookings yet)
    const revenueByCategory = [];


    // Revenue over time (skip for now - no bookings yet)
    const revenueOverTime = [];

    // Total revenue stats (skip for now - no bookings yet)
    const totalStats = {
      totalRevenue: 0,
      totalBookings: 0,
      avgBookingValue: 0,
      maxBookingValue: 0,
      minBookingValue: 0
    };


    res.json({
      success: true,
      data: {
        revenueByCategory,
        revenueOverTime,
        totalStats: totalStats || {
          totalRevenue: 0,
          totalBookings: 0,
          avgBookingValue: 0,
          maxBookingValue: 0,
          minBookingValue: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while generating revenue reports',
      error: error.message
    });
  }
});

// @route   POST /api/admin/seed
// @desc    Seed initial data (development only)
// @access  Private
router.post('/seed', auth, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Seeding not allowed in production'
      });
    }

    // Check if services already exist
    const existingServices = await Service.count();
    if (existingServices > 0) {
      return res.status(400).json({
        success: false,
        message: 'Services already exist. Clear database first.'
      });
    }

    // Seed services - Phokela Guest House "Home Away from Home"
    // Services: WiFi, Conference, Catering, Pool, Events (Professional & Social - NO wedding hall)
    const initialServices = [
      // Conference Services
      {
        name: 'Conference Facilities',
        description: 'Professional conference facilities at Phokela Guest House. Perfect for corporate meetings, workshops, training sessions, and business seminars. Equipped with modern amenities and comfortable seating.',
        category: 'conference',
        facilities: [
          { name: 'High-Speed WiFi', icon: 'FaWifi' },
          { name: 'Projector & Screen', icon: 'FaDesktop' },
          { name: 'Sound System', icon: 'FaVolumeUp' },
          { name: 'Flip Charts', icon: 'FaChalkboard' },
          { name: 'Tea & Coffee', icon: 'FaCoffee' },
          { name: 'Secure Parking', icon: 'FaParking' },
          { name: 'Air Conditioning', icon: 'FaSnowflake' },
          { name: 'Natural Lighting', icon: 'FaSun' }
        ],
        size: 60,
        maxPerson: 30,
        price: 2500,
        priceUnit: 'per day',
        images: {
          thumbnail: '/uploads/services/conference.jpg',
          large: '/uploads/services/conference-lg.jpg'
        },
        availability: true,
        featured: true,
        content: {
          heroSection: {
            title: 'Modern Conference Facilities',
            description: 'Professional meeting spaces equipped with cutting-edge technology',
            backgroundImage: '/uploads/services/conference-bg.jpg'
          },
          introduction: {
            title: 'Professional Meeting Solutions',
            description: 'Phokela Guest House offers state-of-the-art conference facilities designed to meet the needs of modern business. Our professional meeting spaces are equipped with the latest technology and supported by our experienced team to ensure your corporate events, training sessions, and workshops are successful.'
          },
          conferenceRooms: [
            {
              name: 'Executive Boardroom',
              capacity: '12 people',
              size: '35m²',
              setup: 'Boardroom style',
              equipment: ['65" Smart TV', 'Video conferencing', 'Whiteboard', 'Executive chairs'],
              price: 'R1,500/half day',
              image: '/uploads/services/boardroom.jpg'
            },
            {
              name: 'Main Conference Hall',
              capacity: '50 people',
              size: '80m²',
              setup: 'Theater/Classroom style',
              equipment: ['Projector & screen', 'Sound system', 'Wireless microphones', 'Podium'],
              price: 'R3,500/full day',
              image: '/uploads/services/conference-hall.jpg'
            }
          ],
          conferencePackages: [
            {
              name: 'Full Day Conference Package',
              description: 'Complete conference solution for full-day events',
              includes: [
                'Conference room rental (8 hours)',
                'Welcome coffee on arrival',
                'Mid-morning tea break',
                'Three-course lunch',
                'Afternoon tea break',
                'All-day beverages',
                'Stationery and notepads',
                'Technical support',
                'Parking for delegates'
              ],
              price: 'R350',
              duration: '8 hours (8:00 AM - 5:00 PM)',
              minPeople: 10
            }
          ],
          features: [
            { icon: '💻', title: 'Modern Technology', description: 'Latest AV equipment and high-speed internet connectivity' },
            { icon: '🏢', title: 'Flexible Spaces', description: 'Adaptable rooms for various meeting formats and sizes' },
            { icon: '⚡', title: 'Full Support', description: 'Technical assistance and professional service staff' }
          ],
          callToAction: {
            text: 'Ready to Book Your Conference?',
            description: 'Contact us for availability and custom packages',
            buttonText: 'Check Availability'
          }
        }
      },
      // Catering Services
      {
        name: 'Catering Services',
        description: 'Professional catering services for all your events. From business lunches to social gatherings, our experienced chefs prepare delicious meals using fresh, quality ingredients.',
        category: 'catering',
        facilities: [
          { name: 'Custom Menus', icon: 'FaUtensils' },
          { name: 'Fresh Ingredients', icon: 'FaLeaf' },
          { name: 'Professional Chefs', icon: 'FaHatChef' },
          { name: 'Buffet Setup', icon: 'FaCocktail' },
          { name: 'Table Service', icon: 'FaConciergeBell' },
          { name: 'Dietary Options', icon: 'FaAppleAlt' },
          { name: 'Beverage Service', icon: 'FaGlassCheers' },
          { name: 'Event Coordination', icon: 'FaTasks' }
        ],
        size: 0,
        maxPerson: 100,
        price: 250,
        priceUnit: 'per person',
        images: {
          thumbnail: '/uploads/services/catering.jpg',
          large: '/uploads/services/catering-lg.jpg'
        },
        availability: true,
        featured: true,
        content: {
          heroSection: {
            title: 'Professional Catering Services',
            description: 'Delicious, fresh meals prepared with love for your special occasions',
            backgroundImage: '/uploads/services/catering-bg.jpg'
          },
          introduction: {
            title: 'Exceptional Culinary Experiences',
            description: 'At Phokela Guest House, we believe that great food brings people together. Our experienced chefs prepare delicious meals using fresh, locally-sourced ingredients. Whether you\'re hosting a corporate event, celebrating a special occasion, or need daily meal services, we have the perfect catering solution for you.'
          },
          menuCategories: [
            {
              name: 'Traditional South African Cuisine',
              items: [
                { name: 'Boerewors & Pap', description: 'Traditional sausage with maize meal', price: 'R85' },
                { name: 'Potjiekos', description: 'Slow-cooked stew with vegetables', price: 'R95' }
              ]
            }
          ],
          cateringPackages: [
            {
              name: 'Corporate Lunch Package',
              description: 'Perfect for business meetings and corporate events',
              includes: ['Main course', 'Side dish', 'Dessert', 'Beverages', 'Setup & cleanup'],
              price: 'R180',
              minPeople: 10
            }
          ],
          features: [
            { icon: '👨‍🍳', title: 'Expert Chefs', description: 'Experienced culinary professionals passionate about great food' },
            { icon: '🥬', title: 'Fresh Ingredients', description: 'Locally-sourced, fresh ingredients for the best flavor and quality' },
            { icon: '🍽️', title: 'Custom Menus', description: 'Tailored menu options to suit your preferences and dietary needs' }
          ],
          callToAction: {
            text: 'Ready to Place Your Order?',
            description: 'Contact us to discuss your catering needs and get a custom quote',
            buttonText: 'Get Quote'
          }
        }
      },
      // Event Hosting (Professional & Social - NO weddings)
      {
        name: 'Event Hosting',
        description: 'Host your special events at Phokela Guest House. Perfect for birthdays, anniversaries, corporate functions, team building, product launches, and other social gatherings. Professional event coordination included.',
        category: 'events',
        facilities: [
          { name: 'WiFi Access', icon: 'FaWifi' },
          { name: 'Pool Access', icon: 'FaSwimmingPool' },
          { name: 'Garden Venue', icon: 'FaTree' },
          { name: 'Event Setup', icon: 'FaChair' },
          { name: 'Sound System', icon: 'FaMusic' },
          { name: 'Ample Parking', icon: 'FaParking' },
          { name: 'Full Catering', icon: 'FaUtensils' },
          { name: 'Event Coordinator', icon: 'FaUserTie' }
        ],
        size: 120,
        maxPerson: 60,
        price: 8500,
        priceUnit: 'per event',
        images: {
          thumbnail: '/uploads/services/events.jpg',
          large: '/uploads/services/events-lg.jpg'
        },
        availability: true,
        featured: true,
        content: {
          heroSection: {
            title: 'Memorable Event Hosting',
            description: 'Creating unforgettable moments for your special occasions',
            backgroundImage: '/uploads/services/events-bg.jpg'
          },
          introduction: {
            title: 'Your Event, Our Expertise',
            description: 'At Phokela Guest House, we specialize in creating magical moments that last a lifetime. Whether you\'re planning an intimate gathering or a grand celebration, our experienced team will work with you to ensure every detail is perfect. From weddings to corporate functions, we have the expertise and facilities to make your event truly special.'
          },
          eventTypes: [
            {
              name: 'Weddings',
              description: 'Make your special day unforgettable with our comprehensive wedding packages',
              features: ['Bridal suite', 'Ceremony venue', 'Reception setup', 'Catering services', 'Photography coordination'],
              capacity: 'Up to 100 guests',
              price: 'From R25,000',
              image: '/uploads/services/wedding.jpg'
            }
          ],
          eventPackages: [
            {
              name: 'Premium Event Package',
              description: 'Our most comprehensive event hosting solution',
              includes: [
                'Full venue decoration',
                'Professional catering service',
                'Event coordinator',
                'Photography setup',
                'Entertainment system',
                'Full cleanup service',
                'Parking attendants',
                'Security services'
              ],
              price: 'R35,000',
              duration: 'Full day (8 hours)',
              guests: 'Up to 100 guests'
            }
          ],
          features: [
            { icon: '🎯', title: 'Expert Planning', description: 'Professional event coordinators to handle every detail' },
            { icon: '🏛️', title: 'Beautiful Venues', description: 'Elegant indoor and outdoor spaces for any occasion' },
            { icon: '⭐', title: 'Full Service', description: 'From setup to cleanup, we handle everything' }
          ],
          callToAction: {
            text: 'Ready to Plan Your Event?',
            description: 'Let us help you create an unforgettable experience',
            buttonText: 'Start Planning'
          }
        }
      }
    ];

    const createdServices = await Service.bulkCreate(initialServices);

    res.json({
      success: true,
      message: `Successfully seeded ${createdServices.length} services`,
      data: createdServices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while seeding data',
      error: error.message
    });
  }
});

// @route   POST /api/admin/seed-rooms
// @desc    Seed room data (4 types with quantities)
// @access  Private
router.post('/seed-rooms', auth, async (req, res) => {
  try {
    const Room = require('../models/Room');

    // Check if rooms already exist - allow override with force parameter
    const existingRooms = await Room.count();
    if (existingRooms > 0 && !req.query.force) {
      return res.status(400).json({
        success: false,
        message: 'Rooms already exist. Use ?force=true to override.'
      });
    }

    // Delete existing rooms if force is true
    if (req.query.force) {
      await Room.destroy({ where: {}, truncate: true });
    }

    // Phokela Guest House - "Home Away from Home"
    // Old seeding - kept for backward compatibility
    const roomsData = [];
    let roomCounter = 1;

    // Room Type 1: One single bed with shower - R750 (4 rooms)
    for (let i = 0; i < 4; i++) {
      roomsData.push({
        name: `Standard Single Room ${roomCounter}`,
        type: 'standard',
        description: 'Comfortable room with one single bed and modern shower facilities. Perfect for solo travelers looking for a peaceful retreat. Your home away from home.',
        price: 750,
        capacity: 1,
        size: 18,
        beds: 1,
        amenities: ['WiFi', 'Shower', 'TV', 'Air Conditioning', 'Desk', 'Wardrobe', 'Toiletries', 'Fresh Towels'],
        roomNumber: `R${roomCounter}`,
        floor: Math.ceil(roomCounter / 5),
        availability: true,
        featured: i === 0,
        status: 'available',
        viewType: 'Garden View',
        smokingAllowed: false,
        petFriendly: false
      });
      roomCounter++;
    }

    // Room Type 2: Two single beds with shower - R850 (4 rooms)
    for (let i = 0; i < 4; i++) {
      roomsData.push({
        name: `Twin Room ${roomCounter}`,
        type: 'standard',
        description: 'Spacious room with two single beds and modern shower. Ideal for friends or colleagues traveling together. Experience comfort and convenience.',
        price: 850,
        capacity: 2,
        size: 22,
        beds: 2,
        amenities: ['WiFi', 'Shower', 'TV', 'Air Conditioning', 'Desk', 'Wardrobe', 'Toiletries', 'Fresh Towels', 'Mini Fridge'],
        roomNumber: `R${roomCounter}`,
        floor: Math.ceil(roomCounter / 5),
        availability: true,
        featured: i === 0,
        status: 'available',
        viewType: 'Garden View',
        smokingAllowed: false,
        petFriendly: false
      });
      roomCounter++;
    }

    // Room Type 3: One double and one single bed with shower - R850 (4 rooms)
    for (let i = 0; i < 4; i++) {
      roomsData.push({
        name: `Family Room ${roomCounter}`,
        type: 'family',
        description: 'Perfect family accommodation with one double bed and one single bed. Modern shower facilities included. Your comfortable home away from home.',
        price: 850,
        capacity: 3,
        size: 26,
        beds: 2,
        amenities: ['WiFi', 'Shower', 'TV', 'Air Conditioning', 'Desk', 'Wardrobe', 'Toiletries', 'Fresh Towels', 'Mini Fridge', 'Coffee Maker'],
        roomNumber: `R${roomCounter}`,
        floor: Math.ceil(roomCounter / 5),
        availability: true,
        featured: i === 0,
        status: 'available',
        viewType: 'Pool View',
        smokingAllowed: false,
        petFriendly: false
      });
      roomCounter++;
    }

    // Room Type 4: One double bed with bath and shower - R950 (3 rooms)
    for (let i = 0; i < 3; i++) {
      roomsData.push({
        name: `Deluxe Double Room ${roomCounter}`,
        type: 'deluxe',
        description: 'Luxurious room with one double bed, featuring both bath and shower facilities. Premium comfort for a memorable stay at your home away from home.',
        price: 950,
        capacity: 2,
        size: 24,
        beds: 1,
        amenities: ['WiFi', 'Bath & Shower', 'TV', 'Air Conditioning', 'Desk', 'Wardrobe', 'Toiletries', 'Fresh Towels', 'Mini Fridge', 'Coffee Maker', 'Bathrobe', 'Slippers'],
        roomNumber: `R${roomCounter}`,
        floor: Math.ceil(roomCounter / 5),
        availability: true,
        featured: i === 0,
        status: 'available',
        viewType: 'Garden View',
        smokingAllowed: false,
        petFriendly: false
      });
      roomCounter++;
    }

    const createdRooms = await Room.bulkCreate(roomsData);

    res.json({
      success: true,
      message: `Successfully seeded ${createdRooms.length} rooms`,
      data: {
        total: createdRooms.length,
        breakdown: {
          type1_single: 4,
          type2_twin: 4,
          type3_family: 4,
          type4_deluxe: 3
        },
        rooms: createdRooms
      }
    });
  } catch (error) {
    console.error('Seed rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while seeding rooms',
      error: error.message
    });
  }
});

// @route   POST /api/admin/seed-rooms-v2
// @desc    Seed room data (4 types with quantities) - NEW VERSION
// @access  Private
router.post('/seed-rooms-v2', auth, async (req, res) => {
  try {
    const Room = require('../models/Room');

    // Delete all existing rooms
    await Room.destroy({ where: {}, truncate: true });

    // Phokela Guest House - "Home Away from Home"
    // 4 Room Types with Quantity Tracking
    const roomTypes = [
      // Room Type 1: Standard Single - R750 (5 rooms available)
      {
        name: 'Standard Single Room',
        type: 'standard',
        description: 'Comfortable room with one single bed and modern shower facilities. Perfect for solo travelers looking for a peaceful retreat. Your home away from home.',
        price: 750,
        capacity: 1,
        size: 18,
        beds: 1,
        amenities: ['WiFi', 'Shower', 'TV', 'Air Conditioning', 'Desk', 'Wardrobe', 'Toiletries', 'Fresh Towels'],
        totalQuantity: 5,
        bookedQuantity: 0,
        availability: true,
        featured: true,
        status: 'available',
        viewType: 'Garden View',
        smokingAllowed: false,
        petFriendly: false
      },
      // Room Type 2: Twin Room - R850 (7 rooms available)
      {
        name: 'Twin Room',
        type: 'standard',
        description: 'Spacious room with two single beds and modern shower. Ideal for friends or colleagues traveling together. Experience comfort and convenience.',
        price: 850,
        capacity: 2,
        size: 22,
        beds: 2,
        amenities: ['WiFi', 'Shower', 'TV', 'Air Conditioning', 'Desk', 'Wardrobe', 'Toiletries', 'Fresh Towels', 'Mini Fridge'],
        totalQuantity: 7,
        bookedQuantity: 0,
        availability: true,
        featured: true,
        status: 'available',
        viewType: 'Garden View',
        smokingAllowed: false,
        petFriendly: false
      },
      // Room Type 3: Family Room - R900 (4 rooms available)
      {
        name: 'Family Room',
        type: 'family',
        description: 'Perfect family accommodation with one double bed and one single bed. Modern shower facilities included. Your comfortable home away from home.',
        price: 900,
        capacity: 3,
        size: 26,
        beds: 2,
        amenities: ['WiFi', 'Shower', 'TV', 'Air Conditioning', 'Desk', 'Wardrobe', 'Toiletries', 'Fresh Towels', 'Mini Fridge', 'Coffee Maker'],
        totalQuantity: 4,
        bookedQuantity: 0,
        availability: true,
        featured: true,
        status: 'available',
        viewType: 'Pool View',
        smokingAllowed: false,
        petFriendly: false
      },
      // Room Type 4: Deluxe Double - R950 (3 rooms available)
      {
        name: 'Deluxe Double Room',
        type: 'deluxe',
        description: 'Luxurious room with one double bed, featuring both bath and shower facilities. Premium comfort for a memorable stay at your home away from home.',
        price: 950,
        capacity: 2,
        size: 24,
        beds: 1,
        amenities: ['WiFi', 'Bath & Shower', 'TV', 'Air Conditioning', 'Desk', 'Wardrobe', 'Toiletries', 'Fresh Towels', 'Mini Fridge', 'Coffee Maker', 'Bathrobe', 'Slippers'],
        totalQuantity: 3,
        bookedQuantity: 0,
        availability: true,
        featured: false,
        status: 'available',
        viewType: 'Garden View',
        smokingAllowed: false,
        petFriendly: false
      }
    ];

    const createdRooms = await Room.bulkCreate(roomTypes);

    res.json({
      success: true,
      message: `Successfully seeded ${createdRooms.length} room types`,
      data: {
        totalRoomTypes: createdRooms.length,
        totalRoomsAvailable: roomTypes.reduce((sum, room) => sum + room.totalQuantity, 0),
        roomTypes: createdRooms.map(room => ({
          id: room.id,
          name: room.name,
          type: room.type,
          price: room.price,
          totalQuantity: room.totalQuantity,
          availableQuantity: room.getAvailableQuantity()
        }))
      }
    });
  } catch (error) {
    console.error('Seed rooms v2 error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while seeding rooms',
      error: error.message
    });
  }
});

module.exports = router;