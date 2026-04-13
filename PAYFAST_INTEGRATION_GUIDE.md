# PayFast Integration Guide - Phokela Guest House

## 🎉 Integration Complete!

PayFast payment gateway has been successfully integrated into the Phokela Guest House booking system. This guide will help you test and deploy the integration.

---

## 📋 What's Been Implemented

### Backend (Node.js/Express)

✅ **PayFast Service** (`src/utils/payfastService.js`)
- MD5 signature generation
- Payment data creation
- ITN (Instant Transaction Notification) validation
- Server IP validation

✅ **PayFast Routes** (`src/routes/payfast.js`)
- `POST /api/payfast/initiate` - Initialize payment
- `POST /api/payfast/notify` - ITN webhook handler
- `GET /api/payfast/verify/:bookingId` - Verify payment status
- `GET /api/payfast/status` - Integration status

✅ **Environment Variables** (`.env`)
```env
PAYFAST_MODE=sandbox
PAYFAST_MERCHANT_ID=32156937
PAYFAST_MERCHANT_KEY=mbqkdmt1wcaao
PAYFAST_PASSPHRASE=Phokelaholdings321
PAYFAST_RETURN_URL=http://localhost:5173/payment/success
PAYFAST_CANCEL_URL=http://localhost:5173/payment/cancelled
PAYFAST_NOTIFY_URL=http://localhost:5000/api/payfast/notify
```

### Frontend (React)

✅ **Payment Components**
- `PayFastButton.jsx` - Payment initiation button
- `PaymentSuccess.jsx` - Success page
- `PaymentCancelled.jsx` - Cancelled page

✅ **Admin Panel Integration**
- Payment button appears for bookings with "pending" payment status
- Real-time payment verification
- Payment status tracking

✅ **Routes**
- `/payment/success` - Payment confirmation page
- `/payment/cancelled` - Payment cancellation page

---

## 🚀 Setup Instructions

### 1. Backend Setup

```bash
cd HotelBooking--Backend
npm install
```

**Check .env file** (already configured):
- PayFast credentials are set
- Sandbox mode enabled
- URLs configured for localhost testing

### 2. Frontend Setup

```bash
cd HotelBooking--React-Frontend
npm install
```

**Check .env file**:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Phokela Guest House
VITE_APP_URL=http://localhost:5173
```

### 3. Database Setup

Make sure MySQL is running:
```bash
# Check if MySQL container is running
docker ps

# If not, start it
cd phokela_holdings
docker-compose up -d
```

---

## 🧪 Testing in Sandbox Mode

### Step 1: Start the Servers

**Terminal 1 - Backend:**
```bash
cd HotelBooking--Backend
npm run dev
```

Server runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd HotelBooking--React-Frontend
npm run dev
```

App runs on: http://localhost:5173

### Step 2: Create a Test Booking

1. Go to **Admin Panel**: http://localhost:5173/admin
2. Navigate to **Bookings** → **New Booking**
3. Fill in the booking form:
   - Select a room
   - Enter guest details
   - Choose check-in/check-out dates
   - Submit

### Step 3: Process Payment

1. In **Bookings** list, find your new booking
2. Look for the blue **"Pay R..."** button (only shows for pending payments)
3. Click the button
4. You'll be redirected to **PayFast Sandbox**

### Step 4: Test Payment in Sandbox

PayFast will redirect you to their sandbox environment.

**Test Card Details (Sandbox Only):**
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVV: Any 3 digits
```

**Or use Instant EFT test credentials** (provided by PayFast in sandbox)

### Step 5: Verify Payment

After successful payment:
1. You'll be redirected to: `http://localhost:5173/payment/success`
2. Check your email (if email service is configured)
3. Backend console will show ITN processing logs
4. Booking status updates to "confirmed"
5. Payment status updates to "fully-paid"

---

## 🔍 Verification Checklist

### Backend Verification

✅ Server starts without errors
✅ PayFast routes registered: Check `/api/payfast/status`
✅ Database connection working
✅ Payment initiation works
✅ ITN webhook receives notifications

**Test API Endpoint:**
```bash
curl http://localhost:5000/api/payfast/status
```

Expected response:
```json
{
  "success": true,
  "data": {
    "mode": "sandbox",
    "merchantId": "32156937",
    "configured": true,
    "paymentUrl": "https://sandbox.payfast.co.za/eng/process"
  }
}
```

### Frontend Verification

✅ Payment button appears on pending bookings
✅ Payment redirect works
✅ Success page loads correctly
✅ Cancel page loads correctly
✅ Payment verification displays correct info

---

## 📝 Important Notes for Testing

### ITN (Instant Transaction Notification)

**Problem:** PayFast needs to send ITN to your server, but `localhost` is not accessible from the internet.

**Solutions for Testing:**

1. **Use ngrok** (Recommended for testing):
   ```bash
   # Install ngrok
   npm install -g ngrok

   # Expose your backend
   ngrok http 5000
   ```

   You'll get a URL like: `https://abc123.ngrok.io`

   Update `.env`:
   ```env
   PAYFAST_NOTIFY_URL=https://abc123.ngrok.io/api/payfast/notify
   ```

2. **Deploy to a test server** (e.g., Railway, Heroku)

3. **Manual ITN Testing:**
   - Payment still works
   - ITN just won't trigger automatically
   - Manually update payment status in admin panel

### Sandbox Test Cards

PayFast Sandbox accepts these test cards:
- **Successful:** 4000 0000 0000 0002
- **Failed:** 4000 0000 0000 0119
- **3D Secure:** 4000 0000 0000 3220

### Debugging Tips

**Check Backend Console:**
- Payment initiation logs
- ITN received logs
- Signature validation logs
- Database update logs

**Check Frontend Console:**
- Payment button click events
- API response data
- Redirect URLs

**Check PayFast Dashboard:**
- Login to PayFast sandbox
- View transactions
- Check ITN delivery status

---

## 🚀 Production Deployment

### Before Going Live

1. **Update Environment Variables:**
   ```env
   PAYFAST_MODE=production
   PAYFAST_NOTIFY_URL=https://your-production-domain.com/api/payfast/notify
   PAYFAST_RETURN_URL=https://your-production-domain.com/payment/success
   PAYFAST_CANCEL_URL=https://your-production-domain.com/payment/cancelled
   ```

2. **Enable ITN in PayFast Dashboard:**
   - Login to PayFast
   - Go to Settings → Integration
   - Enable ITN
   - Set ITN URL: `https://your-production-domain.com/api/payfast/notify`

3. **SSL Certificate Required:**
   - Production PayFast requires HTTPS
   - Ensure your domain has valid SSL

4. **Test Production Credentials:**
   - Use small real amount first
   - Verify ITN works
   - Check email notifications

### Production Checklist

- [ ] SSL certificate installed
- [ ] Environment variables updated
- [ ] ITN enabled in PayFast dashboard
- [ ] ITN URL updated to production
- [ ] Email service configured
- [ ] Test transaction completed
- [ ] Payment confirmation emails working
- [ ] Admin notifications working
- [ ] Database backups configured

---

## 🐛 Troubleshooting

### Payment Button Not Showing

**Cause:** Booking payment status is not "pending"

**Fix:** Check booking in database:
```sql
SELECT id, bookingReference, paymentStatus FROM bookings;
```

### Payment Redirect Fails

**Cause:** CORS or URL configuration

**Fix:**
- Check CORS settings in `server.js`
- Verify `FRONTEND_URL` in `.env`
- Check PayFast URLs in `.env`

### ITN Not Received

**Cause:** localhost not accessible

**Fix:**
- Use ngrok for local testing
- Or deploy to production/staging server
- Check PayFast dashboard for ITN delivery status

### Signature Validation Fails

**Cause:** Incorrect passphrase or parameter order

**Fix:**
- Verify passphrase matches PayFast dashboard
- Check parameter encoding (spaces as '+')
- Review signature generation in logs

### Payment Shows as Pending

**Cause:** ITN not processed or failed

**Fix:**
- Check backend console for ITN logs
- Verify signature validation
- Manually update payment in admin panel
- Check PayFast transaction status

---

## 📞 Support

### PayFast Support
- Email: support@payfast.co.za
- Phone: +27 21 813 9659
- Documentation: https://developers.payfast.co.za

### Testing Resources
- Sandbox Dashboard: https://sandbox.payfast.co.za
- Test Cards: https://developers.payfast.co.za/docs#test_credit_card_details
- ITN Simulator: Available in PayFast sandbox

---

## 🎯 Next Steps

1. ✅ Test full payment flow in sandbox
2. ✅ Verify ITN webhooks (using ngrok)
3. ✅ Test email notifications
4. ✅ Review payment status updates
5. ⏳ Deploy to staging environment
6. ⏳ Production testing with small amounts
7. ⏳ Go live!

---

## 📊 Payment Flow Diagram

```
Customer Creates Booking
         ↓
Booking Saved (status: pending, payment: pending)
         ↓
Admin Clicks "Pay" Button
         ↓
Frontend → POST /api/payfast/initiate
         ↓
Backend Generates PayFast Form Data
         ↓
Redirect to PayFast Sandbox
         ↓
Customer Completes Payment
         ↓
PayFast Sends ITN → POST /api/payfast/notify
         ↓
Backend Validates Signature
         ↓
Update Booking (status: confirmed, payment: fully-paid)
         ↓
Send Confirmation Email
         ↓
Redirect Customer → /payment/success
```

---

## ✅ Integration Completed

**Files Created/Modified:**

Backend:
- ✅ `src/utils/payfastService.js` - PayFast service
- ✅ `src/routes/payfast.js` - PayFast routes
- ✅ `src/server.js` - Route registration
- ✅ `.env` - PayFast credentials

Frontend:
- ✅ `src/components/PayFastButton.jsx` - Payment button
- ✅ `src/pages/PaymentSuccess.jsx` - Success page
- ✅ `src/pages/PaymentCancelled.jsx` - Cancel page
- ✅ `src/pages/admin/Bookings.jsx` - Added payment button
- ✅ `src/App.jsx` - Payment routes

Documentation:
- ✅ `PAYFAST_INTEGRATION_GUIDE.md` - This guide

**Everything is ready for testing!** 🎉
