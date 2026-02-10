import { useState } from 'react';
import { ScrollToTop } from '../components';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Thank you for your inquiry! We will contact you soon.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      service: '',
      message: ''
    });
  };

  return (
    <div className='min-h-screen pt-[100px] sm:pt-[120px] pb-12'>
      <ScrollToTop />

      <div className='container mx-auto px-4'>
        {/* Header Section */}
        <div className='text-center mb-8 sm:mb-12'>
          <h1 className='font-primary text-[28px] sm:text-[35px] lg:text-[45px] mb-4'>Contact Phokela Guest House</h1>
          <p className='text-[16px] sm:text-[18px] text-gray-600 max-w-[600px] mx-auto'>
            Get in touch with us for accommodation, catering, conferences, and event hosting services.
            We're here to make your experience exceptional.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12'>
          {/* Contact Information */}
          <div>
            <h2 className='font-primary text-[22px] sm:text-[26px] lg:text-[30px] mb-6'>Get In Touch</h2>

            <div className='space-y-6'>
              <div className='flex items-start space-x-4'>
                <div className='bg-accent w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-white' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z' clipRule='evenodd' />
                  </svg>
                </div>
                <div>
                  <h3 className='font-semibold text-[18px] mb-1'>Address</h3>
                  <p className='text-gray-600'>108 Cnr VAN RIEBECK & DUDU MADISHA DRIVE</p>
                </div>
              </div>

              <div className='flex items-start space-x-4'>
                <div className='bg-accent w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-white' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z' />
                  </svg>
                </div>
                <div>
                  <h3 className='font-semibold text-[18px] mb-1'>Phone Numbers</h3>
                  <p className='text-gray-600'>083 594 0966</p>
                  <p className='text-gray-600'>076 691 1116</p>
                </div>
              </div>

              <div className='flex items-start space-x-4'>
                <div className='bg-accent w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-white' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
                    <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
                  </svg>
                </div>
                <div>
                  <h3 className='font-semibold text-[18px] mb-1'>Email</h3>
                  <p className='text-gray-600'>admin@phokelaholdings.co.za</p>
                </div>
              </div>

              <div className='flex items-start space-x-4'>
                <div className='bg-accent w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-white' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z' clipRule='evenodd' />
                  </svg>
                </div>
                <div>
                  <h3 className='font-semibold text-[18px] mb-1'>Services</h3>
                  <p className='text-gray-600'>Accommodation • Catering • Conferences • Events</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className='font-primary text-[22px] sm:text-[26px] lg:text-[30px] mb-6'>Send us a Message</h2>

            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-2'>
                  Full Name *
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent'
                  placeholder='Your full name'
                />
              </div>

              <div>
                <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
                  Email Address *
                </label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent'
                  placeholder='your.email@example.com'
                />
              </div>

              <div>
                <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-2'>
                  Phone Number
                </label>
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent'
                  placeholder='083 123 4567'
                />
              </div>

              <div>
                <label htmlFor='service' className='block text-sm font-medium text-gray-700 mb-2'>
                  Service Interest
                </label>
                <select
                  id='service'
                  name='service'
                  value={formData.service}
                  onChange={handleChange}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent'
                >
                  <option value=''>Select a service</option>
                  <option value='accommodation'>Accommodation</option>
                  <option value='catering'>Catering Services</option>
                  <option value='conference'>Conference Facilities</option>
                  <option value='events'>Event Hosting</option>
                  <option value='corporate'>Corporate Packages</option>
                  <option value='other'>Other</option>
                </select>
              </div>

              <div>
                <label htmlFor='message' className='block text-sm font-medium text-gray-700 mb-2'>
                  Message *
                </label>
                <textarea
                  id='message'
                  name='message'
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent resize-none'
                  placeholder='Tell us about your requirements...'
                />
              </div>

              <button
                type='submit'
                className='w-full bg-accent text-white font-semibold py-3 px-6 rounded-lg hover:bg-accent/90 transition duration-300'
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Map Section */}
        <div className='mt-12 lg:mt-16'>
          <h2 className='font-primary text-[22px] sm:text-[26px] lg:text-[30px] mb-6 text-center'>Find Us</h2>
          <div className='rounded-lg overflow-hidden shadow-lg'>
            <iframe
              src="https://maps.google.com/maps?q=108%20Van%20Riebeeck%20St%20Mokopane&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="450"
              className="sm:h-[400px]"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Phokela Guest House Location"
            ></iframe>
          </div>
          </div>
          <p className='text-center text-gray-600 mt-4'>
            Located at 108 Van Riebeeck St, Mokopane - Easy to find and accessible parking available
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;