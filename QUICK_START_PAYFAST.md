# 🚀 PayFast Integration - Quick Start

## ✅ Integration Status: COMPLETE

All PayFast payment integration has been successfully implemented!

---

## 🎯 Quick Start (3 Steps)

### 1. Start Backend
```bash
cd HotelBooking--Backend
npm run dev
```
Server: http://localhost:5000

### 2. Start Frontend
```bash
cd HotelBooking--React-Frontend
npm run dev
```
App: http://localhost:5173

### 3. Test Payment

**Option A - Frontend Customer Booking:**
1. Go to: http://localhost:5173
2. Browse and select a room/service
3. Click "Book Now"
4. Fill in booking details and submit
5. Payment button appears in success modal
6. Click "Pay R..." button
7. Complete payment in PayFast sandbox

**Option B - Admin View (Website Bookings Only):**
1. Go to Admin: http://localhost:5173/admin
2. View existing website bookings
3. Click blue "Pay R..." button on pending bookings
4. Complete payment in PayFast sandbox

**Note:** Admin-created bookings (walk-in/reception) do NOT show PayFast button

---

## 🔑 PayFast Credentials

```
Mode: Sandbox
Merchant ID: 32156937
Merchant Key: mbqkdmt1wcaao
Passphrase: Phokelaholdings321
```

---

## 💳 Test Card (Sandbox)

```
Card: 4000 0000 0000 0002
Expiry: Any future date
CVV: Any 3 digits
```

---

## 📁 Key Files Created

**Backend:**
- `src/utils/payfastService.js` - Payment processing
- `src/routes/payfast.js` - API endpoints
- `.env` - PayFast credentials

**Frontend:**
- `src/components/PayFastButton.jsx` - Payment button
- `src/pages/PaymentSuccess.jsx` - Success page
- `src/pages/PaymentCancelled.jsx` - Cancel page

---

## 🔗 API Endpoints

- `POST /api/payfast/initiate` - Start payment
- `POST /api/payfast/notify` - ITN webhook
- `GET /api/payfast/verify/:bookingId` - Check status
- `GET /api/payfast/status` - Integration info

---

## ⚠️ Important for Production

### Before Going Live:

1. Update `.env`:
   ```env
   PAYFAST_MODE=production
   PAYFAST_NOTIFY_URL=https://yourdomain.com/api/payfast/notify
   ```

2. Enable ITN in PayFast dashboard

3. Ensure SSL certificate installed

4. Test with small real payment first

---

## 🧪 Testing ITN Locally

**Problem:** PayFast can't reach localhost

**Solution:** Use ngrok

```bash
# Install ngrok
npm install -g ngrok

# Expose backend
ngrok http 5000

# Update .env with ngrok URL
PAYFAST_NOTIFY_URL=https://abc123.ngrok.io/api/payfast/notify

# Restart backend
```

---

## 📊 Payment Flow

**Frontend Customer Bookings:**
1. Customer creates booking on website
2. Payment button appears in success modal
3. Customer clicks "Pay R..." button
4. Redirect to PayFast
5. Customer completes payment
6. PayFast sends ITN to `/api/payfast/notify`
7. Backend validates & updates booking
8. Customer redirects to success page
9. Email confirmation sent

**Admin/Reception Bookings:**
1. Staff creates booking manually
2. NO PayFast button (manual payment)
3. Staff processes payment at reception
4. Updates payment status manually in admin panel

---

## 🐛 Common Issues

### Payment Button Not Showing
- Check booking `paymentStatus` is "pending"

### ITN Not Working
- Use ngrok for local testing
- Or test in production

### Signature Error
- Verify passphrase matches dashboard
- Check backend logs

---

## 📞 Support

**PayFast:**
- support@payfast.co.za
- https://developers.payfast.co.za

**Documentation:**
- Full guide: `PAYFAST_INTEGRATION_GUIDE.md`

---

## ✨ Features Implemented

✅ Full payment processing for website bookings
✅ Real-time payment verification via ITN
✅ ITN webhook handling & validation
✅ Payment status tracking (pending/fully-paid)
✅ Email notifications on payment
✅ Secure signature validation
✅ Sandbox & production modes
✅ Frontend payment modal after booking
✅ Admin PayFast button (website bookings only)
✅ Manual payment update (reception bookings)
✅ Success/cancel pages
✅ Payment reconciliation
✅ Source-based payment flow (website vs manual)

---

**Everything is ready! Start testing now! 🎉**
