import { BsCalendar } from 'react-icons/bs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../style/datepicker.css';

const CheckIn = ({ value, onChange }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className='relative flex items-center justify-end h-full min-h-[60px] lg:min-h-[70px]'>
      <div className='absolute z-10 pr-4 lg:pr-8'>
        <div><BsCalendar className='text-accent text-base' /></div>
      </div>

      <DatePicker
        className='w-full h-full px-4 lg:px-6 py-4 lg:py-0 text-sm lg:text-base'
        selected={value}
        placeholderText='Check in'
        onChange={onChange}
        minDate={today}
        dateFormat='dd/MM/yyyy'
      />
    </div>
  );
};

export default CheckIn;