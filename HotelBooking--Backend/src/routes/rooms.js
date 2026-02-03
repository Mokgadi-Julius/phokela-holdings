const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const Room = require('../models/Room');

// @route   GET /api/rooms
// @desc    Get all rooms with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, minPrice, maxPrice, minCapacity, availability, featured } = req.query;

    const whereClause = {};

    if (type) {
      whereClause.type = type;
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Room.sequelize.Sequelize.Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[Room.sequelize.Sequelize.Op.lte] = parseFloat(maxPrice);
    }

    if (minCapacity) {
      whereClause.capacity = {
        [Room.sequelize.Sequelize.Op.gte]: parseInt(minCapacity)
      };
    }

    if (availability !== undefined) {
      whereClause.availability = availability === 'true';
    }

    if (featured !== undefined) {
      whereClause.featured = featured === 'true';
    }

    const rooms = await Room.findAll({
      where: whereClause,
      order: [
        ['featured', 'DESC'],
        ['price', 'ASC']
      ]
    });

    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: error.message
    });
  }
});

// @route   GET /api/rooms/featured
// @desc    Get featured rooms
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const rooms = await Room.getFeaturedRooms(limit);

    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get featured rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured rooms',
      error: error.message
    });
  }
});

// @route   GET /api/rooms/type/:type
// @desc    Get rooms by type
// @access  Public
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const rooms = await Room.findByType(type);

    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get rooms by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms by type',
      error: error.message
    });
  }
});

// @route   GET /api/rooms/search
// @desc    Search rooms
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, type, minCapacity } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (minCapacity) {
      filters.capacity = {
        [Room.sequelize.Sequelize.Op.gte]: parseInt(minCapacity)
      };
    }

    const rooms = await Room.search(q, filters);

    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Search rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search rooms',
      error: error.message
    });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room',
      error: error.message
    });
  }
});

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private (Admin only - add auth middleware later)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      price,
      capacity,
      size,
      beds,
      totalQuantity,
      amenities,
      mainImage,
      images,
      availability,
      featured,
      floor,
      roomNumber,
      status,
      viewType,
      smokingAllowed,
      petFriendly
    } = req.body;

    // Validate required fields
    if (!name || !type || !description || !price || !capacity || !size || !beds) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const room = await Room.create({
      name,
      type,
      description,
      price: parseFloat(price),
      capacity: parseInt(capacity),
      size: parseFloat(size),
      beds: parseInt(beds),
      totalQuantity: totalQuantity ? parseInt(totalQuantity) : 1,
      bookedQuantity: 0,
      amenities: amenities || [],
      mainImage: mainImage || null,
      images: images || [],
      availability: availability !== undefined ? availability : true,
      featured: featured || false,
      floor,
      roomNumber,
      status: status || 'available',
      viewType,
      smokingAllowed: smokingAllowed || false,
      petFriendly: petFriendly || false
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    console.error('Create room error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Room number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: error.message
    });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update a room
// @access  Private (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const {
      name,
      type,
      description,
      price,
      capacity,
      size,
      beds,
      totalQuantity,
      amenities,
      mainImage,
      images,
      availability,
      featured,
      floor,
      roomNumber,
      status,
      viewType,
      smokingAllowed,
      petFriendly
    } = req.body;

    // Validate totalQuantity if being updated
    if (totalQuantity !== undefined) {
      const newTotal = parseInt(totalQuantity);
      if (newTotal < room.bookedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot set total quantity to ${newTotal}. Currently ${room.bookedQuantity} rooms are booked. Please cancel some bookings first.`
        });
      }
    }

    // Update fields
    if (name !== undefined) room.name = name;
    if (type !== undefined) room.type = type;
    if (description !== undefined) room.description = description;
    if (price !== undefined) room.price = parseFloat(price);
    if (capacity !== undefined) room.capacity = parseInt(capacity);
    if (size !== undefined) room.size = parseFloat(size);
    if (beds !== undefined) room.beds = parseInt(beds);
    if (totalQuantity !== undefined) room.totalQuantity = parseInt(totalQuantity);
    if (amenities !== undefined) room.amenities = amenities;
    if (mainImage !== undefined) room.mainImage = mainImage;
    if (images !== undefined) room.images = images;
    if (availability !== undefined) room.availability = availability;
    if (featured !== undefined) room.featured = featured;
    if (floor !== undefined) room.floor = floor;
    if (roomNumber !== undefined) room.roomNumber = roomNumber;
    if (status !== undefined) room.status = status;
    if (viewType !== undefined) room.viewType = viewType;
    if (smokingAllowed !== undefined) room.smokingAllowed = smokingAllowed;
    if (petFriendly !== undefined) room.petFriendly = petFriendly;

    await room.save();

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: room
    });
  } catch (error) {
    console.error('Update room error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Room number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update room',
      error: error.message
    });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete a room
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Delete associated images from filesystem
    if (room.images && Array.isArray(room.images)) {
      room.images.forEach(imageUrl => {
        try {
          const imagePath = imageUrl.replace('/uploads/', '');
          const fullPath = path.join(__dirname, '../uploads', imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (err) {
          console.error('Error deleting image file:', err);
        }
      });
    }

    await room.destroy();

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room',
      error: error.message
    });
  }
});

// @route   POST /api/rooms/upload-images
// @desc    Upload room images
// @access  Private (Admin only)
router.post('/upload-images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const imageUrls = req.files.map(file => file.path); // Cloudinary returns the URL in file.path

    res.json({
      success: true,
      message: `${req.files.length} images uploaded successfully`,
      data: {
        imageUrls
      }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

// @route   PATCH /api/rooms/:id/availability
// @desc    Toggle room availability
// @access  Private (Admin only)
router.patch('/:id/availability', async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    await room.toggleAvailability();

    res.json({
      success: true,
      message: 'Room availability updated',
      data: room
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room availability',
      error: error.message
    });
  }
});

// @route   PATCH /api/rooms/:id/status
// @desc    Update room status
// @access  Private (Admin only)
router.patch('/:id/status', async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    await room.updateStatus(status);

    res.json({
      success: true,
      message: 'Room status updated',
      data: room
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update room status',
      error: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.'
    });
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files. Maximum is 10 images.'
    });
  }

  res.status(500).json({
    success: false,
    message: error.message || 'Upload failed'
  });
});

module.exports = router;
