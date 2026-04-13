import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { roomsAPI, bookingsAPI } from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NewBooking = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [formData, setFormData] = useState({
    roomId: '',
    roomQuantity: 1,
    primaryGuest: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    bookingDetails: {
      checkIn: '',
      checkOut: '',
      adults: 1,
      children: 0
    },
    specialRequests: {
      notes: ''
    }
  });

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await roomsAPI.getAll();
      if (response.success) {
        setRooms(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('Failed to load rooms. Please refresh the page.');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRoomSelect = (e) => {
    const roomId = parseInt(e.target.value);
    const room = rooms.find(r => r.id === roomId);
    setSelectedRoom(room);
    setFormData({ ...formData, roomId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate
      if (!formData.roomId) {
        throw new Error('Please select a room');
      }
      if (!formData.primaryGuest.firstName || !formData.primaryGuest.lastName) {
        throw new Error('Guest name is required');
      }
      if (!formData.primaryGuest.email) {
        throw new Error('Guest email is required');
      }
      if (!formData.primaryGuest.phone) {
        throw new Error('Guest phone is required');
      }
      if (!formData.bookingDetails.checkIn || !formData.bookingDetails.checkOut) {
        throw new Error('Check-in and check-out dates are required');
      }

      // Ensure checkout time is 10pm
      const checkOutDate = new Date(formData.bookingDetails.checkOut);
      checkOutDate.setHours(22, 0, 0, 0);

      const bookingData = {
        ...formData,
        bookingDetails: {
          ...formData.bookingDetails,
          checkOut: checkOutDate.toISOString()
        }
      };

      const response = await bookingsAPI.createRoomBooking(bookingData);

      if (response.success) {
        // Broadcast that a new booking was created (Cross-tab)
        const bookingChannel = new BroadcastChannel('booking_updates');
        bookingChannel.postMessage('new_booking');
        bookingChannel.close();

        // Dispatch local event (Same-tab)
        window.dispatchEvent(new Event('local_booking_update'));

        setSuccess(true);
        setTimeout(() => {
          navigate('/admin/bookings');
        }, 2000);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (formData.bookingDetails.checkIn && formData.bookingDetails.checkOut) {
      const checkIn = new Date(formData.bookingDetails.checkIn);
      const checkOut = new Date(formData.bookingDetails.checkOut);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 0;
    }
    return 0;
  };

  const calculateTotal = () => {
    if (selectedRoom && calculateNights() > 0) {
      return parseFloat(selectedRoom.price) * calculateNights() * formData.roomQuantity;
    }
    return 0;
  };

  const getAvailableQuantity = (room) => {
    return room.totalQuantity - room.bookedQuantity;
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Booking Created Successfully!</h2>
          <p className="text-green-700 mb-4">Redirecting to bookings list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Room Booking</h1>
          <p className="mt-1 text-gray-600">Create a manual booking from reception</p>
        </div>
        <button
          onClick={() => navigate('/admin/bookings')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">1. Select Room</h2>

          {loadingRooms ? (
            <p className="text-gray-600">Loading rooms...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type
                </label>
                <select
                  value={formData.roomId}
                  onChange={handleRoomSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a room type...</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id} disabled={getAvailableQuantity(room) === 0}>
                      {room.name} - R{room.price}/night -
                      {getAvailableQuantity(room) > 0
                        ? ` ${getAvailableQuantity(room)} available`
                        : ' FULLY BOOKED'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRoom && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">{selectedRoom.name}</h3>
                  <p className="text-sm text-blue-800 mb-2">{selectedRoom.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Price:</span> R{selectedRoom.price}/night
                    </div>
                    <div>
                      <span className="font-medium">Capacity:</span> {selectedRoom.capacity} guests
                    </div>
                    <div>
                      <span className="font-medium">Total Available:</span> {selectedRoom.totalQuantity}
                    </div>
                    <div>
                      <span className="font-medium">Currently Available:</span> {getAvailableQuantity(selectedRoom)}
                    </div>
                  </div>
                </div>
              )}

              {selectedRoom && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Rooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={getAvailableQuantity(selectedRoom)}
                    value={formData.roomQuantity}
                    onChange={(e) => setFormData({ ...formData, roomQuantity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {getAvailableQuantity(selectedRoom)} rooms available
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Guest Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">2. Guest Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.primaryGuest.firstName}
                onChange={(e) => setFormData({
                  ...formData,
                  primaryGuest: { ...formData.primaryGuest, firstName: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.primaryGuest.lastName}
                onChange={(e) => setFormData({
                  ...formData,
                  primaryGuest: { ...formData.primaryGuest, lastName: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.primaryGuest.email}
                onChange={(e) => setFormData({
                  ...formData,
                  primaryGuest: { ...formData.primaryGuest, email: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.primaryGuest.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  primaryGuest: { ...formData.primaryGuest, phone: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">3. Booking Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Date *
              </label>
              <input
                type="date"
                value={formData.bookingDetails.checkIn}
                onChange={(e) => setFormData({
                  ...formData,
                  bookingDetails: { ...formData.bookingDetails, checkIn: e.target.value }
                })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Check-in: Anytime</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out Date *
              </label>
              <input
                type="date"
                value={formData.bookingDetails.checkOut}
                onChange={(e) => setFormData({
                  ...formData,
                  bookingDetails: { ...formData.bookingDetails, checkOut: e.target.value }
                })}
                min={formData.bookingDetails.checkIn || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Check-out: 10:00 PM (22:00)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adults *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.bookingDetails.adults}
                onChange={(e) => setFormData({
                  ...formData,
                  bookingDetails: { ...formData.bookingDetails, adults: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Children
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.bookingDetails.children}
                onChange={(e) => setFormData({
                  ...formData,
                  bookingDetails: { ...formData.bookingDetails, children: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests / Notes
            </label>
            <textarea
              value={formData.specialRequests.notes}
              onChange={(e) => setFormData({
                ...formData,
                specialRequests: { notes: e.target.value }
              })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Any special requests or notes..."
            />
          </div>
        </div>

        {/* Booking Summary */}
        {selectedRoom && calculateNights() > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Room:</span>
                <span className="font-semibold">{selectedRoom.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-semibold">{formData.roomQuantity} room(s)</span>
              </div>
              <div className="flex justify-between">
                <span>Price per night:</span>
                <span className="font-semibold">R{selectedRoom.price}</span>
              </div>
              <div className="flex justify-between">
                <span>Number of nights:</span>
                <span className="font-semibold">{calculateNights()}</span>
              </div>
              <div className="flex justify-between">
                <span>Guests:</span>
                <span className="font-semibold">
                  {formData.bookingDetails.adults} adult(s), {formData.bookingDetails.children} child(ren)
                </span>
              </div>
              <div className="border-t border-green-300 pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-700">R{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/bookings')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedRoom}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Booking...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewBooking;
