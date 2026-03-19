import { useState, useRef, useEffect } from 'react';
import { useRoomContext } from '../context/RoomContext';
import { BsChevronDown } from 'react-icons/bs';
import { adultsList } from '../constants/data';

const AdultsDropdown = () => {
  const { adults, setAdults } = useRoomContext();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className='w-full h-full bg-white relative min-h-[60px] lg:min-h-[70px]'>
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className='w-full h-full flex items-center justify-between px-4 lg:px-8 py-4 lg:py-0 text-sm lg:text-base'
      >
        {adults}
        <BsChevronDown
          className={`text-base text-accent-hover transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul className='bg-white absolute w-full flex flex-col z-40 shadow-lg'>
          {adultsList.map(({ name }, idx) => (
            <li
              key={idx}
              onClick={() => {
                setAdults(name);
                setOpen(false);
              }}
              className='border-b last-of-type:border-b-0 h-10 hover:bg-accent hover:text-white w-full flex items-center justify-center cursor-pointer text-sm lg:text-base'
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdultsDropdown;
