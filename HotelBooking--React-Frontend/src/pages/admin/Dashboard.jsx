import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import BookingChart from './BookingChart';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();

    // Listen for booking updates
    const bookingChannel = new BroadcastChannel('booking_updates');
    bookingChannel.onmessage = (event) => {
      if (event.data === 'new_booking' || event.data === 'booking_updated') {
        fetchDashboardData();
      }
    };

    // Set up polling to refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => {
      bookingChannel.close();
      clearInterval(interval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        throw new Error('API request unsuccessful');
      }
    } catch (err) {
      console.error('Dashboard error, using mock data:', err);
      // Mock data for fallback
      const mockData = {
        stats: {
          totalBookings: 0,
          pendingBookings: 0,
          todayBookings: 0,
          thisMonthRevenue: 0,
          newContacts: 0,
          totalServices: 8
        },
        recentBookings: [],
        upcomingBookings: [],
        monthlyOverview: []
      };
      setDashboardData(mockData);
      // Optionally notify the user but don't block the UI
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">{error}</p>
        <p className="text-sm text-yellow-600 mt-2">
          This is likely because the backend server is not running or the database is not connected.
        </p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const recentBookings = dashboardData?.recentBookings || [];
  const upcomingBookings = dashboardData?.upcomingBookings || [];
  const monthlyOverview = dashboardData?.monthlyOverview || [];

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings || 0,
      icon: '📅',
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings || 0,
      icon: '⏳',
      color: 'bg-yellow-500',
      link: '/admin/bookings?status=pending',
    },
    {
      title: 'Today\'s Bookings',
      value: stats.todayBookings || 0,
      icon: '📊',
      color: 'bg-green-500',
    },
    {
      title: 'This Month Revenue',
      value: `R${(stats.thisMonthRevenue || 0).toLocaleString()}`,
      icon: '💰',
      color: 'bg-purple-500',
      change: '+8%',
    },
    {
      title: 'New Contacts',
      value: stats.newContacts || 0,
      icon: '✉️',
      color: 'bg-pink-500',
      link: '/admin/contacts',
    },
    {
      title: 'Active Services',
      value: stats.totalServices || 0,
      icon: '🏨',
      color: 'bg-indigo-500',
      link: '/admin/services',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">Welcome back! Here\'s what\'s happening today.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                {stat.change && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    {stat.change} from last month
                  </p>
                )}
                {stat.link && (
                  <Link to={stat.link} className="mt-2 text-sm text-blue-600 hover:text-blue-700 inline-block">
                    View all →
                  </Link>
                )}
              </div>
              <div className={`${stat.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Overview Chart */}
      <BookingChart data={monthlyOverview} />

      {/* Recent and Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent bookings</p>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{booking.bookingReference}</p>
                    <p className="text-sm text-gray-600">
                      {booking.primaryGuest?.firstName} {booking.primaryGuest?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{booking.service?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      R{booking.pricing?.totalAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Bookings</h2>
            <Link to="/admin/calendar" className="text-sm text-blue-600 hover:text-blue-700">
              View calendar
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming bookings</p>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{booking.bookingReference}</p>
                    <p className="text-sm text-gray-600">
                      {booking.primaryGuest?.firstName} {booking.primaryGuest?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.bookingDetails?.checkIn && new Date(booking.bookingDetails.checkIn).toLocaleDateString()}
                      {booking.bookingDetails?.eventDate && new Date(booking.bookingDetails.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/bookings/new"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <span className="text-3xl mb-2">➕</span>
            <span className="text-sm font-medium text-gray-700">New Booking</span>
          </Link>
          <Link
            to="/admin/services?add=true"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <span className="text-3xl mb-2">🏨</span>
            <span className="text-sm font-medium text-gray-700">Add Service</span>
          </Link>
          <Link
            to="/admin/reports"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <span className="text-3xl mb-2">📈</span>
            <span className="text-sm font-medium text-gray-700">View Reports</span>
          </Link>
          <button
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <span className="text-3xl mb-2">🌐</span>
            <span className="text-sm font-medium text-gray-700">View Website</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
