import { useRoomContext } from '../context/RoomContext';
import { SpinnerDotted } from 'spinners-react';
import { Room } from '.';


const Rooms = () => {

  const { rooms, loading } = useRoomContext();

  return (
    <section className='py-24'>

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
          <h2 className='font-primary text-[28px] sm:text-[35px] lg:text-[45px] mb-4 lg:mb-6'>Our Services & Packages</h2>
          <p className='text-[16px] lg:text-[18px] text-gray-600 max-w-[600px] mx-auto mb-8 px-4 lg:px-0'>
            From comfortable accommodation to professional catering, conference facilities, and memorable events.
            Discover our comprehensive range of services designed to meet all your hospitality needs.
          </p>
        </div>

        <div className='grid grid-cols-1 max-w-sm mx-auto gap-[20px] sm:gap-[30px] md:grid-cols-2 md:max-w-2xl lg:grid-cols-3 lg:max-w-none lg:mx-0'>
          {
            rooms.map(room =>
              <Room key={room.id} room={room} />
            )
          }
        </div>
      </div>

    </section>
  );
};

export default Rooms;
