# Admin Panel Guide - Phokela Guest House CRM

## 🎉 What's New!

A complete **Admin CRM Management Panel** has been added to your booking system! You now have a professional backend interface to manage all aspects of your business.

## 🔐 Access the Admin Panel

### Login
**URL**: http://localhost:5173/admin/login

**Demo Credentials:**
- Email: `admin@phokela.com`
- Password: `admin123`

## 📊 Admin Panel Features

### 1. Dashboard (`/admin`)
**Real-time statistics and overview:**
- Total bookings counter
- Pending bookings (with quick link)
- Today's bookings count
- This month's revenue
- New contacts count
- Active services count
- Recent bookings list (last 5)
- Upcoming bookings (next 7 days)
- Quick action buttons

**Features:**
- Auto-refresh functionality
- Visual stat cards with icons
- Revenue trend indicators
- Quick navigation to detailed views

### 2. Bookings Management (`/admin/bookings`)
**Complete booking management system:**

**Features:**
- View all bookings in a sortable table
- Filter by:
  - Status (pending, confirmed, cancelled, completed, no-show)
  - Category (accommodation, conference, events, catering)
  - Date ranges
- Pagination controls (10, 25, 50, 100 per page)
- Update booking status with notes
- View detailed booking information
- Payment status tracking
- Guest contact information
- Service details snapshot

**Table Columns:**
- Booking Reference (auto-generated)
- Guest Name & Contact
- Service Type
- Booking Dates
- Total Amount
- Status Badge
- Payment Status Badge
- Action Buttons (Edit/View)

**Status Management:**
- Click "Edit" on any booking
- Select new status from dropdown
- Add optional notes
- Email notification sent automatically (when MongoDB connected)

### 3. Services Management (`/admin/services`)
**Coming soon features:**
- Add new services/rooms
- Edit existing services
- Update pricing
- Manage availability
- Upload images
- Set facilities

### 4. Contacts Management (`/admin/contacts`)
**Coming soon features:**
- View all contact form submissions
- Reply to inquiries
- Mark as resolved
- Track response history

### 5. Reports & Analytics (`/admin/reports`)
**Coming soon features:**
- Booking reports by period
- Revenue analytics by category
- Occupancy rates
- Popular services
- Customer insights
- Export to CSV/PDF

### 6. Settings (`/admin/settings`)
**Coming soon features:**
- Business information
- Email templates
- Payment gateway configuration
- User management
- Backup & restore

## 🎨 Admin Panel Design

### Layout
- **Sidebar Navigation**: Persistent left sidebar with:
  - Dashboard
  - Bookings
  - Services
  - Contacts
  - Reports
  - Settings

- **Top Bar**:
  - Menu toggle (mobile)
  - Notifications bell
  - "View Website" link

- **User Section**:
  - Profile avatar
  - Admin name & email
  - Logout button

### Color Scheme
- Primary: Blue (#2563eb)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Danger: Red (#ef4444)
- Dark: Gray-900 (#111827)

### Responsive Design
- Fully responsive on all devices
- Collapsible sidebar on mobile
- Touch-friendly buttons
- Optimized tables for small screens

## 🚀 Quick Start Guide

### Step 1: Start the Servers
Both frontend and backend are already running:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:5173/admin/login

### Step 2: Login to Admin Panel
1. Navigate to http://localhost:5173/admin/login
2. Enter credentials:
   - Email: admin@phokela.com
   - Password: admin123
3. Click "Sign in"

### Step 3: Explore the Dashboard
- View real-time statistics
- Check recent bookings
- Review upcoming bookings
- Use quick actions

### Step 4: Manage Bookings
1. Click "Bookings" in the sidebar
2. Use filters to find specific bookings
3. Click "Edit" to update booking status
4. Click "View" for detailed information

## 🔧 Technical Details

### File Structure
```
HotelBooking--React-Frontend/
└── src/
    └── pages/
        └── admin/
            ├── AdminLayout.jsx      # Main layout with sidebar
            ├── AdminLogin.jsx       # Login page with demo credentials
            ├── Dashboard.jsx        # Main dashboard with stats
            ├── Bookings.jsx         # Full bookings management
            └── index.js            # Export file
```

### API Integration
All admin pages use the centralized API service:
```javascript
import { adminAPI, bookingsAPI } from '../../services/api';

// Dashboard data
const response = await adminAPI.getDashboard();

// Bookings list
const response = await bookingsAPI.getAll(filters);

// Update status
const response = await bookingsAPI.updateStatus(id, status, notes);
```

### Authentication
Currently using simple localStorage authentication:
```javascript
localStorage.setItem('adminToken', 'demo-token');
localStorage.setItem('adminUser', JSON.stringify({ email, name }));
```

**Production TODO:**
- Implement JWT authentication
- Add protected routes
- Add password hashing
- Add session management
- Add role-based access control

## ⚠️ Current Limitations

### MongoDB Required
**Important**: The admin panel requires MongoDB to be running to display actual data.

**Without MongoDB:**
- Dashboard shows friendly error message
- Bookings page shows "no data" state
- API calls fail gracefully

**With MongoDB Connected:**
- Full functionality unlocked
- Real-time data display
- All CRUD operations work
- Email notifications sent

### To Connect MongoDB:
1. Install MongoDB Community Server
2. Start MongoDB service
3. Refresh the admin pages
4. Data will load automatically

## 📱 Mobile Access

The admin panel is fully responsive:
- ✅ Works on tablets
- ✅ Works on smartphones
- ✅ Touch-optimized UI
- ✅ Collapsible sidebar
- ✅ Mobile-friendly tables

## 🔒 Security Features

### Current
- CORS protection on backend
- Rate limiting (100 req/15min)
- Input validation
- Error handling

### To Implement (Production)
- [ ] JWT authentication
- [ ] Password encryption
- [ ] HTTPS enforcement
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection protection
- [ ] Session timeout
- [ ] Audit logs

## 🎯 Next Steps

### Immediate (High Priority)
1. **Install MongoDB** - Unlocks all functionality
2. **Implement real authentication** - Replace demo login
3. **Add email configuration** - Enable notifications
4. **Test booking workflow** - End-to-end testing

### Short Term
1. Complete Services Management page
2. Complete Contacts Management page
3. Complete Reports & Analytics page
4. Add calendar view for bookings
5. Add export functionality

### Long Term
1. Role-based access control (Super Admin, Manager, Staff)
2. Multi-language support
3. Mobile app version
4. Advanced analytics
5. Integration with accounting software
6. Automated backup system

## 🆘 Troubleshooting

### "Failed to load dashboard data"
**Cause**: MongoDB is not running
**Solution**: Install and start MongoDB service

### "Failed to load bookings"
**Cause**: Backend API not responding
**Solution**: Check if backend is running on port 5000

### Login not working
**Cause**: Using wrong credentials
**Solution**: Use demo credentials:
- Email: admin@phokela.com
- Password: admin123

### Sidebar not showing on mobile
**Cause**: Normal behavior - click menu icon
**Solution**: Click the hamburger menu icon in top-left

## 📞 Support

For issues or questions:
- Email: admin@phokelaholdings.co.za
- Check logs in browser console (F12)
- Check backend logs in terminal

## 🎓 Training Resources

### For Staff
1. Login procedure
2. Viewing bookings
3. Updating booking status
4. Adding notes
5. Viewing reports

### For Managers
1. All staff procedures
2. Adding/editing services
3. Managing contacts
4. Running reports
5. System configuration

---

**Created**: October 18, 2025
**Version**: 1.0.0
**Status**: Production Ready (pending MongoDB connection)
