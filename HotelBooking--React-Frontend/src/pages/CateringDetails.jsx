import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ScrollToTop } from '../components';
import { servicesAPI } from '../services/api';
import { getImageUrl } from '../utils/imageHelpers';
import BookingModal from '../components/BookingModal';
import { FaCheck, FaArrowLeft } from 'react-icons/fa';

const CateringDetails = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    servicesAPI.getById(id)
      .then(res => {
        if (res.success && res.data) setService(res.data);
      })
      .catch(err => console.error('Error fetching catering service:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className='min-h-screen pt-[120px] flex items-center justify-center'>
        <div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent'></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className='min-h-screen pt-[120px] flex items-center justify-center text-center px-4'>
        <div>
          <p className='text-xl text-gray-600 mb-4'>Catering package not found.</p>
          <Link to='/catering' className='text-accent underline'>Back to Catering</Link>
        </div>
      </div>
    );
  }

  // Build gallery: thumbnail first, then gallery images
  const galleryImages = [];
  if (service.images?.thumbnail) galleryImages.push(service.images.thumbnail);
  if (service.images?.gallery?.length > 0) {
    service.images.gallery.forEach(img => {
      if (img !== service.images.thumbnail) galleryImages.push(img);
    });
  }

  const currentImage = galleryImages.length > 0
    ? getImageUrl(galleryImages[selectedImageIndex])
    : null;

  return (
    <section className='min-h-screen pt-[120px] pb-16'>
      <ScrollToTop />

      {/* Hero Banner */}
      <div className='bg-gray-900 h-[280px] flex items-center justify-center text-center'>
        <div className='px-4'>
          <p className='font-tertiary uppercase tracking-[6px] text-[12px] text-gray-300 mb-3'>
            Phokela Guest House
          </p>
          <h1 className='font-primary text-[28px] sm:text-[40px] lg:text-[52px] text-white uppercase tracking-[2px] leading-tight'>
            {service.name}
          </h1>
        </div>
      </div>

      <div className='container mx-auto px-4 py-12'>

        {/* Back link */}
        <Link to='/catering' className='inline-flex items-center gap-2 text-accent hover:underline mb-8'>
          <FaArrowLeft className='text-sm' />
          Back to Catering
        </Link>

        <div className='flex flex-col lg:flex-row lg:gap-x-10'>

          {/* Left — Images & Description */}
          <div className='w-full lg:w-[60%]'>

            {/* Main Image */}
            {currentImage ? (
              <div className='mb-4 rounded-lg overflow-hidden shadow-lg'>
                <img
                  src={currentImage}
                  alt={service.name}
                  className='w-full h-[400px] object-cover'
                />
              </div>
            ) : (
              <div className='mb-4 h-[400px] bg-gray-100 rounded-lg flex items-center justify-center'>
                <p className='text-gray-400'>No image available</p>
              </div>
            )}

            {/* Thumbnail Gallery */}
            {galleryImages.length > 1 && (
              <div className='grid grid-cols-4 md:grid-cols-6 gap-2 mb-8'>
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-video rounded overflow-hidden transition-all ${
                      selectedImageIndex === index
                        ? 'ring-4 ring-accent scale-105'
                        : 'ring-2 ring-gray-200 hover:ring-gray-400'
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`${service.name} - Image ${index + 1}`}
                      className='w-full h-full object-cover'
                    />
                    {index === 0 && (
                      <div className='absolute top-0 right-0 bg-accent text-white text-[8px] px-1 py-0.5'>
                        Main
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <h2 className='font-primary text-[28px] mb-3'>{service.name}</h2>
            <p className='text-gray-600 text-[16px] mb-6'>{service.description}</p>

            {/* What's Included */}
            {service.facilities?.length > 0 && (
              <div className='mt-6'>
                <h3 className='font-primary text-[22px] mb-4'>What's Included</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {service.facilities.map((item, idx) => (
                    <div key={idx} className='flex items-center gap-x-3 bg-white p-3 rounded shadow-sm'>
                      <FaCheck className='text-accent flex-shrink-0' />
                      <span className='text-base'>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Booking Panel */}
          <div className='w-full lg:w-[40%] mt-10 lg:mt-0'>
            <div className='bg-accent/10 rounded-lg p-6 sticky top-[140px]'>
              <h3 className='font-primary text-[26px] mb-2'>{service.name}</h3>

              {service.featured && (
                <span className='inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold mb-4'>
                  ⭐ Featured
                </span>
              )}

              <div className='text-3xl font-bold text-accent mb-1'>R{service.price}</div>
              <div className='text-sm text-gray-600 mb-6'>{service.priceUnit}</div>

              {service.maxPerson && (
                <div className='flex items-center gap-2 text-gray-600 mb-6 text-sm'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                  </svg>
                  Max {service.maxPerson} people
                </div>
              )}

              <button
                onClick={() => setIsBookingModalOpen(true)}
                className='w-full bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition font-semibold text-lg'
              >
                Book Now
              </button>

              <Link
                to='/contact'
                className='block w-full text-center border border-accent text-accent py-3 rounded-lg hover:bg-accent hover:text-white transition font-semibold mt-3'
              >
                Enquire
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          service={service}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          bookingDetails={null}
        />
      )}
    </section>
  );
};

export default CateringDetails;
