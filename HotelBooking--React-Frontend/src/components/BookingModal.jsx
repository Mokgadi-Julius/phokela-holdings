import { useState } from 'react';
import { bookingsAPI, APIError } from '../services/api';

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
      const bookingData = {
        service: service._id || service.id,
        primaryGuest: formData.primaryGuest,
        bookingDetails: {
          ...formData.bookingDetails,
          adults: parseInt(formData.bookingDetails.adults),
          children: parseInt(formData.bookingDetails.children),
        },
        specialRequests: formData.specialRequests,
        source: 'website',
      };

      const response = await bookingsAPI.create(bookingData);

      if (response.success) {
        setSuccess(true);
        setBookingReference(response.data.bookingReference);

        // Reset form after 3 seconds and close modal
        setTimeout(() => {
          onClose();
          resetForm();
        }, 5000);
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Booking</h2>
          <p className="text-gray-600 mt-1">
            {service?.name} - R{service?.price} {service?.priceUnit || 'per night'}
          </p>
        </div>

        {success ? (
          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">Booking Confirmed!</h3>
              <p className="text-gray-700 mb-4">
                Your booking reference is: <strong className="text-green-700">{bookingReference}</strong>
              </p>
              <p className="text-gray-600">
                A confirmation email has been sent to {formData.primaryGuest.email}
              </p>
              <p className="text-sm text-gray-500 mt-4">
                This window will close automatically...
              </p>
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
              <h3 className="text-lg font-semibold mb-4">Guest Information</h3>
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID/Passport Number
                  </label>
                  <input
                    type="text"
                    value={formData.primaryGuest.idNumber}
                    onChange={(e) => handleInputChange('primaryGuest', 'idNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {service?.category === 'accommodation' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-in Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.bookingDetails.checkIn}
                        onChange={(e) => handleInputChange('bookingDetails', 'checkIn', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-out Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.bookingDetails.checkOut}
                        onChange={(e) => handleInputChange('bookingDetails', 'checkOut', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
                {(service?.category === 'events' || service?.category === 'conference' || service?.category === 'catering') && (
                  <>
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
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Adults *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={service?.maxPerson || 20}
                    required
                    value={formData.bookingDetails.adults}
                    onChange={(e) => handleInputChange('bookingDetails', 'adults', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.bookingDetails.children}
                    onChange={(e) => handleInputChange('bookingDetails', 'children', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Special Requests (Optional)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dietary Requirements
                  </label>
                  <textarea
                    rows="2"
                    value={formData.specialRequests.dietary}
                    onChange={(e) => handleInputChange('specialRequests', 'dietary', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any dietary restrictions or preferences..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accessibility Needs
                  </label>
                  <textarea
                    rows="2"
                    value={formData.specialRequests.accessibility}
                    onChange={(e) => handleInputChange('specialRequests', 'accessibility', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any accessibility requirements..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Requests
                  </label>
                  <textarea
                    rows="2"
                    value={formData.specialRequests.other}
                    onChange={(e) => handleInputChange('specialRequests', 'other', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any other special requests..."
                  />
                </div>
              </div>
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
