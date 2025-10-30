import { AdultsDropdown, CheckIn, CheckOut, KidsDropdown, ScrollToTop } from '../components';
import { useRoomContext } from '../context/RoomContext';
import { guestHouseRules } from '../constants/data';
import { useParams } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa';
import { useState } from 'react';


const RoomDetails = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { id } = useParams(); // id get form url (/room/:id) as string...
  const { rooms } = useRoomContext();

  const room = rooms.find(room => room.id === +id);

  // for (const key in room) {
  //   console.log(key);
  // }

  const { name, description, facilities, amenities, price, imageLg, mainImage, images, capacity, maxPerson, size, beds, type } = room ?? {};

  // Handle both old and new schema
  const roomAmenities = amenities || facilities || [];
  const guestCapacity = capacity || maxPerson || 1;

  // Create gallery array with mainImage first, then other images
  const galleryImages = [];
  if (mainImage) {
    galleryImages.push(mainImage);
  }
  if (images && images.length > 0) {
    // Add other images (excluding mainImage if it's in the array)
    images.forEach(img => {
      if (img !== mainImage) {
        galleryImages.push(img);
      }
    });
  }
  // Fallback to imageLg if no images
  if (galleryImages.length === 0 && imageLg) {
    galleryImages.push(imageLg);
  }

  const roomImage = galleryImages.length > 0
    ? `http://localhost:5000${galleryImages[selectedImageIndex]}`
    : 'https://via.placeholder.com/800x600?text=No+Image';

  return (
    <section>

      <ScrollToTop />

      <div className='bg-room h-[560px] relative flex justify-center items-center bg-cover bg-center'>
        <div className='absolute w-full h-full bg-black/70' />
        <h1 className='text-6xl text-white z-20 font-primary text-center'>{name} Details</h1>
      </div>


      <div className='container mx-auto'>
        <div className='flex flex-col lg:flex-row lg:gap-x-8 h-full py-24'>

          {/* ⬅️⬅️⬅️ left side ⬅️⬅️⬅️ */}
          <div className='w-full lg:w-[60%] h-full text-justify'>

            <h2 className='h2'>{name}</h2>
            <p className='mb-4'>{description}</p>

            {/* Room specs */}
            <div className='flex flex-wrap gap-4 mb-8'>
              {capacity && (
                <div className='flex items-center gap-2 bg-accent/10 px-4 py-2 rounded'>
                  <span className='font-semibold'>Capacity:</span> {guestCapacity} guests
                </div>
              )}
              {size && (
                <div className='flex items-center gap-2 bg-accent/10 px-4 py-2 rounded'>
                  <span className='font-semibold'>Size:</span> {size}m²
                </div>
              )}
              {beds && (
                <div className='flex items-center gap-2 bg-accent/10 px-4 py-2 rounded'>
                  <span className='font-semibold'>Beds:</span> {beds}
                </div>
              )}
              {type && (
                <div className='flex items-center gap-2 bg-accent/10 px-4 py-2 rounded capitalize'>
                  <span className='font-semibold'>Type:</span> {type}
                </div>
              )}
            </div>

            {/* Main Image */}
            <div className='mb-4'>
              <img className='w-full rounded-lg shadow-lg' src={roomImage} alt={name || "Room"} />
            </div>

            {/* Image Gallery Thumbnails */}
            {galleryImages.length > 1 && (
              <div className='mb-8'>
                <div className='grid grid-cols-4 md:grid-cols-6 gap-2'>
                  {galleryImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-video rounded overflow-hidden cursor-pointer transition-all ${
                        selectedImageIndex === index
                          ? 'ring-4 ring-accent scale-105'
                          : 'ring-2 ring-gray-200 hover:ring-gray-400'
                      }`}
                    >
                      <img
                        src={`http://localhost:5000${img}`}
                        alt={`${name} - Image ${index + 1}`}
                        className='w-full h-full object-cover'
                      />
                      {index === 0 && mainImage && (
                        <div className='absolute top-0 right-0 bg-accent text-white text-[8px] px-1 py-0.5'>
                          Main
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className='mt-12'>
              <h3 className='h3 mb-3'>What's Included</h3>
              <p className='mb-12'>At Phokela Guest House, we believe in providing exceptional value and service. Our packages include all the amenities and services you need for a comfortable and memorable experience. Whether you're here for business or leisure, we've got you covered.</p>

              {/* Amenities list */}
              {roomAmenities && roomAmenities.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                  {roomAmenities.map((item, index) => (
                    <div key={index} className='flex items-center gap-x-3 flex-1 bg-white p-3 rounded shadow-sm'>
                      <div className='text-accent'><FaCheck /></div>
                      <div className='text-base'>{typeof item === 'string' ? item : item.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>


          {/* ➡️➡️➡️ right side ➡️➡️➡️ */}
          <div className='w-full lg:w-[40%] h-full'>

            {/* reservation */}
            <div className='py-8 px-6 bg-accent/20 mb-12'>

              <div className='flex flex-col space-y-4 mb-4'>
                <h3>Your Booking</h3>
                <div className='h-[60px]'> <CheckIn /> </div>
                <div className='h-[60px]'> <CheckOut /> </div>
                <div className='h-[60px]'> <AdultsDropdown /> </div>
                <div className='h-[60px]'> <KidsDropdown /> </div>
              </div>

              <button className='btn btn-lg btn-primary w-full'>
                book now for R{price}
              </button>
            </div>

            <div>
              <h3 className='h3'>Guest House Policies</h3>
              <p className='mb-6 text-justify'>
                We strive to provide a comfortable and enjoyable experience for all our guests. Please familiarize yourself with our policies to ensure a pleasant stay at Phokela Guest House.
              </p>

              <ul className='flex flex-col gap-y-4'>
                {
                  guestHouseRules.map(({ rules }, idx) =>
                    <li key={idx} className='flex items-center gap-x-4'>
                      <FaCheck className='text-accent' />
                      {rules}
                    </li>
                  )
                }
              </ul>
            </div>

          </div>

        </div>
      </div>

    </section>
  );
};

export default RoomDetails;
