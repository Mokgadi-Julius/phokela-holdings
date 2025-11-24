import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import PayFastButton from '../../components/PayFastButton';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [paymentData, setPaymentData] = useState({
    paymentStatus: '',
    paymentMethod: '',
    amount: '',
    reference: ''
  });

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingsAPI.getAll(filters);
      if (response.success) {
        setBookings(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError('Failed to load bookings. Make sure the backend server is running and the database is connected.');
      console.error('Bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedBooking || !newStatus) return;

    try {
      const response = await bookingsAPI.updateStatus(
        selectedBooking.id,
        newStatus,
        statusNotes
      );

      if (response.success) {
        // Update the booking in the list
        setBookings(bookings.map(b =>
          b.id === selectedBooking.id ? response.data : b
        ));
        setShowStatusModal(false);
        setSelectedBooking(null);
        setNewStatus('');
        setStatusNotes('');
      }
    } catch (err) {
      alert('Failed to update booking status');
      console.error('Status update error:', err);
    }
  };

  const handlePaymentUpdate = async () => {
    if (!selectedBooking || !paymentData.paymentStatus) return;

    try {
      const response = await bookingsAPI.updatePayment(selectedBooking.id, paymentData);

      if (response.success) {
        // Update the booking in the list
        setBookings(bookings.map(b =>
          b.id === selectedBooking.id ? response.data : b
        ));
        setShowPaymentModal(false);
        setSelectedBooking(null);
        setPaymentData({
          paymentStatus: '',
          paymentMethod: '',
          amount: '',
          reference: ''
        });
      }
    } catch (err) {
      alert('Failed to update payment status');
      console.error('Payment update error:', err);
    }
  };

  const handleQuickAction = async (booking, action) => {
    try {
      let response;
      switch (action) {
        case 'confirm':
          response = await bookingsAPI.updateStatus(booking.id, 'confirmed', 'Quick confirmed by admin');
          break;
        case 'complete':
          response = await bookingsAPI.updateStatus(booking.id, 'completed', 'Quick completed by admin');
          break;
        case 'cancel':
          if (window.confirm(`Are you sure you want to cancel booking ${booking.bookingReference}?`)) {
            response = await bookingsAPI.cancel(booking.id);
          }
          break;
        default:
          return;
      }

      if (response && response.success) {
        setBookings(bookings.map(b =>
          b.id === booking.id ? response.data : b
        ));
      }
    } catch (err) {
      alert(`Failed to ${action} booking`);
      console.error(`${action} error:`, err);
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      'no-show': 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentBadgeClass = (status) => {
    const classes = {
      pending: 'bg-red-100 text-red-800',
      'deposit-paid': 'bg-yellow-100 text-yellow-800',
      'fully-paid': 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
          <p className="mt-1 text-gray-600">View and manage all bookings</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Refresh
          </button>
          <Link
            to="/admin/calendar"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Calendar View
          </Link>
          <Link
            to="/admin/bookings/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            New Booking
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
              <option value="no-show">No Show</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="accommodation">Accommodation</option>
              <option value="conference">Conference</option>
              <option value="events">Events</option>
              <option value="catering">Catering</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Per Page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', category: '', page: 1, limit: 10 })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {error ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">{error}</p>
          <button
            onClick={fetchBookings}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Retry
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">No bookings match your current filters or there are no bookings yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.bookingReference}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.primaryGuest?.firstName} {booking.primaryGuest?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{booking.primaryGuest?.email}</div>
                      <div className="text-xs text-gray-500">{booking.primaryGuest?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.serviceSnapshot?.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{booking.serviceSnapshot?.category}</div>
                      {booking.roomQuantity && (
                        <div className="text-xs text-blue-600 font-medium mt-1">
                          {booking.roomQuantity} room{booking.roomQuantity > 1 ? 's' : ''} booked
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.bookingDetails?.checkIn && (
                          <div>
                            Check-in: {new Date(booking.bookingDetails.checkIn).toLocaleDateString()}
                          </div>
                        )}
                        {booking.bookingDetails?.eventDate && (
                          <div>
                            Event: {new Date(booking.bookingDetails.eventDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.bookingDetails?.adults} adults, {booking.bookingDetails?.children || 0} children
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      R{booking.pricing?.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentBadgeClass(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex space-x-2">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleQuickAction(booking, 'confirm')}
                              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              title="Quick Confirm"
                            >
                              Confirm
                            </button>
                          )}
                          {booking.status === 'confirmed' && booking.roomId && (
                            <button
                              onClick={() => handleQuickAction(booking, 'complete')}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              title="Check Out - Mark Complete"
                            >
                              Check Out
                            </button>
                          )}
                          {booking.status === 'confirmed' && !booking.roomId && (
                            <button
                              onClick={() => handleQuickAction(booking, 'complete')}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              title="Mark Complete"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setNewStatus(booking.status);
                              setShowStatusModal(true);
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            title="Update Status"
                          >
                            Status
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          {/* Only show PayFast button for website bookings with pending payment */}
                          {booking.paymentStatus === 'pending' && booking.source === 'website' && (
                            <PayFastButton
                              bookingId={booking.id}
                              amount={booking.pricing?.totalAmount}
                              bookingReference={booking.bookingReference}
                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            />
                          )}
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setPaymentData({
                                ...paymentData,
                                paymentStatus: booking.paymentStatus,
                                amount: booking.pricing?.totalAmount || ''
                              });
                              setShowPaymentModal(true);
                            }}
                            className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                            title="Update Payment - Manual"
                          >
                            Payment
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailsModal(true);
                            }}
                            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                            title="View Details"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= pagination.pages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Update Booking Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Reference
                </label>
                <p className="text-sm text-gray-900">{selectedBooking?.bookingReference}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes about this status change..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedBooking(null);
                    setNewStatus('');
                    setStatusNotes('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Update Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Update Payment Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Reference
                </label>
                <p className="text-sm text-gray-900">{selectedBooking?.bookingReference}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={paymentData.paymentStatus}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="deposit-paid">Deposit Paid</option>
                  <option value="fully-paid">Fully Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Method</option>
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="eft">EFT/Bank Transfer</option>
                  <option value="mobile">Mobile Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (R)
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference/Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Transaction reference..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedBooking(null);
                    setPaymentData({ paymentStatus: '', paymentMethod: '', amount: '', reference: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Booking Details
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBooking(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Booking Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Reference</p>
                  <p className="font-semibold">{selectedBooking.bookingReference}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Service</p>
                  <p className="font-semibold">{selectedBooking.serviceSnapshot?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-semibold capitalize">{selectedBooking.serviceSnapshot?.category}</p>
                </div>
                {selectedBooking.roomQuantity && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Room Quantity</p>
                      <p className="font-semibold text-blue-600">
                        {selectedBooking.roomQuantity} room{selectedBooking.roomQuantity > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Room Type</p>
                      <p className="font-semibold capitalize">{selectedBooking.bookingDetails?.roomType || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Guest Information */}
              <div>
                <h4 className="font-semibold text-lg mb-3">Guest Information</h4>
                <div className="grid grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedBooking.primaryGuest?.firstName} {selectedBooking.primaryGuest?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedBooking.primaryGuest?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedBooking.primaryGuest?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Guests</p>
                    <p className="font-medium">
                      {selectedBooking.bookingDetails?.adults || 0} Adults, {selectedBooking.bookingDetails?.children || 0} Children
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Dates */}
              <div>
                <h4 className="font-semibold text-lg mb-3">Booking Dates</h4>
                <div className="grid grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
                  {selectedBooking.bookingDetails?.checkIn && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Check-in</p>
                        <p className="font-medium">{new Date(selectedBooking.bookingDetails.checkIn).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Check-out</p>
                        <p className="font-medium">{new Date(selectedBooking.bookingDetails.checkOut).toLocaleDateString()}</p>
                      </div>
                    </>
                  )}
                  {selectedBooking.bookingDetails?.eventDate && (
                    <div>
                      <p className="text-sm text-gray-600">Event Date</p>
                      <p className="font-medium">{new Date(selectedBooking.bookingDetails.eventDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="font-semibold text-lg mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPaymentBadgeClass(selectedBooking.paymentStatus)}`}>
                      {selectedBooking.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold text-lg">R{selectedBooking.pricing?.totalAmount?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests?.notes && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">Special Requests</h4>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <p className="text-gray-700">{selectedBooking.specialRequests.notes}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedBooking.notes && selectedBooking.notes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">Notes</h4>
                  <div className="space-y-2">
                    {selectedBooking.notes.map((note, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">{new Date(note.date).toLocaleString()}</p>
                        <p className="text-gray-800">{note.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;