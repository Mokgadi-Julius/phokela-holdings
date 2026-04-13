# Troubleshooting Guide

## Issue: "Server error while creating room booking"

### Diagnosis Steps

#### 1. Check Backend Server Status
```bash
# Is the backend running?
# Should see: "🚀 Phokela Guest House API Server running on port 5000"
```

#### 2. Check Database Connection
The logs show: `❌ MySQL connection failed: Too many keys specified; max 64 keys allowed`

This error means MySQL has too many indexes defined across all tables.

### Solution: Reduce Indexes

The issue is that when Sequelize syncs all models, the combined number of indexes exceeds MySQL's limit of 64 keys per table.

**Option 1: Use Existing Database (Recommended)**
Instead of syncing models on startup, use the existing database structure:

**File: `src/server.js`**
```javascript
// Change from:
await sequelize.sync({ alter: true });

// To:
await sequelize.authenticate();  // Just check connection, don't sync
```

**Option 2: Reduce Indexes in Models**

Remove less critical indexes from models. For example:

**File: `src/models/Room.js`**
```javascript
indexes: [
  { fields: ['type', 'availability'] },  // Keep - used for filtering
  // { fields: ['price'] },  // Remove - less critical
  // { fields: ['capacity'] },  // Remove - less critical
  { fields: ['featured', 'availability'] },  // Keep - used for homepage
  { fields: ['status'] },  // Keep - important
  { fields: ['roomNumber'], unique: true },  // Keep - unique constraint
],
```

### Quick Fix for Testing

1. **Stop all backend servers**
2. **Comment out sync in server.js**:
```javascript
// await sequelize.sync({ alter: true });
await sequelize.authenticate();
console.log('✅ MySQL Database Connected (no sync)');
```

3. **Restart backend**
4. **Try creating booking again**

### Check if Booking API Works

Test the room booking endpoint directly:

```bash
curl -X POST http://localhost:5000/api/bookings/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "roomQuantity": 1,
    "primaryGuest": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "phone": "0123456789"
    },
    "bookingDetails": {
      "checkIn": "2025-10-25",
      "checkOut": "2025-10-27",
      "adults": 2,
      "children": 0
    }
  }'
```

### Common Errors and Solutions

#### Error: "Room not found"
- **Cause**: Room ID doesn't exist
- **Solution**: Check room IDs in database or create rooms first

#### Error: "Only X room(s) available"
- **Cause**: Trying to book more rooms than available
- **Solution**: Check room availability, reduce quantity, or wait for checkout

#### Error: "Check-out date must be after check-in date"
- **Cause**: Invalid dates
- **Solution**: Ensure check-out is after check-in

#### Error: "Server error while creating room booking"
- **Cause**: Database connection issue or model validation error
- **Solution**: Check backend logs for detailed error message

### Debug Mode

To see detailed error messages:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try creating booking again
4. Look for red error messages

### Database Verification

Check if rooms exist:
```bash
curl http://localhost:5000/api/rooms
```

Should return array of rooms with `totalQuantity` and `bookedQuantity` fields.

### Contact Information

If error persists, please provide:
1. **Full error message** from browser console
2. **Backend server logs** (what appears in terminal)
3. **Room ID** you're trying to book
4. **Booking details** (quantity, dates, etc.)

This will help diagnose the exact issue.
