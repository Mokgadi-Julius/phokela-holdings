import { useRoomContext } from '../context/RoomContext';
import { BsChevronDown } from 'react-icons/bs';
import { adultsList } from '../constants/data';
import { Menu } from '@headlessui/react';


const AdultsDropdown = () => {

  const { adults, setAdults, } = useRoomContext();


  return (
    <Menu as='div' className='w-full h-full bg-white relative min-h-[60px] lg:min-h-[70px]'>

      <Menu.Button className='w-full h-full flex items-center justify-between px-4 lg:px-8 py-4 lg:py-0 text-sm lg:text-base'>
        {adults}
        <BsChevronDown className='text-base text-accent-hover' />
      </Menu.Button>

      <Menu.Items as='ul' className='bg-white absolute w-full flex flex-col z-40 shadow-lg'>
        {
          adultsList.map(({ name }, idx) =>
            <Menu.Item
              as='li'
              key={idx}
              onClick={() => setAdults(name)}
              className='border-b last-of-type:border-b-0 h-10 hover:bg-accent hover:text-white w-full flex items-center justify-center cursor-pointer text-sm lg:text-base'
            >
              {name}
            </Menu.Item>
          )
        }
      </Menu.Items>

    </Menu>
  );
};

export default AdultsDropdown;
