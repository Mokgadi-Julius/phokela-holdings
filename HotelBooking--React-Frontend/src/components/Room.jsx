import { BsArrowsFullscreen, BsPeople } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { getMainImageUrl } from '../utils/imageHelpers';

const Room = ({ room }) => {

  const { id, name, mainImage, images, capacity, maxPerson, description, price } = room ?? {};

  // Prioritize mainImage, then first image from array, or use placeholder
  const imageUrl = getMainImageUrl(mainImage, images) || 'https://placehold.co/400x300?text=No+Image';

  // Use capacity if available, fallback to maxPerson for backward compatibility
  const guestCapacity = capacity || maxPerson || 1;

  return (
    <div className='bg-white shadow-2xl min-h-[500px] group rounded-lg overflow-hidden'>

      <div className='overflow-hidden'>
        <img src={imageUrl} alt={name || "Room"} className='group-hover:scale-110 transition-all duration-300 w-full h-[200px] sm:h-[250px] object-cover' />
      </div>

      <div className='bg-white shadow-lg max-w-[280px] sm:max-w-[300px] mx-auto h-[60px] -translate-y-1/2 flex justify-center items-center uppercase font-tertiary tracking-[1px] font-semibold text-sm sm:text-base'>

        <div className='flex justify-center w-[85%] sm:w-[80%]'>

          <div className='flex items-center gap-x-1 sm:gap-x-2'>
            <div className='text-accent'>
              <BsPeople className='text-[15px] sm:text-[18px]' />
            </div>
            <div className='flex gap-x-1 text-xs sm:text-sm'>
              <div>Max people</div>
              <div>{guestCapacity}</div>
            </div>
          </div>

        </div>

      </div>

      {/* name and description */}
      <div className='text-center px-4'>
        <Link to={`/room/${id}`}>
          <h3 className="h3 text-lg sm:text-xl lg:text-2xl">{name}</h3>
        </Link>

        <p className='max-w-[300px] mx-auto mb-3 lg:mb-6 text-sm sm:text-base'>{description?.slice(0, 56)}..</p>
      </div>

      {/* button */}
      <Link
        to={`/room/${id}`}
        className="btn btn-secondary btn-sm max-w-[240px] mx-auto duration-300 mb-6"
      >
        Book now from R{price}
      </Link>

    </div>
  );

};

export default Room;
