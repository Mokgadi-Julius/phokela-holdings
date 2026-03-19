import { useRoomContext } from '../context/RoomContext';
import { SpinnerDotted } from 'spinners-react';
import { Room } from '.';


const Rooms = () => {

  const { rooms, loading, filtered, resetRoomFilterData } = useRoomContext();

  return (
    <section id='rooms-section' className='py-24'>

      {
        // overlay & spinner effect 
        loading &&
        <div className='h-screen w-full fixed bottom-0 top-0 bg-black/80 z-50 grid place-items-center'>
          <SpinnerDotted />
        </div>
      }


      <div className='container mx-auto px-4 lg:px-0'>

        <div className='text-center'>
          <p className='font-tertiary uppercase text-[13px] sm:text-[15px] tracking-[4px] sm:tracking-[6px]'>Phokela Guest House</p>
          <h2 className='font-primary text-[28px] sm:text-[35px] lg:text-[45px] mb-4 lg:mb-6'>Our Services &amp; Packages</h2>
          <p className='text-[16px] lg:text-[18px] text-gray-600 max-w-[600px] mx-auto mb-8 px-4 lg:px-0'>
            From comfortable accommodation to professional catering, conference facilities, and memorable events.
            Discover our comprehensive range of services designed to meet all your hospitality needs.
          </p>
        </div>

        {/* Filter active banner */}
        {filtered && (
          <div className='flex items-center justify-between bg-accent/10 border border-accent rounded-lg px-4 py-3 mb-6 max-w-xl mx-auto'>
            <span className='text-sm text-accent font-medium'>
              🔍 Showing filtered results ({rooms.length} found)
            </span>
            <button
              onClick={resetRoomFilterData}
              className='text-sm text-white bg-accent hover:bg-accent-hover px-3 py-1 rounded-md transition-colors duration-200'
            >
              Clear filter
            </button>
          </div>
        )}

        <div className='grid grid-cols-1 max-w-sm mx-auto gap-[20px] sm:gap-[30px] md:grid-cols-2 md:max-w-2xl lg:grid-cols-3 lg:max-w-none lg:mx-0'>
          {
            rooms.length > 0
              ? rooms.map(room =>
                  <Room key={room.id} room={room} />
                )
              : filtered && (
                  <div className='col-span-3 text-center py-16'>
                    <p className='text-xl text-gray-500 mb-4'>No rooms match your criteria.</p>
                    <button
                      onClick={resetRoomFilterData}
                      className='btn btn-primary'
                    >
                      Show all rooms
                    </button>
                  </div>
                )
          }
        </div>
      </div>

    </section>
  );
};

export default Rooms;
