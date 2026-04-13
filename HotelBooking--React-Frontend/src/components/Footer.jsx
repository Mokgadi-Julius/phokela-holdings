import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogoWhite } from "../assets";
import { settingsAPI } from '../services/api';

const parseJsonList = (json, fallback) => {
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) && p.length > 0 ? p : fallback;
  } catch { return fallback; }
};

const DEFAULT_FOOTER_LINKS = [
  { label: 'Accommodation', href: '/accommodation' },
  { label: 'Catering',      href: '/catering' },
  { label: 'Events',        href: '/events' },
  { label: 'Conference',    href: '/conference' },
  { label: 'Contact',       href: '/contact' },
];

const SOCIAL_ICONS = {
  social_facebook:  { icon: '📘', label: 'Facebook' },
  social_instagram: { icon: '📷', label: 'Instagram' },
  social_twitter:   { icon: '🐦', label: 'X (Twitter)' },
  social_tiktok:    { icon: '🎵', label: 'TikTok' },
};

const Footer = () => {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    settingsAPI.getByGroup('cms_general')
      .then(res => setCms(res.success ? res.data : {}))
      .catch(() => setCms({}));
  }, []);

  const siteName    = cms?.site_name       || 'Phokela Guest House';
  const logoSrc     = cms?.logo_light      || LogoWhite;
  const tagline     = cms?.footer_tagline  || 'Experience excellent hospitality at Phokela Guest House. We provide accommodation, catering, conference facilities, and event hosting services with a personal touch.';
  const copyright   = cms?.footer_copyright || `${siteName}. All Rights Reserved.`;
  const address     = cms?.address         || '108 Cnr VAN RIEBECK & DUDU MADISHA DRIVE';
  const phone1      = cms?.phone_1         || '083 594 0966';
  const phone2      = cms?.phone_2         || '';
  const email       = cms?.email           || 'admin@phokelaholdings.co.za';
  const footerLinks = parseJsonList(cms?.footer_links, DEFAULT_FOOTER_LINKS);
  const socials     = Object.entries(SOCIAL_ICONS)
    .filter(([key]) => cms?.[key])
    .map(([key, meta]) => ({ ...meta, url: cms[key] }));

  return (
    <footer className='bg-primary py-12'>
      <div className='container mx-auto text-white px-4 lg:px-0'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-8'>

          {/* Logo, tagline, social links */}
          <div>
            <Link to="/">
              <img src={logoSrc} alt={`${siteName} Logo`} className="w-[160px] mb-4" />
            </Link>
            <p className='text-sm text-gray-300 mb-4'>{tagline}</p>
            {socials.length > 0 && (
              <div className='flex gap-3 mt-2'>
                {socials.map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" title={s.label}
                     className='text-xl hover:opacity-75 transition-opacity'>
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className='font-semibold text-lg mb-4'>Contact Information</h3>
            <div className='space-y-2 text-sm text-gray-300'>
              <p>📍 {address}</p>
              <p>📞 {[phone1, phone2].filter(Boolean).join(' / ')}</p>
              <p>✉️ {email}</p>
            </div>
          </div>

          {/* Footer nav links */}
          <div>
            <h3 className='font-semibold text-lg mb-4'>Quick Links</h3>
            <div className='space-y-2 text-sm text-gray-300'>
              {footerLinks.map((link, i) => (
                <p key={i}>
                  <Link to={link.href} className='hover:text-accent transition-colors'>
                    {link.label}
                  </Link>
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className='border-t border-gray-600 pt-6 text-center'>
          <p className='text-sm text-gray-300'>
            Copyright &copy; {new Date().getFullYear()} {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;