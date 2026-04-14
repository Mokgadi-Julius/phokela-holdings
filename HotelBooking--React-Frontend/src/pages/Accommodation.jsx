import { useState, useEffect } from 'react';
import { Rooms, ScrollToTop } from '../components';
import { settingsAPI } from '../services/api';

const Accommodation = () => {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    settingsAPI.getByGroup('cms_accommodation')
      .then(res => setCms(res.success ? res.data : {}))
      .catch(() => setCms({}));
  }, []);

  const title       = cms?.page_heading     || 'Premium Guest Accommodations';
  const subtitle    = cms?.page_subtitle    || 'Comfortable, well-appointed rooms designed for a restful stay.';
  const description = cms?.page_description || '';
  const roomOrder   = cms?.room_order       || null;

  return (
    <div>
      <ScrollToTop />

      {/* Hero banner — shown once CMS has loaded */}
      {cms !== null && (
        <div className='relative bg-gray-900 h-[280px] sm:h-[340px] flex items-center justify-center text-center overflow-hidden'>
          <div className='absolute inset-0 bg-black/60' />
          <div className='relative z-10 px-4'>
            <p className='font-tertiary uppercase tracking-[6px] text-[12px] text-gray-300 mb-3'>
              Phokela Guest House
            </p>
            <h1 className='font-primary text-[28px] sm:text-[40px] lg:text-[52px] text-white uppercase tracking-[2px] leading-tight mb-4'>
              {title}
            </h1>
            <p className='text-[15px] sm:text-[18px] text-gray-300 max-w-[600px] mx-auto'>
              {subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Optional description block */}
      {description && (
        <div className='container mx-auto px-4 py-8 text-center'>
          <p className='text-[16px] lg:text-[18px] text-gray-600 max-w-[700px] mx-auto'>
            {description}
          </p>
        </div>
      )}

      <Rooms roomOrder={roomOrder} sectionHeading='Our Rooms & Accommodation' />
    </div>
  );
};

export default Accommodation;
