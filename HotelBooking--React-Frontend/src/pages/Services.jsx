import { ScrollToTop } from '../components';
import { Link } from 'react-router-dom';
import { settingsAPI } from '../services/api';
import images from '../assets';
import { useState, useEffect } from 'react';

const parseJsonList = (json, fallback) => {
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) && p.length > 0 ? p : fallback;
  } catch { return fallback; }
};

const DEFAULT_HIGHLIGHTS = [
  { icon: '⭐', title: 'Professional Service', description: 'Our team of experienced professionals ensures seamless service delivery' },
  { icon: '✅', title: 'Quality Assurance',    description: 'We maintain the highest standards in all our services' },
  { icon: '🔄', title: 'Flexible Options',     description: 'Customizable packages to meet your specific requirements' },
  { icon: '📦', title: 'All-Inclusive',        description: 'Complete solutions from setup to execution and cleanup' },
];

const DEFAULT_WHY = [
  { icon: '🏆', title: 'Quality Guarantee',  desc: 'We maintain the highest standards in all our services to ensure your satisfaction' },
  { icon: '👨‍💼', title: 'Professional Team', desc: 'Our experienced staff is dedicated to providing exceptional service' },
  { icon: '📍', title: 'Prime Location',     desc: 'Conveniently located with easy access and ample parking' },
];

const DEFAULT_BIZ = [
  { title: 'Conference Rooms',   desc: 'Professional venues equipped with modern technology' },
  { title: 'Corporate Events',   desc: 'Complete event hosting for business functions' },
  { title: 'Meeting Facilities', desc: 'Flexible spaces for various meeting formats' },
  { title: 'Catering Services',  desc: 'Professional catering for corporate events' },
];

const DEFAULT_PERSONAL = [
  { title: 'Accommodation',     desc: 'Comfortable rooms and suites for your stay' },
  { title: 'Event Hosting',     desc: 'Perfect venues for weddings, birthdays, and celebrations' },
  { title: 'Special Occasions', desc: 'Customized services for milestone events' },
  { title: 'Catering Solutions', desc: 'Delicious food for all types of celebrations' },
];

const Services = () => {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    settingsAPI.getByGroup('cms_services')
      .then(res => setCms(res.success ? res.data : {}))
      .catch(() => setCms({}));
  }, []);

  const pageHeading  = cms?.page_heading  || 'Our Services';
  const pageSubtitle = cms?.page_subtitle || 'Discover our comprehensive range of services designed to meet your accommodation, conference, catering, and event hosting needs';
  const whyHeading   = cms?.why_choose_heading || 'Why Choose Our Services?';

  const serviceCards = [
    { id: 'accommodation', name: 'Accommodation', description: cms?.accom_desc      || 'Comfortable rooms and suites for your stay',        image: images.PhokelaRoomImg, link: '/accommodation', icon: '🏨' },
    { id: 'conference',    name: 'Conference',    description: cms?.conference_desc  || 'Modern facilities for meetings and conferences',     image: images.PhokelaConferenceImg, link: '/conference',    icon: '🏢' },
    { id: 'catering',      name: 'Catering',      description: cms?.catering_desc    || 'Delicious meals and catering services',              image: images.PhokelaCateringImg,  link: '/catering',      icon: '🍽️' },
    { id: 'events',        name: 'Events',        description: cms?.events_desc      || 'Host memorable events and celebrations',             image: images.Slider3,  link: '/events',        icon: '🎉' },
  ];

  const serviceHighlights = [1, 2, 3, 4].map((n, i) => ({
    icon:        cms?.[`highlight_${n}_icon`]  || DEFAULT_HIGHLIGHTS[i].icon,
    title:       cms?.[`highlight_${n}_title`] || DEFAULT_HIGHLIGHTS[i].title,
    description: cms?.[`highlight_${n}_desc`]  || DEFAULT_HIGHLIGHTS[i].description,
  }));

  const whyBullets    = parseJsonList(cms?.why_choose_bullets, DEFAULT_WHY);
  const bizServices   = parseJsonList(cms?.biz_services,       DEFAULT_BIZ);
  const personalServices = parseJsonList(cms?.personal_services, DEFAULT_PERSONAL);

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
              {pageHeading}
            </h1>
            <p className='text-[20px] max-w-[800px] mx-auto'>
              {pageSubtitle}
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
            {serviceCards.map((service) => (
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
            {[
              { heading: 'Business Services',  items: bizServices },
              { heading: 'Personal Services',  items: personalServices },
            ].map(col => (
              <div key={col.heading} className='bg-gray-50 rounded-lg p-8'>
                <h3 className='font-primary text-[28px] mb-6 text-center text-accent'>{col.heading}</h3>
                <ul className='space-y-4'>
                  {col.items.map((item, i) => (
                    <li key={i} className='flex items-start'>
                      <span className='text-accent mr-3 text-xl'>✓</span>
                      <div>
                        <h4 className='font-semibold'>{item.title}</h4>
                        <p className='text-gray-600'>{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className='mb-16'>
          <h2 className='font-primary text-[35px] text-center mb-12'>{whyHeading}</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {whyBullets.map((b, i) => (
              <div key={i} className='text-center'>
                <div className='bg-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <span className='text-white text-2xl'>{b.icon}</span>
                </div>
                <h3 className='font-semibold text-[20px] mb-3'>{b.title}</h3>
                <p className='text-gray-600'>{b.desc}</p>
              </div>
            ))}
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
              to='/accommodation'
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