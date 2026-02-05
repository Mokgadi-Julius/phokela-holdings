import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../services/api';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    } else {
      fetchNotifications();
      
      // Listen for booking updates from other components (Cross-tab)
      const bookingChannel = new BroadcastChannel('booking_updates');
      bookingChannel.onmessage = (event) => {
        if (event.data === 'new_booking' || event.data === 'booking_updated') {
          fetchNotifications();
        }
      };

      // Listen for local updates (Same-tab)
      const handleLocalUpdate = () => {
        console.log('🔄 Local booking update received, fetching notifications...');
        fetchNotifications();
      };
      window.addEventListener('local_booking_update', handleLocalUpdate);

      // Poll for new notifications every 60 seconds as a fallback
      const interval = setInterval(fetchNotifications, 60000);

      return () => {
        bookingChannel.close();
        window.removeEventListener('local_booking_update', handleLocalUpdate);
        clearInterval(interval);
      };
    }
  }, [navigate]);

  useEffect(() => {
    // Close notifications when clicking outside
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log('🔔 Fetching notifications...');
      const response = await adminAPI.getDashboard();
      if (response.success) {
        // Get already seen IDs from localStorage
        const seenIdsString = localStorage.getItem('seenNotificationIds');
        const seenIds = seenIdsString ? JSON.parse(seenIdsString) : [];
        
        // Use recent bookings as notifications
        const recent = response.data.recentBookings || [];
        const mappedNotifications = recent.map(b => {
          const itemName = b.serviceSnapshot?.name || b.service?.name || b.room?.name || 'a room';
          const isRead = seenIds.includes(b.id);
          
          return {
            id: b.id,
            title: 'New Booking',
            message: `${b.primaryGuest.firstName} booked ${itemName}`,
            time: new Date(b.createdAt).toLocaleTimeString(),
            read: isRead,
            link: '/admin/bookings'
          };
        });
        
        setNotifications(mappedNotifications);
        
        // ONLY count those that are NOT in seenIds
        const newUnreadCount = mappedNotifications.filter(n => !n.read).length;
        console.log(`🔔 Unread notifications: ${newUnreadCount}`);
        setUnreadCount(newUnreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAllAsRead = () => {
    if (notifications.length === 0) return;
    
    console.log('🔔 Marking all current notifications as read...');
    const seenIds = JSON.parse(localStorage.getItem('seenNotificationIds') || '[]');
    const currentIds = notifications.map(n => n.id);
    
    // Merge unique IDs
    const updatedSeenIds = Array.from(new Set([...seenIds, ...currentIds]));
    
    // Prune to avoid bloat (keep last 100)
    if (updatedSeenIds.length > 100) {
      updatedSeenIds.splice(0, updatedSeenIds.length - 100);
    }
    
    localStorage.setItem('seenNotificationIds', JSON.stringify(updatedSeenIds));
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markAsRead = (id) => {
    console.log(`🔔 Marking notification ${id} as read...`);
    const seenIds = JSON.parse(localStorage.getItem('seenNotificationIds') || '[]');
    if (!seenIds.includes(id)) {
      const updatedSeenIds = [...seenIds, id];
      localStorage.setItem('seenNotificationIds', JSON.stringify(updatedSeenIds));
      
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Calendar', href: '/admin/calendar', icon: '📅' },
    { name: 'Bookings', href: '/admin/bookings', icon: '📝' },
    { name: 'Rooms', href: '/admin/rooms', icon: '🛏️' },
    { name: 'Services', href: '/admin/services', icon: '🏨' },
    { name: 'Contacts', href: '/admin/contacts', icon: '✉️' },
    { name: 'Reports', href: '/admin/reports', icon: '📈' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
  ];

  const handleLogout = () => {
    // TODO: Implement actual logout logic
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
            <span className="text-xl font-bold text-white">Phokela Admin</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/admin' && location.pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-gray-400">admin@phokela.com</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 relative"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            to={n.link}
                            onClick={() => {
                              markAsRead(n.id);
                              setNotificationsOpen(false);
                            }}
                            className={`block p-4 border-b border-gray-50 hover:bg-gray-50 transition ${!n.read ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                              <span className="text-[10px] text-gray-400">{n.time}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="p-3 text-center border-t border-gray-100">
                      <Link 
                        to="/admin/bookings" 
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        View all bookings
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/"
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                View Website
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
