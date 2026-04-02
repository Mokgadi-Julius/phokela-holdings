import { useState, useEffect } from 'react';
import { BookForm, HeroSlider, Rooms, ScrollToTop } from '../components';
import { settingsAPI } from '../services/api';

const Home = () => {
  const [bookingTitle, setBookingTitle] = useState('');

  useEffect(() => {
    settingsAPI.getByGroup('cms_home')
      .then(res => {
        if (res.success && res.data?.booking_form_title) {
          setBookingTitle(res.data.booking_form_title);
        }
      })
      .catch(() => { /* keep empty — title is optional */ });
  }, []);

  return (
    <div>
      <ScrollToTop />

      <HeroSlider />

      <div className='container mx-auto relative'>

        <div className='bg-accent/20 mt-4 p-4 lg:absolute lg:left-0 lg:right-0 lg:p-0 lg:-top-12 lg:z-30 lg:shadow-xl'>
          {bookingTitle && (
            <p className='font-tertiary uppercase tracking-[4px] text-sm text-center pt-3 pb-1 px-4 lg:px-6 text-gray-700'>
              {bookingTitle}
            </p>
          )}
          <BookForm />
        </div>

      </div>

      <Rooms />
    </div>
  );
};

export default Home;
