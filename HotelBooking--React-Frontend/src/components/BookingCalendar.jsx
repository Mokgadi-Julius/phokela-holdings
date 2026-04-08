import React, { useState, useEffect, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { format, parseISO } from 'date-fns';
import { bookingsAPI, servicesAPI, roomsAPI } from '../services/api';

const CATEGORY_COLORS = {
  accommodation: '#3b82f6', // blue
  catering:      '#f97316', // orange
  conference:    '#8b5cf6', // purple
  events:        '#10b981', // green
};

const STATUS_BORDER_COLORS = {
  confirmed: '#16a34a',
  pending:   '#d97706',
  cancelled: '#dc2626',
  completed: '#4b5563',
  'no-show': '#7c3aed',
};

// ---------- Quick Booking Modal ----------
const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  adults: 1, children: 0,
  checkIn: '', checkOut: '', eventDate: '', eventTime: '',
  source: 'walk-in', specialRequests: '',
};

const QuickBookingModal = ({ initialDates, onClose, onCreated }) => {
  const [category, setCategory]               = useState('accommodation');
  const [serviceList, setServiceList]         = useState([]);
  const [serviceLoading, setServiceLoading]   = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [form, setForm]                       = useState({
    ...EMPTY_FORM,
    checkIn:   initialDates.checkIn,
    checkOut:  initialDates.checkOut,
    eventDate: initialDates.checkIn,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    const load = async () => {
      setServiceLoading(true);
      setSelectedServiceId('');
      setServiceList([]);
      try {
        const res = category === 'accommodation'
          ? await roomsAPI.getAll()
          : await servicesAPI.getAll({ category });
        if (res.success) setServiceList(res.data || []);
      } finally {
        setServiceLoading(false);
      }
    };
    load();
  }, [category]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) { setError('Please select a room or service.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const isAccommodation = category === 'accommodation';
      const bookingDetails = isAccommodation
        ? { checkIn: form.checkIn, checkOut: form.checkOut,  adults: parseInt(form.adults), children: parseInt(form.children) }
        : { eventDate: form.eventDate, eventTime: form.eventTime, adults: parseInt(form.adults), children: parseInt(form.children) };

      const res = await bookingsAPI.create({
        service: parseInt(selectedServiceId),
        primaryGuest: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, idNumber: '' },
        bookingDetails,
        specialRequests: { other: form.specialRequests },
        source: form.source,
      });

      if (res.success) {
        onCreated(res.data);
      } else {
        setError(res.message || 'Failed to create booking.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">New Booking</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}

          {/* Category + Service */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                <option value="accommodation">Accommodation</option>
                <option value="catering">Catering</option>
                <option value="conference">Conference</option>
                <option value="events">Events</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>
                {category === 'accommodation' ? 'Room' : 'Service'} *
              </label>
              <select
                required
                value={selectedServiceId}
                onChange={e => setSelectedServiceId(e.target.value)}
                className={inputCls}
                disabled={serviceLoading}
              >
                <option value="">{serviceLoading ? 'Loading…' : 'Select…'}</option>
                {serviceList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} — R{s.price}{s.priceUnit ? `/${s.priceUnit}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          {category === 'accommodation' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Check-in *</label>
                <input required type="date" value={form.checkIn} onChange={e => set('checkIn', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Check-out *</label>
                <input required type="date" value={form.checkOut} min={form.checkIn} onChange={e => set('checkOut', e.target.value)} className={inputCls} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Event Date *</label>
                <input required type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Event Time *</label>
                <input required type="time" value={form.eventTime} onChange={e => set('eventTime', e.target.value)} className={inputCls} />
              </div>
            </div>
          )}

          {/* Guest Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name *</label>
              <input required type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Last Name *</label>
              <input required type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone *</label>
              <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Guests + Source */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Adults *</label>
              <input required type="number" min="1" max="20" value={form.adults} onChange={e => set('adults', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Children</label>
              <input type="number" min="0" max="10" value={form.children} onChange={e => set('children', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)} className={inputCls}>
                <option value="walk-in">Walk-in</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="referral">Referral</option>
                <option value="website">Website</option>
              </select>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className={labelCls}>Special Requests</label>
            <textarea rows="2" value={form.specialRequests} onChange={e => set('specialRequests', e.target.value)} className={inputCls} placeholder="Dietary, accessibility, other…" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
              {submitting ? 'Creating…' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// -----------------------------------------

// ---------- Booking Detail Side Panel ----------
const NOTE_TYPE_LABELS = {
  general:       'Note',
  status_change: 'Status',
  reschedule:    'Reschedule',
};

const SectionHeader = ({ children }) => (
  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{children}</h4>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between items-start gap-2 text-sm">
    <span className="text-gray-500 shrink-0">{label}</span>
    <span className="font-medium text-gray-800 text-right">{value ?? '—'}</span>
  </div>
);

const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
const PAYMENT_STATUSES = ['pending', 'deposit-paid', 'fully-paid', 'refunded'];
const PAYMENT_METHODS  = ['cash', 'card', 'eft', 'payfast', 'other'];

const BookingDetailPanel = ({ booking, onClose, onBookingUpdated }) => {
  const [statusDraft,  setStatusDraft]  = useState(booking.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError,  setStatusError]  = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentStatus: booking.paymentStatus || 'pending',
    paymentMethod: '',
    amount: booking.pricing?.totalAmount || '',
    reference: '',
  });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError,  setPaymentError]  = useState(null);

  const [noteText,   setNoteText]   = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError,  setNoteError]  = useState(null);

  const isAccommodation = booking.serviceSnapshot?.category === 'accommodation' || !!booking.roomId;
  const serviceName     = booking.serviceSnapshot?.name || booking.service?.name || '—';
  const serviceCategory = booking.serviceSnapshot?.category || booking.service?.category || '—';
  const notes           = (booking.notes || []).slice().reverse(); // newest first

  const handleStatusSave = async () => {
    if (statusDraft === booking.status) return;
    setStatusSaving(true);
    setStatusError(null);
    try {
      const res = await bookingsAPI.updateStatus(booking.id, statusDraft);
      if (res.success) onBookingUpdated(res.data);
      else setStatusError(res.message || 'Failed to update status.');
    } catch (err) {
      setStatusError(err.message || 'Failed to update status.');
    } finally {
      setStatusSaving(false);
    }
  };

  const handlePaymentSave = async () => {
    setPaymentSaving(true);
    setPaymentError(null);
    try {
      const res = await bookingsAPI.updatePayment(booking.id, {
        paymentStatus: paymentForm.paymentStatus,
        paymentMethod: paymentForm.paymentMethod || undefined,
        amount: paymentForm.amount ? parseFloat(paymentForm.amount) : undefined,
        reference: paymentForm.reference || undefined,
      });
      if (res.success) {
        onBookingUpdated(res.data);
        setShowPaymentModal(false);
      } else {
        setPaymentError(res.message || 'Failed to update payment.');
      }
    } catch (err) {
      setPaymentError(err.message || 'Failed to update payment.');
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    setNoteError(null);
    try {
      const res = await bookingsAPI.addNote(booking.id, noteText.trim());
      if (res.success) {
        onBookingUpdated(res.data);
        setNoteText('');
      } else {
        setNoteError(res.message || 'Failed to add note.');
      }
    } catch (err) {
      setNoteError(err.message || 'Failed to add note.');
    } finally {
      setNoteSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose} />

      {/* Side Panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0,
        height: '100vh', width: 480, maxWidth: '100vw',
        zIndex: 50, background: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.25s ease-out',
      }}>

        {/* ── Header ─────────────────────────────── */}
        <div className="flex items-start justify-between px-6 py-4 border-b bg-gray-50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Booking Details</h3>
            <p className="text-sm text-gray-500 font-mono mt-0.5">{booking.bookingReference}</p>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <a
              href={`/admin/bookings?ref=${booking.bookingReference}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Bookings page"
              className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              Full view
            </a>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
        </div>

        {/* ── Scrollable Body ─────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* CA-16 Guest Details */}
          <div>
            <SectionHeader>Guest Details</SectionHeader>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-gray-900 text-base">
                {booking.primaryGuest.firstName} {booking.primaryGuest.lastName}
              </p>
              <Row label="Email"  value={booking.primaryGuest.email} />
              <Row label="Phone"  value={booking.primaryGuest.phone} />
              {booking.primaryGuest.idNumber && (
                <Row label="ID Number" value={booking.primaryGuest.idNumber} />
              )}
            </div>
          </div>

          {/* CA-17 Booking Details */}
          <div>
            <SectionHeader>Booking Details</SectionHeader>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <Row label="Service"  value={serviceName} />
              <Row label="Category" value={serviceCategory.charAt(0).toUpperCase() + serviceCategory.slice(1)} />
              {isAccommodation ? (
                <>
                  <Row label="Check-in"  value={booking.bookingDetails?.checkIn  ? format(parseISO(booking.bookingDetails.checkIn.substring(0, 10)),  'MMM dd, yyyy') : null} />
                  <Row label="Check-out" value={booking.bookingDetails?.checkOut ? format(parseISO(booking.bookingDetails.checkOut.substring(0, 10)), 'MMM dd, yyyy') : null} />
                  {booking.bookingDetails?.nights > 0 && <Row label="Nights" value={booking.bookingDetails.nights} />}
                </>
              ) : (
                <>
                  <Row label="Event Date" value={booking.bookingDetails?.eventDate ? format(parseISO(booking.bookingDetails.eventDate.substring(0, 10)), 'MMM dd, yyyy') : null} />
                  {booking.bookingDetails?.eventTime && <Row label="Event Time" value={booking.bookingDetails.eventTime} />}
                </>
              )}
              <Row label="Guests" value={`${booking.bookingDetails?.adults || 0} adults${booking.bookingDetails?.children > 0 ? `, ${booking.bookingDetails.children} children` : ''}`} />
              <Row label="Source" value={booking.source ? booking.source.charAt(0).toUpperCase() + booking.source.slice(1) : null} />
              {booking.specialRequests?.other && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Special Requests</p>
                  <p className="text-sm text-gray-700">{booking.specialRequests.other}</p>
                </div>
              )}
            </div>
          </div>

          {/* CA-18 Payment Section */}
          <div>
            <SectionHeader>Payment</SectionHeader>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  booking.paymentStatus === 'fully-paid'    ? 'bg-green-100 text-green-800' :
                  booking.paymentStatus === 'deposit-paid'  ? 'bg-blue-100 text-blue-800' :
                  booking.paymentStatus === 'refunded'      ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.paymentStatus || 'pending'}
                </span>
              </div>
              <Row label="Total Amount" value={booking.pricing?.totalAmount != null ? `R ${Number(booking.pricing.totalAmount).toFixed(2)}` : null} />
              {booking.paymentDetails?.transactions?.length > 0 && (() => {
                const last = booking.paymentDetails.transactions[booking.paymentDetails.transactions.length - 1];
                return (
                  <>
                    {last.method    && <Row label="Method"    value={last.method.charAt(0).toUpperCase() + last.method.slice(1)} />}
                    {last.reference && <Row label="Reference" value={last.reference} />}
                  </>
                );
              })()}
              {/* CA-20 Payment Update Button */}
              <button
                onClick={() => setShowPaymentModal(true)}
                className="mt-2 w-full px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium transition-colors"
              >
                Update Payment
              </button>
            </div>
          </div>

          {/* CA-19 Status Update */}
          <div>
            <SectionHeader>Update Status</SectionHeader>
            <div className="flex gap-2">
              <select
                value={statusDraft}
                onChange={e => { setStatusDraft(e.target.value); setStatusError(null); }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {BOOKING_STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                ))}
              </select>
              <button
                onClick={handleStatusSave}
                disabled={statusSaving || statusDraft === booking.status}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors whitespace-nowrap"
              >
                {statusSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {statusError && <p className="mt-1.5 text-xs text-red-600">{statusError}</p>}
          </div>

          {/* CA-21 Add Note */}
          <div>
            <SectionHeader>Add Note</SectionHeader>
            <textarea
              rows={2}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Write a note…"
              className={inputCls}
            />
            {noteError && <p className="mt-1 text-xs text-red-600">{noteError}</p>}
            <button
              onClick={handleAddNote}
              disabled={noteSaving || !noteText.trim()}
              className="mt-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {noteSaving ? 'Adding…' : 'Add Note'}
            </button>
          </div>

          {/* CA-22 Notes History */}
          {notes.length > 0 && (
            <div>
              <SectionHeader>Notes History</SectionHeader>
              <div className="space-y-2">
                {notes.map((n, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        n.type === 'status_change' ? 'bg-blue-100 text-blue-700' :
                        n.type === 'reschedule'    ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {NOTE_TYPE_LABELS[n.type] || n.type || 'Note'}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {n.date ? format(parseISO(n.date), 'MMM dd, yyyy HH:mm') : ''}
                      </span>
                    </div>
                    <p className="text-gray-700">{n.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Footer ─────────────────────────────── */}
        <div className="px-6 py-3 border-t bg-gray-50 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
          >
            Close
          </button>
        </div>

      </div>

      {/* CA-20 Payment Update Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">Update Payment</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status *</label>
                <select
                  value={paymentForm.paymentStatus}
                  onChange={e => setPaymentForm(p => ({ ...p, paymentStatus: e.target.value }))}
                  className={inputCls}
                >
                  {PAYMENT_STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={e => setPaymentForm(p => ({ ...p, paymentMethod: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select…</option>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. 1500.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reference</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))}
                  className={inputCls}
                  placeholder="Transaction / receipt reference"
                />
              </div>
              {paymentError && <p className="text-xs text-red-600">{paymentError}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowPaymentModal(false); setPaymentError(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSave}
                disabled={paymentSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {paymentSaving ? 'Saving…' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
// -----------------------------------------------

const BookingCalendar = ({ refreshKey }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterServiceId, setFilterServiceId] = useState('all');
  const [allServiceOptions, setAllServiceOptions] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [pendingDrop, setPendingDrop] = useState(null);
  const [dropSaving, setDropSaving] = useState(false);
  const [tooltip, setTooltip] = useState(null); // { booking, x, y }
  const calendarWrapperRef = useRef(null);
  const [newBookingDates, setNewBookingDates] = useState(null);

  // Fetch bookings from the API
  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getAll();
      if (response.success) {
        setBookings(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all rooms + services once for the filter dropdown
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [roomsRes, servicesRes] = await Promise.all([
          roomsAPI.getAll(),
          servicesAPI.getAll(),
        ]);
        const rooms    = (roomsRes.success    ? roomsRes.data    : []).map(r => ({ key: `room-${r.id}`,    id: r.id, name: r.name, category: 'accommodation', totalQuantity: r.totalQuantity || 1 }));
        const services = (servicesRes.success ? servicesRes.data : []).map(s => ({ key: `service-${s.id}`, id: s.id, name: s.name, category: s.category }));
        setTotalRooms(rooms.reduce((sum, r) => sum + r.totalQuantity, 0));
        setAllServiceOptions([...rooms, ...services]);
      } catch {
        // non-fatal — filter just won't have options
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    fetchBookings();

    // Set up BroadcastChannel to listen for new bookings
    const bookingChannel = new BroadcastChannel('booking_updates');
    bookingChannel.onmessage = (event) => {
      if (event.data === 'new_booking' || event.data === 'booking_updated') {
        console.log('🔄 Booking update received via BroadcastChannel, refetching...');
        fetchBookings();
      }
    };

    // Set up polling to refresh data every 30 seconds
    const interval = setInterval(fetchBookings, 30000);
    return () => {
      clearInterval(interval);
      bookingChannel.close();
    };
  }, [refreshKey]);

  // Reposition FullCalendar's "+more" popover if it overflows the viewport.
  // Uses two observers: one to detect when the popover is added to the DOM,
  // then a second on the popover's own style attribute so the constraint runs
  // after FullCalendar has written the final left/top values.
  useEffect(() => {
    const el = calendarWrapperRef.current;
    if (!el) return;

    let styleObserver = null;

    const constrain = (popover) => {
      requestAnimationFrame(() => {
        // getBoundingClientRect() returns clipped dimensions when a parent has
        // overflow:hidden, so we calculate the actual unclipped edges manually.
        const parent = popover.offsetParent;
        if (!parent) return;
        const parentRect = parent.getBoundingClientRect();
        const left = parseInt(popover.style.left) || 0;
        const top  = parseInt(popover.style.top)  || 0;
        const pad  = 8;

        // Actual (unclipped) edges in viewport coordinates
        const actualRight  = parentRect.left + left + popover.offsetWidth;
        const actualBottom = parentRect.top  + top  + popover.offsetHeight;

        let newLeft = left;
        let newTop  = top;
        if (actualRight  > window.innerWidth  - pad) newLeft -= actualRight  - (window.innerWidth  - pad);
        if (actualBottom > window.innerHeight - pad) newTop  -= actualBottom - (window.innerHeight - pad);
        // Don't push off the left / top viewport edge either
        newLeft = Math.max(-parentRect.left, newLeft);
        newTop  = Math.max(-parentRect.top,  newTop);

        popover.style.left = `${newLeft}px`;
        popover.style.top  = `${newTop}px`;
      });
    };

    const childObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && node.classList.contains('fc-popover')) {
            // Watch for FullCalendar setting the position styles on the popover
            if (styleObserver) styleObserver.disconnect();
            styleObserver = new MutationObserver(() => constrain(node));
            styleObserver.observe(node, { attributes: true, attributeFilter: ['style'] });
            constrain(node); // also run immediately in case style is already set
          }
        }
        for (const node of mutation.removedNodes) {
          if (node.nodeType === 1 && node.classList.contains('fc-popover')) {
            if (styleObserver) { styleObserver.disconnect(); styleObserver = null; }
          }
        }
      }
    });

    childObserver.observe(el, { childList: true, subtree: true });
    return () => {
      childObserver.disconnect();
      if (styleObserver) styleObserver.disconnect();
    };
  }, []);

  // Extract YYYY-MM-DD string from an ISO date string without timezone conversion
  const toDateStr = (isoStr) => isoStr ? isoStr.substring(0, 10) : null;

  // Advance a YYYY-MM-DD string by one day (for FullCalendar exclusive end)
  const nextDay = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
  };

  // Per-day room occupancy derived from active accommodation bookings
  const roomOccupancyMap = useMemo(() => {
    const map = {};
    bookings
      .filter(b => {
        const cat = b.serviceSnapshot?.category || (b.roomId ? 'accommodation' : '');
        return cat === 'accommodation' && (b.status === 'pending' || b.status === 'confirmed');
      })
      .forEach(b => {
        const checkIn  = b.bookingDetails?.checkIn?.substring(0, 10);
        const checkOut = b.bookingDetails?.checkOut?.substring(0, 10);
        if (!checkIn || !checkOut) return;
        const qty = b.roomQuantity || 1;
        const [ey, em, ed] = checkOut.split('-').map(Number);
        const endDate = new Date(ey, em - 1, ed);
        let cur = new Date(...checkIn.split('-').map((v, i) => i === 1 ? Number(v) - 1 : Number(v)));
        while (cur < endDate) {
          const ds = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
          map[ds] = (map[ds] || 0) + qty;
          cur.setDate(cur.getDate() + 1);
        }
      });
    return map;
  }, [bookings]);

  const dayCellContent = (arg) => {
    const dateStr = fcDateToStr(arg.date);
    const booked    = roomOccupancyMap[dateStr] || 0;
    const available = Math.max(0, totalRooms - booked);
    const color = available === 0
      ? '#ef4444'
      : available / totalRooms < 0.5
        ? '#f97316'
        : '#10b981';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
        <span>{arg.dayNumberText}</span>
        {totalRooms > 0 && (
          <span style={{ fontSize: '10px', fontWeight: 600, color, lineHeight: 1.2 }}>
            {available}/{totalRooms} rooms
          </span>
        )}
      </div>
    );
  };

  // Service options shown in the dropdown — scoped to the active category filter
  const visibleServiceOptions = filterCategory === 'all'
    ? allServiceOptions
    : allServiceOptions.filter(o => o.category === filterCategory);

  const handleCategoryChange = (value) => {
    setFilterCategory(value);
    setFilterServiceId('all'); // reset service filter when category changes
  };

  // Format bookings for FullCalendar
  const calendarEvents = bookings
    .filter(booking => filterStatus === 'all' || booking.status === filterStatus)
    .filter(booking => {
      if (filterCategory === 'all') return true;
      const cat = booking.serviceSnapshot?.category || (booking.roomId ? 'accommodation' : '');
      return cat === filterCategory;
    })
    .filter(booking => {
      if (filterServiceId === 'all') return true;
      if (filterServiceId.startsWith('room-')) {
        return booking.roomId === parseInt(filterServiceId.replace('room-', ''));
      }
      return booking.serviceId === parseInt(filterServiceId.replace('service-', ''));
    })
    .map(booking => {
      const category = booking.serviceSnapshot?.category || (booking.roomId ? 'accommodation' : '');
      const isAccommodation = category === 'accommodation';

      // Use date strings (YYYY-MM-DD) to avoid timezone shifts from Date objects
      const checkInStr  = toDateStr(booking.bookingDetails?.checkIn);
      const checkOutStr = toDateStr(booking.bookingDetails?.checkOut);
      const eventDateStr = toDateStr(booking.bookingDetails?.eventDate);

      // Accommodation: check-in through check-out (end is exclusive, so +1 day)
      // Service: single day on eventDate
      const start = isAccommodation ? checkInStr : (checkInStr || eventDateStr);
      const end   = isAccommodation && checkOutStr ? nextDay(checkOutStr) : null;

      // Skip bookings with no usable start date
      if (!start) return null;

      const bgColor     = CATEGORY_COLORS[category] || '#6b7280';
      const statusColor = STATUS_BORDER_COLORS[booking?.status] || bgColor;

      const categoryLabel = category ? ` [${category.charAt(0).toUpperCase() + category.slice(1)}]` : '';
      const isDraggable = booking.status === 'pending' || booking.status === 'confirmed';

      return {
        id: booking.id.toString(),
        title: `${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName} - ${booking.bookingReference}${categoryLabel}`,
        start,
        end,
        backgroundColor: bgColor,
        borderColor: statusColor,
        editable: isDraggable,
        extendedProps: { booking, category },
        allDay: true
      };
    })
    .filter(Boolean);

  // Handle event click
  const handleEventClick = (info) => {
    setSelectedEvent(info.event.extendedProps.booking);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  // Convert a FullCalendar Date (local) to YYYY-MM-DD string
  const fcDateToStr = (date) => {
    if (!date) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // FullCalendar all-day end is exclusive — subtract one day to get the real last night
  const fcEndToCheckOut = (date) => {
    if (!date) return null;
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return fcDateToStr(d);
  };

  const handleEventDrop = (info) => {
    const booking = info.event.extendedProps.booking;
    const category = info.event.extendedProps.category;
    const isAccommodation = category === 'accommodation';
    const newStart = fcDateToStr(info.event.start);
    const newEnd   = isAccommodation && info.event.end ? fcEndToCheckOut(info.event.end) : newStart;

    setPendingDrop({
      booking,
      isAccommodation,
      newCheckIn:   isAccommodation ? newStart : null,
      newCheckOut:  isAccommodation ? newEnd   : null,
      newEventDate: !isAccommodation ? newStart : null,
      revert: info.revert,
    });
  };

  const confirmDrop = async () => {
    if (!pendingDrop) return;
    setDropSaving(true);
    try {
      const dates = pendingDrop.isAccommodation
        ? { checkIn: pendingDrop.newCheckIn, checkOut: pendingDrop.newCheckOut }
        : { eventDate: pendingDrop.newEventDate };
      const response = await bookingsAPI.updateDates(pendingDrop.booking.id, dates);
      if (response.success) {
        setBookings(prev =>
          prev.map(b => b.id === pendingDrop.booking.id ? response.data : b)
        );
        setPendingDrop(null);
      } else {
        pendingDrop.revert();
        setPendingDrop(null);
      }
    } catch {
      pendingDrop.revert();
      setPendingDrop(null);
    } finally {
      setDropSaving(false);
    }
  };

  const cancelDrop = () => {
    if (pendingDrop) pendingDrop.revert();
    setPendingDrop(null);
  };

  const handleEventMouseEnter = (info) => {
    const { booking } = info.event.extendedProps;
    const { clientX: x, clientY: y } = info.jsEvent;
    setTooltip({ booking, x, y });
  };

  const handleEventMouseLeave = () => setTooltip(null);

  const handleDateSelect = (info) => {
    const checkIn  = fcDateToStr(info.start);
    // select end is exclusive; subtract a day to get the real last day
    const checkOut = fcEndToCheckOut(info.end) || checkIn;
    setNewBookingDates({ checkIn, checkOut });
  };

  const handleBookingCreated = (newBooking) => {
    setBookings(prev => [newBooking, ...prev]);
    setNewBookingDates(null);
  };

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
    { value: 'no-show', label: 'No Show' }
  ];

  const categoryOptions = [
    { value: 'all',           label: 'All Categories' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'catering',      label: 'Catering' },
    { value: 'conference',    label: 'Conference' },
    { value: 'events',        label: 'Events' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Booking Calendar</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filterServiceId}
            onChange={(e) => setFilterServiceId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={visibleServiceOptions.length === 0}
          >
            <option value="all">All Rooms / Services</option>
            {visibleServiceOptions.map(o => (
              <option key={o.key} value={o.key}>{o.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setLoading(true);
              fetchBookings();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <span className="font-semibold text-gray-600">Category:</span>
        {categoryOptions.filter(o => o.value !== 'all').map(({ value, label }) => (
          <span key={value} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS[value], borderLeft: `4px solid ${CATEGORY_COLORS[value]}` }} />
            {label}
          </span>
        ))}
        <span className="ml-4 font-semibold text-gray-600">Status:</span>
        {Object.entries(STATUS_BORDER_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#e5e7eb', borderLeft: `4px solid ${color}` }} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        ))}
      </div>

      <style>{`
        .booking-calendar-wrap .fc-event {
          border-top: none !important;
          border-right: none !important;
          border-bottom: none !important;
          border-left-width: 4px !important;
        }
      `}</style>

      <div ref={calendarWrapperRef} className="booking-calendar-wrap border rounded-lg overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
          }}
          initialView="dayGridMonth"
          events={calendarEvents}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          select={handleDateSelect}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          dayCellContent={dayCellContent}
          eventDidMount={(info) => {
            const { category } = info.event.extendedProps;
            const bgColor = CATEGORY_COLORS[category] || '#6b7280';
            info.el.style.backgroundColor = bgColor;
            info.el.style.borderRadius    = '3px';
            info.el.style.borderTop       = 'none';
            info.el.style.borderRight     = 'none';
            info.el.style.borderBottom    = 'none';
            info.el.style.borderLeftWidth = '4px';
          }}
          height="700px"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            omitZeroMinute: false,
            meridiem: 'short'
          }}
        />
      </div>

      {/* Hover Tooltip */}
      {tooltip && (() => {
        const b = tooltip.booking;
        const isAccommodation = b.serviceSnapshot?.category === 'accommodation' || !!b.roomId;
        const checkIn  = b.bookingDetails?.checkIn?.substring(0, 10);
        const checkOut = b.bookingDetails?.checkOut?.substring(0, 10);
        const eventDate = b.bookingDetails?.eventDate?.substring(0, 10);
        const amount = b.pricing?.totalAmount;

        // Keep tooltip inside viewport
        const tipW = 220;
        const tipH = 110; // approximate tooltip height
        const x = tooltip.x + 14 + tipW > window.innerWidth  ? tooltip.x - tipW - 8  : tooltip.x + 14;
        const y = tooltip.y + 12 + tipH > window.innerHeight ? tooltip.y - tipH - 8  : tooltip.y + 12;

        const statusColors = {
          confirmed: '#16a34a', pending: '#d97706', cancelled: '#dc2626',
          completed: '#4b5563', 'no-show': '#7c3aed',
        };

        return (
          <div style={{
            position: 'fixed', top: y, left: x, zIndex: 9999,
            width: tipW, pointerEvents: 'none',
            background: '#1e293b', color: '#f1f5f9', borderRadius: 8,
            padding: '10px 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            fontSize: 12, lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {b.primaryGuest.firstName} {b.primaryGuest.lastName}
            </div>
            <div style={{ color: '#94a3b8', marginBottom: 4 }}>
              {b.serviceSnapshot?.name || 'N/A'}
            </div>
            <div style={{ marginBottom: 6 }}>
              {isAccommodation ? (
                <span>{checkIn} → {checkOut}</span>
              ) : (
                <span>{eventDate}</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#34d399' }}>
                {amount != null ? `R ${Number(amount).toFixed(2)}` : '—'}
              </span>
              <span style={{
                padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                background: statusColors[b.status] || '#475569', color: '#fff',
              }}>
                {b.status}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Quick Booking Modal (date click / range select) */}
      {newBookingDates && (
        <QuickBookingModal
          initialDates={newBookingDates}
          onClose={() => setNewBookingDates(null)}
          onCreated={handleBookingCreated}
        />
      )}

      {/* Drag-and-Drop Confirmation Dialog */}
      {pendingDrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Reschedule Booking?</h3>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">{pendingDrop.booking.primaryGuest.firstName} {pendingDrop.booking.primaryGuest.lastName}</span>
              {' — '}{pendingDrop.booking.bookingReference}
            </p>
            {pendingDrop.isAccommodation ? (
              <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-800 space-y-1">
                <p><span className="font-medium">Old check-in:</span> {pendingDrop.booking.bookingDetails?.checkIn?.substring(0, 10)}</p>
                <p><span className="font-medium">Old check-out:</span> {pendingDrop.booking.bookingDetails?.checkOut?.substring(0, 10)}</p>
                <p className="pt-1 border-t border-blue-200"><span className="font-medium">New check-in:</span> {pendingDrop.newCheckIn}</p>
                <p><span className="font-medium">New check-out:</span> {pendingDrop.newCheckOut}</p>
              </div>
            ) : (
              <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-800 space-y-1">
                <p><span className="font-medium">Old date:</span> {pendingDrop.booking.bookingDetails?.eventDate?.substring(0, 10)}</p>
                <p className="pt-1 border-t border-blue-200"><span className="font-medium">New date:</span> {pendingDrop.newEventDate}</p>
              </div>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={cancelDrop}
                disabled={dropSaving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDrop}
                disabled={dropSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {dropSaving ? 'Saving…' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Side Panel */}
      {showModal && selectedEvent && (
        <BookingDetailPanel
          booking={selectedEvent}
          onClose={closeModal}
          onBookingUpdated={(updated) => {
            setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
            setSelectedEvent(updated);
          }}
        />
      )}
    </div>
  );
};

export default BookingCalendar;