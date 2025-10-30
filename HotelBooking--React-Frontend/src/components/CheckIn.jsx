import { BsCalendar } from 'react-icons/bs';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../style/datepicker.css';


const CheckIn = () => {

  const [startDate, setStartDate] = useState(false);

  return (
    <div className='relative flex items-center justify-end h-full min-h-[60px] lg:min-h-[70px]'>

      <div className='absolute z-10 pr-4 lg:pr-8'>
        <div><BsCalendar className='text-accent text-base' /> </div>
      </div>

      <DatePicker
        className='w-full h-full px-4 lg:px-6 py-4 lg:py-0 text-sm lg:text-base'
        selected={startDate}
        placeholderText='Check in'
        onChange={(date) => setStartDate(date)}
      />

    </div>
  );
};

export default CheckIn;
