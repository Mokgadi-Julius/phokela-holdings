import { useState, useEffect, useRef } from 'react';
import { settingsAPI, uploadsAPI, roomsAPI } from '../../services/api';
import { sliderData } from '../../constants/data';

// ─── Default slide data — bg is taken from the bundled sliderData assets so
// saved slides always have a real image URL and Swiper can initialize correctly
const DEFAULT_SLIDES = sliderData.map((s, i) => ({
  id: String(s.id),
  title: s.title,
  subheading: [
    'Professional catering, comfortable accommodation, modern conference facilities, and memorable events at the heart of hospitality.',
    'Experience world-class hospitality with our range of comfortable rooms and event spaces.',
    'From intimate gatherings to large corporate events — we handle everything.',
  ][i] || '',
  bg: s.bg,
  btnNext: s.btnNext,
  link: s.link,
}));

// ─── CMS Schema ──────────────────────────────────────────────────────────────
const CMS_TABS = [
  {
    id: 'general',
    label: 'General',
    group: 'cms_general',
    icon: '🏢',
    description: 'Site-wide brand, logos, contact details, footer, social links, and SEO defaults.',
    hasLogos: true,
    hasFooterLinks: true,
    footerLinksDefault: [
      { label: 'Accommodation', href: '/accommodation' },
      { label: 'Catering',      href: '/catering' },
      { label: 'Events',        href: '/events' },
      { label: 'Conference',    href: '/conference' },
      { label: 'Contact',       href: '/contact' },
    ],
    hasSocialLinks: true,
    fields: [
      // CM-38 brand
      { key: 'site_name',          label: 'Business Name',         type: 'text',     default: 'Phokela Guest House' },
      { key: 'site_tagline',       label: 'Tagline',               type: 'text',     default: 'Experience Excellence in Hospitality' },
      // CM-41 WhatsApp
      { key: 'whatsapp_number',    label: 'WhatsApp Number',       type: 'tel',      default: '0835940966' },
      // CM-32/33/34 contact (read by Contact page)
      { key: 'address',            label: 'Physical Address',      type: 'text',     default: '108 Cnr VAN RIEBECK & DUDU MADISHA DRIVE' },
      { key: 'phone_1',            label: 'Phone Number 1',        type: 'tel',      default: '083 594 0966' },
      { key: 'phone_2',            label: 'Phone Number 2',        type: 'tel',      default: '076 691 1116' },
      { key: 'email',              label: 'Email Address',         type: 'email',    default: 'admin@phokelaholdings.co.za' },
      // CM-40 footer text
      { key: 'footer_tagline',     label: 'Footer Tagline',        type: 'textarea', default: 'Experience excellent hospitality at Phokela Guest House. We provide accommodation, catering, conference facilities, and event hosting services with a personal touch.' },
      { key: 'footer_copyright',   label: 'Footer Copyright Text', type: 'text',     default: 'Phokela Guest House. All Rights Reserved.' },
      // CM-42 social links
      { key: 'social_facebook',    label: 'Facebook URL',          type: 'text',     default: '' },
      { key: 'social_instagram',   label: 'Instagram URL',         type: 'text',     default: '' },
      { key: 'social_twitter',     label: 'X (Twitter) URL',       type: 'text',     default: '' },
      { key: 'social_tiktok',      label: 'TikTok URL',            type: 'text',     default: '' },
      // CM-43 SEO
      { key: 'seo_title',          label: 'SEO Meta Title',        type: 'text',     default: 'Phokela Guest House - Accommodation, Catering, Conferences & Events' },
      { key: 'seo_description',    label: 'SEO Meta Description',  type: 'textarea', default: 'Phokela Guest House offers premium accommodation, professional catering, modern conference facilities, and memorable event hosting. Located at Van Riebeck & Dudu Madisha Drive.' },
      { key: 'seo_keywords',       label: 'SEO Keywords',          type: 'text',     default: 'guest house, accommodation, catering, conferences, events, Van Riebeck, Dudu Madisha Drive, hospitality' },
    ],
  },
  {
    id: 'home',
    label: 'Home',
    group: 'cms_home',
    icon: '🏠',
    description: 'Hero slider, booking form title, and services section on the home page.',
    hasSlides: true,
    slidesDefault: DEFAULT_SLIDES,
    fields: [
      { key: 'booking_form_title',    label: 'Booking Form Title',           type: 'text',     default: 'Check Availability' },
      { key: 'services_heading',      label: 'Services Section Heading',     type: 'text',     default: 'Our Services & Packages' },
      { key: 'services_description',  label: 'Services Section Description', type: 'textarea', default: 'From comfortable accommodation to professional catering, conference facilities, and memorable events. Discover our comprehensive range of services designed to meet all your hospitality needs.' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    group: 'cms_contact',
    icon: '📞',
    description: 'Contact page text, map, services list, and form options. Address, phone, and email are managed in the General tab.',
    hasContactLists: true,
    contactServicesDefault: ['Accommodation', 'Catering', 'Conferences', 'Events'],
    formServiceOptionsDefault: [
      { value: 'accommodation', label: 'Accommodation' },
      { value: 'catering',      label: 'Catering Services' },
      { value: 'conference',    label: 'Conference Facilities' },
      { value: 'events',        label: 'Event Hosting' },
      { value: 'corporate',     label: 'Corporate Packages' },
      { value: 'other',         label: 'Other' },
    ],
    fields: [
      { key: 'page_heading',    label: 'Page Heading',     type: 'text',     default: 'Contact Phokela Guest House' },
      { key: 'page_subtitle',   label: 'Page Subtitle',    type: 'textarea', default: "Get in touch with us for accommodation, catering, conferences, and event hosting services. We're here to make your experience exceptional." },
      { key: 'hours_weekday',   label: 'Weekday Hours',    type: 'text',     default: 'Mon–Fri: 7:00 AM – 9:00 PM' },
      { key: 'hours_weekend',   label: 'Weekend Hours',    type: 'text',     default: 'Sat–Sun: 8:00 AM – 8:00 PM' },
      { key: 'maps_embed_url',  label: 'Google Maps Embed URL', type: 'text', default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3584.8995959631353!2d28.0376!3d-26.2041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e950c0b8c0b8c0b%3A0x1e950c0b8c0b8c0b!2sVan%20Riebeck%20Ave%20%26%20Dudu%20Madisha%20Dr%2C%20Johannesburg%2C%20South%20Africa!5e0!3m2!1sen!2sza!4v1640995200000!5m2!1sen!2sza' },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    group: 'cms_services',
    icon: '🏨',
    description: 'Hero, highlight cards, Why Choose Us bullets, and service category lists on the Services page.',
    hasHighlightCards: true,
    highlightCount: 4,
    highlightCardDefaults: [
      { icon: '⭐', title: 'Professional Service', desc: 'Our team of experienced professionals ensures seamless service delivery' },
      { icon: '✅', title: 'Quality Assurance',    desc: 'We maintain the highest standards in all our services' },
      { icon: '🔄', title: 'Flexible Options',     desc: 'Customizable packages to meet your specific requirements' },
      { icon: '📦', title: 'All-Inclusive',        desc: 'Complete solutions from setup to execution and cleanup' },
    ],
    hasWhyChoose: true,
    whyChooseDefault: [
      { icon: '🏆', title: 'Quality Guarantee',  desc: 'We maintain the highest standards in all our services to ensure your satisfaction' },
      { icon: '👨‍💼', title: 'Professional Team', desc: 'Our experienced staff is dedicated to providing exceptional service' },
      { icon: '📍', title: 'Prime Location',     desc: 'Conveniently located with easy access and ample parking' },
    ],
    hasBizPersonalServices: true,
    bizServicesDefault: [
      { title: 'Conference Rooms',    desc: 'Professional venues equipped with modern technology' },
      { title: 'Corporate Events',    desc: 'Complete event hosting for business functions' },
      { title: 'Meeting Facilities',  desc: 'Flexible spaces for various meeting formats' },
      { title: 'Catering Services',   desc: 'Professional catering for corporate events' },
    ],
    personalServicesDefault: [
      { title: 'Accommodation',    desc: 'Comfortable rooms and suites for your stay' },
      { title: 'Event Hosting',    desc: 'Perfect venues for weddings, birthdays, and celebrations' },
      { title: 'Special Occasions', desc: 'Customized services for milestone events' },
      { title: 'Catering Solutions', desc: 'Delicious food for all types of celebrations' },
    ],
    fields: [
      { key: 'page_heading',    label: 'Page Heading (Hero Title)',    type: 'text',     default: 'Our Services' },
      { key: 'page_subtitle',   label: 'Page Subtitle (Hero)',         type: 'textarea', default: 'Discover our comprehensive range of services designed to meet your accommodation, conference, catering, and event hosting needs' },
      { key: 'accom_desc',      label: 'Accommodation Card Desc',      type: 'textarea', default: 'Comfortable rooms and suites for your stay' },
      { key: 'conference_desc', label: 'Conference Card Desc',         type: 'textarea', default: 'Modern facilities for meetings and conferences' },
      { key: 'catering_desc',   label: 'Catering Card Desc',           type: 'textarea', default: 'Delicious meals and catering services' },
      { key: 'events_desc',     label: 'Events Card Desc',             type: 'textarea', default: 'Host memorable events and celebrations' },
      { key: 'why_choose_heading',        label: 'Why Choose Us — Heading',         type: 'text',     default: 'Why Choose Our Services?' },
      // Venue Hire Policy
      { key: 'policy_section_heading',    label: 'Policy Section — Heading',        type: 'text',     default: 'Conference & Event Venue Hire' },
      { key: 'policy_intro',              label: 'Policy Section — Intro Text',     type: 'textarea', default: 'Conference, meeting room, and event bookings are handled through a personalised inquiry process — not an online checkout. Contact us to discuss your needs, and we will prepare a custom contract before any deposit is taken.' },
      { key: 'venue1_name',               label: 'Venue 1 — Name',                  type: 'text',     default: 'Meeting Room' },
      { key: 'venue1_capacity',           label: 'Venue 1 — Capacity',              type: 'text',     default: '2 – 30 people' },
      { key: 'venue1_price',              label: 'Venue 1 — Price',                 type: 'text',     default: 'R3,500' },
      { key: 'venue1_price_label',        label: 'Venue 1 — Price Label',           type: 'text',     default: 'Venue only (baseline price)' },
      { key: 'venue1_description',        label: 'Venue 1 — Description',           type: 'textarea', default: 'Final amount confirmed in your contract based on chosen package and extras (catering, equipment, etc.).' },
      { key: 'venue2_name',               label: 'Venue 2 — Name',                  type: 'text',     default: 'Conference' },
      { key: 'venue2_capacity',           label: 'Venue 2 — Capacity',              type: 'text',     default: '30 – 50 people · Indoor or Outdoor' },
      { key: 'venue2_price',              label: 'Venue 2 — Price',                 type: 'text',     default: 'R5,500' },
      { key: 'venue2_price_label',        label: 'Venue 2 — Price Label',           type: 'text',     default: 'Venue only (baseline price)' },
      { key: 'venue2_description',        label: 'Venue 2 — Description',           type: 'textarea', default: 'Final amount confirmed in your contract based on chosen package and extras (catering, equipment, décor, etc.).' },
      { key: 'policy_steps_heading',      label: 'Booking Steps — Heading',         type: 'text',     default: 'How the booking process works' },
      { key: 'policy_step_1',             label: 'Booking Step 1',                  type: 'textarea', default: 'Contact us via WhatsApp or email with your date, headcount, and requirements' },
      { key: 'policy_step_2',             label: 'Booking Step 2',                  type: 'textarea', default: 'We prepare a custom quote based on your chosen package (venue only, venue + catering, full service, etc.)' },
      { key: 'policy_step_3',             label: 'Booking Step 3',                  type: 'textarea', default: 'A contract — customised per booking — must be signed by both parties before anything is confirmed' },
      { key: 'policy_step_4',             label: 'Booking Step 4',                  type: 'textarea', default: 'Deposit amount and payment terms are set out in the signed contract' },
    ],
  },
  {
    id: 'accommodation',
    label: 'Accommodation',
    group: 'cms_accommodation',
    icon: '🛏️',
    description: 'Hero banner, description text, and room display order on the Accommodation page.',
    hasRoomOrder: true,
    fields: [
      { key: 'page_heading',          label: 'Hero Title',                        type: 'text',     default: 'Our Rooms & Accommodation' },
      { key: 'page_subtitle',         label: 'Hero Subtitle',                     type: 'text',     default: 'Comfortable, well-appointed rooms designed for a restful stay.' },
      { key: 'page_description',      label: 'Page Description',                  type: 'textarea', default: 'Discover our range of thoughtfully furnished rooms, each designed to provide comfort and relaxation. Whether you\'re visiting for business or leisure, we have the perfect room for you.' },
      // Booking & Cancellation Policy
      { key: 'policy_payment_title',   label: 'Payment Policy — Card Title',       type: 'text',     default: 'Payment Requirements' },
      { key: 'policy_payment_text',    label: 'Payment Policy — Body Text',        type: 'textarea', default: 'During peak holiday periods — including Easter, long weekends, mid-December to mid-January, and school holidays — full payment is required 30 days prior to arrival.' },
      { key: 'policy_cancel_title',    label: 'Cancellation Policy — Card Title',  type: 'text',     default: 'Cancellation Fees' },
      { key: 'policy_cancel_subtitle', label: 'Cancellation Policy — Subtitle',    type: 'text',     default: 'Charged as a percentage of the total booking value:' },
      { key: 'policy_cancel_25',       label: 'Cancellation — 25% Tier Text',      type: 'text',     default: 'Cancelled within 30 days prior to arrival' },
      { key: 'policy_cancel_50',       label: 'Cancellation — 50% Tier Text',      type: 'text',     default: 'Cancelled 7 to 2 days prior to arrival' },
      { key: 'policy_cancel_100',      label: 'Cancellation — 100% Tier Text',     type: 'text',     default: 'Cancelled less than 2 days prior to arrival or no-show' },
    ],
  },
  {
    id: 'catering',
    label: 'Catering',
    group: 'cms_catering',
    icon: '🍽️',
    description: 'Hero section, highlight cards, packages heading, and call-to-action on the Catering page.',
    hasHeroBg: true,
    heroBgDefault: '',
    hasHighlightCards: true,
    highlightCardDefaults: [
      { icon: '👨‍🍳', title: 'Expert Chefs',      desc: 'Experienced culinary professionals passionate about great food' },
      { icon: '🥬',   title: 'Fresh Ingredients', desc: 'Locally-sourced, fresh ingredients for the best flavor and quality' },
      { icon: '🍽️',  title: 'Custom Menus',      desc: 'Tailored menu options to suit your preferences and dietary needs' },
    ],
    fields: [
      { key: 'hero_title',               label: 'Hero Title',                      type: 'text',     default: 'Professional Catering Services' },
      { key: 'hero_description',         label: 'Hero Description',                type: 'textarea', default: 'Delicious, fresh meals prepared with love for your special occasions' },
      { key: 'packages_heading',         label: 'Packages Section Heading',        type: 'text',     default: 'Our Catering Packages' },
      { key: 'cta_heading',              label: 'CTA Heading',                     type: 'text',     default: 'Ready to Place Your Order?' },
      { key: 'cta_description',          label: 'CTA Description',                 type: 'textarea', default: 'Contact us to discuss your catering needs and get a custom quote for your event' },
      { key: 'cta_btn_text',             label: 'CTA Button Text',                 type: 'text',     default: 'Contact Us for Catering' },
      { key: 'cta_btn_link',             label: 'CTA Button Link',                 type: 'text',     default: '/contact' },
      // Venue Pricing & Booking Policy
      { key: 'policy_section_heading',   label: 'Policy Section — Heading',        type: 'text',     default: 'Venue Options & Pricing' },
      { key: 'policy_intro',             label: 'Policy Section — Intro Text',     type: 'textarea', default: 'All catering bookings are handled through a personalised inquiry process — not an online checkout. Contact us via WhatsApp or email to discuss your requirements, and we will prepare a custom contract before any deposit is taken.' },
      { key: 'venue1_name',              label: 'Venue 1 — Name',                  type: 'text',     default: 'Meeting Room' },
      { key: 'venue1_capacity',          label: 'Venue 1 — Capacity',              type: 'text',     default: '2 – 30 people' },
      { key: 'venue1_price',             label: 'Venue 1 — Price',                 type: 'text',     default: 'R3,500' },
      { key: 'venue1_price_label',       label: 'Venue 1 — Price Label',           type: 'text',     default: 'Venue only (baseline price)' },
      { key: 'venue1_description',       label: 'Venue 1 — Description',           type: 'textarea', default: 'Catering can be added to this venue. The final contract amount is confirmed based on your chosen menu, headcount, and any additional services selected.' },
      { key: 'venue2_name',              label: 'Venue 2 — Name',                  type: 'text',     default: 'Conference / Event Venue' },
      { key: 'venue2_capacity',          label: 'Venue 2 — Capacity',              type: 'text',     default: '30 – 50 people · Indoor or Outdoor' },
      { key: 'venue2_price',             label: 'Venue 2 — Price',                 type: 'text',     default: 'R5,500' },
      { key: 'venue2_price_label',       label: 'Venue 2 — Price Label',           type: 'text',     default: 'Venue only (baseline price)' },
      { key: 'venue2_description',       label: 'Venue 2 — Description',           type: 'textarea', default: 'Full catering service available for this venue. The final contract amount varies based on your menu, number of guests, and package chosen.' },
      { key: 'policy_packages_summary',  label: 'Packages Summary Text',           type: 'textarea', default: 'Available packages: venue + catering · full service (venue + equipment + catering) · catering only · event catering without décor' },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    group: 'cms_events',
    icon: '🎉',
    description: 'Hero section, highlight cards, packages heading, and call-to-action on the Events page.',
    hasHeroBg: true,
    heroBgDefault: '',
    hasHighlightCards: true,
    highlightCardDefaults: [
      { icon: '🎯', title: 'Expert Planning',  desc: 'Professional event coordinators to handle every detail' },
      { icon: '🏛️', title: 'Beautiful Venues', desc: 'Elegant indoor and outdoor spaces for any occasion' },
      { icon: '⭐',  title: 'Full Service',     desc: 'From setup to cleanup, we handle everything' },
    ],
    fields: [
      { key: 'hero_title',       label: 'Hero Title',               type: 'text',     default: 'Memorable Event Hosting' },
      { key: 'hero_description', label: 'Hero Description',         type: 'textarea', default: 'Creating unforgettable moments for your special occasions' },
      { key: 'packages_heading', label: 'Packages Section Heading', type: 'text',     default: 'Our Event Packages' },
      { key: 'cta_heading',      label: 'CTA Heading',              type: 'text',     default: 'Ready to Plan Your Event?' },
      { key: 'cta_description',  label: 'CTA Description',          type: 'textarea', default: 'Contact us to discuss your event needs and get a custom quote for your celebration' },
      { key: 'cta_btn_text',             label: 'CTA Button Text',                 type: 'text',     default: 'Contact Us for Events' },
      { key: 'cta_btn_link',             label: 'CTA Button Link',                 type: 'text',     default: '/contact' },
      // Venue Pricing & Booking Policy
      { key: 'policy_section_heading',   label: 'Policy Section — Heading',        type: 'text',     default: 'Venue Options & Pricing' },
      { key: 'policy_intro',             label: 'Policy Section — Intro Text',     type: 'textarea', default: 'All event bookings are handled through a personalised inquiry process — not an online checkout. Contact us via WhatsApp or email to discuss your requirements, and we will prepare a custom contract before any deposit is taken.' },
      { key: 'venue1_name',              label: 'Venue 1 — Name',                  type: 'text',     default: 'Meeting Room' },
      { key: 'venue1_capacity',          label: 'Venue 1 — Capacity',              type: 'text',     default: '2 – 30 people' },
      { key: 'venue1_price',             label: 'Venue 1 — Price',                 type: 'text',     default: 'R3,500' },
      { key: 'venue1_price_label',       label: 'Venue 1 — Price Label',           type: 'text',     default: 'Venue only (baseline price)' },
      { key: 'venue1_description',       label: 'Venue 1 — Description',           type: 'textarea', default: 'Events and catering can be added to this venue. The final contract amount is confirmed based on your chosen package, headcount, and any additional services selected.' },
      { key: 'venue2_name',              label: 'Venue 2 — Name',                  type: 'text',     default: 'Event Venue' },
      { key: 'venue2_capacity',          label: 'Venue 2 — Capacity',              type: 'text',     default: '30 – 50 people · Indoor or Outdoor' },
      { key: 'venue2_price',             label: 'Venue 2 — Price',                 type: 'text',     default: 'R5,500' },
      { key: 'venue2_price_label',       label: 'Venue 2 — Price Label',           type: 'text',     default: 'Venue only (baseline price)' },
      { key: 'venue2_description',       label: 'Venue 2 — Description',           type: 'textarea', default: 'Full event hosting service available for this venue. The final contract amount varies based on your event type, number of guests, and package chosen.' },
      { key: 'policy_packages_summary',  label: 'Packages Summary Text',           type: 'textarea', default: 'Available packages: venue only · venue + catering · full service (venue + equipment + catering + décor) · event hosting without décor' },
    ],
  },
  {
    id: 'conference',
    label: 'Conference',
    group: 'cms_conference',
    icon: '🏢',
    description: 'Hero section, highlight cards, packages heading, and call-to-action on the Conference page.',
    hasHeroBg: true,
    heroBgDefault: '',
    hasHighlightCards: true,
    highlightCardDefaults: [
      { icon: '💻', title: 'Modern Technology', desc: 'Latest AV equipment and high-speed internet connectivity' },
      { icon: '🏢', title: 'Flexible Spaces',   desc: 'Adaptable rooms for various meeting formats and sizes' },
      { icon: '⚡',  title: 'Full Support',      desc: 'Technical assistance and professional service staff' },
    ],
    fields: [
      { key: 'hero_title',       label: 'Hero Title',               type: 'text',     default: 'Professional Conference Facilities' },
      { key: 'hero_description', label: 'Hero Description',         type: 'textarea', default: 'Modern meeting spaces equipped with cutting-edge technology' },
      { key: 'packages_heading', label: 'Packages Section Heading', type: 'text',     default: 'Our Conference Packages' },
      { key: 'cta_heading',      label: 'CTA Heading',              type: 'text',     default: 'Ready to Book Your Conference?' },
      { key: 'cta_description',  label: 'CTA Description',          type: 'textarea', default: 'Contact us to discuss your conference needs and get a custom quote for your event' },
      { key: 'cta_btn_text',             label: 'CTA Button Text',                 type: 'text',     default: 'Contact Us for Conference' },
      { key: 'cta_btn_link',             label: 'CTA Button Link',                 type: 'text',     default: '/contact' },
      // Venue Pricing & Booking Policy
      { key: 'policy_section_heading',   label: 'Policy Section — Heading',        type: 'text',     default: 'Venue Options & Pricing' },
      { key: 'policy_intro',             label: 'Policy Section — Intro Text',     type: 'textarea', default: 'All conference and meeting bookings are handled through a personalised inquiry process — not an online checkout. Contact us via WhatsApp or email to discuss your requirements, and we will prepare a custom contract before any deposit is taken.' },
      { key: 'venue1_name',              label: 'Venue 1 — Name',                  type: 'text',     default: 'Meeting Room' },
      { key: 'venue1_capacity',          label: 'Venue 1 — Capacity',              type: 'text',     default: '2 – 30 people' },
      { key: 'venue1_price',             label: 'Venue 1 — Price',                 type: 'text',     default: 'R3,500' },
      { key: 'venue1_price_label',       label: 'Venue 1 — Price Label',           type: 'text',     default: 'Venue only (baseline price)' },
      { key: 'venue1_description',       label: 'Venue 1 — Description',           type: 'textarea', default: 'Catering and AV equipment can be added to this venue. The final contract amount is confirmed based on your chosen package, headcount, and any additional services selected.' },
      { key: 'venue2_name',              label: 'Venue 2 — Name',                  type: 'text',     default: 'Conference Venue' },
      { key: 'venue2_capacity',          label: 'Venue 2 — Capacity',              type: 'text',     default: '30 – 50 people · Indoor or Outdoor' },
      { key: 'venue2_price',             label: 'Venue 2 — Price',                 type: 'text',     default: 'R5,500' },
      { key: 'venue2_price_label',       label: 'Venue 2 — Price Label',           type: 'text',     default: 'Venue only (baseline price)' },
      { key: 'venue2_description',       label: 'Venue 2 — Description',           type: 'textarea', default: 'Full conference facilities available for this venue. The final contract amount varies based on your chosen package, number of delegates, and extras (catering, AV, décor, etc.).' },
      { key: 'policy_packages_summary',  label: 'Packages Summary Text',           type: 'textarea', default: 'Available packages: venue only · venue + catering · full service (venue + AV equipment + catering) · conference without catering' },
    ],
  },
];

const buildDefaults = () =>
  Object.fromEntries(
    CMS_TABS.map(tab => [
      tab.id,
      {
        ...Object.fromEntries(tab.fields.map(f => [f.key, f.default])),
        ...(tab.hasSlides ? { home_slides: JSON.stringify(tab.slidesDefault) } : {}),
        ...(tab.hasLogos ? { logo_light: '', logo_dark: '' } : {}),
        ...(tab.hasFooterLinks ? { footer_links: JSON.stringify(tab.footerLinksDefault) } : {}),
        ...(tab.hasHeroBg ? { hero_bg: tab.heroBgDefault || '' } : {}),
        ...(tab.hasHighlightCards ? Object.fromEntries(
          tab.highlightCardDefaults.flatMap((c, i) => [
            [`highlight_${i + 1}_icon`,  c.icon],
            [`highlight_${i + 1}_title`, c.title],
            [`highlight_${i + 1}_desc`,  c.desc],
          ])
        ) : {}),
        ...(tab.hasWhyChoose ? { why_choose_bullets: JSON.stringify(tab.whyChooseDefault) } : {}),
        ...(tab.hasBizPersonalServices ? {
          biz_services:      JSON.stringify(tab.bizServicesDefault),
          personal_services: JSON.stringify(tab.personalServicesDefault),
        } : {}),
        ...(tab.hasContactLists ? {
          contact_services:       JSON.stringify(tab.contactServicesDefault),
          form_service_options:   JSON.stringify(tab.formServiceOptionsDefault),
        } : {}),
      },
    ])
  );

const parseSlides = (json, fallback) => {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
};

// ─── Slides Editor (CM-07, CM-08) ────────────────────────────────────────────
const SlidesEditor = ({ slidesJson, defaultSlides, onChange }) => {
  const slides = parseSlides(slidesJson, defaultSlides);
  const [uploading, setUploading] = useState(null); // index being uploaded
  const [uploadError, setUploadError] = useState(null);
  const dragIndex = useRef(null);
  const fileInputRefs = useRef({});

  const emit = (newSlides) => onChange(JSON.stringify(newSlides));

  const updateSlide = (i, field, val) => {
    const next = slides.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    emit(next);
  };

  const addSlide = () => {
    const newSlide = { id: Date.now().toString(), title: '', subheading: '', bg: '', btnNext: '', link: '/' };
    emit([...slides, newSlide]);
  };

  const removeSlide = (i) => {
    if (slides.length <= 1) return;
    emit(slides.filter((_, idx) => idx !== i));
  };

  const handleImageUpload = async (i, file) => {
    if (!file) return;
    setUploading(i);
    setUploadError(null);
    try {
      const res = await uploadsAPI.uploadSingle(file);
      if (res.success) updateSlide(i, 'bg', res.data.url);
      else setUploadError(`Slide ${i + 1}: ${res.message || 'Upload failed'}`);
    } catch (err) {
      setUploadError(`Slide ${i + 1}: ${err.message || 'Upload failed'}`);
    } finally {
      setUploading(null);
    }
  };

  // ── Drag-reorder ──────────────────────────────────────────────────────────
  const handleDragStart = (i) => { dragIndex.current = i; };

  const handleDrop = (i) => {
    const from = dragIndex.current;
    if (from === null || from === i) return;
    const next = [...slides];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIndex.current = null;
    emit(next);
  };

  const inputCls = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hero Slides</h3>
        <button
          type="button"
          onClick={addSlide}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          + Add Slide
        </button>
      </div>

      {uploadError && (
        <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{uploadError}</p>
      )}

      <div className="space-y-4">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Slide header bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-b border-gray-200">
              {/* Drag handle */}
              <span
                className="cursor-grab text-gray-400 hover:text-gray-600 select-none text-lg leading-none"
                title="Drag to reorder"
              >
                ⠿
              </span>
              <span className="text-xs font-semibold text-gray-600 flex-1">Slide {i + 1}</span>
              <button
                type="button"
                onClick={() => removeSlide(i)}
                disabled={slides.length <= 1}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-0.5 rounded hover:bg-red-50"
              >
                Remove
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image upload (CM-07) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Background Image</label>
                <div className="flex items-center gap-3">
                  {/* Preview */}
                  <div
                    className="w-24 h-14 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => fileInputRefs.current[i]?.click()}
                    title="Click to upload"
                  >
                    {uploading === i ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                    ) : slide.bg ? (
                      <img src={slide.bg} alt="slide bg" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-gray-300">🖼</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={el => fileInputRefs.current[i] = el}
                      onChange={e => handleImageUpload(i, e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[i]?.click()}
                      disabled={uploading === i}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {uploading === i ? 'Uploading…' : slide.bg ? 'Replace Image' : 'Upload Image'}
                    </button>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · max 5 MB</p>
                    {/* URL fallback */}
                    <input
                      type="text"
                      value={slide.bg || ''}
                      onChange={e => updateSlide(i, 'bg', e.target.value)}
                      className="mt-1.5 w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 bg-white"
                      placeholder="…or paste an image URL"
                    />
                  </div>
                </div>
              </div>

              {/* Heading (CM-08) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Heading *</label>
                <input
                  type="text"
                  value={slide.title || ''}
                  onChange={e => updateSlide(i, 'title', e.target.value)}
                  className={inputCls}
                  placeholder="Slide heading text"
                />
              </div>

              {/* Subheading (CM-08) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Subheading</label>
                <textarea
                  rows={2}
                  value={slide.subheading || ''}
                  onChange={e => updateSlide(i, 'subheading', e.target.value)}
                  className={inputCls}
                  placeholder="Short description below the heading"
                />
              </div>

              {/* Button text */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Button Text</label>
                <input
                  type="text"
                  value={slide.btnNext || ''}
                  onChange={e => updateSlide(i, 'btnNext', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Book Now"
                />
              </div>

              {/* Button link */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Button Link</label>
                <input
                  type="text"
                  value={slide.link || ''}
                  onChange={e => updateSlide(i, 'link', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. /accommodation"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
        <span>⠿</span> Drag the handle on each slide to reorder
      </p>
    </div>
  );
};

// ─── Room Order Editor (CM-14) ────────────────────────────────────────────────
const RoomOrderEditor = ({ orderJson, rooms, onChange }) => {
  const dragIndex = useRef(null);

  // Parse saved order (array of room IDs). Merge with live rooms so new rooms
  // always appear at the end even if not yet in the saved order.
  const orderedRooms = (() => {
    let ids = [];
    try { ids = JSON.parse(orderJson || '[]'); } catch { ids = []; }
    const ordered = ids.map(id => rooms.find(r => r.id === id)).filter(Boolean);
    const unsorted = rooms.filter(r => !ids.includes(r.id));
    return [...ordered, ...unsorted];
  })();

  const emit = (list) => onChange(JSON.stringify(list.map(r => r.id)));

  const handleDragStart = (i) => { dragIndex.current = i; };

  const handleDrop = (i) => {
    const from = dragIndex.current;
    if (from === null || from === i) return;
    const next = [...orderedRooms];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIndex.current = null;
    emit(next);
  };

  if (!rooms.length) {
    return (
      <div className="p-6 pt-0">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Room Display Order</h3>
        <p className="text-sm text-gray-400 italic">No rooms found. Add rooms in the Rooms page first.</p>
      </div>
    );
  }

  return (
    <div className="p-6 pt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Room Display Order</h3>
      <p className="text-xs text-gray-400 mb-3">Drag to reorder how rooms appear on the Accommodation page.</p>
      <div className="space-y-1.5">
        {orderedRooms.map((room, i) => (
          <div
            key={room.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-grab hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <span className="text-gray-400 select-none text-base leading-none">⠿</span>
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            {(room.mainImage || room.images?.[0]) && (
              <img
                src={room.mainImage || room.images[0]}
                alt=""
                className="w-8 h-8 rounded object-cover shrink-0 border border-gray-200"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{room.name}</p>
              {room.type && <p className="text-[10px] text-gray-400 capitalize">{room.type} · R{room.price}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Logo Upload Editor (CM-39) ──────────────────────────────────────────────
const LogoUploadEditor = ({ lightUrl, darkUrl, onChangeLight, onChangeDark }) => {
  const [uploading, setUploading] = useState(null); // 'light' | 'dark'
  const [uploadError, setUploadError] = useState(null);
  const lightRef = useRef(null);
  const darkRef  = useRef(null);

  const handleUpload = async (variant, file) => {
    if (!file) return;
    setUploading(variant);
    setUploadError(null);
    try {
      const res = await uploadsAPI.uploadSingle(file);
      if (res.success) {
        variant === 'light' ? onChangeLight(res.data.url) : onChangeDark(res.data.url);
      } else {
        setUploadError(res.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const LogoSlot = ({ label, url, variant, fileRef, onChange }) => (
    <div className="flex-1">
      <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>
      <div
        className={`h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors mb-2 ${variant === 'light' ? 'bg-gray-800' : 'bg-white'}`}
        onClick={() => fileRef.current?.click()}
        title="Click to upload"
      >
        {uploading === variant ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
        ) : url ? (
          <img src={url} alt={label} className="max-h-full max-w-full object-contain p-2" />
        ) : (
          <span className="text-2xl text-gray-400">🖼</span>
        )}
      </div>
      <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={e => handleUpload(variant, e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading === variant}
        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors mb-1.5"
      >
        {uploading === variant ? 'Uploading…' : url ? 'Replace' : 'Upload'}
      </button>
      <input
        type="text"
        value={url || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 bg-white"
        placeholder="…or paste URL"
      />
    </div>
  );

  return (
    <div className="p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Logo Images</h3>
      <p className="text-xs text-gray-400 mb-4">Light logo is shown on dark/transparent backgrounds; Dark logo on white headers.</p>
      {uploadError && (
        <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{uploadError}</p>
      )}
      <div className="flex gap-4">
        <LogoSlot label="Light Logo (on dark bg)" url={lightUrl} variant="light" fileRef={lightRef} onChange={onChangeLight} />
        <LogoSlot label="Dark Logo (on white bg)"  url={darkUrl}  variant="dark"  fileRef={darkRef}  onChange={onChangeDark} />
      </div>
    </div>
  );
};

// ─── Footer Links Editor (CM-40) ─────────────────────────────────────────────
const FooterLinksEditor = ({ linksJson, defaultLinks, onChange }) => {
  const links = parseJsonList(linksJson, defaultLinks);
  const emit = (list) => onChange(JSON.stringify(list));
  const dragIndex = useRef(null);
  const inputCls = 'flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';

  const updateLink = (i, field, val) => emit(links.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  const addLink    = () => emit([...links, { label: '', href: '/' }]);
  const removeLink = (i) => { if (links.length > 1) emit(links.filter((_, idx) => idx !== i)); };

  const handleDragStart = (i) => { dragIndex.current = i; };
  const handleDrop = (i) => {
    const from = dragIndex.current;
    if (from === null || from === i) return;
    const next = [...links];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIndex.current = null;
    emit(next);
  };

  return (
    <div className="p-6 pt-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Footer Navigation Links</h3>
        <button
          type="button"
          onClick={addLink}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          + Add Link
        </button>
      </div>
      <div className="space-y-2">
        {links.map((link, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className="flex items-center gap-2"
          >
            <span className="cursor-grab text-gray-400 text-base leading-none select-none">⠿</span>
            <input type="text" value={link.label || ''} onChange={e => updateLink(i, 'label', e.target.value)} className={inputCls} placeholder="Link label" />
            <input type="text" value={link.href  || ''} onChange={e => updateLink(i, 'href',  e.target.value)} className="w-36 shrink-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono" placeholder="/path" />
            <button
              type="button"
              onClick={() => removeLink(i)}
              disabled={links.length <= 1}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 px-1.5 py-1 rounded hover:bg-red-50"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400 flex items-center gap-1"><span>⠿</span> Drag to reorder</p>
    </div>
  );
};

// ─── Hero Background Image Editor (CM-15) ────────────────────────────────────
const HeroBgEditor = ({ bgUrl, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const res = await uploadsAPI.uploadSingle(file);
      if (res.success) onChange(res.data.url);
      else setUploadError(res.message || 'Upload failed');
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Hero Background Image</h3>
      {uploadError && (
        <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{uploadError}</p>
      )}
      <div className="flex items-start gap-4">
        <div
          className="w-32 h-20 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => fileRef.current?.click()}
          title="Click to upload"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
          ) : bgUrl ? (
            <img src={bgUrl} alt="hero bg" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl text-gray-300">🖼</span>
          )}
        </div>
        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileRef}
            onChange={e => handleUpload(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading…' : bgUrl ? 'Replace Image' : 'Upload Image'}
          </button>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · max 5 MB</p>
          <input
            type="text"
            value={bgUrl || ''}
            onChange={e => onChange(e.target.value)}
            className="mt-1.5 w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 bg-white"
            placeholder="…or paste an image URL"
          />
        </div>
      </div>
    </div>
  );
};

// ─── Highlight Cards Editor (CM-16, CM-28) ───────────────────────────────────
const HighlightCardsEditor = ({ values, onChange, count = 3 }) => {
  const cardInputCls = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';

  return (
    <div className="p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">Highlight Cards</h3>
      <div className="space-y-4">
        {Array.from({ length: count }, (_, i) => i + 1).map(n => (
          <div key={n} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">Card {n}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Icon (emoji)</label>
                <input
                  type="text"
                  value={values[`highlight_${n}_icon`] || ''}
                  onChange={e => onChange(`highlight_${n}_icon`, e.target.value)}
                  className={cardInputCls}
                  placeholder="e.g. 👨‍🍳"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
                <input
                  type="text"
                  value={values[`highlight_${n}_title`] || ''}
                  onChange={e => onChange(`highlight_${n}_title`, e.target.value)}
                  className={cardInputCls}
                  placeholder="Card title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={values[`highlight_${n}_desc`] || ''}
                  onChange={e => onChange(`highlight_${n}_desc`, e.target.value)}
                  className={cardInputCls}
                  placeholder="Short description"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Why Choose Us Editor (CM-29) ────────────────────────────────────────────
const parseJsonList = (json, fallback) => {
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p : fallback;
  } catch { return fallback; }
};

const WhyChooseEditor = ({ bulletsJson, defaultBullets, onChange }) => {
  const bullets = parseJsonList(bulletsJson, defaultBullets);
  const emit = (list) => onChange(JSON.stringify(list));
  const dragIndex = useRef(null);
  const inputCls = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';

  const updateItem = (i, field, val) => {
    emit(bullets.map((b, idx) => idx === i ? { ...b, [field]: val } : b));
  };
  const addItem = () => emit([...bullets, { icon: '✓', title: '', desc: '' }]);
  const removeItem = (i) => { if (bullets.length > 1) emit(bullets.filter((_, idx) => idx !== i)); };

  const handleDragStart = (i) => { dragIndex.current = i; };
  const handleDrop = (i) => {
    const from = dragIndex.current;
    if (from === null || from === i) return;
    const next = [...bullets];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIndex.current = null;
    emit(next);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Why Choose Us — Bullet Points</h3>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          + Add Item
        </button>
      </div>
      <div className="space-y-3">
        {bullets.map((b, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className="bg-gray-50 border border-gray-200 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="cursor-grab text-gray-400 text-base leading-none select-none">⠿</span>
              <span className="text-xs font-semibold text-gray-500 flex-1">Item {i + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                disabled={bullets.length <= 1}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 px-2 py-0.5 rounded hover:bg-red-50"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Icon (emoji)</label>
                <input type="text" value={b.icon || ''} onChange={e => updateItem(i, 'icon', e.target.value)} className={inputCls} placeholder="e.g. 🏆" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input type="text" value={b.title || ''} onChange={e => updateItem(i, 'title', e.target.value)} className={inputCls} placeholder="Item title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea rows={2} value={b.desc || ''} onChange={e => updateItem(i, 'desc', e.target.value)} className={inputCls} placeholder="Short description" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400 flex items-center gap-1"><span>⠿</span> Drag to reorder</p>
    </div>
  );
};

// ─── Service Item List Editor (CM-30, CM-31) ──────────────────────────────────
const ServiceItemListEditor = ({ label, listJson, defaultList, onChange }) => {
  const items = parseJsonList(listJson, defaultList);
  const emit = (list) => onChange(JSON.stringify(list));
  const dragIndex = useRef(null);
  const inputCls = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';

  const updateItem = (i, field, val) => {
    emit(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };
  const addItem = () => emit([...items, { title: '', desc: '' }]);
  const removeItem = (i) => { if (items.length > 1) emit(items.filter((_, idx) => idx !== i)); };

  const handleDragStart = (i) => { dragIndex.current = i; };
  const handleDrop = (i) => {
    const from = dragIndex.current;
    if (from === null || from === i) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIndex.current = null;
    emit(next);
  };

  return (
    <div className="p-6 pt-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</h3>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          + Add Item
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5"
          >
            <span className="cursor-grab text-gray-400 text-base leading-none select-none mt-1">⠿</span>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input type="text" value={item.title || ''} onChange={e => updateItem(i, 'title', e.target.value)} className={inputCls} placeholder="Item title" />
              <input type="text" value={item.desc || ''} onChange={e => updateItem(i, 'desc', e.target.value)} className={inputCls} placeholder="Short description" />
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              disabled={items.length <= 1}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 px-1.5 py-0.5 rounded hover:bg-red-50 mt-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400 flex items-center gap-1"><span>⠿</span> Drag to reorder</p>
    </div>
  );
};

// ─── Simple String List Editor (CM-36) ───────────────────────────────────────
const StringListEditor = ({ label, hint, listJson, defaultList, onChange }) => {
  const items = parseJsonList(listJson, defaultList);
  const emit = (list) => onChange(JSON.stringify(list));
  const dragIndex = useRef(null);
  const inputCls = 'flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';

  const updateItem = (i, val) => emit(items.map((item, idx) => idx === i ? val : item));
  const addItem    = () => emit([...items, '']);
  const removeItem = (i) => { if (items.length > 1) emit(items.filter((_, idx) => idx !== i)); };

  const handleDragStart = (i) => { dragIndex.current = i; };
  const handleDrop = (i) => {
    const from = dragIndex.current;
    if (from === null || from === i) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIndex.current = null;
    emit(next);
  };

  return (
    <div className="p-6 pt-0">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</h3>
          {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className="flex items-center gap-2"
          >
            <span className="cursor-grab text-gray-400 text-base leading-none select-none">⠿</span>
            <input
              type="text"
              value={item}
              onChange={e => updateItem(i, e.target.value)}
              className={inputCls}
              placeholder="Item text"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              disabled={items.length <= 1}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 px-1.5 py-1 rounded hover:bg-red-50"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400 flex items-center gap-1"><span>⠿</span> Drag to reorder</p>
    </div>
  );
};

// ─── Form Service Options Editor (CM-37) ─────────────────────────────────────
const FormServiceOptionsEditor = ({ listJson, defaultList, onChange }) => {
  const items = parseJsonList(listJson, defaultList);
  const emit = (list) => onChange(JSON.stringify(list));
  const dragIndex = useRef(null);
  const inputCls = 'flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';

  const updateItem = (i, field, val) => emit(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const addItem    = () => emit([...items, { value: '', label: '' }]);
  const removeItem = (i) => { if (items.length > 1) emit(items.filter((_, idx) => idx !== i)); };

  const handleDragStart = (i) => { dragIndex.current = i; };
  const handleDrop = (i) => {
    const from = dragIndex.current;
    if (from === null || from === i) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIndex.current = null;
    emit(next);
  };

  return (
    <div className="p-6 pt-0">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Contact Form — Service Dropdown Options</h3>
          <p className="text-xs text-gray-400 mt-0.5">Label is shown to the user; Value is stored on submission.</p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className="flex items-center gap-2"
          >
            <span className="cursor-grab text-gray-400 text-base leading-none select-none">⠿</span>
            <input
              type="text"
              value={item.label || ''}
              onChange={e => updateItem(i, 'label', e.target.value)}
              className={inputCls}
              placeholder="Label (shown to user)"
            />
            <input
              type="text"
              value={item.value || ''}
              onChange={e => updateItem(i, 'value', e.target.value)}
              className={`w-32 shrink-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono`}
              placeholder="value"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              disabled={items.length <= 1}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 px-1.5 py-1 rounded hover:bg-red-50"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400 flex items-center gap-1"><span>⠿</span> Drag to reorder</p>
    </div>
  );
};

// ─── Preview Components ───────────────────────────────────────────────────────

// Thin browser chrome wrapper used by every preview
const BrowserFrame = ({ label = 'phokela.co.za', children }) => (
  <div className="rounded-xl overflow-hidden border border-gray-300 shadow-lg bg-white">
    {/* browser bar */}
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200">
      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
      <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
      <span className="flex-1 text-center text-[10px] text-gray-400 bg-white rounded px-2 py-0.5 border border-gray-200 truncate">
        {label}
      </span>
    </div>
    {children}
  </div>
);

// ── General preview ───────────────────────────────────────────────────────────
const GeneralPreview = ({ v }) => {
  const footerLinks = parseJsonList(v.footer_links, []);
  const socials = [
    { key: 'social_facebook',  icon: '📘', label: 'Facebook' },
    { key: 'social_instagram', icon: '📷', label: 'Instagram' },
    { key: 'social_twitter',   icon: '🐦', label: 'X' },
    { key: 'social_tiktok',    icon: '🎵', label: 'TikTok' },
  ].filter(s => v[s.key]);

  return (
    <BrowserFrame label="phokela.co.za — site info">
      {/* mock nav bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-100">
        {v.logo_dark
          ? <img src={v.logo_dark} alt="logo" className="h-5 object-contain" />
          : <span className="text-[11px] font-bold text-gray-800 tracking-wide">{v.site_name || 'Phokela Guest House'}</span>
        }
        <div className="flex gap-2">
          {['Home','Rooms','Services','Contact'].map(l => (
            <span key={l} className="text-[8px] text-gray-500">{l}</span>
          ))}
        </div>
      </div>

      {/* contact + tagline */}
      <div className="p-3 space-y-2">
        {v.site_tagline && (
          <p className="text-[9px] italic text-gray-500 text-center border-b border-gray-100 pb-2">{v.site_tagline}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded p-2 space-y-0.5">
            <p className="text-[8px] font-semibold uppercase text-gray-400">Address</p>
            <p className="text-[8px] text-gray-600">{v.address}</p>
          </div>
          <div className="bg-gray-50 rounded p-2 space-y-0.5">
            <p className="text-[8px] font-semibold uppercase text-gray-400">Contact</p>
            <p className="text-[8px] text-gray-600">{v.phone_1}</p>
            {v.phone_2 && <p className="text-[8px] text-gray-600">{v.phone_2}</p>}
            <p className="text-[8px] text-blue-500 truncate">{v.email}</p>
            {v.whatsapp_number && <p className="text-[8px] text-green-600">WA: {v.whatsapp_number}</p>}
          </div>
        </div>

        {/* SEO preview */}
        {(v.seo_title || v.seo_description) && (
          <div className="bg-blue-50 rounded p-2 border border-blue-100">
            <p className="text-[8px] font-semibold text-gray-400 uppercase mb-0.5">SEO</p>
            {v.seo_title && <p className="text-[8px] text-blue-700 font-medium truncate">{v.seo_title}</p>}
            {v.seo_description && <p className="text-[7px] text-gray-500 line-clamp-2 mt-0.5">{v.seo_description}</p>}
          </div>
        )}
      </div>

      {/* Footer mock */}
      <div className="bg-gray-800 px-3 py-3">
        <div className="flex items-start gap-2 mb-2">
          {v.logo_light
            ? <img src={v.logo_light} alt="logo" className="h-5 object-contain shrink-0" />
            : <span className="text-[9px] font-bold text-white">{v.site_name}</span>
          }
          {v.footer_tagline && (
            <p className="text-[7px] text-gray-400 line-clamp-2">{v.footer_tagline}</p>
          )}
        </div>
        {footerLinks.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-2">
            {footerLinks.map((l, i) => (
              <span key={i} className="text-[7px] text-gray-400 hover:text-white">{l.label}</span>
            ))}
          </div>
        )}
        {socials.length > 0 && (
          <div className="flex gap-2 mb-2">
            {socials.map(s => (
              <span key={s.key} className="text-[10px]" title={s.label}>{s.icon}</span>
            ))}
          </div>
        )}
        <p className="text-[7px] text-gray-500 border-t border-gray-700 pt-1.5">
          © {new Date().getFullYear()} {v.footer_copyright || `${v.site_name}. All Rights Reserved.`}
        </p>
      </div>
    </BrowserFrame>
  );
};

// ── Hero slide thumbnail — one per slide ─────────────────────────────────────
const HeroSlidePreview = ({ slide, index }) => (
  <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '16/7' }}>
    {slide.bg
      ? <img src={slide.bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      : <div className="absolute inset-0 bg-gray-700" />
    }
    <div className="absolute inset-0 bg-black/70" />

    {/* Slide number badge */}
    <span className="absolute top-1.5 left-1.5 z-10 bg-black/50 text-white text-[7px] font-semibold px-1.5 py-0.5 rounded">
      Slide {index + 1}
    </span>

    <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
      <p className="uppercase tracking-[4px] text-[6px] mb-1.5 text-gray-300">Experience Excellence</p>
      <h1 className="uppercase font-bold text-[10px] leading-tight max-w-[200px] mb-1.5">
        {slide.title || <span className="italic text-gray-400">No heading</span>}
      </h1>
      {slide.subheading && (
        <p className="text-[7px] text-gray-300 max-w-[180px] mb-2 line-clamp-2">{slide.subheading}</p>
      )}
      {slide.btnNext && (
        <span className="px-2 py-0.5 bg-amber-500 text-black text-[7px] font-bold rounded">
          {slide.btnNext}
        </span>
      )}
    </div>
  </div>
);

// ── Home preview ──────────────────────────────────────────────────────────────
const HomePreview = ({ v }) => {
  const slides = parseSlides(v.home_slides, DEFAULT_SLIDES);

  return (
    <BrowserFrame label="phokela.co.za">
      {/* ── All slides stacked ── */}
      <div className="divide-y divide-gray-700 bg-gray-900">
        {slides.map((slide, i) => (
          <HeroSlidePreview key={slide.id || i} slide={slide} index={i} />
        ))}
      </div>

      {/* ── Booking bar ── */}
      <div className="bg-amber-50 border-y border-amber-200 px-3 py-2 flex items-center gap-2">
        {v.booking_form_title && (
          <span className="text-[8px] uppercase tracking-widest text-gray-500 shrink-0">{v.booking_form_title}</span>
        )}
        <div className="flex flex-1 gap-1">
          {['Check-in','Check-out','Adults','Kids'].map(p => (
            <div key={p} className="flex-1 bg-white border border-gray-200 rounded px-1.5 py-1">
              <p className="text-[7px] text-gray-400">{p}</p>
            </div>
          ))}
          <div className="bg-amber-500 text-white text-[7px] font-bold rounded px-2 flex items-center">Check</div>
        </div>
      </div>

      {/* ── Services section heading ── */}
      <div className="px-4 pt-4 pb-3 text-center bg-white">
        <p className="text-[8px] uppercase tracking-[3px] text-gray-400 mb-1">Phokela Guest House</p>
        <h2 className="text-[13px] font-bold text-gray-900 mb-1.5">{v.services_heading}</h2>
        <p className="text-[9px] text-gray-500 max-w-[240px] mx-auto line-clamp-3">{v.services_description}</p>
      </div>

      {/* ── Placeholder room cards ── */}
      <div className="grid grid-cols-3 gap-2 px-3 pb-4">
        {[1,2,3].map(n => (
          <div key={n} className="bg-gray-100 rounded-lg overflow-hidden">
            <div className="h-10 bg-gray-200" />
            <div className="p-1.5 space-y-1">
              <div className="h-1.5 bg-gray-300 rounded w-3/4" />
              <div className="h-1.5 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
};

// ── Contact preview ───────────────────────────────────────────────────────────
const ContactPreview = ({ v, general }) => {
  const contactServices  = parseJsonList(v.contact_services,     ['Accommodation', 'Catering', 'Conferences', 'Events']);
  const formOptions      = parseJsonList(v.form_service_options, []);

  return (
    <BrowserFrame label="phokela.co.za/contact">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 text-center border-b border-gray-100">
        <h1 className="text-[15px] font-bold text-gray-900 mb-1">{v.page_heading}</h1>
        <p className="text-[9px] text-gray-500 max-w-[260px] mx-auto line-clamp-2">{v.page_subtitle}</p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-100">
        {/* Contact info column */}
        <div className="p-3 space-y-2">
          <p className="text-[9px] font-bold text-gray-700">Get In Touch</p>
          {[
            { icon: '📍', val: general?.address },
            { icon: '📞', val: [general?.phone_1, general?.phone_2].filter(Boolean).join(', ') },
            { icon: '✉️', val: general?.email },
            { icon: '🕐', val: v.hours_weekday },
            { icon: '🕐', val: v.hours_weekend },
            { icon: '🏷️', val: contactServices.join(' • ') },
          ].filter(r => r.val).map((r, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-[10px] shrink-0">{r.icon}</span>
              <span className="text-[8px] text-gray-600 leading-tight">{r.val}</span>
            </div>
          ))}
        </div>

        {/* Form column */}
        <div className="p-3 space-y-1.5">
          <p className="text-[9px] font-bold text-gray-700">Send us a Message</p>
          {['Full Name', 'Email', 'Phone'].map(f => (
            <div key={f} className="h-4 bg-gray-100 rounded border border-gray-200 px-1.5 flex items-center">
              <span className="text-[7px] text-gray-400">{f}</span>
            </div>
          ))}
          {/* Service dropdown preview */}
          <div className="h-4 bg-gray-100 rounded border border-gray-200 px-1.5 flex items-center justify-between">
            <span className="text-[7px] text-gray-400">
              {formOptions[0]?.label || 'Select a service'}
            </span>
            <span className="text-[7px] text-gray-400">▾</span>
          </div>
          <div className="h-6 bg-gray-100 rounded border border-gray-200 px-1.5 flex items-start pt-1">
            <span className="text-[7px] text-gray-400">Message…</span>
          </div>
          <div className="h-4 bg-amber-500 rounded flex items-center justify-center">
            <span className="text-[7px] font-bold text-white">Send Message</span>
          </div>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="mx-3 mb-3 mt-2 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 h-16 flex items-center justify-center">
        {v.maps_embed_url
          ? <span className="text-[8px] text-gray-500 text-center px-2">📍 Map configured — visible on live page</span>
          : <span className="text-[8px] text-gray-400">No map URL set</span>
        }
      </div>
    </BrowserFrame>
  );
};

// ── Services preview ──────────────────────────────────────────────────────────
const ServicesPreview = ({ v }) => {
  const highlights = [1, 2, 3, 4].map(n => ({
    icon:  v[`highlight_${n}_icon`]  || '⭐',
    title: v[`highlight_${n}_title`] || `Highlight ${n}`,
    desc:  v[`highlight_${n}_desc`]  || '',
  }));
  const whyBullets   = parseJsonList(v.why_choose_bullets, []);
  const bizItems     = parseJsonList(v.biz_services, []);
  const personalItems = parseJsonList(v.personal_services, []);

  return (
    <BrowserFrame label="phokela.co.za/services">
      {/* Hero */}
      <div className="px-4 pt-5 pb-4 text-center bg-gray-800">
        <h1 className="text-[13px] font-bold text-white mb-1">{v.page_heading || 'Our Services'}</h1>
        <p className="text-[8px] text-gray-300 max-w-[240px] mx-auto line-clamp-2">{v.page_subtitle}</p>
      </div>

      {/* Highlight cards (4) */}
      <div className="grid grid-cols-2 gap-2 p-3 border-b border-gray-100">
        {highlights.map((h, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
            <span className="text-base">{h.icon}</span>
            <p className="text-[8px] font-bold text-gray-800 mt-0.5">{h.title}</p>
            <p className="text-[7px] text-gray-500 line-clamp-2 mt-0.5">{h.desc}</p>
          </div>
        ))}
      </div>

      {/* Service cards grid */}
      <div className="grid grid-cols-2 gap-2 px-3 py-3 border-b border-gray-100">
        {[
          { name: 'Accommodation', desc: v.accom_desc,      icon: '🛏️', bg: 'bg-blue-50' },
          { name: 'Conference',    desc: v.conference_desc,  icon: '🏢', bg: 'bg-purple-50' },
          { name: 'Catering',      desc: v.catering_desc,    icon: '🍽️', bg: 'bg-orange-50' },
          { name: 'Events',        desc: v.events_desc,      icon: '🎉', bg: 'bg-green-50' },
        ].map(c => (
          <div key={c.name} className={`${c.bg} rounded-lg p-2`}>
            <span className="text-sm">{c.icon}</span>
            <p className="text-[8px] font-bold mt-0.5 text-gray-800">{c.name}</p>
            <p className="text-[7px] text-gray-500 mt-0.5 line-clamp-2">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Why Choose Us */}
      {whyBullets.length > 0 && (
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="text-[9px] font-bold text-gray-900 text-center mb-2">{v.why_choose_heading || 'Why Choose Our Services?'}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {whyBullets.map((b, i) => (
              <div key={i} className="text-center">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-0.5">
                  <span className="text-[10px]">{b.icon}</span>
                </div>
                <p className="text-[7px] font-semibold text-gray-800">{b.title}</p>
                <p className="text-[6px] text-gray-500 line-clamp-2">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business / Personal service lists */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 px-0 pb-3">
        {[
          { label: 'Business Services',  items: bizItems },
          { label: 'Personal Services',  items: personalItems },
        ].map(col => (
          <div key={col.label} className="px-3 pt-3">
            <p className="text-[8px] font-bold text-amber-600 mb-1.5 text-center">{col.label}</p>
            <ul className="space-y-1">
              {col.items.slice(0, 4).map((item, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-amber-500 text-[8px] leading-tight shrink-0">✓</span>
                  <div>
                    <p className="text-[7px] font-semibold text-gray-800 leading-tight">{item.title}</p>
                    <p className="text-[6px] text-gray-500 leading-tight line-clamp-1">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
};

// ── Accommodation preview ─────────────────────────────────────────────────────
const AccommodationPreview = ({ v, rooms }) => {
  // Resolve display order
  const orderedRooms = (() => {
    let ids = [];
    try { ids = JSON.parse(v.room_order || '[]'); } catch { ids = []; }
    if (!ids.length) return rooms;
    const ordered = ids.map(id => rooms.find(r => r.id === id)).filter(Boolean);
    const rest = rooms.filter(r => !ids.includes(r.id));
    return [...ordered, ...rest];
  })();

  return (
    <BrowserFrame label="phokela.co.za/accommodation">
      {/* Hero banner */}
      <div className="relative bg-gray-800 overflow-hidden" style={{ aspectRatio: '16/5' }}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
          <h1 className="font-bold text-[13px] uppercase tracking-wide leading-tight mb-1">
            {v.page_heading || 'Our Rooms & Accommodation'}
          </h1>
          <p className="text-[8px] text-gray-300 max-w-[200px]">
            {v.page_subtitle || 'Comfortable, well-appointed rooms.'}
          </p>
        </div>
      </div>

      {/* Description text */}
      {v.page_description && (
        <div className="px-4 py-3 text-center border-b border-gray-100">
          <p className="text-[8px] text-gray-500 max-w-[260px] mx-auto line-clamp-3">{v.page_description}</p>
        </div>
      )}

      {/* Room cards — real rooms if loaded, placeholders otherwise */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {orderedRooms.length > 0
          ? orderedRooms.slice(0, 6).map((room) => (
              <div key={room.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="h-10 bg-gray-200 overflow-hidden">
                  {(room.mainImage || room.images?.[0]) && (
                    <img src={room.mainImage || room.images[0]} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-1.5">
                  <p className="text-[8px] font-semibold text-gray-800 truncate">{room.name}</p>
                  <p className="text-[7px] text-gray-400 truncate">R{room.price}</p>
                  <div className="mt-1 h-2.5 bg-amber-400 rounded flex items-center justify-center">
                    <span className="text-[6px] font-bold text-white">Book now</span>
                  </div>
                </div>
              </div>
            ))
          : [1,2,3].map(n => (
              <div key={n} className="bg-gray-100 rounded-lg overflow-hidden">
                <div className="h-10 bg-gray-200" />
                <div className="p-1.5 space-y-1">
                  <div className="h-1.5 bg-gray-300 rounded w-3/4" />
                  <div className="h-1.5 bg-gray-200 rounded w-1/2" />
                  <div className="h-2.5 bg-amber-200 rounded w-2/3 mt-1" />
                </div>
              </div>
            ))
        }
      </div>
    </BrowserFrame>
  );
};

// ── Catering preview ──────────────────────────────────────────────────────────
const CateringPreview = ({ v }) => (
  <BrowserFrame label="phokela.co.za/catering">
    {/* Hero */}
    <div className="relative overflow-hidden" style={{ aspectRatio: '16/5' }}>
      {v.hero_bg
        ? <img src={v.hero_bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        : <div className="absolute inset-0 bg-gray-700" />
      }
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
        <h1 className="font-bold text-[13px] uppercase tracking-wide leading-tight mb-1">
          {v.hero_title || 'Professional Catering Services'}
        </h1>
        <p className="text-[8px] text-gray-300 max-w-[200px] line-clamp-2">
          {v.hero_description || ''}
        </p>
      </div>
    </div>

    {/* Highlight cards */}
    <div className="grid grid-cols-3 gap-2 px-3 py-3 border-b border-gray-100">
      {[1, 2, 3].map(n => (
        <div key={n} className="text-center">
          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-1">
            <span className="text-[11px]">{v[`highlight_${n}_icon`] || '⭐'}</span>
          </div>
          <p className="text-[8px] font-semibold text-gray-800">{v[`highlight_${n}_title`] || `Highlight ${n}`}</p>
          <p className="text-[7px] text-gray-500 line-clamp-2 mt-0.5">{v[`highlight_${n}_desc`] || ''}</p>
        </div>
      ))}
    </div>

    {/* Packages heading */}
    <div className="px-3 pt-3 pb-1 text-center">
      <h2 className="text-[11px] font-bold text-gray-900">{v.packages_heading || 'Our Catering Packages'}</h2>
    </div>

    {/* Placeholder package cards */}
    <div className="grid grid-cols-2 gap-2 px-3 pb-3">
      {[1, 2].map(n => (
        <div key={n} className="bg-gray-100 rounded-lg overflow-hidden">
          <div className="h-10 bg-gray-200" />
          <div className="p-1.5 space-y-1">
            <div className="h-1.5 bg-gray-300 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-amber-200 rounded w-2/3 mt-1" />
          </div>
        </div>
      ))}
    </div>

    {/* CTA */}
    <div className="mx-3 mb-3 bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
      <p className="text-[9px] font-bold text-gray-900 mb-0.5">{v.cta_heading || 'Ready to Place Your Order?'}</p>
      <p className="text-[7px] text-gray-500 mb-1.5 line-clamp-2">{v.cta_description || ''}</p>
      <span className="inline-block bg-amber-500 text-white text-[7px] font-bold px-2 py-0.5 rounded">
        {v.cta_btn_text || 'Contact Us'}
      </span>
    </div>
  </BrowserFrame>
);

// ── Events preview ────────────────────────────────────────────────────────────
const EventsPreview = ({ v }) => (
  <BrowserFrame label="phokela.co.za/events">
    {/* Hero */}
    <div className="relative overflow-hidden" style={{ aspectRatio: '16/5' }}>
      {v.hero_bg
        ? <img src={v.hero_bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        : <div className="absolute inset-0 bg-gray-700" />
      }
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
        <h1 className="font-bold text-[13px] uppercase tracking-wide leading-tight mb-1">
          {v.hero_title || 'Memorable Event Hosting'}
        </h1>
        <p className="text-[8px] text-gray-300 max-w-[200px] line-clamp-2">
          {v.hero_description || ''}
        </p>
      </div>
    </div>

    {/* Highlight cards */}
    <div className="grid grid-cols-3 gap-2 px-3 py-3 border-b border-gray-100">
      {[1, 2, 3].map(n => (
        <div key={n} className="text-center">
          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-1">
            <span className="text-[11px]">{v[`highlight_${n}_icon`] || '⭐'}</span>
          </div>
          <p className="text-[8px] font-semibold text-gray-800">{v[`highlight_${n}_title`] || `Highlight ${n}`}</p>
          <p className="text-[7px] text-gray-500 line-clamp-2 mt-0.5">{v[`highlight_${n}_desc`] || ''}</p>
        </div>
      ))}
    </div>

    {/* Packages heading */}
    <div className="px-3 pt-3 pb-1 text-center">
      <h2 className="text-[11px] font-bold text-gray-900">{v.packages_heading || 'Our Event Packages'}</h2>
    </div>

    {/* Placeholder package cards */}
    <div className="grid grid-cols-2 gap-2 px-3 pb-3">
      {[1, 2].map(n => (
        <div key={n} className="bg-gray-100 rounded-lg overflow-hidden">
          <div className="h-10 bg-gray-200" />
          <div className="p-1.5 space-y-1">
            <div className="h-1.5 bg-gray-300 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-amber-200 rounded w-2/3 mt-1" />
          </div>
        </div>
      ))}
    </div>

    {/* CTA */}
    <div className="mx-3 mb-3 bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
      <p className="text-[9px] font-bold text-gray-900 mb-0.5">{v.cta_heading || 'Ready to Plan Your Event?'}</p>
      <p className="text-[7px] text-gray-500 mb-1.5 line-clamp-2">{v.cta_description || ''}</p>
      <span className="inline-block bg-amber-500 text-white text-[7px] font-bold px-2 py-0.5 rounded">
        {v.cta_btn_text || 'Contact Us'}
      </span>
    </div>
  </BrowserFrame>
);

// ── Conference preview ────────────────────────────────────────────────────────
const ConferencePreview = ({ v }) => (
  <BrowserFrame label="phokela.co.za/conference">
    {/* Hero */}
    <div className="relative overflow-hidden" style={{ aspectRatio: '16/5' }}>
      {v.hero_bg
        ? <img src={v.hero_bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        : <div className="absolute inset-0 bg-gray-700" />
      }
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
        <h1 className="font-bold text-[13px] uppercase tracking-wide leading-tight mb-1">
          {v.hero_title || 'Professional Conference Facilities'}
        </h1>
        <p className="text-[8px] text-gray-300 max-w-[200px] line-clamp-2">
          {v.hero_description || ''}
        </p>
      </div>
    </div>

    {/* Highlight cards */}
    <div className="grid grid-cols-3 gap-2 px-3 py-3 border-b border-gray-100">
      {[1, 2, 3].map(n => (
        <div key={n} className="text-center">
          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-1">
            <span className="text-[11px]">{v[`highlight_${n}_icon`] || '⭐'}</span>
          </div>
          <p className="text-[8px] font-semibold text-gray-800">{v[`highlight_${n}_title`] || `Highlight ${n}`}</p>
          <p className="text-[7px] text-gray-500 line-clamp-2 mt-0.5">{v[`highlight_${n}_desc`] || ''}</p>
        </div>
      ))}
    </div>

    {/* Packages heading */}
    <div className="px-3 pt-3 pb-1 text-center">
      <h2 className="text-[11px] font-bold text-gray-900">{v.packages_heading || 'Our Conference Packages'}</h2>
    </div>

    {/* Placeholder package cards */}
    <div className="grid grid-cols-2 gap-2 px-3 pb-3">
      {[1, 2].map(n => (
        <div key={n} className="bg-gray-100 rounded-lg overflow-hidden">
          <div className="h-10 bg-gray-200" />
          <div className="p-1.5 space-y-1">
            <div className="h-1.5 bg-gray-300 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-amber-200 rounded w-2/3 mt-1" />
          </div>
        </div>
      ))}
    </div>

    {/* CTA */}
    <div className="mx-3 mb-3 bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
      <p className="text-[9px] font-bold text-gray-900 mb-0.5">{v.cta_heading || 'Ready to Book Your Conference?'}</p>
      <p className="text-[7px] text-gray-500 mb-1.5 line-clamp-2">{v.cta_description || ''}</p>
      <span className="inline-block bg-amber-500 text-white text-[7px] font-bold px-2 py-0.5 rounded">
        {v.cta_btn_text || 'Contact Us'}
      </span>
    </div>
  </BrowserFrame>
);

// ── Generic page preview (Catering / Events / Conference) ─────────────────────
const GenericPagePreview = ({ v, path = '' }) => (
  <BrowserFrame label={`phokela.co.za${path}`}>
    <div className="px-4 pt-6 pb-4 text-center border-b border-gray-100">
      <h1 className="text-[16px] font-bold text-gray-900 mb-1.5">{v.page_heading}</h1>
      <p className="text-[9px] text-gray-500 max-w-[260px] mx-auto">{v.page_subtitle}</p>
    </div>
    <div className="grid grid-cols-3 gap-2 p-3">
      {[1,2,3].map(n => (
        <div key={n} className="bg-gray-100 rounded-lg overflow-hidden">
          <div className="h-12 bg-gray-200" />
          <div className="p-1.5 space-y-1">
            <div className="h-1.5 bg-gray-300 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-amber-200 rounded w-2/3 mt-1" />
          </div>
        </div>
      ))}
    </div>
  </BrowserFrame>
);

const PAGE_PATHS = { catering: '/catering', events: '/events', conference: '/conference' };

const TabPreview = ({ tabId, values, allValues, rooms }) => {
  const v = values || {};
  switch (tabId) {
    case 'general':       return <GeneralPreview v={v} />;
    case 'home':          return <HomePreview v={v} />;
    case 'contact':       return <ContactPreview v={v} general={allValues?.general} />;
    case 'services':      return <ServicesPreview v={v} />;
    case 'accommodation': return <AccommodationPreview v={v} rooms={rooms || []} />;
    case 'catering':      return <CateringPreview v={v} />;
    case 'events':        return <EventsPreview v={v} />;
    case 'conference':    return <ConferencePreview v={v} />;
    default:              return <GenericPagePreview v={v} path={PAGE_PATHS[tabId] || ''} />;
  }
};

// ─── Field Input ──────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';

const FieldInput = ({ field, value, onChange }) => {
  if (field.type === 'textarea') {
    return (
      <textarea rows={3} value={value || ''} onChange={e => onChange(e.target.value)} className={inputCls} />
    );
  }
  return (
    <input type={field.type} value={value || ''} onChange={e => onChange(e.target.value)} className={inputCls} />
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ContentManager = () => {
  const [activeTab, setActiveTab]     = useState(CMS_TABS[0].id);
  const [values, setValues]           = useState(buildDefaults);
  const [apiLoaded, setApiLoaded]     = useState(false);
  const [saving, setSaving]           = useState({});
  const [saved, setSaved]             = useState({});
  const [errors, setErrors]           = useState({});
  const [hasDraft, setHasDraft]       = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [allRooms, setAllRooms]       = useState([]);
  const draftTimers = useRef({});

  // ── Load API → overlay localStorage drafts ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const next = buildDefaults();
      await Promise.all([
        // Load CMS settings for every tab
        ...CMS_TABS.map(async (tab) => {
          try {
            const res = await settingsAPI.getByGroup(tab.group);
            if (res.success && res.data) {
              next[tab.id] = { ...next[tab.id], ...res.data };
            }
          } catch { /* non-fatal */ }

          try {
            const raw = localStorage.getItem(`cms_draft_${tab.id}`);
            if (raw) {
              next[tab.id] = { ...next[tab.id], ...JSON.parse(raw) };
              setHasDraft(p => ({ ...p, [tab.id]: true }));
            }
          } catch { /* malformed draft */ }
        }),
        // Load rooms for the drag-reorder editor and preview
        roomsAPI.getAll().then(res => {
          if (res.success) setAllRooms(res.data || []);
        }).catch(() => {}),
      ]);
      setValues(next);
      setApiLoaded(true);
    };
    load();
  }, []);

  // ── Field change + auto-save draft (CM-06) ────────────────────────────────
  const handleChange = (tabId, key, val) => {
    setValues(prev => ({ ...prev, [tabId]: { ...prev[tabId], [key]: val } }));
    // Compute updated tab snapshot outside the updater (no side effects in updater)
    const updatedTab = { ...(values[tabId] || {}), [key]: val };
    clearTimeout(draftTimers.current[tabId]);
    draftTimers.current[tabId] = setTimeout(() => {
      localStorage.setItem(`cms_draft_${tabId}`, JSON.stringify(updatedTab));
      setHasDraft(p => ({ ...p, [tabId]: true }));
    }, 800);
  };

  // ── Save section (CM-04) ──────────────────────────────────────────────────
  const handleSave = async (tab) => {
    setSaving(p => ({ ...p, [tab.id]: true }));
    setErrors(p => ({ ...p, [tab.id]: null }));
    try {
      const res = await settingsAPI.update(values[tab.id], tab.group);
      if (res.success) {
        localStorage.removeItem(`cms_draft_${tab.id}`);
        setHasDraft(p => ({ ...p, [tab.id]: false }));
        setSaved(p => ({ ...p, [tab.id]: true }));
        setTimeout(() => setSaved(p => ({ ...p, [tab.id]: false })), 3000);
      } else {
        setErrors(p => ({ ...p, [tab.id]: res.message || 'Failed to save.' }));
      }
    } catch (err) {
      setErrors(p => ({ ...p, [tab.id]: err.message || 'Failed to save.' }));
    } finally {
      setSaving(p => ({ ...p, [tab.id]: false }));
    }
  };

  // ── Revert to defaults (CM-05) ────────────────────────────────────────────
  const handleRevert = (tab) => {
    if (!window.confirm(`Revert all "${tab.label}" content to defaults? This will discard your customizations for this section.`)) return;
    const defaults = {
      ...Object.fromEntries(tab.fields.map(f => [f.key, f.default])),
      ...(tab.hasSlides ? { home_slides: JSON.stringify(tab.slidesDefault) } : {}),
      ...(tab.hasLogos ? { logo_light: '', logo_dark: '' } : {}),
      ...(tab.hasFooterLinks ? { footer_links: JSON.stringify(tab.footerLinksDefault) } : {}),
      ...(tab.hasHeroBg ? { hero_bg: tab.heroBgDefault || '' } : {}),
      ...(tab.hasHighlightCards ? Object.fromEntries(
        tab.highlightCardDefaults.flatMap((c, i) => [
          [`highlight_${i + 1}_icon`,  c.icon],
          [`highlight_${i + 1}_title`, c.title],
          [`highlight_${i + 1}_desc`,  c.desc],
        ])
      ) : {}),
      ...(tab.hasWhyChoose ? { why_choose_bullets: JSON.stringify(tab.whyChooseDefault) } : {}),
      ...(tab.hasBizPersonalServices ? {
        biz_services:      JSON.stringify(tab.bizServicesDefault),
        personal_services: JSON.stringify(tab.personalServicesDefault),
      } : {}),
      ...(tab.hasContactLists ? {
        contact_services:     JSON.stringify(tab.contactServicesDefault),
        form_service_options: JSON.stringify(tab.formServiceOptionsDefault),
      } : {}),
    };
    setValues(p => ({ ...p, [tab.id]: defaults }));
    localStorage.removeItem(`cms_draft_${tab.id}`);
    setHasDraft(p => ({ ...p, [tab.id]: false }));
  };

  const currentTab    = CMS_TABS.find(t => t.id === activeTab);
  const currentValues = values[activeTab] || {};

  return (
    <div>
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Content</h1>
          <p className="text-sm text-gray-500 mt-0.5">Edit public-facing content without touching code</p>
        </div>
        {/* CM-03: Preview toggle */}
        <button
          onClick={() => setShowPreview(p => !p)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            showPreview
              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {!apiLoaded && (
        <div className="flex items-center gap-3 text-sm text-gray-500 py-8">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
          Loading saved content…
        </div>
      )}

      {apiLoaded && (
        <div className={`flex gap-6 ${showPreview ? 'flex-col xl:flex-row' : ''}`}>

          {/* ── Editor panel ─────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* CM-02: Tab bar */}
            <div className="flex overflow-x-auto gap-1 pb-px mb-6 border-b border-gray-200">
              {CMS_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {hasDraft[tab.id] && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" title="Unsaved draft" />
                  )}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500 mb-5">{currentTab.description}</p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">

              {/* CM-07 + CM-08: Slides editor (Home tab only) */}
              {currentTab.hasSlides && (
                <SlidesEditor
                  slidesJson={currentValues.home_slides}
                  defaultSlides={currentTab.slidesDefault}
                  onChange={val => handleChange(activeTab, 'home_slides', val)}
                />
              )}

              {/* CM-14: Room display order editor (Accommodation tab only) */}
              {currentTab.hasRoomOrder && (
                <RoomOrderEditor
                  orderJson={currentValues.room_order}
                  rooms={allRooms}
                  onChange={val => handleChange(activeTab, 'room_order', val)}
                />
              )}

              {/* CM-39: Logo upload editor */}
              {currentTab.hasLogos && (
                <LogoUploadEditor
                  lightUrl={currentValues.logo_light}
                  darkUrl={currentValues.logo_dark}
                  onChangeLight={val => handleChange(activeTab, 'logo_light', val)}
                  onChangeDark={val => handleChange(activeTab, 'logo_dark', val)}
                />
              )}

              {/* CM-40: Footer links editor */}
              {currentTab.hasFooterLinks && (
                <FooterLinksEditor
                  linksJson={currentValues.footer_links}
                  defaultLinks={currentTab.footerLinksDefault}
                  onChange={val => handleChange(activeTab, 'footer_links', val)}
                />
              )}

              {/* CM-15: Hero background image editor */}
              {currentTab.hasHeroBg && (
                <HeroBgEditor
                  bgUrl={currentValues.hero_bg}
                  onChange={val => handleChange(activeTab, 'hero_bg', val)}
                />
              )}

              {/* CM-16 / CM-28: Highlight cards editor */}
              {currentTab.hasHighlightCards && (
                <HighlightCardsEditor
                  values={currentValues}
                  onChange={(key, val) => handleChange(activeTab, key, val)}
                  count={currentTab.highlightCount || 3}
                />
              )}

              {/* CM-29: Why Choose Us editor */}
              {currentTab.hasWhyChoose && (
                <WhyChooseEditor
                  bulletsJson={currentValues.why_choose_bullets}
                  defaultBullets={currentTab.whyChooseDefault}
                  onChange={val => handleChange(activeTab, 'why_choose_bullets', val)}
                />
              )}

              {/* Contact tab: note about General tab for address/phone/email */}
              {currentTab.id === 'contact' && (
                <div className="px-6 pt-5 pb-0">
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-800">
                    <span className="shrink-0 text-base leading-tight">ℹ️</span>
                    <span>
                      <strong>Address, phone numbers, and email</strong> are managed in the{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className="underline font-semibold hover:text-blue-600"
                      >
                        General tab
                      </button>
                      {' '}and will appear automatically on this page.
                    </span>
                  </div>
                </div>
              )}

              {/* CM-36 / CM-37: Contact page lists */}
              {currentTab.hasContactLists && (
                <>
                  <StringListEditor
                    label="Services List (shown in contact info)"
                    hint="Displayed as bullet points alongside address, phone, and email."
                    listJson={currentValues.contact_services}
                    defaultList={currentTab.contactServicesDefault}
                    onChange={val => handleChange(activeTab, 'contact_services', val)}
                  />
                  <FormServiceOptionsEditor
                    listJson={currentValues.form_service_options}
                    defaultList={currentTab.formServiceOptionsDefault}
                    onChange={val => handleChange(activeTab, 'form_service_options', val)}
                  />
                </>
              )}

              {/* CM-30 / CM-31: Business & Personal service lists */}
              {currentTab.hasBizPersonalServices && (
                <>
                  <ServiceItemListEditor
                    label="Business Services"
                    listJson={currentValues.biz_services}
                    defaultList={currentTab.bizServicesDefault}
                    onChange={val => handleChange(activeTab, 'biz_services', val)}
                  />
                  <ServiceItemListEditor
                    label="Personal Services"
                    listJson={currentValues.personal_services}
                    defaultList={currentTab.personalServicesDefault}
                    onChange={val => handleChange(activeTab, 'personal_services', val)}
                  />
                </>
              )}

              {/* Regular text fields */}
              {currentTab.fields.length > 0 && (
                <div className="p-6">
                  {(currentTab.hasSlides || currentTab.hasRoomOrder || currentTab.hasLogos || currentTab.hasFooterLinks || currentTab.hasHeroBg || currentTab.hasHighlightCards || currentTab.hasWhyChoose || currentTab.hasBizPersonalServices || currentTab.hasContactLists) && (
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">Page Text</h3>
                  )}
                  <div className="space-y-5">
                    {currentTab.fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {field.label}
                        </label>
                        <FieldInput
                          field={field}
                          value={currentValues[field.key]}
                          onChange={val => handleChange(activeTab, field.key, val)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Action bar ───────────────────────────────── */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex flex-wrap items-center gap-3">
                {hasDraft[activeTab] && !saved[activeTab] && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    Unsaved draft
                  </span>
                )}
                {saved[activeTab] && (
                  <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    ✓ Saved successfully
                  </span>
                )}
                {errors[activeTab] && (
                  <span className="text-xs text-red-600">{errors[activeTab]}</span>
                )}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => handleRevert(currentTab)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    Revert to Defaults
                  </button>
                  <button
                    onClick={() => handleSave(currentTab)}
                    disabled={saving[activeTab]}
                    className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    {saving[activeTab] ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CM-03: Preview panel */}
          {showPreview && (
            <div className="xl:w-[380px] shrink-0">
              <div className="sticky top-20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Preview</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Live</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 overflow-y-auto max-h-[75vh]">
                  <TabPreview tabId={activeTab} values={currentValues} allValues={values} rooms={allRooms} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentManager;
