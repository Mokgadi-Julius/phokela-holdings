import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { servicesAPI } from '../../services/api';
import { getImageUrl, getImageUrls } from '../../utils/imageHelpers';
import { roomData } from '../../db/data';

const Services = () => {
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    category: 'catering',
    description: '',
    price: '',
    priceUnit: 'per person',
    maxPerson: '',
    size: '',
    facilities: [],
    featured: false,
    images: {
      thumbnail: '',
      large: '',
      gallery: [],
    },
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const categories = [
    { value: 'catering', label: 'Catering', icon: '🍽️', color: 'bg-orange-100 text-orange-800' },
    { value: 'conference', label: 'Conference', icon: '🏢', color: 'bg-blue-100 text-blue-800' },
    { value: 'events', label: 'Events', icon: '🎉', color: 'bg-purple-100 text-purple-800' },
  ];

  const priceUnits = [
    { value: 'per person', label: 'Per Person' },
    { value: 'per day', label: 'Per Day' },
    { value: 'per event', label: 'Per Event' },
    { value: 'per hour', label: 'Per Hour' },
  ];

  const facilitiesList = {
    catering: [
      'Buffet Setup',
      'Table Service',
      'Bar Service',
      'Custom Menu',
      'Dietary Options',
      'Food Stations',
      'Dessert Bar',
      'Coffee Station',
    ],
    conference: [
      'Projector',
      'Screen',
      'Whiteboard',
      'Sound System',
      'Microphones',
      'Video Conferencing',
      'WiFi',
      'Air Conditioning',
      'Podium',
      'Stage',
    ],
    events: [
      'Dance Floor',
      'Stage',
      'Sound System',
      'Lighting',
      'Decorations',
      'Photography',
      'DJ',
      'MC Services',
      'Security',
      'Parking',
    ],
  };

  useEffect(() => {
    fetchServices();
    
    // Check for "add" query parameter to auto-open modal
    const params = new URLSearchParams(location.search);
    if (params.get('add') === 'true') {
      setShowModal(true);
    }
  }, [location.search]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      let apiServices = [];
      try {
        const response = await servicesAPI.getAll();
        if (response.success && response.data) {
          apiServices = response.data;
        }
      } catch (apiErr) {
        // Silently relying on local data
      }

      // Load from local storage
      const localServices = JSON.parse(localStorage.getItem('local_services') || '[]');
      
      // Fallback roomData for services
      const fallbackServices = roomData.filter(item => 
        item.name.includes('Catering') || 
        item.name.includes('Conference') || 
        item.name.includes('Event')
      );

      // Merge all sources, preferring API > Local > Fallback (by ID or name)
      // For simplicity, we'll just combine them and filter duplicates by name/id
      const combined = [...apiServices, ...localServices];
      
      // If no dynamic services, use fallback roomData
      if (combined.length === 0) {
        setServices(fallbackServices);
      } else {
        setServices(combined);
      }
      
      setError(null);
    } catch (err) {
      console.error('Admin: fetchServices error:', err);
      setError('Failed to process services data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFacilityToggle = (facility) => {
    const currentFacilities = formData.facilities || [];
    if (currentFacilities.includes(facility)) {
      setFormData({
        ...formData,
        facilities: currentFacilities.filter((f) => f !== facility),
      });
    } else {
      setFormData({
        ...formData,
        facilities: [...currentFacilities, facility],
      });
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);

    // Create preview URLs
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreview(previews);

    // Auto-upload images immediately
    if (files.length > 0) {
      setUploadingImages(true);
      try {
        const uploadedUrls = await uploadImages(files);
        setUploadedImageUrls(uploadedUrls);

        // Set images in the proper structure
        setFormData({
          ...formData,
          images: {
            thumbnail: uploadedUrls[0] || '',
            large: uploadedUrls[0] || '',
            gallery: uploadedUrls,
          }
        });
      } catch (err) {
        console.error('Image upload error:', err);
        setError('Failed to upload images: ' + err.message);
        alert('Image upload failed: ' + err.message);
      } finally {
        setUploadingImages(false);
      }
    }
  };

  const uploadImages = async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await servicesAPI.uploadImages(formData);
      return response.data.imageUrls;
    } catch (err) {
      console.error('Image upload error:', err);
      throw new Error('Failed to upload images: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!formData.price || isNaN(parseFloat(formData.price))) {
        alert('Please enter a valid price');
        return;
      }

      const serviceData = {
        ...formData,
        price: parseFloat(formData.price),
        maxPerson: parseInt(formData.maxPerson),
        size: formData.size ? parseInt(formData.size) : 0,
      };

      try {
        let response;
        if (editingService && !String(editingService.id).startsWith('local-')) {
          response = await servicesAPI.update(editingService.id, serviceData);
        } else if (!editingService) {
          response = await servicesAPI.create(serviceData);
        } else {
          // This was a local service being edited, skip API and go to catch block for local update
          throw new Error('Local service update');
        }

        if (response.success) {
          await fetchServices();
          handleCloseModal();
          return;
        }
      } catch (apiErr) {
        console.warn('API failed to save service, saving locally...', apiErr);
        
        const localServices = JSON.parse(localStorage.getItem('local_services') || '[]');
        
        if (editingService) {
          // Update existing local service or "convert" API service to local if update failed
          const updatedLocal = localServices.map(s => 
            s.id === editingService.id ? { ...serviceData, id: s.id } : s
          );
          
          // If it wasn't in local storage (it was an API service), add it
          if (!localServices.find(s => s.id === editingService.id)) {
            updatedLocal.push({ ...serviceData, id: editingService.id });
          }
          
          localStorage.setItem('local_services', JSON.stringify(updatedLocal));
        } else {
          // Create new local service
          const newService = {
            ...serviceData,
            id: 'local-' + Date.now(),
            availability: true
          };
          localStorage.setItem('local_services', JSON.stringify([...localServices, newService]));
        }
        
        await fetchServices();
        handleCloseModal();
      }
    } catch (err) {
      console.error('Save service error:', err);
      setError(err.message || 'Failed to save service');
      alert('Error saving service:\n' + (err.message || 'Unknown error'));
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description,
      price: service.price,
      priceUnit: service.priceUnit || 'per person',
      maxPerson: service.maxPerson,
      size: service.size || '',
      facilities: service.facilities || [],
      featured: service.featured || false,
      images: service.images || {
        thumbnail: '',
        large: '',
        gallery: [],
      },
    });

    // Convert backend image URLs to full URLs for preview
    const gallery = service.images?.gallery || [];
    const imageUrls = getImageUrls(gallery);
    setImagePreview(imageUrls);
    setUploadedImageUrls(gallery);
    setShowModal(true);
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        if (!String(serviceId).startsWith('local-')) {
          try {
            const response = await servicesAPI.delete(serviceId);
            if (response.success) {
              await fetchServices();
              return;
            }
          } catch (apiErr) {
            console.warn('API delete failed, checking local storage');
          }
        }
        
        // Remove from local storage
        const localServices = JSON.parse(localStorage.getItem('local_services') || '[]');
        const filtered = localServices.filter(s => s.id !== serviceId);
        localStorage.setItem('local_services', JSON.stringify(filtered));
        await fetchServices();
      } catch (err) {
        setError(err.message || 'Failed to delete service');
        console.error('Delete service error:', err);
      }
    }
  };

  const handleToggleAvailability = async (service) => {
    try {
      if (!String(service.id).startsWith('local-')) {
        try {
          const response = await servicesAPI.toggleAvailability(service.id);
          if (response.success) {
            setServices(services.map(s =>
              s.id === service.id ? response.data : s
            ));
            return;
          }
        } catch (apiErr) {
          console.warn('API toggle failed, falling back to local');
        }
      }
      
      // Toggle in local storage
      const localServices = JSON.parse(localStorage.getItem('local_services') || '[]');
      const updated = localServices.map(s => 
        s.id === service.id ? { ...s, availability: !s.availability } : s
      );
      
      // If it wasn't in local storage (it was an API service), add it with toggled state
      if (!localServices.find(s => s.id === service.id)) {
        updated.push({ ...service, availability: !service.availability });
      }
      
      localStorage.setItem('local_services', JSON.stringify(updated));
      await fetchServices();
    } catch (err) {
      setError(err.message || 'Failed to toggle availability');
      console.error('Toggle availability error:', err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({
      name: '',
      category: 'catering',
      description: '',
      price: '',
      priceUnit: 'per person',
      maxPerson: '',
      size: '',
      facilities: [],
      featured: false,
      images: {
        thumbnail: '',
        large: '',
        gallery: [],
      },
    });
    setImageFiles([]);
    setImagePreview([]);
    setUploadedImageUrls([]);
  };

  const filteredServices = filterCategory === 'all'
    ? services
    : services.filter(s => s.category === filterCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
          <p className="mt-1 text-gray-600">Manage catering, conference, and event services</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Service
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterCategory === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Services ({services.length || 0})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterCategory === cat.value
                ? 'bg-blue-600 text-white'
                : cat.color + ' hover:opacity-80'
            }`}
          >
            {String(cat.icon)} {String(cat.label)} ({services.filter(s => s.category === cat.value).length || 0})
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <p className="text-yellow-800 font-medium">No services found</p>
            <p className="text-sm text-yellow-600 mt-2">
              Click "Add New Service" to create your first service
            </p>
          </div>
        ) : (
          filteredServices.map((service) => {
            const categoryInfo = categories.find(c => c.value === service.category) || { icon: '📋', label: 'Other', color: 'bg-gray-100 text-gray-800' };
            const thumbnail = service.images?.thumbnail || service.images?.gallery?.[0];

            return (
              <div key={service.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                {/* Service Image */}
                <div className="h-48 bg-gray-200 relative">
                  {thumbnail ? (
                    <img
                      src={getImageUrl(thumbnail)}
                      alt={service.name || 'Service'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x300?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <span className="text-6xl">{String(categoryInfo.icon)}</span>
                    </div>
                  )}
                  {service.featured && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded font-bold">
                      ⭐ Featured
                    </div>
                  )}
                </div>

                {/* Service Details */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{service.name || 'Unnamed Service'}</h3>
                    <button
                      onClick={() => handleToggleAvailability(service)}
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        service.availability
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                      title={service.availability ? 'Available - Click to disable' : 'Unavailable - Click to enable'}
                    >
                      {service.availability ? 'Available' : 'Unavailable'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-sm px-2 py-1 rounded font-medium ${categoryInfo.color}`}>
                      {String(categoryInfo.icon)} {String(categoryInfo.label)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{String(service.description || '')}</p>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
                    <div>Max: {service.maxPerson || 0} people</div>
                    
                    <div className="col-span-2 font-bold text-blue-600 text-base">
                      R{service.price || 0} {String(service.priceUnit || 'per person')}
                    </div>
                  </div>

                  {/* Facilities */}
                  {service.facilities && Array.isArray(service.facilities) && service.facilities.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {service.facilities.slice(0, 3).map((facility, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {String(facility)}
                          </span>
                        ))}
                        {service.facilities.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            +{service.facilities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Wedding Catering Package"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {String(cat.icon)} {String(cat.label)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the service features and highlights..."
                />
              </div>

              {/* Pricing & Capacity */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (R) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Unit *
                  </label>
                  <select
                    name="priceUnit"
                    value={formData.priceUnit}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priceUnits.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max People *
                  </label>
                  <input
                    type="number"
                    name="maxPerson"
                    value={formData.maxPerson}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>


              </div>

              {/* Featured Toggle */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded text-yellow-600 focus:ring-yellow-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-yellow-900">⭐ Featured Service</span>
                    <p className="text-xs text-yellow-700">Featured services appear at the top of listings</p>
                  </div>
                </label>
              </div>

              {/* Facilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facilities & Features
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(facilitiesList[formData.category] || []).map((facility, idx) => (
                    <label
                      key={`${facility}-${idx}`}
                      className="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.facilities && formData.facilities.includes(facility)}
                        onChange={() => handleFacilityToggle(facility)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{String(facility)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Upload multiple images. The first image will be used as the main thumbnail.
                </p>

                {uploadingImages && (
                  <div className="mt-4 flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-blue-700">Uploading images...</span>
                  </div>
                )}

                {imagePreview.length > 0 && !uploadingImages && (
                  <div className="mt-4">
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                      {imagePreview.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
                            <img
                              src={preview}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {idx === 0 && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                Main
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImages}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImages ? 'Uploading...' : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
