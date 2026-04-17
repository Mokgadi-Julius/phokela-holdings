import { useState, useEffect, useRef } from 'react';
import { adminAPI, roomsAPI, servicesAPI, expendituresAPI, bookingsAPI } from '../../services/api';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange] = useState('7days');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Room Occupancy filter state
  const [occupancyView, setOccupancyView] = useState('current'); // 'current' | 'hour' | 'day' | 'week' | 'month' | 'year'
  const [occupancyDate, setOccupancyDate] = useState(new Date().toISOString().split('T')[0]);
  const [occupancyHour, setOccupancyHour] = useState(new Date().getHours());
  const [occupancyWeek, setOccupancyWeek] = useState('');
  const [occupancyMonth, setOccupancyMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [occupancyYear, setOccupancyYear] = useState(new Date().getFullYear());
  const [filteredOccupancy, setFilteredOccupancy] = useState(null);
  const [occupancyLoading, setOccupancyLoading] = useState(false);
  const cachedBookingsRef = useRef(null); // cached bookings for filter computation

  // Electricity readings state — keyed by room name, persisted to localStorage
  // Updated to track monthly kWh units
  const currentMonthYear = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const [activeMonthYear, setActiveMonthYear] = useState(currentMonthYear);
  const [electricityReadings, setElectricityReadings] = useState({});

  // Helper to load readings for a specific month
  const loadReadingsForMonth = (monthYear) => {
    try {
      const allReadings = JSON.parse(localStorage.getItem('electricity_readings_monthly') || '{}');
      setElectricityReadings(allReadings[monthYear] || {});
      setActiveMonthYear(monthYear);
    } catch {
      setElectricityReadings({});
    }
  };

  // Initial load
  useEffect(() => {
    loadReadingsForMonth(currentMonthYear);
  }, []);

  const [showElectricityInputs, setShowElectricityInputs] = useState(false);

  const handleElectricityChange = (roomName, value) => {
    const updatedRoomReadings = { ...electricityReadings, [roomName]: value === '' ? '' : Number(value) };
    setElectricityReadings(updatedRoomReadings);

    try {
      const allReadings = JSON.parse(localStorage.getItem('electricity_readings_monthly') || '{}');
      allReadings[activeMonthYear] = updatedRoomReadings;
      localStorage.setItem('electricity_readings_monthly', JSON.stringify(allReadings));
    } catch (err) {
      console.error('Failed to save electricity readings:', err);
    }
  };

  // Expenditure state
  const [expenditures, setExpenditures] = useState([]);
  const [showExpModal, setShowExpModal] = useState(false);
  const [expFormData, setExpFormData] = useState({
    title: '',
    category: 'other',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: ''
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const stats = reportData?.stats || {};

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Revenue (This Month)', stats.thisMonthRevenue || 0],
      ['Total Bookings (All Time)', stats.totalBookings || 0],
      ['Pending Bookings', stats.pendingBookings || 0],
      ['Active Services', stats.totalServices || 0],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // 2. Financial Performance
    const financialData = reportData.revenueData.map(item => ({
      Month: item.month,
      'Revenue (R)': item.revenue,
      'Expenditure (R)': item.expenditure,
      'Profit (R)': item.profit,
      Bookings: item.bookings
    }));
    const wsFinancial = XLSX.utils.json_to_sheet(financialData);
    XLSX.utils.book_append_sheet(wb, wsFinancial, 'Financial Performance');

    // 3. Room Occupancy
    const occupancyData = (filteredOccupancy || reportData.roomOccupancy).map(room => {
      // Get monthly kWh for this specific room
      // Use currentMonthYear if view is current, otherwise try to match month from filter
      let monthlyKwh = electricityReadings[room.name] || 0;
      
      return {
        Room: room.name,
        Total: room.total,
        Booked: room.booked,
        Available: room.available,
        'Monthly kWh': monthlyKwh
      };
    });
    const wsOccupancy = XLSX.utils.json_to_sheet(occupancyData);
    XLSX.utils.book_append_sheet(wb, wsOccupancy, 'Room Occupancy');

    // 4. Expenditures
    const expData = expenditures.map(exp => ({
      Date: exp.date,
      Title: exp.title,
      Category: exp.category,
      Amount: parseFloat(exp.amount),
      Reference: exp.reference || '',
      Description: exp.description || ''
    }));
    const wsExpenditures = XLSX.utils.json_to_sheet(expData);
    XLSX.utils.book_append_sheet(wb, wsExpenditures, 'Expenditures');

    // 5. Recent Bookings
    const bookingsData = reportData.recentBookings.map(booking => ({
      Reference: booking.bookingReference,
      Guest: `${booking.primaryGuest?.firstName || ''} ${booking.primaryGuest?.lastName || ''}`,
      Service: booking.serviceSnapshot?.name || booking.service?.name || 'N/A',
      Amount: booking.pricing?.totalAmount || 0,
      Status: booking.status,
      'Check In': booking.bookingDetails?.checkIn || 'N/A',
      'Check Out': booking.bookingDetails?.checkOut || 'N/A'
    }));
    const wsBookings = XLSX.utils.json_to_sheet(bookingsData);
    XLSX.utils.book_append_sheet(wb, wsBookings, 'Recent Bookings');

    // Export
    XLSX.writeFile(wb, `Hotel_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ── Occupancy filter helpers ──────────────────────────────────────────────

  /** Compute [startDate, endDate] from the current filter selections */
  const getOccupancyDateRange = () => {
    if (occupancyView === 'hour' || occupancyView === 'day') {
      const start = new Date(occupancyDate);
      const end = new Date(occupancyDate);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
    if (occupancyView === 'week') {
      if (!occupancyWeek) return null;
      const [yearStr, weekPart] = occupancyWeek.split('-W');
      const year = parseInt(yearStr, 10);
      const week = parseInt(weekPart, 10);
      // ISO week: week 1 contains Jan 4
      const jan4 = new Date(year, 0, 4);
      const mondayOfWeek1 = new Date(jan4);
      mondayOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1);
      const start = new Date(mondayOfWeek1);
      start.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
    if (occupancyView === 'month') {
      const [yearStr, monthStr] = occupancyMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return [start, end];
    }
    if (occupancyView === 'year') {
      const start = new Date(occupancyYear, 0, 1);
      const end = new Date(occupancyYear, 11, 31, 23, 59, 59, 999);
      return [start, end];
    }
    return null;
  };

  /** Build a human-readable label for the active filter */
  const getOccupancyLabel = () => {
    if (occupancyView === 'current') return 'Current occupancy';
    if (occupancyView === 'hour') {
      const h = String(occupancyHour).padStart(2, '0');
      return `${occupancyDate} at ${h}:00`;
    }
    if (occupancyView === 'day') return occupancyDate;
    if (occupancyView === 'week') {
      if (!occupancyWeek) return '';
      const range = getOccupancyDateRange();
      if (!range) return occupancyWeek;
      const fmt = d => d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
      return `${fmt(range[0])} – ${fmt(range[1])}, ${range[0].getFullYear()}`;
    }
    if (occupancyView === 'month') {
      const [y, m] = occupancyMonth.split('-');
      return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }
    if (occupancyView === 'year') return String(occupancyYear);
    return '';
  };

  /** Filter cached bookings to compute room occupancy for a date range */
  const computeFilteredOccupancy = (bookings, rawRooms, startDate, endDate) => {
    const roomCounts = {};
    bookings.forEach(booking => {
      if (['cancelled', 'no-show'].includes(booking.status)) return;
      if (!booking.roomId) return;
      const details = booking.bookingDetails || {};
      const checkIn  = details.checkIn  ? new Date(details.checkIn)  : null;
      const checkOut = details.checkOut ? new Date(details.checkOut) : null;
      if (!checkIn || !checkOut) return;
      // Booking overlaps with period when checkIn ≤ endDate AND checkOut ≥ startDate
      if (checkIn <= endDate && checkOut >= startDate) {
        roomCounts[booking.roomId] = (roomCounts[booking.roomId] || 0) + (booking.roomQuantity || 1);
      }
    });
    return rawRooms.map(room => {
      const booked = Math.min(roomCounts[room.id] || 0, room.totalQuantity || 0);
      return {
        name: room.name,
        total: room.totalQuantity || 0,
        booked,
        available: Math.max(0, (room.totalQuantity || 0) - booked),
      };
    });
  };

  /** Fetch bookings (cached) and apply the current occupancy filter */
  const applyOccupancyFilter = async () => {
    if (occupancyView === 'current') {
      setFilteredOccupancy(null);
      return;
    }
    const range = getOccupancyDateRange();
    if (!range) return;
    const [startDate, endDate] = range;

    setOccupancyLoading(true);
    try {
      // Fetch once and cache — pass a high limit to bypass the default 50-record page cap
      if (!cachedBookingsRef.current) {
        const res = await bookingsAPI.getAll({ limit: 9999 });
        cachedBookingsRef.current = res.data || [];
      }
      const computed = computeFilteredOccupancy(
        cachedBookingsRef.current,
        reportData?.rawRooms || [],
        startDate,
        endDate
      );
      setFilteredOccupancy(computed);
    } catch (err) {
      console.error('Occupancy filter error:', err);
    } finally {
      setOccupancyLoading(false);
    }
  };

  // Re-apply filter whenever the date selectors change (only if a non-current view is active)
  useEffect(() => {
    if (occupancyView !== 'current' && reportData) applyOccupancyFilter();

    // Sync electricity readings with the selected month/period
    let targetMonthYear = currentMonthYear;
    if (occupancyView === 'month' && occupancyMonth) {
      const [y, m] = occupancyMonth.split('-');
      targetMonthYear = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } else if (occupancyView === 'day' || occupancyView === 'hour') {
      targetMonthYear = new Date(occupancyDate).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } else if (occupancyView === 'week' && occupancyWeek) {
      const range = getOccupancyDateRange();
      if (range) targetMonthYear = range[0].toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } else if (occupancyView === 'current') {
      targetMonthYear = currentMonthYear;
    }
    
    if (targetMonthYear !== activeMonthYear) {
      loadReadingsForMonth(targetMonthYear);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occupancyDate, occupancyHour, occupancyWeek, occupancyMonth, occupancyYear, occupancyView]);

  // ── End occupancy filter helpers ──────────────────────────────────────────

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardRes, roomsRes, servicesRes, expRes, allBookingsRes] = await Promise.all([
        adminAPI.getDashboard(),
        roomsAPI.getAll(),
        servicesAPI.getAll(),
        expendituresAPI.getAll(),
        cachedBookingsRef.current ? Promise.resolve({ data: cachedBookingsRef.current }) : bookingsAPI.getAll({ limit: 9999 })
      ]);

      if (allBookingsRes && allBookingsRes.data) {
        cachedBookingsRef.current = allBookingsRes.data;
      }

      if (!dashboardRes.success) throw new Error('Failed to load dashboard data');

      const stats = dashboardRes.data.stats;
      const monthlyData = dashboardRes.data.monthlyOverview || [];
      const recentBookings = dashboardRes.data.recentBookings || [];
      const allExpenditures = expRes.data || [];
      setExpenditures(allExpenditures);

      // Process monthly revenue and bookings data
      const revenueData = monthlyData.map(item => {
        const monthYear = item.month;
        const monthExpenditure = allExpenditures
          .filter(exp => {
            const expDate = new Date(exp.date);
            const expMonthYear = expDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            return expMonthYear === monthYear;
          })
          .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        return {
          month: monthYear,
          revenue: parseFloat(item.revenue) || 0,
          bookings: parseInt(item.bookings) || 0,
          expenditure: monthExpenditure,
          profit: (parseFloat(item.revenue) || 0) - monthExpenditure
        };
      });

      // Expenditure by category
      const expByCategory = {};
      allExpenditures.forEach(exp => {
        const cat = exp.category || 'other';
        if (!expByCategory[cat]) expByCategory[cat] = 0;
        expByCategory[cat] += parseFloat(exp.amount);
      });

      const expenditureCategoryData = Object.entries(expByCategory).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

      // Room occupancy — use live booking counts from the backend, not cached bookedQuantity
      const roomBookingCounts = dashboardRes.data.roomBookingCounts || {};
      const roomOccupancy = roomsRes.data.map(room => {
        const booked = roomBookingCounts[room.id] || 0;
        return {
          name: room.name,
          total: room.totalQuantity || 0,
          booked,
          available: Math.max(0, (room.totalQuantity || 0) - booked)
        };
      });

      // Service category breakdown
      const servicesByCategory = {};
      servicesRes.data.forEach(service => {
        const category = service.category || 'Other';
        if (!servicesByCategory[category]) servicesByCategory[category] = 0;
        servicesByCategory[category]++;
      });

      const categoryData = Object.entries(servicesByCategory).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: count
      }));

      // Booking status distribution — use accurate per-status counts from backend
      const bookingStatusCounts = dashboardRes.data.bookingStatusCounts || {};
      const statusData = [
        { name: 'Pending',   value: bookingStatusCounts.pending   || 0 },
        { name: 'Confirmed', value: bookingStatusCounts.confirmed || 0 },
        { name: 'Completed', value: bookingStatusCounts.completed || 0 },
        { name: 'Cancelled', value: bookingStatusCounts.cancelled || 0 },
        { name: 'No-Show',   value: bookingStatusCounts['no-show'] || 0 },
      ].filter(s => s.value > 0);

      // Daily bookings trend (last 7 days)
      const dailyBookings = dashboardRes.data.dailyBookings || [];

      setReportData({
        stats,
        revenueData,
        roomOccupancy,
        rawRooms: roomsRes.data,
        categoryData,
        statusData,
        dailyBookings,
        recentBookings,
        expenditureCategoryData
      });
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setError('Failed to load report data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchReportData();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Compute monthly stats for the activeMonthYear
  const monthlyStats = (() => {
    if (!reportData || !cachedBookingsRef.current || !activeMonthYear) return null;
    
    let start, end;
    try {
      const d = new Date(activeMonthYear);
      if (isNaN(d.getTime())) return null;
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    } catch {
      return null;
    }

    const roomCounts = {};
    cachedBookingsRef.current.forEach(booking => {
      if (['cancelled', 'no-show'].includes(booking.status)) return;
      if (!booking.roomId) return;
      const details = booking.bookingDetails || {};
      const checkIn  = details.checkIn  ? new Date(details.checkIn)  : null;
      const checkOut = details.checkOut ? new Date(details.checkOut) : null;
      if (!checkIn || !checkOut) return;
      if (checkIn <= end && checkOut >= start) {
        roomCounts[booking.roomId] = (roomCounts[booking.roomId] || 0) + 1;
      }
    });

    const breakdown = (reportData.rawRooms || []).map(room => ({
      name: room.name,
      booked: roomCounts[room.id] || 0
    }));

    const totalBookings = breakdown.reduce((sum, r) => sum + r.booked, 0);
    const totalKwh = Object.values(electricityReadings).reduce((sum, val) => sum + (Number(val) || 0), 0);

    return { totalBookings, breakdown, totalKwh };
  })();

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-6">
        <p className="text-red-800 font-medium">{error}</p>
        <button
          onClick={fetchReportData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Moved stats declaration here after loading/error checks but before return
  // stats is actually already part of reportData, so we use it safely here.

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-gray-600">Real-time insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Auto Refresh Toggle */}
          <label className="flex items-center gap-2 cursor-pointer no-print">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
          </label>

          <button
            onClick={() => setShowExpModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center no-print"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Expenditure
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={fetchReportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center no-print"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          {/* Export to Excel Button */}
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center no-print"
            title="Download full report as Excel spreadsheet"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition flex items-center no-print"
            title="Print report or Save as PDF"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print PDF
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print, button, label, .fixed, .modal { display: none !important; }
          body { background: white; padding: 20px; }
          .bg-white { box-shadow: none !important; border: 1px solid #eee; margin-bottom: 20px; }
          .grid { display: block !important; }
          .grid > div { margin-bottom: 2rem; break-inside: avoid; }
          .h-64, .h-[300px], .recharts-responsive-container { height: 400px !important; min-height: 400px !important; }
          canvas { max-width: 100% !important; height: auto !important; }
          .text-3xl { font-size: 24pt !important; }
          .text-xl { font-size: 18pt !important; }
          .overflow-x-auto, .overflow-y-auto { overflow: visible !important; max-height: none !important; }
          table { width: 100% !important; border-collapse: collapse; }
          th, td { border: 1px solid #eee !important; }
        }
      `}} />

      {/* Error banner (shown when refresh fails but old data is still visible) */}
      {error && reportData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between no-print">
          <p className="text-red-800 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700 text-sm ml-4">Dismiss</button>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">R{(stats.thisMonthRevenue || 0).toLocaleString()}</p>
              <p className="text-blue-100 text-xs mt-2">This Month</p>
            </div>
            <div className="text-5xl opacity-20 no-print">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Bookings</p>
              <p className="text-3xl font-bold mt-2">{stats.totalBookings || 0}</p>
              <p className="text-green-100 text-xs mt-2">All Time</p>
            </div>
            <div className="text-5xl opacity-20 no-print">📅</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending Bookings</p>
              <p className="text-3xl font-bold mt-2">{stats.pendingBookings || 0}</p>
              <p className="text-yellow-100 text-xs mt-2">Requires Action</p>
            </div>
            <div className="text-5xl opacity-20 no-print">⏳</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Active Services</p>
              <p className="text-3xl font-bold mt-2">{stats.totalServices || 0}</p>
              <p className="text-purple-100 text-xs mt-2">Available Now</p>
            </div>
            <div className="text-5xl opacity-20 no-print">🏨</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit, Revenue & Expenditure Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Performance (Profit vs Expense)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={reportData.revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (R)" />
              <Area type="monotone" dataKey="expenditure" stroke="#EF4444" fillOpacity={1} fill="url(#colorExp)" name="Expenditure (R)" />
              <Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" name="Net Profit (R)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Bookings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Bookings (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.dailyBookings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bookings" stroke="#8B5CF6" strokeWidth={3} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Occupancy */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Header + view toggle */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Room Occupancy</h2>
              {occupancyView !== 'current' && (
                <p className="text-sm text-blue-600 mt-0.5">{getOccupancyLabel()}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 no-print">
              {['current', 'hour', 'day', 'week', 'month', 'year'].map(v => (
                <button
                  key={v}
                  onClick={() => setOccupancyView(v)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                    occupancyView === v
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date / time selectors */}
          {occupancyView !== 'current' && (
            <div className="flex flex-wrap items-center gap-3 mb-4 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm no-print">
              {(occupancyView === 'day' || occupancyView === 'hour') && (
                <>
                  <label className="text-gray-600 font-medium">Date</label>
                  <input
                    type="date"
                    value={occupancyDate}
                    onChange={e => setOccupancyDate(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </>
              )}
              {occupancyView === 'hour' && (
                <>
                  <label className="text-gray-600 font-medium">Hour</label>
                  <select
                    value={occupancyHour}
                    onChange={e => setOccupancyHour(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </>
              )}
              {occupancyView === 'week' && (
                <>
                  <label className="text-gray-600 font-medium">Week</label>
                  <input
                    type="week"
                    value={occupancyWeek}
                    onChange={e => setOccupancyWeek(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </>
              )}
              {occupancyView === 'month' && (
                <>
                  <label className="text-gray-600 font-medium">Month</label>
                  <input
                    type="month"
                    value={occupancyMonth}
                    onChange={e => setOccupancyMonth(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </>
              )}
              {occupancyView === 'year' && (
                <>
                  <label className="text-gray-600 font-medium">Year</label>
                  <select
                    value={occupancyYear}
                    onChange={e => setOccupancyYear(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  >
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </>
              )}
              {occupancyLoading && (
                <span className="flex items-center gap-1.5 text-blue-600">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Loading…
                </span>
              )}
            </div>
          )}

          {(() => {
            const baseData = filteredOccupancy || reportData.roomOccupancy;
            const chartData = baseData.map(room => ({
              ...room,
              electricityKwh: electricityReadings[room.name] || 0,
            }));
            return (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="booked" fill="#EF4444" name="Booked" />
                  <Bar dataKey="available" fill="#10B981" name="Available" />
                  <Bar dataKey="electricityKwh" fill="#F59E0B" name={`Monthly kWh (${activeMonthYear})`} />
                </BarChart>
              </ResponsiveContainer>
            );
          })()}

          {/* Monthly Statistics Summary */}
          {monthlyStats && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Monthly Analytics: {activeMonthYear}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Electricity Stats Card */}
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-amber-800 text-sm font-semibold uppercase tracking-wider">Total Electricity</p>
                      <p className="text-3xl font-bold text-amber-600 mt-1">
                        {monthlyStats.totalKwh.toFixed(1)} <span className="text-lg font-medium">kWh</span>
                      </p>
                    </div>
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    <p className="text-xs font-bold text-amber-800 uppercase border-b border-amber-200 pb-1">Room Breakdown</p>
                    <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {(reportData.rawRooms || []).map(room => (
                        <div key={room.name} className="flex justify-between items-center py-1.5 border-b border-amber-100 last:border-0">
                          <span className="text-sm text-gray-700">{room.name}</span>
                          <span className="text-sm font-bold text-gray-900">{electricityReadings[room.name] || 0} kWh</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowElectricityInputs(!showElectricityInputs)}
                    className="mt-4 w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition no-print"
                  >
                    {showElectricityInputs ? 'Close Editor' : `Update ${activeMonthYear} Readings`}
                  </button>
                </div>

                {/* Booking Stats Card */}
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-blue-800 text-sm font-semibold uppercase tracking-wider">Rooms Booked</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">
                        {monthlyStats.totalBookings} <span className="text-lg font-medium">Times</span>
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <p className="text-xs font-bold text-blue-800 uppercase border-b border-blue-200 pb-1">Booking Breakdown</p>
                    <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {monthlyStats.breakdown.map(room => (
                        <div key={room.name} className="flex justify-between items-center py-1.5 border-b border-blue-100 last:border-0">
                          <span className="text-sm text-gray-700">{room.name}</span>
                          <span className="text-sm font-bold text-gray-900">{room.booked} bookings</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
                    <p className="text-xs text-blue-800 italic">
                      * Total number of times each room was booked during <strong>{activeMonthYear}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {showElectricityInputs && (
                <div className="mt-6 p-6 bg-white border-2 border-amber-200 rounded-xl shadow-lg no-print">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900">Edit kWh Readings for {activeMonthYear}</h4>
                    <button onClick={() => setShowElectricityInputs(false)} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(reportData.rawRooms || []).map(room => (
                      <div key={room.name} className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">{room.name}</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={electricityReadings[room.name] ?? ''}
                            onChange={e => handleElectricityChange(room.name, e.target.value)}
                            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none text-sm"
                            placeholder="0.0"
                          />
                          <span className="absolute right-3 top-2 text-xs text-gray-400">kWh</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-gray-500 italic">Values are saved automatically to your local storage.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Service Categories */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Services by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.categoryData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent, x, y, cx: pcx }) => (
                  <text
                    x={x}
                    y={y}
                    fill="#374151"
                    textAnchor={x > pcx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={11}
                  >
                    {`${name.length > 9 ? name.slice(0, 8) + '…' : name} ${(percent * 100).toFixed(0)}%`}
                  </text>
                )}
                outerRadius={75}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.categoryData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {reportData.statusData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={
                    _entry.name === 'Pending'   ? '#F59E0B' :
                    _entry.name === 'Confirmed' ? '#10B981' :
                    _entry.name === 'Completed' ? '#3B82F6' :
                    _entry.name === 'Cancelled' ? '#EF4444' :
                    '#6B7280'
                  } />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenditure Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Expenditure Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.expenditureCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.expenditureCategoryData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Expenditure History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Expenditures</h2>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenditures.slice(0, 10).map((exp) => (
                  <tr key={exp.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{exp.date}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 font-medium">{exp.title}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 font-bold">R{parseFloat(exp.amount).toLocaleString()}</td>
                  </tr>
                ))}
                {expenditures.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-500">No expenditures recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.bookingReference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {booking.primaryGuest?.firstName} {booking.primaryGuest?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{booking.serviceSnapshot?.name || booking.service?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    R{booking.pricing?.totalAmount?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenditure Modal */}
      {showExpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Expenditure</h3>
              <button onClick={() => setShowExpModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await expendituresAPI.create(expFormData);
                setShowExpModal(false);
                setExpFormData({
                  title: '',
                  category: 'other',
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  reference: ''
                });
                fetchReportData();
              } catch (err) {
                alert('Failed to record expenditure: ' + err.message);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={expFormData.title}
                  onChange={(e) => setExpFormData({...expFormData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Monthly Electricity"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (R) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={expFormData.amount}
                    onChange={(e) => setExpFormData({...expFormData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expFormData.date}
                    onChange={(e) => setExpFormData({...expFormData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={expFormData.category}
                  onChange={(e) => setExpFormData({...expFormData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="supplies">Supplies</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="salaries">Salaries</option>
                  <option value="utilities">Utilities</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input
                  type="text"
                  value={expFormData.reference}
                  onChange={(e) => setExpFormData({...expFormData, reference: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Invoice # or receipt #"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
              >
                Record Expenditure
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
