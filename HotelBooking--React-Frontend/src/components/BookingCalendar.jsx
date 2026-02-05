import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { bookingsAPI } from '../services/api';

const BookingCalendar = ({ refreshKey }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

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

  // Format bookings for FullCalendar
  const calendarEvents = bookings
    .filter(booking => filterStatus === 'all' || booking.status === filterStatus)
    .map(booking => {
      // Parse check-in and check-out dates from booking details
      const checkIn = booking.bookingDetails?.checkIn ? parseISO(booking.bookingDetails.checkIn) : null;
      const checkOut = booking.bookingDetails?.checkOut ? parseISO(booking.bookingDetails.checkOut) : null;

      let eventColor = '#3b82f6'; // Default blue
      switch (booking.status) {
        case 'confirmed':
          eventColor = '#10b981'; // Green
          break;
        case 'pending':
          eventColor = '#f59e0b'; // Yellow
          break;
        case 'cancelled':
          eventColor = '#ef4444'; // Red
          break;
        case 'completed':
          eventColor = '#6b7280'; // Gray
          break;
        case 'no-show':
          eventColor = '#8b5cf6'; // Purple
          break;
        default:
          eventColor = '#3b82f6'; // Blue
      }

      return {
        id: booking.id.toString(),
        title: `${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName} - ${booking.bookingReference}`,
        start: checkIn,
        end: checkOut,
        backgroundColor: eventColor,
        borderColor: eventColor,
        extendedProps: {
          booking: booking
        },
        allDay: true
      };
    });

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

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
    { value: 'no-show', label: 'No Show' }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Booking Calendar</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
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

      <div className="border rounded-lg overflow-hidden">
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
          height="700px"
          editable={false}
          selectable={false}
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

      {/* Event Detail Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Booking Details: {selectedEvent.bookingReference}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Guest Information</h4>
                  <p><span className="font-medium">Name:</span> {selectedEvent.primaryGuest.firstName} {selectedEvent.primaryGuest.lastName}</p>
                  <p><span className="font-medium">Email:</span> {selectedEvent.primaryGuest.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedEvent.primaryGuest.phone}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Booking Information</h4>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      selectedEvent.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      selectedEvent.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedEvent.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      selectedEvent.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                    </span>
                  </p>
                  <p><span className="font-medium">Payment:</span> {selectedEvent.paymentStatus}</p>
                  <p><span className="font-medium">Created:</span> {format(parseISO(selectedEvent.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Stay Details</h4>
                  {selectedEvent.bookingDetails && (
                    <>
                      <p><span className="font-medium">Check-in:</span> {selectedEvent.bookingDetails.checkIn ? format(parseISO(selectedEvent.bookingDetails.checkIn), 'MMM dd, yyyy') : 'N/A'}</p>
                      <p><span className="font-medium">Check-out:</span> {selectedEvent.bookingDetails.checkOut ? format(parseISO(selectedEvent.bookingDetails.checkOut), 'MMM dd, yyyy') : 'N/A'}</p>
                      <p><span className="font-medium">Nights:</span> {selectedEvent.bookingDetails.nights || 0}</p>
                      <p><span className="font-medium">Room Type:</span> {selectedEvent.bookingDetails.roomName || 'N/A'}</p>
                      <p><span className="font-medium">Guests:</span> {selectedEvent.bookingDetails.adults || 0} adults, {selectedEvent.bookingDetails.children || 0} children</p>
                    </>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Service Details</h4>
                  {selectedEvent.service && (
                    <>
                      <p><span className="font-medium">Service:</span> {selectedEvent.service.name}</p>
                      <p><span className="font-medium">Category:</span> {selectedEvent.service.category}</p>
                      <p><span className="font-medium">Price:</span> {selectedEvent.service.price ? `R ${selectedEvent.service.price}` : 'N/A'}</p>
                    </>
                  )}
                </div>
              </div>

              {selectedEvent.specialRequests && selectedEvent.specialRequests.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-2">Special Requests</h4>
                  <ul className="list-disc pl-5">
                    {selectedEvent.specialRequests.map((request, index) => (
                      <li key={index}>{request}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;