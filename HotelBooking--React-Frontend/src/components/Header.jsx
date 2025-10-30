import { useRoomContext } from '../context/RoomContext';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoWhite } from '../assets'; // SVG Logo
import { LogoDark } from '../assets'; // SVG Logo


const Header = () => {

  const { resetRoomFilterData } = useRoomContext();

  const [header, setHeader] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.addEventListener('scroll', () =>
      window.scrollY > 50
        ? setHeader(true)
        : setHeader(false)
    );
  });

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Accommodation', path: '/accommodation' },
    { name: 'Catering', path: '/catering' },
    { name: 'Events', path: '/events' },
    { name: 'Conference', path: '/conference' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <header
      className={`fixed z-50 w-full transition-all duration-300
      ${header ? 'bg-white py-4 shadow-lg' : 'bg-black bg-opacity-70 py-6 backdrop-blur-sm'}`}
    >

      <div className='container mx-auto flex items-center justify-between px-4 lg:px-0'>

        {/* Logo */}
        <Link to="/" onClick={() => {resetRoomFilterData(); closeMobileMenu();}}>
          {
            header
              ? <img className='w-[120px] md:w-[160px]' src={LogoDark} alt="Hotel Logo" />
              : <img className='w-[120px] md:w-[160px] drop-shadow-lg' src={LogoWhite} alt="Hotel Logo" />
          }
        </Link>

        {/* Desktop Nav */}
        <nav className={`${header ? 'text-primary' : 'text-white drop-shadow-lg'}
        hidden lg:flex gap-x-4 lg:gap-x-8 font-tertiary tracking-[3px] text-[15px] items-center uppercase`}>
          {
            navLinks.map(link =>
              <Link to={link.path} className='transition hover:text-accent' key={link.name}>
                {link.name}
              </Link>
            )
          }
        </nav>

        {/* Mobile Menu Button */}
        <button
          className={`lg:hidden p-2 ${header ? 'text-primary' : 'text-white drop-shadow-lg'}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center">
            <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${mobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
            <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
          </div>
        </button>

      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
        mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      } ${header ? 'bg-white border-t border-gray-200' : 'bg-black bg-opacity-95 backdrop-blur-sm'}`}>
        <nav className={`${header ? 'text-primary' : 'text-white'}
        flex flex-col font-tertiary tracking-[2px] text-[14px] uppercase`}>
          {
            navLinks.map(link =>
              <Link
                to={link.path}
                className='transition hover:text-accent py-4 px-4 border-b border-opacity-20 border-current last:border-b-0'
                key={link.name}
                onClick={() => {resetRoomFilterData(); closeMobileMenu();}}
              >
                {link.name}
              </Link>
            )
          }
        </nav>
      </div>

    </header>
  );
};

export default Header;
