import { useState } from 'react';
import { AdultsDropdown, KidsDropdown } from '.';
import CheckIn from './CheckIn';
import CheckOut from './CheckOut';
import { useRoomContext } from '../context/RoomContext';

const BookForm = () => {
  const { handleCheck } = useRoomContext();

  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);

  const handleCheckInChange = (date) => {
    setCheckIn(date);
    // Reset checkOut if it's before the new checkIn date
    if (checkOut && date && checkOut <= date) {
      setCheckOut(null);
    }
  };

  return (
    <form className='w-full'>
      <div className='flex flex-col lg:flex-row lg:h-[70px] bg-white rounded-lg overflow-visible shadow-lg'>
        <div className='flex-1 lg:border-r border-b lg:border-b-0'>
          <CheckIn value={checkIn} onChange={handleCheckInChange} />
        </div>

        <div className='flex-1 lg:border-r border-b lg:border-b-0'>
          <CheckOut value={checkOut} onChange={setCheckOut} minDate={checkIn} />
        </div>

        <div className='flex-1 lg:border-r border-b lg:border-b-0'>
          <AdultsDropdown />
        </div>

        <div className='flex-1 lg:border-r border-b lg:border-b-0'>
          <KidsDropdown />
        </div>

        <button
          type='submit'
          className='btn btn-primary h-[60px] lg:h-full lg:flex-1 lg:min-w-[140px]'
          onClick={(e) => handleCheck(e, checkIn, checkOut)}
        >
          Check Now
        </button>
      </div>
    </form>
  );
};

export default BookForm;