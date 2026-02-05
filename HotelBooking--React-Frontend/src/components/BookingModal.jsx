import { useState } from 'react';
import { bookingsAPI, APIError } from '../services/api';
import PayFastButton from './PayFastButton';

const BookingModal = ({ service, isOpen, onClose, bookingDetails }) => {
  const [formData, setFormData] = useState({
    primaryGuest: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      idNumber: '',
    },
    bookingDetails: {
      checkIn: bookingDetails?.checkIn || '',
      checkOut: bookingDetails?.checkOut || '',
      eventDate: bookingDetails?.eventDate || '',
      eventTime: bookingDetails?.eventTime || '',
      adults: bookingDetails?.adults || 1,
      children: bookingDetails?.children || 0,
    },
    specialRequests: {
      dietary: '',
      accessibility: '',
      other: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bookingReference, setBookingReference] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [bookingAmount, setBookingAmount] = useState(null);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Set default dates for accommodation if not provided
      const bookingDetails = { ...formData.bookingDetails };

      if (service?.category === 'accommodation') {
        // Set default check-in to tomorrow, check-out to day after
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);

        bookingDetails.checkIn = tomorrow.toISOString().split('T')[0];
        bookingDetails.checkOut = dayAfter.toISOString().split('T')[0];
        bookingDetails.adults = parseInt(formData.bookingDetails.adults) || 1;
        bookingDetails.children = parseInt(formData.bookingDetails.children) || 0;
      } else {
        bookingDetails.adults = parseInt(formData.bookingDetails.adults);
        bookingDetails.children = parseInt(formData.bookingDetails.children) || 0;
      }

      const bookingData = {
        service: service._id || service.id,
        primaryGuest: formData.primaryGuest,
        bookingDetails,
        specialRequests: formData.specialRequests,
        source: 'website',
      };

      const response = await bookingsAPI.create(bookingData);

      if (response.success) {
        setSuccess(true);
        setBookingReference(response.data.bookingReference);
        setBookingId(response.data.id);
        setBookingAmount(response.data.pricing?.totalAmount || 0);
        // Don't auto-close - let user proceed to payment
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Failed to create booking. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      primaryGuest: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        idNumber: '',
      },
      bookingDetails: {
        checkIn: '',
        checkOut: '',
        eventDate: '',
        eventTime: '',
        adults: 1,
        children: 0,
      },
      specialRequests: {
        dietary: '',
        accessibility: '',
        other: '',
      },
    });
    setSuccess(false);
    setError(null);
    setBookingReference(null);
    setBookingId(null);
    setBookingAmount(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{service?.name}</h2>
          <p className="text-gray-600 mt-1">
            Please fill in your contact details to complete your booking
          </p>
        </div>

        {success ? (
          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">Booking Created!</h3>
              <p className="text-gray-700 mb-4">
                Your booking reference is: <strong className="text-green-700">{bookingReference}</strong>
              </p>
              <p className="text-gray-600 mb-6">
                A confirmation email has been sent to {formData.primaryGuest.email}
              </p>

              {/* Payment Section */}
              <div className="bg-white border border-gray-300 rounded-lg p-6 mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Payment</h4>
                <p className="text-gray-600 mb-4">
                  To confirm your booking, please complete the payment now.
                </p>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    R{bookingAmount ? bookingAmount.toFixed(2) : '0.00'}
                  </div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                </div>

                {/* PayFast Payment Button */}
                <PayFastButton
                  bookingId={bookingId}
                  amount={bookingAmount}
                  bookingReference={bookingReference}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2 text-lg"
                />

                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Your booking will only be confirmed after successful payment.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  resetForm();
                }}
                className="mt-6 text-gray-600 hover:text-gray-800 text-sm"
              >
                Skip payment (pay later)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Guest Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.primaryGuest.firstName}
                      onChange={(e) => handleInputChange('primaryGuest', 'firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.primaryGuest.lastName}
                      onChange={(e) => handleInputChange('primaryGuest', 'lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.primaryGuest.email}
                    onChange={(e) => handleInputChange('primaryGuest', 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.primaryGuest.phone}
                    onChange={(e) => handleInputChange('primaryGuest', 'phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Booking Details - Only for Events/Conference/Catering */}
            {(service?.category === 'events' || service?.category === 'conference' || service?.category === 'catering') && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.bookingDetails.eventDate}
                      onChange={(e) => handleInputChange('bookingDetails', 'eventDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.bookingDetails.eventTime}
                      onChange={(e) => handleInputChange('bookingDetails', 'eventTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Guests *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={service?.maxPerson || 200}
                      required
                      value={formData.bookingDetails.adults}
                      onChange={(e) => handleInputChange('bookingDetails', 'adults', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Special Requests */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests (Optional)
              </label>
              <textarea
                rows="3"
                value={formData.specialRequests.other}
                onChange={(e) => handleInputChange('specialRequests', 'other', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requests, dietary requirements, or accessibility needs..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  resetForm();
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
