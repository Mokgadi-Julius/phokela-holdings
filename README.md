# Phokela Guest House - Hotel Booking System

A comprehensive full-stack booking management system for Phokela Guest House, built with React (frontend) and Node.js/Express (backend).

## Features

### Core Functionality
- **Multi-Service Booking System**
  - Accommodation booking (rooms/suites)
  - Conference room booking
  - Event hosting services
  - Catering services

- **Complete Booking Management**
  - Real-time availability checking
  - Automated booking reference generation
  - Email confirmations
  - Multiple booking statuses (pending, confirmed, cancelled, completed, no-show)
  - Payment tracking (pending, deposit-paid, fully-paid, refunded)

- **Guest Management**
  - Guest information collection
  - Special requests handling (dietary, accessibility, etc.)
  - Communication history tracking

- **Admin Features**
  - Dashboard with statistics
  - Booking reports and analytics
  - Revenue tracking by category
  - Calendar view of bookings

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Email**: Nodemailer
- **Security**:
  - Helmet.js (HTTP headers security)
  - CORS protection
  - Rate limiting (100 requests per 15 minutes)
  - Bcrypt (password hashing)
- **File Uploads**: Multer
- **Environment**: dotenv

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS
- **UI Components**:
  - Headless UI
  - React Icons
  - React DatePicker
  - Swiper (for sliders)
  - Spinners React (loading states)

## Project Structure

```
phokela_holdings/
├── HotelBooking--Backend/
│   ├── src/
│   │   ├── config/         # Database and configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Mongoose models
│   │   │   ├── Booking.js  # Booking schema with auto-generated references
│   │   │   ├── Service.js  # Service/Room schema
│   │   │   └── Contact.js  # Contact form schema
│   │   ├── routes/         # API routes
│   │   │   ├── bookings.js # Booking endpoints
│   │   │   ├── services.js # Service endpoints
│   │   │   ├── contacts.js # Contact endpoints
│   │   │   ├── admin.js    # Admin dashboard & reports
│   │   │   └── uploads.js  # File upload endpoints
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Entry point
│   ├── .env
│   └── package.json
│
├── HotelBooking--React-Frontend/
│   ├── src/
│   │   ├── assets/         # Images and static files
│   │   ├── components/     # React components
│   │   │   ├── BookingModal.jsx  # New: Full booking form
│   │   │   ├── BookForm.jsx
│   │   │   ├── Room.jsx
│   │   │   └── ...
│   │   ├── pages/          # Page components
│   │   │   ├── Accommodation.jsx
│   │   │   ├── Conference.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Catering.jsx
│   │   │   └── Contact.jsx
│   │   ├── services/       # API integration
│   │   │   └── api.js      # New: Complete API service layer
│   │   ├── context/        # React context
│   │   ├── db/             # Static data
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
│
└── README.md
```

## API Endpoints

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `GET /api/services/category/:category` - Get services by category
- `POST /api/services` - Create new service (Admin)
- `PUT /api/services/:id` - Update service (Admin)
- `DELETE /api/services/:id` - Delete service (Admin)

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get all bookings (with filters)
- `GET /api/bookings/:id` - Get booking by ID or reference
- `GET /api/bookings/calendar` - Get calendar view
- `GET /api/bookings/stats` - Get booking statistics
- `PUT /api/bookings/:id/status` - Update booking status
- `POST /api/bookings/:id/communicate` - Add communication log

### Contacts
- `POST /api/contacts` - Submit contact form
- `GET /api/contacts` - Get all contacts (Admin)
- `PUT /api/contacts/:id` - Update contact status (Admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/reports/bookings` - Booking reports
- `GET /api/admin/reports/revenue` - Revenue reports
- `POST /api/admin/seed` - Seed initial data (Development only)

### Health
- `GET /api/health` - Health check endpoint

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd HotelBooking--Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` (if not exists)
   - Update the following variables:
     ```env
     NODE_ENV=development
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/phokela-guest-house
     JWT_SECRET=your-super-secret-jwt-key
     JWT_EXPIRE=30d
     FROM_EMAIL=noreply@phokelaholdings.co.za
     ADMIN_EMAIL=admin@phokelaholdings.co.za
     FRONTEND_URL=http://localhost:5173
     ```

4. Start MongoDB service:
   - Windows: `net start MongoDB` or start MongoDB Compass
   - Mac/Linux: `sudo systemctl start mongod` or `brew services start mongodb-community`

5. Run the server:
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

6. The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd HotelBooking--React-Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create `.env` file in the frontend root
   - Add the following:
     ```env
     VITE_API_URL=http://localhost:5000/api
     VITE_APP_NAME=Phokela Guest House
     VITE_APP_URL=http://localhost:5173
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. The frontend will run on `http://localhost:5173`

### Seeding Initial Data

To populate the database with initial services:

1. Make a POST request to the seed endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/admin/seed
   ```

   Or use the browser/Postman to send a POST request to:
   `http://localhost:5000/api/admin/seed`

2. This will create 5 initial services:
   - Comfort Room (Accommodation)
   - Executive Suite (Accommodation)
   - Conference Package
   - Event Hosting Package
   - Catering Services

## Database Models

### Booking Model
- Booking reference (auto-generated: PH + YYMMDD + sequence)
- Service information (with snapshot for historical data)
- Primary guest details
- Additional guests
- Booking details (dates, guests count, special requests)
- Pricing (base price, additional charges, discounts)
- Status tracking
- Payment information
- Communication logs

### Service Model
- Name, description, category
- Facilities (with icons)
- Capacity (max persons, size)
- Pricing (amount and unit)
- Images (thumbnail, large, gallery)
- Availability status
- Featured flag
- SEO metadata

### Contact Model
- Name, email, phone
- Subject and message
- Status (new, in-progress, resolved)
- Response tracking

## Key Features Implemented

### ✅ Booking System
- Complete booking workflow from frontend to backend
- Validation on both client and server side
- Automated booking reference generation
- Email confirmation system
- Support for different service categories
- Special requests handling

### ✅ API Integration
- Centralized API service layer
- Error handling with custom APIError class
- Environment-based configuration
- Support for filters and pagination

### ✅ Security
- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Helmet.js for HTTP header security
- Input validation and sanitization
- JWT authentication ready

### ✅ User Experience
- Responsive design with Tailwind CSS
- Loading states and error handling
- Success confirmations
- Modal-based booking forms
- WhatsApp integration

## Important Notes

### MongoDB Connection
**Note**: MongoDB is NOT currently running. The application will function but bookings will not be saved to the database. To enable full functionality:

1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start the MongoDB service
3. Restart the backend server

The backend will continue to run without MongoDB in development mode, but all database operations will fail gracefully.

### Email Service
The email service is configured for development mode. No actual emails will be sent. For production:
1. Update the email configuration in `src/utils/emailService.js`
2. Configure SMTP credentials
3. Set `NODE_ENV=production`

### Authentication
Currently, admin routes are not protected. To add authentication:
1. Implement login/register endpoints
2. Create auth middleware to protect admin routes
3. Add JWT token handling in frontend

## Development Roadmap

### Immediate Improvements Needed
1. **Start MongoDB** - Install and configure MongoDB
2. **Add Authentication** - Implement user login system
3. **Payment Integration** - Add payment gateway (Stripe, PayPal, etc.)
4. **Admin Dashboard** - Create admin frontend panel
5. **Image Upload** - Implement actual image upload functionality

### Future Enhancements
- Real-time availability calendar
- SMS notifications
- Online payment processing
- Multi-language support
- Mobile app version
- Advanced reporting and analytics
- Customer loyalty program
- Integration with booking platforms (Booking.com, Airbnb, etc.)

## Testing

### Backend Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-18T16:00:00.000Z",
  "environment": "development"
}
```

### Test Booking Creation
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "service": "SERVICE_ID_HERE",
    "primaryGuest": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+27123456789"
    },
    "bookingDetails": {
      "checkIn": "2025-11-01",
      "checkOut": "2025-11-05",
      "adults": 2,
      "children": 0
    }
  }'
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is installed and running
- Check the connection string in `.env`
- Verify MongoDB is listening on port 27017

### Frontend API Errors
- Verify backend is running on port 5000
- Check CORS configuration
- Ensure `.env` file exists with correct API URL

### Build Errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`
- Ensure Node.js version is compatible (v16+)

## License
Private project for Phokela Guest House

## Contact
For support or inquiries: admin@phokelaholdings.co.za
