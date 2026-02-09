import { useState, useEffect } from 'react';
import { roomsAPI } from '../../services/api';
import { getImageUrl, getImageUrls, getMainImageUrl } from '../../utils/imageHelpers';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'standard',
    description: '',
    price: '',
    capacity: '',
    beds: '',
    totalQuantity: '1',
    amenities: [],
    mainImage: '',
    images: [],
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const amenitiesList = [
    'WiFi',
    'Air Conditioning',
    'TV',
    'Mini Bar',
    'Safe',
    'Bathroom',
    'Shower',
    'Bathtub',
    'Hair Dryer',
    'Coffee Maker',
    'Desk',
    'Wardrobe',
    'Balcony',
    'Sea View',
    'Garden View',
  ];

  const roomTypes = [
    { value: 'standard', label: 'Standard Room' },
    { value: 'deluxe', label: 'Deluxe Room' },
    { value: 'suite', label: 'Suite' },
    { value: 'family', label: 'Family Room' },
    { value: 'executive', label: 'Executive Room' },
  ];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      
      let apiRooms = [];
      try {
        const response = await roomsAPI.getAll();
        if (response.success && response.data) {
          apiRooms = response.data;
        }
      } catch (apiErr) {
        console.warn('Admin: Rooms API fetch failed, relying on local data');
      }

      const localRooms = JSON.parse(localStorage.getItem('local_rooms') || '[]');
      setRooms([...apiRooms, ...localRooms]);
      setError(null);
    } catch (err) {
      setError('Failed to process rooms data');
      console.error('Rooms error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAmenityToggle = (amenity) => {
    const currentAmenities = formData.amenities || [];
    if (currentAmenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: currentAmenities.filter((a) => a !== amenity),
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...currentAmenities, amenity],
      });
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreview(previews);

    if (files.length > 0) {
      setUploadingImages(true);
      try {
        const uploadedUrls = await uploadImages(files);
        setUploadedImageUrls(uploadedUrls);
        if (!formData.mainImage && uploadedUrls.length > 0) {
          setFormData({ ...formData, mainImage: uploadedUrls[0], images: uploadedUrls });
        } else {
          setFormData({ ...formData, images: uploadedUrls });
        }
      } catch (err) {
        console.error('Image upload error:', err);
        setError('Failed to upload images: ' + err.message);
        alert('Image upload failed: ' + err.message);
      } finally {
        setUploadingImages(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!formData.price || isNaN(parseFloat(formData.price))) {
        alert('Please enter a valid price');
        return;
      }
      
      const roomDataObj = {
        ...formData,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        beds: parseInt(formData.beds),
        totalQuantity: parseInt(formData.totalQuantity),
      };

      if (uploadedImageUrls.length > 0) {
        roomDataObj.images = uploadedImageUrls;
      }

      try {
        let response;
        if (editingRoom && !String(editingRoom.id).startsWith('local-')) {
          response = await roomsAPI.update(editingRoom.id || editingRoom._id, roomDataObj);
        } else if (!editingRoom) {
          response = await roomsAPI.create(roomDataObj);
        } else {
          throw new Error('Local room update');
        }

        if (response.success) {
          await fetchRooms();
          handleCloseModal();
          return;
        }
      } catch (apiErr) {
        console.warn('API failed to save room, saving locally...', apiErr);
        
        const localRooms = JSON.parse(localStorage.getItem('local_rooms') || '[]');
        
        if (editingRoom) {
          const updatedLocal = localRooms.map(r => 
            r.id === editingRoom.id ? { ...roomDataObj, id: r.id } : r
          );
          if (!localRooms.find(r => r.id === editingRoom.id)) {
            updatedLocal.push({ ...roomDataObj, id: editingRoom.id });
          }
          localStorage.setItem('local_rooms', JSON.stringify(updatedLocal));
        } else {
          const newRoom = {
            ...roomDataObj,
            id: 'local-' + Date.now(),
            availability: true
          };
          localStorage.setItem('local_rooms', JSON.stringify([...localRooms, newRoom]));
        }
        
        await fetchRooms();
        handleCloseModal();
      }
    } catch (err) {
      setError(err.message || 'Failed to save room');
      alert('Error saving room: ' + (err.message || 'Unknown error'));
      console.error('Save room error:', err);
    }
  };

  const uploadImages = async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await roomsAPI.uploadImages(formData);
      return response.data.imageUrls;
    } catch (err) {
      console.error('Image upload error:', err);
      throw new Error('Failed to upload images: ' + err.message);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      description: room.description,
      price: room.price,
      capacity: room.capacity,
      beds: room.beds,
      totalQuantity: room.totalQuantity || 1,
      amenities: room.amenities || [],
      mainImage: room.mainImage || '',
      images: room.images || [],
    });
    const imageUrls = getImageUrls(room.images || []);
    setImagePreview(imageUrls);
    setUploadedImageUrls(room.images || []);
    setShowModal(true);
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        if (!String(roomId).startsWith('local-')) {
          try {
            const response = await roomsAPI.delete(roomId);
            if (response.success) {
              await fetchRooms();
              return;
            }
          } catch (apiErr) {
            console.warn('API delete failed, checking local');
          }
        }
        
        const localRooms = JSON.parse(localStorage.getItem('local_rooms') || '[]');
        const filtered = localRooms.filter(r => r.id !== roomId);
        localStorage.setItem('local_rooms', JSON.stringify(filtered));
        await fetchRooms();
      } catch (err) {
        setError(err.message || 'Failed to delete room');
        console.error('Delete room error:', err);
      }
    }
  };

  const handleToggleAvailability = async (room) => {
    try {
      const roomId = room.id || room._id;
      if (!String(roomId).startsWith('local-')) {
        try {
          const response = await roomsAPI.toggleAvailability(roomId);
          if (response.success) {
            setRooms(rooms.map(r =>
              (r.id || r._id) === roomId ? response.data : r
            ));
            return;
          }
        } catch (apiErr) {
          console.warn('API toggle failed, checking local');
        }
      }
      
      const localRooms = JSON.parse(localStorage.getItem('local_rooms') || '[]');
      const updated = localRooms.map(r => 
        r.id === roomId ? { ...r, availability: !r.availability } : r
      );
      
      if (!localRooms.find(r => r.id === roomId)) {
        updated.push({ ...room, id: roomId, availability: !room.availability });
      }
      
      localStorage.setItem('local_rooms', JSON.stringify(updated));
      await fetchRooms();
    } catch (err) {
      setError(err.message || 'Failed to toggle availability');
      console.error('Toggle availability error:', err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData({
      name: '',
      type: 'standard',
      description: '',
      price: '',
      capacity: '',
      beds: '',
      totalQuantity: '1',
      amenities: [],
      mainImage: '',
      images: [],
    });
    setImageFiles([]);
    setImagePreview([]);
    setUploadedImageUrls([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
          <p className="mt-1 text-gray-600">Manage your hotel rooms and accommodations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Room
        </button>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.length === 0 ? (
          <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <p className="text-yellow-800 font-medium">No rooms found</p>
            <p className="text-sm text-yellow-600 mt-2">
              Click "Add New Room" to create your first room
            </p>
          </div>
        ) : (
          rooms.map((room) => (
            <div key={room.id || room._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="h-48 bg-gray-200 relative">
                {room.mainImage || (room.images && room.images.length > 0) ? (
                  <>
                    <img
                      src={getMainImageUrl(room.mainImage, room.images)}
                      alt={room.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x300?text=No+Image';
                      }}
                    />
                    {room.images && room.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {room.images.length} photos
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {roomTypes.find((t) => t.value === room.type)?.label || room.type}
                    </span>
                    <button
                      onClick={() => handleToggleAvailability(room)}
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        room.availability
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                      title={room.availability ? 'Available - Click to mark unavailable' : 'Unavailable - Click to mark available'}
                    >
                      {room.availability ? 'Available' : 'Unavailable'}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{room.description}</p>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
                  <div>Capacity: {room.capacity} guests</div>
                  <div>Beds: {room.beds}</div>
                  <div className="font-bold text-blue-600">R{room.price}/night</div>
                  <div className="col-span-2 pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">Quantity:</span> {room.totalQuantity || 1} total
                  </div>
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {room.amenities.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          +{room.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(room)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(room.id || room._id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Deluxe Ocean View"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {roomTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
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
                  placeholder="Describe the room features and highlights..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (R/night) *
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
                    Capacity (guests) *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Beds *
                  </label>
                  <input
                    type="number"
                    name="beds"
                    value={formData.beds}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Quantity *
                    </label>
                    <input
                      type="number"
                      name="totalQuantity"
                      value={formData.totalQuantity}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {amenitiesList.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {uploadingImages && (
                  <div className="mt-4 flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-blue-700">Uploading images...</span>
                  </div>
                )}
                {imagePreview.length > 0 && !uploadingImages && (
                  <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-4">
                    {imagePreview.map((preview, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={uploadingImages} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploadingImages ? 'Uploading...' : editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;