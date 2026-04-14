import { useState, useEffect } from 'react';
import { expendituresAPI } from '../../services/api';

const Expenses = () => {
  const [activeTab, setActiveTab] = useState('expenses');

  // Expenses tab state
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Templates tab state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Filter & Pagination state
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit, setLimit] = useState(10);

  const [globalTotal, setGlobalTotal] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [thisMonthTotal, setThisMonthTotal] = useState(0);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [ytdTotal, setYtdTotal] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    category: 'other',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    isRecurring: false,
    recurringFrequency: 'monthly',
  });

  const categories = ['supplies', 'maintenance', 'salaries', 'utilities', 'marketing', 'other'];

  const fetchExpenses = async (clear = false, targetPage = currentPage, targetLimit = limit) => {
    try {
      setLoading(true);
      const activeFilters = { page: targetPage, limit: targetLimit };
      if (!clear) {
        if (filterCategory) activeFilters.category = filterCategory;
        if (filterStartDate) activeFilters.startDate = filterStartDate;
        if (filterEndDate) activeFilters.endDate = filterEndDate;
      }
      const res = await expendituresAPI.getAll(activeFilters);
      setExpenses(res.data || []);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.currentPage || 1);
      setTotalRecords(res.count || 0);
      setGlobalTotal(res.globalTotal || 0);
      setFilteredTotal(res.filteredTotal || 0);
      setThisMonthTotal(res.thisMonthTotal || 0);
      setLastMonthTotal(res.lastMonthTotal || 0);
      setYtdTotal(res.ytdTotal || 0);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setError('Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await expendituresAPI.getTemplates();
      setTemplates(res.data || []);
      setTemplatesError(null);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setTemplatesError('Failed to load recurring templates. Please try again.');
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await expendituresAPI.update(editId, formData);
      } else {
        await expendituresAPI.create(formData);
      }
      setShowAddModal(false);
      resetForm();
      if (activeTab === 'templates') {
        fetchTemplates();
      } else {
        fetchExpenses(false, currentPage, limit);
      }
    } catch (err) {
      console.error('Failed to save expense:', err);
      alert('Failed to save expense. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'other',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      isRecurring: false,
      recurringFrequency: 'monthly',
    });
    setEditMode(false);
    setEditId(null);
  };

  const openAddModal = (presetRecurring = false) => {
    setEditMode(false);
    setEditId(null);
    setFormData({
      title: '',
      category: 'other',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      isRecurring: presetRecurring,
      recurringFrequency: 'monthly',
    });
    setShowAddModal(true);
  };

  const handleEdit = (expense) => {
    setEditMode(true);
    setEditId(expense.id);
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      description: expense.description || '',
      reference: expense.reference || '',
      isRecurring: !!expense.isRecurring,
      recurringFrequency: expense.recurringFrequency || 'monthly',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await expendituresAPI.delete(id);
      if (activeTab === 'templates') {
        fetchTemplates();
      } else {
        fetchExpenses();
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
      alert('Failed to delete expense.');
    }
  };

  const handleRunNow = async (id) => {
    if (!window.confirm('Generate next occurrence for this template now?')) return;
    try {
      await expendituresAPI.triggerTemplate(id);
      fetchTemplates();
    } catch (err) {
      console.error('Failed to trigger template:', err);
      alert('Failed to generate occurrence. Please try again.');
    }
  };

  const handleTogglePause = async (id, currentlyPaused) => {
    try {
      await expendituresAPI.togglePause(id);
      fetchTemplates();
    } catch (err) {
      console.error('Failed to toggle pause:', err);
      alert(`Failed to ${currentlyPaused ? 'resume' : 'pause'} template.`);
    }
  };

  const handleRunAllDue = async () => {
    if (!window.confirm('Process all due recurring templates now?')) return;
    try {
      await expendituresAPI.triggerAll();
      fetchTemplates();
      alert('All due recurring expenses processed successfully.');
    } catch (err) {
      console.error('Failed to trigger all:', err);
      alert('Failed to process recurring expenses. Please try again.');
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchExpenses(false, 1, limit);
  };

  const handleClearFilters = () => {
    setFilterCategory('');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
    fetchExpenses(true, 1, limit);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchExpenses(false, newPage, limit);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setLimit(newLimit);
    setCurrentPage(1);
    fetchExpenses(false, 1, newLimit);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const isOverdue = (nextDueDate) => {
    if (!nextDueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return nextDueDate < today;
  };

  const estimatedMonthlyCost = () => {
    return templates.filter(t => !t.isPaused).reduce((sum, t) => {
      const amt = parseFloat(t.amount) || 0;
      if (t.recurringFrequency === 'weekly') return sum + amt * 4.33;
      if (t.recurringFrequency === 'monthly') return sum + amt;
      if (t.recurringFrequency === 'quarterly') return sum + amt / 3;
      return sum + amt;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage guest house expenditures</p>
        </div>
        {activeTab === 'expenses' ? (
          <button
            onClick={() => openAddModal(false)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center shadow-sm"
          >
            <span className="mr-2">+</span> Add Expense
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleRunAllDue}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center shadow-sm text-sm"
            >
              Run All Due
            </button>
            <button
              onClick={() => openAddModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center shadow-sm"
            >
              <span className="mr-2">+</span> Add Template
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'expenses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'templates'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recurring Templates
            {templates.length > 0 && (
              <span className="ml-2 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {templates.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ── EXPENSES TAB ── */}
      {activeTab === 'expenses' && (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => fetchExpenses()} className="ml-4 text-sm font-medium underline hover:no-underline">Retry</button>
            </div>
          )}

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(thisMonthTotal)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Month</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(lastMonthTotal)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Year-to-Date</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(ytdTotal)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full mr-4"><span className="text-xl">💸</span></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">All-Time Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(globalTotal)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-bl-lg">Filtered</div>
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full mr-4"><span className="text-xl">📋</span></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Filtered Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(filteredTotal)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-full mr-4"><span className="text-xl">📑</span></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Filtered Records</p>
                  <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              Filter Expenses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded text-sm px-3 py-2 bg-gray-50 focus:bg-white focus:ring-blue-500 focus:border-blue-500 capitalize transition-colors"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded text-sm px-3 py-2 bg-gray-50 focus:bg-white focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded text-sm px-3 py-2 bg-gray-50 focus:bg-white focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleApplyFilters}
                  className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-900 transition flex-1 border border-gray-800"
                >
                  Apply Filter
                </button>
                <button
                  onClick={handleClearFilters}
                  className="bg-white text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition border border-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurring</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="8" className="px-6 py-10 text-center text-gray-500">Loading expenses...</td></tr>
                  ) : expenses.length === 0 ? (
                    <tr><td colSpan="8" className="px-6 py-10 text-center text-gray-500">{error ? 'Failed to load expenses.' : 'No expenses matched criteria.'}</td></tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">{expense.category}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(expense.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.reference || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {expense.isRecurring ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 capitalize">
                              {expense.recurringFrequency || 'recurring'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={expense.description}>{expense.description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleEdit(expense)} className="text-blue-600 hover:text-blue-900 transition-colors mr-3">Edit</button>
                          <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900 transition-colors">Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalRecords > 0 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * limit) + 1}</span> to <span className="font-medium">{Math.min(currentPage * limit, totalRecords)}</span> of <span className="font-medium">{totalRecords}</span> entries
                  </span>
                  <select
                    value={limit}
                    onChange={handleLimitChange}
                    className="border-gray-300 rounded text-sm py-1 px-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1 ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TEMPLATES TAB ── */}
      {activeTab === 'templates' && (
        <>
          {templatesError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
              <span>{templatesError}</span>
              <button onClick={() => fetchTemplates()} className="ml-4 text-sm font-medium underline hover:no-underline">Retry</button>
            </div>
          )}

          {/* Templates Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{templates.filter(t => !t.isPaused).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-full mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {templates.filter(t => !t.isPaused && isOverdue(t.nextDueDate)).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Est. Monthly Cost</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estimatedMonthlyCost())}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {templatesLoading ? (
                    <tr><td colSpan="8" className="px-6 py-10 text-center text-gray-500">Loading templates...</td></tr>
                  ) : templates.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                        No recurring templates yet. Click "Add Template" to create one.
                      </td>
                    </tr>
                  ) : (
                    templates.map((template) => {
                      const overdue = !template.isPaused && isOverdue(template.nextDueDate);
                      return (
                        <tr key={template.id} className={`hover:bg-gray-50 ${template.isPaused ? 'opacity-60' : overdue ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {template.title}
                            {template.isPaused && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Paused</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">{template.category}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(template.amount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 capitalize">
                              {template.recurringFrequency}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {template.date ? new Date(template.date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {template.isPaused ? (
                              <span className="text-gray-400 italic">paused</span>
                            ) : template.nextDueDate ? (
                              <span className={`font-medium ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                                {overdue && <span className="mr-1">⚠</span>}
                                {new Date(template.nextDueDate).toLocaleDateString()}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={template.description}>{template.description || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEdit(template)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleTogglePause(template.id, template.isPaused)}
                              className={`transition-colors ${template.isPaused ? 'text-green-600 hover:text-green-900' : 'text-yellow-600 hover:text-yellow-900'}`}
                            >
                              {template.isPaused ? 'Resume' : 'Pause'}
                            </button>
                            {!template.isPaused && (
                              <button
                                onClick={() => handleRunNow(template.id)}
                                className="text-green-600 hover:text-green-900 transition-colors"
                              >
                                Run Now
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(template.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Shared Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {editMode
                  ? (formData.isRecurring ? 'Edit Recurring Template' : 'Edit Expense')
                  : (formData.isRecurring ? 'Add Recurring Template' : 'Add New Expense')}
              </h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-500">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Monthly Electricity"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ZAR)</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.isRecurring ? 'Start Date' : 'Date'}
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference/Receipt # (Optional)</label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Recurring Expense</span>
                </label>
                {formData.isRecurring && (
                  <select
                    name="recurringFrequency"
                    value={formData.recurringFrequency}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  name="description"
                  rows="2"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {editMode ? 'Save Changes' : (formData.isRecurring ? 'Save Template' : 'Save Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
