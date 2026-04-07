# PayFast Payment Flow - Phokela Guest House

## 🎯 Payment Flow Overview

### **Who Pays?**

✅ **Frontend Customers** (Online Bookings)
- Customers booking through the website
- Payment is **REQUIRED** before confirmation
- PayFast button appears immediately after booking

❌ **Admin/Reception Bookings** (Manual Bookings)
- Created by staff at reception
- Payment handled manually (cash, card at reception)
- **NO** PayFast button shown

---

## 📊 Complete Booking & Payment Flow

### **1. Frontend Customer Booking (Website)**

```
Customer visits website
         ↓
Selects accommodation/service
         ↓
Clicks "Book Now"
         ↓
Fills booking form
  - Guest details
  - Dates
  - Special requests
         ↓
Submits booking → POST /api/bookings
         ↓
Booking Created
  - status: 'pending'
  - paymentStatus: 'pending'
  - source: 'website' ← IMPORTANT!
         ↓
Success Modal Appears
  ✓ Booking reference shown
  ✓ Payment section displayed
  ✓ PayFast "Pay Now" button
         ↓
Customer clicks "Pay R..."
         ↓
Redirect to PayFast Sandbox
         ↓
Customer completes payment
  - Card
  - EFT
  - Other methods
         ↓
PayFast processes payment
         ↓
PayFast sends ITN → POST /api/payfast/notify
         ↓
Backend validates ITN
  - Signature check
  - Payment status check
         ↓
Booking Updated
  - status: 'confirmed'
  - paymentStatus: 'fully-paid'
  - paymentDetails: { transaction info }
         ↓
Customer redirected → /payment/success
         ↓
Confirmation email sent
         ↓
✓ BOOKING CONFIRMED!
```

---

### **2. Admin/Reception Booking (Manual)**

```
Staff at reception
         ↓
Customer walks in / calls
         ↓
Admin Panel: /admin/bookings/new
         ↓
Fills booking form
  - Guest details
  - Dates
  - Service/Room
         ↓
Submits booking → POST /api/bookings
         ↓
Booking Created
  - status: 'pending'
  - paymentStatus: 'pending'
  - source: 'walk-in' or 'phone' ← IMPORTANT!
         ↓
NO PayFast button shown
         ↓
Staff processes payment manually
  - Cash
  - Card terminal
  - Bank transfer
         ↓
Admin updates payment status manually
  - Click "Payment" button
  - Select "fully-paid"
  - Enter payment method
  - Enter reference number
         ↓
Booking Updated
  - status: 'confirmed'
  - paymentStatus: 'fully-paid'
  - paymentDetails: { manual transaction info }
         ↓
✓ BOOKING CONFIRMED!
```

---

## 🔑 Key Differences

| Aspect | Frontend Booking | Admin Booking |
|--------|-----------------|---------------|
| **Source** | `'website'` | `'walk-in'`, `'phone'`, `'email'`, `'referral'` |
| **Payment Method** | PayFast (online) | Manual (reception) |
| **PayFast Button** | ✅ YES | ❌ NO |
| **Payment Required** | Yes, before confirmation | No, manual handling |
| **Payment Flow** | Automated via ITN | Manual update |

---

## 🎨 UI/UX Details

### **Frontend Booking Success Modal**

After successful booking creation:

```
┌─────────────────────────────────────┐
│  ✓ Booking Created!                 │
│                                      │
│  Reference: PH2511220001             │
│  Email sent to: customer@email.com   │
│                                      │
│  ┌───────────────────────────────┐  │
│  │ Complete Your Payment         │  │
│  │                               │  │
│  │     R 1,500.00                │  │
│  │     Total Amount              │  │
│  │                               │  │
│  │  [Pay R1,500.00 - Secure]    │  │
│  │                               │  │
│  │  ⚠ Booking confirmed after   │  │
│  │     successful payment        │  │
│  └───────────────────────────────┘  │
│                                      │
│  Skip payment (pay later)            │
└─────────────────────────────────────┘
```

### **Admin Panel - Website Booking**

Booking list showing website booking:

```
┌────────────────────────────────────────────┐
│ PH2511220001 │ John Doe │ Pending │ Pending│
│                                             │
│ Actions:                                    │
│ [Confirm] [Status]                          │
│ [Pay R1,500.00] [Payment] [Details]  ←─────┤ PayFast button
└────────────────────────────────────────────┘
```

### **Admin Panel - Manual Booking**

Booking list showing reception booking:

```
┌────────────────────────────────────────────┐
│ PH2511220002 │ Jane Smith │ Pending │ Pending│
│                                             │
│ Actions:                                    │
│ [Confirm] [Status]                          │
│ [Payment] [Details]  ←──────────────────────┤ NO PayFast button
└────────────────────────────────────────────┘
```

---

## 🔒 Security & Validation

### **Payment Validation (ITN)**

1. **Signature Check** - Validates PayFast signature
2. **IP Validation** - Confirms request from PayFast servers
3. **Amount Verification** - Matches booking amount
4. **Status Check** - Ensures payment is "COMPLETE"

### **Booking Source Validation**

```javascript
// Only show PayFast for website bookings
{booking.source === 'website' && booking.paymentStatus === 'pending' && (
  <PayFastButton />
)}
```

---

## 💡 Important Notes

### **For Frontend Customers:**

- ✅ Payment is required to confirm booking
- ✅ Multiple payment methods via PayFast
- ✅ Secure payment processing
- ✅ Automatic confirmation after payment
- ✅ Email confirmation sent

### **For Reception Staff:**

- ✅ Create bookings for walk-in customers
- ✅ Process payments manually
- ✅ Update payment status in admin panel
- ✅ No online payment required
- ✅ Full control over booking process

### **For Administrators:**

- ✅ View all bookings (website + manual)
- ✅ See payment source (website vs manual)
- ✅ PayFast button only for website bookings
- ✅ Manual payment update for reception bookings
- ✅ Full transaction history

---

## 🧪 Testing Scenarios

### **Scenario 1: Website Booking with Payment**

1. Go to website: http://localhost:5173
2. Browse accommodation/services
3. Click "Book Now"
4. Fill booking form
5. Submit
6. **Verify**: Payment button appears
7. Click "Pay R..."
8. Complete payment in sandbox
9. **Verify**: Redirected to success page
10. **Verify**: Booking status = confirmed
11. **Verify**: Payment status = fully-paid

### **Scenario 2: Reception Booking (No Payment)**

1. Go to admin: http://localhost:5173/admin
2. Navigate to Bookings → New Booking
3. Fill booking form
4. Submit
5. **Verify**: NO PayFast button in booking list
6. Click "Payment" button
7. Manually update to "fully-paid"
8. **Verify**: Booking confirmed without online payment

### **Scenario 3: Website Booking - Skip Payment**

1. Create booking on website
2. Payment modal appears
3. Click "Skip payment (pay later)"
4. **Verify**: Booking created but NOT confirmed
5. **Verify**: Admin can see PayFast button
6. Admin sends payment link to customer
7. Customer completes payment
8. **Verify**: Booking auto-confirmed via ITN

---

## 📞 Support Scenarios

### **Customer Didn't Pay**

- Booking exists with `paymentStatus: 'pending'`
- Admin can see PayFast button
- Admin can click to get payment link
- Send link to customer via email/WhatsApp

### **Payment Failed**

- Customer redirected to cancel page
- Booking remains `paymentStatus: 'pending'`
- Customer can retry payment
- Or admin can mark as paid if payment received

### **Manual Payment Received**

- Customer paid via bank transfer
- Admin verifies payment
- Updates booking payment status manually
- Marks as "fully-paid"
- Booking confirmed

---

## ✅ Checklist for Going Live

**Frontend:**
- [ ] PayFast button appears on website bookings
- [ ] Payment modal shows after booking
- [ ] Success/cancel pages working
- [ ] Email notifications configured

**Admin Panel:**
- [ ] PayFast button ONLY for website bookings
- [ ] Manual payment update works
- [ ] Booking source displayed correctly

**Backend:**
- [ ] ITN webhook configured
- [ ] Signature validation working
- [ ] Payment status auto-updates
- [ ] Email service configured

**Production:**
- [ ] Update PayFast mode to production
- [ ] SSL certificate installed
- [ ] ITN URL publicly accessible
- [ ] Test with real small payment

---

**Everything is configured correctly!** 🎉

Frontend customers pay online via PayFast.
Reception bookings are handled manually.
