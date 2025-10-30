import { LogoWhite } from "../assets";

const Footer = () => (
  <footer className='bg-primary py-12'>

    <div className='container mx-auto text-white px-4 lg:px-0'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-8'>

        {/* Logo and Description */}
        <div>
          <a href="/" >
            <img src={LogoWhite} alt="Phokela Guest House Logo" className="w-[160px] mb-4" />
          </a>
          <p className='text-sm text-gray-300 mb-4'>
            Experience excellent hospitality at Phokela Guest House. We provide accommodation,
            catering, conference facilities, and event hosting services with a personal touch.
          </p>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className='font-semibold text-lg mb-4'>Contact Information</h3>
          <div className='space-y-2 text-sm text-gray-300'>
            <p>📍 108 Cnr VAN RIEBECK & DUDU MADISHA DRIVE</p>
            <p>📞 083 594 0966 / 076 691 1116</p>
            <p>✉️ admin@phokelaholdings.co.za</p>
          </div>
        </div>

        {/* Services */}
        <div>
          <h3 className='font-semibold text-lg mb-4'>Our Services</h3>
          <div className='space-y-2 text-sm text-gray-300'>
            <p>🏠 Accommodation</p>
            <p>🍽️ Catering Services</p>
            <p>🏢 Conference Facilities</p>
            <p>🎉 Event Hosting</p>
          </div>
        </div>
      </div>

      <div className='border-t border-gray-600 pt-6 text-center'>
        <p className='text-sm text-gray-300'>
          Copyright &copy; {new Date().getFullYear()} Phokela Guest House. All Rights Reserved.
        </p>
      </div>
    </div>

  </footer>
);

export default Footer;