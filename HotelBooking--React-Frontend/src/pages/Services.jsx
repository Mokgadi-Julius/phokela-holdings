import { ScrollToTop } from '../components';
import { Link } from 'react-router-dom';
import images from '../assets';

const Services = () => {
  const services = [
    {
      id: 'accommodation',
      name: 'Accommodation',
      description: 'Comfortable rooms and suites for your stay',
      image: images.Room1Img,
      link: '/accommodation',
      icon: '🏨'
    },
    {
      id: 'conference',
      name: 'Conference',
      description: 'Modern facilities for meetings and conferences',
      image: images.Room3Img,
      link: '/conference',
      icon: '🏢'
    },
    {
      id: 'catering',
      name: 'Catering',
      description: 'Delicious meals and catering services',
      image: images.Slider2,
      link: '/catering',
      icon: '🍽️'
    },
    {
      id: 'events',
      name: 'Events',
      description: 'Host memorable events and celebrations',
      image: images.Slider3,
      link: '/events',
      icon: '🎉'
    }
  ];

  const serviceHighlights = [
    {
      title: 'Professional Service',
      description: 'Our team of experienced professionals ensures seamless service delivery',
      icon: '⭐'
    },
    {
      title: 'Quality Assurance',
      description: 'We maintain the highest standards in all our services',
      icon: '✅'
    },
    {
      title: 'Flexible Options',
      description: 'Customizable packages to meet your specific requirements',
      icon: '🔄'
    },
    {
      title: 'All-Inclusive',
      description: 'Complete solutions from setup to execution and cleanup',
      icon: '📦'
    }
  ];

  return (
    <div className='min-h-screen pt-[120px] pb-12'>
      <ScrollToTop />

      {/* Hero Section */}
      <div className='relative h-[500px] bg-cover bg-center'
           style={{ backgroundImage: `url(${images.Slider1})` }}>
        <div className='absolute inset-0 bg-black/70'></div>
        <div className='relative z-10 h-full flex items-center justify-center'>
          <div className='text-center text-white'>
            <h1 className='font-primary text-[45px] lg:text-[65px] mb-4'>
              Our Services
            </h1>
            <p className='text-[20px] max-w-[800px] mx-auto'>
              Discover our comprehensive range of services designed to meet your accommodation, 
              conference, catering, and event hosting needs
            </p>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-16'>
        {/* Introduction */}
        <div className='text-center mb-16'>
          <h2 className='font-primary text-[35px] mb-6'>Comprehensive Service Solutions</h2>
          <p className='text-[18px] text-gray-600 max-w-[800px] mx-auto'>
            At Phokela Guest House, we offer a complete range of services to accommodate all your needs. 
            Whether you're looking for a comfortable place to stay, a professional conference venue, 
            delicious catering, or an unforgettable event space, we have you covered.
          </p>
        </div>

        {/* Service Highlights */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16'>
          {serviceHighlights.map((highlight, index) => (
            <div key={index} className='text-center bg-white p-6 rounded-lg shadow-md'>
              <div className='text-4xl mb-4'>{highlight.icon}</div>
              <h3 className='font-semibold text-[20px] mb-3'>{highlight.title}</h3>
              <p className='text-gray-600'>{highlight.description}</p>
            </div>
          ))}
        </div>

        {/* Services Grid */}
        <div className='mb-16'>
          <h2 className='font-primary text-[35px] text-center mb-12'>Explore Our Services</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {services.map((service) => (
              <div key={service.id} className='bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300'>
                <div className='relative h-64'>
                  <img
                    src={service.image}
                    alt={service.name}
                    className='w-full h-full object-cover'
                  />
                  <div className='absolute top-4 left-4 bg-accent text-white px-4 py-2 rounded-full text-sm font-semibold'>
                    {service.icon} {service.name}
                  </div>
                </div>
                <div className='p-6'>
                  <h3 className='font-primary text-[24px] mb-3'>{service.name}</h3>
                  <p className='text-gray-600 mb-6'>{service.description}</p>
                  <Link
                    to={service.link}
                    className='w-full bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 transition duration-300 text-center block font-semibold'
                  >
                    Explore {service.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Categories */}
        <div className='mb-16'>
          <h2 className='font-primary text-[35px] text-center mb-12'>Service Categories</h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
            <div className='bg-gray-50 rounded-lg p-8'>
              <h3 className='font-primary text-[28px] mb-6 text-center text-accent'>Business Services</h3>
              <ul className='space-y-4'>
                <li className='flex items-start'>
                  <span className='text-accent mr-3 text-xl'>✓</span>
                  <div>
                    <h4 className='font-semibold'>Conference Rooms</h4>
                    <p className='text-gray-600'>Professional venues equipped with modern technology</p>
                  </div>
                </li>
                <li className='flex items-start'>
                  <span className='text-accent mr-3 text-xl'>✓</span>
                  <div>
                    <h4 className='font-semibold'>Corporate Events</h4>
                    <p className='text-gray-600'>Complete event hosting for business functions</p>
                  </div>
                </li>
                <li className='flex items-start'>
                  <span className='text-accent mr-3 text-xl'>✓</span>
                  <div>
                    <h4 className='font-semibold'>Meeting Facilities</h4>
                    <p className='text-gray-600'>Flexible spaces for various meeting formats</p>
                  </div>
                </li>
                <li className='flex items-start'>
                  <span className='text-accent mr-3 text-xl'>✓</span>
                  <div>
                    <h4 className='font-semibold'>Catering Services</h4>
                    <p className='text-gray-600'>Professional catering for corporate events</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className='bg-gray-50 rounded-lg p-8'>
              <h3 className='font-primary text-[28px] mb-6 text-center text-accent'>Personal Services</h3>
              <ul className='space-y-4'>
                <li className='flex items-start'>
                  <span className='text-accent mr-3 text-xl'>✓</span>
                  <div>
                    <h4 className='font-semibold'>Accommodation</h4>
                    <p className='text-gray-600'>Comfortable rooms and suites for your stay</p>
                  </div>
                </li>
                <li className='flex items-start'>
                  <span className='text-accent mr-3 text-xl'>✓</span>
                  <div>
                    <h4 className='font-semibold'>Event Hosting</h4>
                    <p className='text-gray-600'>Perfect venues for weddings, birthdays, and celebrations</p>
                  </div>
                </li>
                <li className='flex items-start'>
                  <span className='text-accent mr-3 text-xl'>✓</span>
                  <div>
                    <h4 className='font-semibold'>Special Occasions</h4>
                    <p className='text-gray-600'>Customized services for milestone events</p>
                  </div>
                </li>
                <li className='flex items-start'>
                  <span className='text-accent mr-3 text-xl'>✓</span>
                  <div>
                    <h4 className='font-semibold'>Catering Solutions</h4>
                    <p className='text-gray-600'>Delicious food for all types of celebrations</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className='mb-16'>
          <h2 className='font-primary text-[35px] text-center mb-12'>Why Choose Our Services?</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='bg-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-white text-2xl'>🏆</span>
              </div>
              <h3 className='font-semibold text-[20px] mb-3'>Quality Guarantee</h3>
              <p className='text-gray-600'>We maintain the highest standards in all our services to ensure your satisfaction</p>
            </div>
            <div className='text-center'>
              <div className='bg-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-white text-2xl'>👨‍💼</span>
              </div>
              <h3 className='font-semibold text-[20px] mb-3'>Professional Team</h3>
              <p className='text-gray-600'>Our experienced staff is dedicated to providing exceptional service</p>
            </div>
            <div className='text-center'>
              <div className='bg-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-white text-2xl'>📍</span>
              </div>
              <h3 className='font-semibold text-[20px] mb-3'>Prime Location</h3>
              <p className='text-gray-600'>Conveniently located with easy access and ample parking</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className='text-center bg-accent/10 rounded-lg p-12'>
          <h2 className='font-primary text-[35px] mb-6'>Ready to Explore Our Services?</h2>
          <p className='text-gray-600 mb-8 max-w-2xl mx-auto'>
            Browse through our comprehensive range of services and find the perfect solution for your needs. 
            Contact us today to discuss your requirements and get a custom quote.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              to='/contact'
              className='bg-accent text-white px-8 py-3 rounded-lg hover:bg-accent/90 transition duration-300 text-center font-semibold'
            >
              Contact Us
            </Link>
            <Link
              to='/book'
              className='border border-accent text-accent px-8 py-3 rounded-lg hover:bg-accent hover:text-white transition duration-300 text-center font-semibold'
            >
              Book Now
            </Link>
            <a
              href='tel:0835940966'
              className='border border-accent text-accent px-8 py-3 rounded-lg hover:bg-accent hover:text-white transition duration-300 text-center font-semibold'
            >
              Call: 083 594 0966
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;