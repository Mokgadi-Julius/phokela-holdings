import { ScrollToTop } from '../components';
import { Link } from 'react-router-dom';
import { servicesAPI } from '../services/api';
import { roomData } from '../db/data';
import images from '../assets';
import { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/imageHelpers';
import BookingModal from '../components/BookingModal';

const Catering = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    fetchCateringServices();
  }, []);

  const fetchCateringServices = async () => {
    try {
      let apiServices = [];
      try {
        const response = await servicesAPI.getByCategory('catering');
        if (response.success && response.data) {
          apiServices = response.data;
        }
      } catch (apiErr) {
        // Silently fallback to local storage if API fails
      }

      // Merge with local storage
      const localServices = JSON.parse(localStorage.getItem('local_services') || '[]')
        .filter(s => s.category === 'catering');
      
      const combined = [...apiServices, ...localServices];

      if (combined.length > 0) {
        setServices(combined);
      } else {
         // Fallback to static data
         const cateringServices = roomData.filter(item => item.name.includes('Catering'));
         setServices(cateringServices);
      }
    } catch (error) {
      console.error('Error fetching catering services:', error);
      const cateringServices = roomData.filter(item => item.name.includes('Catering'));
      setServices(cateringServices);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen pt-[120px] pb-12'>
      <ScrollToTop />

      {/* Hero Section */}
      <div className='relative h-[400px] bg-cover bg-center'
           style={{ backgroundImage: `url(${images.Slider2})` }}>
        <div className='absolute inset-0 bg-black/60'></div>
        <div className='relative z-10 h-full flex items-center justify-center'>
          <div className='text-center text-white'>
            <h1 className='font-primary text-[45px] lg:text-[65px] mb-4'>
              Professional Catering Services
            </h1>
            <p className='text-[20px] max-w-[600px] mx-auto'>
              Delicious, fresh meals prepared with love for your special occasions
            </p>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-16'>
        {/* Introduction Section */}
        <div className='text-center mb-16'>
          <h2 className='font-primary text-[35px] mb-6'>Exceptional Culinary Experiences</h2>
          <p className='text-[18px] text-gray-600 max-w-[800px] mx-auto mb-8'>
            At Phokela Guest House, we believe that great food brings people together. Our experienced chefs prepare delicious meals using fresh, locally-sourced ingredients. Whether you're hosting a corporate event or celebrating a special occasion, we have the perfect catering solution for you.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto'>
            <div className='text-center'>
              <div className='bg-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-white text-2xl'>👨‍🍳</span>
              </div>
              <h3 className='font-semibold text-[20px] mb-2'>Expert Chefs</h3>
              <p className='text-gray-600'>Experienced culinary professionals passionate about great food</p>
            </div>
            <div className='text-center'>
              <div className='bg-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-white text-2xl'>🥬</span>
              </div>
              <h3 className='font-semibold text-[20px] mb-2'>Fresh Ingredients</h3>
              <p className='text-gray-600'>Locally-sourced, fresh ingredients for the best flavor and quality</p>
            </div>
          </div>
        </div>

        {/* Catering Services */}
        <div className='mb-16'>
          <h2 className='font-primary text-[35px] text-center mb-12'>Our Catering Packages</h2>

          {loading ? (
            <div className='text-center py-12'>
              <div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent'></div>
              <p className='mt-4 text-gray-600'>Loading catering services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className='text-center py-12 bg-gray-50 rounded-lg'>
              <p className='text-gray-600 text-lg'>No catering services available at the moment.</p>
              <p className='text-gray-500 mt-2'>Please contact us for more information.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {services.map((service) => {
                const thumbnail = service.images?.thumbnail || service.images?.gallery?.[0];

                return (
                  <div key={service.id} className='bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow'>
                    {/* Service Image */}
                    {thumbnail && (
                      <div className='h-48 bg-gray-200 overflow-hidden'>
                        <img
                          src={getImageUrl(thumbnail)}
                          alt={service.name}
                          className='w-full h-full object-cover'
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className='p-6'>
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex-1'>
                          <h3 className='font-primary text-[24px] mb-2 text-accent'>{service.name}</h3>
                          {service.featured && (
                            <span className='inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold'>
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                        <div className='text-right'>
                          <div className='text-2xl font-bold text-accent'>R{service.price}</div>
                          <div className='text-sm text-gray-600'>{service.priceUnit}</div>
                        </div>
                      </div>

                      <p className='text-gray-600 mb-4'>{service.description}</p>

                      <div className='grid grid-cols-2 gap-3 mb-4 text-sm'>
                        <div className='flex items-center text-gray-600'>
                          <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                          </svg>
                          Max: {service.maxPerson} people
                        </div>
                      </div>

                      {service.facilities && service.facilities.length > 0 && (
                        <div className='mb-4'>
                          <h4 className='font-semibold text-sm mb-2'>Includes:</h4>
                          <ul className='grid grid-cols-2 gap-2'>
                            {service.facilities.slice(0, 6).map((facility, idx) => (
                              <li key={idx} className='flex items-start text-sm text-gray-600'>
                                <svg className='w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
                                  <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                </svg>
                                {typeof facility === 'string' ? facility : facility.name}
                              </li>
                            ))}
                          </ul>
                          {service.facilities.length > 6 && (
                            <p className='text-xs text-gray-500 mt-2'>+{service.facilities.length - 6} more features</p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setSelectedService(service);
                          setIsBookingModalOpen(true);
                        }}
                        className='block w-full text-center bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition font-semibold'
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className='bg-accent/10 rounded-lg p-12 text-center'>
          <h2 className='font-primary text-[32px] mb-4'>Ready to Place Your Order?</h2>
          <p className='text-gray-600 text-lg mb-6 max-w-[600px] mx-auto'>
            Contact us to discuss your catering needs and get a custom quote for your event
          </p>
          <Link
            to='/contact'
            className='inline-block bg-accent text-white px-8 py-4 rounded-lg hover:bg-accent/90 transition font-semibold text-lg'
          >
            Contact Us for Catering
          </Link>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <BookingModal
          service={selectedService}
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedService(null);
          }}
          bookingDetails={null}
        />
      )}
    </div>
  );
};

export default Catering;
