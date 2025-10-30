import { AdultsDropdown, CheckIn, CheckOut, KidsDropdown } from '.';
import { useRoomContext } from '../context/RoomContext';


const BookForm = () => {

  const { handleCheck } = useRoomContext();


  return (
    <form className='w-full'>
      <div className='flex flex-col lg:flex-row lg:h-[70px] bg-white rounded-lg overflow-hidden shadow-lg'>

        <div className='flex-1 lg:border-r border-b lg:border-b-0'>
          <CheckIn />
        </div>

        <div className='flex-1 lg:border-r border-b lg:border-b-0'>
          <CheckOut />
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
          onClick={(e) => handleCheck(e)}
        >
          Check Now
        </button>

      </div>
    </form>
  );
};

export default BookForm;
