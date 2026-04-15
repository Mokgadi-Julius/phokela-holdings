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

      {/* Hero banner */}
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

      {/* Optional description block */}
      {description && (
        <div className='container mx-auto px-4 py-8 text-center'>
          <p className='text-[16px] lg:text-[18px] text-gray-600 max-w-[700px] mx-auto'>
            {description}
          </p>
        </div>
      )}

      {/* Booking & Cancellation Policy */}
      <div className='bg-gray-50 border-y border-gray-200'>
        <div className='container mx-auto px-4 py-10 max-w-4xl'>
          <div className='text-center mb-8'>
            <p className='font-tertiary uppercase tracking-[5px] text-[12px] text-gray-500 mb-2'>Accommodation</p>
            <h2 className='font-primary text-[26px] sm:text-[32px] text-gray-900'>Booking & Cancellation Policy</h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>

            {/* Payment policy */}
            <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0'>
                  <svg className='w-5 h-5 text-amber-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <h3 className='font-semibold text-gray-900 text-[17px]'>Payment Requirements</h3>
              </div>
              <p className='text-gray-600 text-[14px] leading-relaxed'>
                During <span className='font-semibold text-gray-800'>peak holiday periods</span> — including Easter, long weekends,
                mid-December to mid-January, and school holidays —{' '}
                <span className='font-semibold text-gray-800'>full payment is required 30 days prior to arrival.</span>
              </p>
            </div>

            {/* Cancellation policy */}
            <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0'>
                  <svg className='w-5 h-5 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </div>
                <h3 className='font-semibold text-gray-900 text-[17px]'>Cancellation Fees</h3>
              </div>
              <p className='text-[13px] text-gray-500 mb-3'>Charged as a percentage of the total booking value:</p>
              <ul className='space-y-3'>
                <li className='flex items-start gap-3'>
                  <span className='mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 text-[11px] font-bold flex-shrink-0'>25%</span>
                  <span className='text-gray-600 text-[14px]'>Cancelled within <span className='font-semibold text-gray-800'>30 days</span> prior to arrival</span>
                </li>
                <li className='flex items-start gap-3'>
                  <span className='mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-[11px] font-bold flex-shrink-0'>50%</span>
                  <span className='text-gray-600 text-[14px]'>Cancelled <span className='font-semibold text-gray-800'>7 to 2 days</span> prior to arrival</span>
                </li>
                <li className='flex items-start gap-3'>
                  <span className='mt-0.5 inline-flex items-center justify-center w-7 h-6 rounded-full bg-red-100 text-red-700 text-[11px] font-bold flex-shrink-0'>100%</span>
                  <span className='text-gray-600 text-[14px]'>Cancelled <span className='font-semibold text-gray-800'>less than 2 days</span> prior to arrival or <span className='font-semibold text-gray-800'>no-show</span></span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      <Rooms roomOrder={roomOrder} sectionHeading='Our Rooms & Accommodation' />
    </div>
  );
};

export default Accommodation;
