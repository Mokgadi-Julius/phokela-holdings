import React from 'react';
import BookingCalendar from '../../components/BookingCalendar';

const Calendar = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Calendar</h1>
          <p className="mt-1 text-gray-600">View and manage all bookings in a calendar view</p>
        </div>
      </div>
      
      <BookingCalendar />
    </div>
  );
};

export default Calendar;