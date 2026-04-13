import { ScrollToTop } from '../components';
import { Link } from 'react-router-dom';
import { servicesAPI, settingsAPI } from '../services/api';
import images from '../assets';
import { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/imageHelpers';
import BookingModal from '../components/BookingModal';

const Conference = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [cms, setCms] = useState(null);

  useEffect(() => {
    fetchConferenceServices();
    settingsAPI.getByGroup('cms_conference')
      .then(res => setCms(res.success ? res.data : {}))
      .catch(() => setCms({}));
  }, []);

  const fetchConferenceServices = async () => {
    try {
      const response = await servicesAPI.getByCategory('conference');
      if (response.success && response.data) {
        setServices(response.data);
      }
    } catch (error) {
      console.error('Error fetching conference services:', error);
    } finally {
      setLoading(false);
    }
  };

  const heroTitle       = cms?.hero_title       || 'Professional Conference Facilities';
  const heroDescription = cms?.hero_description || 'Modern meeting spaces equipped with cutting-edge technology';
  const heroBg          = cms?.hero_bg          || images.Slider1;
  const highlights      = [1, 2, 3].map(n => ({
    icon:  cms?.[`highlight_${n}_icon`]  || ['💻', '🏢', '⚡'][n - 1],
    title: cms?.[`highlight_${n}_title`] || ['Modern Technology', 'Flexible Spaces', 'Full Support'][n - 1],
    desc:  cms?.[`highlight_${n}_desc`]  || [
      'Latest AV equipment and high-speed internet connectivity',
      'Adaptable rooms for various meeting formats and sizes',
      'Technical assistance and professional service staff',
    ][n - 1],
  }));
  const packagesHeading = cms?.packages_heading || 'Our Conference Packages';
  const ctaHeading      = cms?.cta_heading      || 'Ready to Book Your Conference?';
  const ctaDescription  = cms?.cta_description  || 'Contact us to discuss your conference needs and get a custom quote for your event';
  const ctaBtnText      = cms?.cta_btn_text      || 'Contact Us for Conference';
  const ctaBtnLink      = cms?.cta_btn_link      || '/contact';

  return (
    <div className='min-h-screen pt-[120px] pb-12'>
      <ScrollToTop />

      {/* Hero Section */}
      {cms !== null && (
        <div className='relative h-[400px] bg-cover bg-center'
             style={{ backgroundImage: `url(${heroBg})` }}>
          <div className='absolute inset-0 bg-black/60'></div>
          <div className='relative z-10 h-full flex items-center justify-center'>
            <div className='text-center text-white'>
              <h1 className='font-primary text-[45px] lg:text-[65px] mb-4'>
                {heroTitle}
              </h1>
              <p className='text-[20px] max-w-[600px] mx-auto'>
                {heroDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className='container mx-auto px-4 py-16'>
        {/* Introduction Section */}
        <div className='text-center mb-16'>
          <h2 className='font-primary text-[35px] mb-6'>Professional Meeting Solutions</h2>
          <p className='text-[18px] text-gray-600 max-w-[800px] mx-auto mb-8'>
            At Phokela Guest House, we offer state-of-the-art conference facilities designed to meet the needs of modern business. Our professional meeting spaces are equipped with the latest technology and supported by our experienced team to ensure your corporate events, training sessions, and workshops are successful.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mt-12'>
            {highlights.map((h, i) => (
              <div key={i} className='text-center'>
                <div className='bg-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <span className='text-white text-2xl'>{h.icon}</span>
                </div>
                <h3 className='font-semibold text-[20px] mb-2'>{h.title}</h3>
                <p className='text-gray-600'>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Conference Services */}
        <div className='mb-16'>
          <h2 className='font-primary text-[35px] text-center mb-12'>{packagesHeading}</h2>

          {loading ? (
            <div className='text-center py-12'>
              <div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent'></div>
              <p className='mt-4 text-gray-600'>Loading conference services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className='text-center py-12 bg-gray-50 rounded-lg'>
              <p className='text-gray-600 text-lg'>No conference services available at the moment.</p>
              <p className='text-gray-500 mt-2'>Please contact us for more information.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {services.map((service) => {
                const thumbnail = service.images?.thumbnail || service.images?.gallery?.[0];

                return (
                  <div key={service.id} className='bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow'>
                    {/* Service Image — clickable */}
                    <Link to={`/conference/${service.id}`}>
                      <div className='h-48 bg-gray-200 overflow-hidden cursor-pointer'>
                        {thumbnail ? (
                          <img
                            src={getImageUrl(thumbnail)}
                            alt={service.name}
                            className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center text-gray-400'>No Image</div>
                        )}
                      </div>
                    </Link>

                    <div className='p-6'>
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex-1'>
                          <Link to={`/conference/${service.id}`}>
                            <h3 className='font-primary text-[24px] mb-2 text-accent hover:underline cursor-pointer'>{service.name}</h3>
                          </Link>
                          {service.featured && (
                            <span className='inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold'>
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                        <div className='text-right'>
                          <div className='text-2xl font-bold text-accent'>R{service.price}</div>
                          <div className='text-sm text-gray-600'>{String(service.priceUnit || 'per day')}</div>
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
                        {service.size > 0 && (
                          <div className='flex items-center text-gray-600'>
                            <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5' />
                            </svg>
                            {service.size}m²
                          </div>
                        )}
                      </div>

                      {service.facilities && Array.isArray(service.facilities) && service.facilities.length > 0 && (
                        <div className='mb-4'>
                          <h4 className='font-semibold text-sm mb-2'>Includes:</h4>
                          <ul className='grid grid-cols-2 gap-2'>
                            {service.facilities.slice(0, 6).map((facility, idx) => (
                              <li key={idx} className='flex items-start text-sm text-gray-600'>
                                <svg className='w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
                                  <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                </svg>
                                {String(facility)}
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
          <h2 className='font-primary text-[32px] mb-4'>{ctaHeading}</h2>
          <p className='text-gray-600 text-lg mb-6 max-w-[600px] mx-auto'>
            {ctaDescription}
          </p>
          <Link
            to={ctaBtnLink}
            className='inline-block bg-accent text-white px-8 py-4 rounded-lg hover:bg-accent/90 transition font-semibold text-lg'
          >
            {ctaBtnText}
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

export default Conference;