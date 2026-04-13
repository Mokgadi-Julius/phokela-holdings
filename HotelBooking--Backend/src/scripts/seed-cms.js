/**
 * CMS Default Content Seeder (CM-B04)
 *
 * Seeds the settings table with default CMS content for all public pages.
 * Safe to run multiple times — uses INSERT IGNORE semantics (skipDuplicates).
 * Existing customised values are never overwritten.
 *
 * Usage:
 *   npm run seed:cms
 */

require('dotenv').config();
const { connectDB } = require('../config/database-mysql');
const { Setting } = require('../models');

// ─── Default seed data ────────────────────────────────────────────────────────
// Each entry: { key, value, group, description }
// Values must match what the frontend CMS_TABS schema expects.

const CMS_DEFAULTS = [

  // ── General / Site-wide (cms_general) ──────────────────────────────────────
  { key: 'site_name',        group: 'cms_general', value: 'Phokela Guest House',                                     description: 'Business / brand name' },
  { key: 'site_tagline',     group: 'cms_general', value: 'Experience Excellence in Hospitality',                    description: 'Site tagline shown in header and footer' },
  { key: 'whatsapp_number',  group: 'cms_general', value: '0835940966',                                              description: 'WhatsApp contact number (local format)' },
  { key: 'address',          group: 'cms_general', value: '108 Cnr VAN RIEBECK & DUDU MADISHA DRIVE',               description: 'Physical address' },
  { key: 'phone_1',          group: 'cms_general', value: '083 594 0966',                                            description: 'Primary phone number' },
  { key: 'phone_2',          group: 'cms_general', value: '076 691 1116',                                            description: 'Secondary phone number' },
  { key: 'email',            group: 'cms_general', value: 'admin@phokelaholdings.co.za',                             description: 'Contact email address' },
  { key: 'logo_light',       group: 'cms_general', value: '',                                                        description: 'Logo URL for dark/transparent backgrounds' },
  { key: 'logo_dark',        group: 'cms_general', value: '',                                                        description: 'Logo URL for white/light backgrounds' },
  { key: 'footer_tagline',   group: 'cms_general', value: 'Experience excellent hospitality at Phokela Guest House. We provide accommodation, catering, conference facilities, and event hosting services with a personal touch.', description: 'Footer description paragraph' },
  { key: 'footer_copyright', group: 'cms_general', value: 'Phokela Guest House. All Rights Reserved.',              description: 'Footer copyright line (year prepended automatically)' },
  { key: 'footer_links',     group: 'cms_general', value: JSON.stringify([
      { label: 'Accommodation', href: '/accommodation' },
      { label: 'Catering',      href: '/catering' },
      { label: 'Events',        href: '/events' },
      { label: 'Conference',    href: '/conference' },
      { label: 'Contact',       href: '/contact' },
    ]),                                                                                                                description: 'Footer navigation links (JSON array of {label, href})' },
  { key: 'social_facebook',  group: 'cms_general', value: '',                                                        description: 'Facebook page URL' },
  { key: 'social_instagram', group: 'cms_general', value: '',                                                        description: 'Instagram profile URL' },
  { key: 'social_twitter',   group: 'cms_general', value: '',                                                        description: 'X (Twitter) profile URL' },
  { key: 'social_tiktok',    group: 'cms_general', value: '',                                                        description: 'TikTok profile URL' },
  { key: 'seo_title',        group: 'cms_general', value: 'Phokela Guest House - Accommodation, Catering, Conferences & Events', description: 'HTML <title> tag' },
  { key: 'seo_description',  group: 'cms_general', value: 'Phokela Guest House offers premium accommodation, professional catering, modern conference facilities, and memorable event hosting. Located at Van Riebeck & Dudu Madisha Drive.', description: 'Meta description' },
  { key: 'seo_keywords',     group: 'cms_general', value: 'guest house, accommodation, catering, conferences, events, Van Riebeck, Dudu Madisha Drive, hospitality', description: 'Meta keywords' },

  // ── Home page (cms_home) ───────────────────────────────────────────────────
  { key: 'booking_form_title',   group: 'cms_home', value: 'Check Availability',                description: 'Label above the booking form' },
  { key: 'services_heading',     group: 'cms_home', value: 'Our Services & Packages',           description: 'Services section heading' },
  { key: 'services_description', group: 'cms_home', value: 'From comfortable accommodation to professional catering, conference facilities, and memorable events. Discover our comprehensive range of services designed to meet all your hospitality needs.', description: 'Services section description' },
  { key: 'home_slides',          group: 'cms_home', value: JSON.stringify([
      { id: '1', title: 'Welcome to Phokela Guest House',      subheading: 'Professional catering, comfortable accommodation, modern conference facilities, and memorable events at the heart of hospitality.', bg: '', btnNext: 'Book Now',    link: '/accommodation' },
      { id: '2', title: 'Professional Catering & Events',       subheading: 'Experience world-class hospitality with our range of comfortable rooms and event spaces.',                                          bg: '', btnNext: 'Our Services', link: '/services' },
      { id: '3', title: 'Modern Conference Facilities',         subheading: 'From intimate gatherings to large corporate events — we handle everything.',                                                        bg: '', btnNext: 'Learn More',   link: '/conference' },
    ]),                                                                                           description: 'Hero slider slides (JSON array)' },

  // ── Accommodation page (cms_accommodation) ─────────────────────────────────
  { key: 'page_heading',     group: 'cms_accommodation', value: 'Our Rooms & Accommodation',                                description: 'Hero title' },
  { key: 'page_subtitle',    group: 'cms_accommodation', value: 'Comfortable, well-appointed rooms designed for a restful stay.', description: 'Hero subtitle' },
  { key: 'page_description', group: 'cms_accommodation', value: "Discover our range of thoughtfully furnished rooms, each designed to provide comfort and relaxation. Whether you're visiting for business or leisure, we have the perfect room for you.", description: 'Page description paragraph' },

  // ── Catering page (cms_catering) ──────────────────────────────────────────
  { key: 'hero_title',         group: 'cms_catering', value: 'Professional Catering Services',                                                    description: 'Hero title' },
  { key: 'hero_description',   group: 'cms_catering', value: 'Delicious, fresh meals prepared with love for your special occasions',              description: 'Hero subtitle' },
  { key: 'hero_bg',            group: 'cms_catering', value: '',                                                                                   description: 'Hero background image URL' },
  { key: 'highlight_1_icon',   group: 'cms_catering', value: '👨‍🍳',                                                                           description: 'Highlight card 1 icon' },
  { key: 'highlight_1_title',  group: 'cms_catering', value: 'Expert Chefs',                                                                       description: 'Highlight card 1 title' },
  { key: 'highlight_1_desc',   group: 'cms_catering', value: 'Experienced culinary professionals passionate about great food',                     description: 'Highlight card 1 description' },
  { key: 'highlight_2_icon',   group: 'cms_catering', value: '🥬',                                                                                description: 'Highlight card 2 icon' },
  { key: 'highlight_2_title',  group: 'cms_catering', value: 'Fresh Ingredients',                                                                  description: 'Highlight card 2 title' },
  { key: 'highlight_2_desc',   group: 'cms_catering', value: 'Locally-sourced, fresh ingredients for the best flavor and quality',                description: 'Highlight card 2 description' },
  { key: 'highlight_3_icon',   group: 'cms_catering', value: '🍽️',                                                                              description: 'Highlight card 3 icon' },
  { key: 'highlight_3_title',  group: 'cms_catering', value: 'Custom Menus',                                                                       description: 'Highlight card 3 title' },
  { key: 'highlight_3_desc',   group: 'cms_catering', value: 'Tailored menu options to suit your preferences and dietary needs',                  description: 'Highlight card 3 description' },
  { key: 'packages_heading',   group: 'cms_catering', value: 'Our Catering Packages',                                                              description: 'Section heading above packages grid' },
  { key: 'cta_heading',        group: 'cms_catering', value: 'Ready to Place Your Order?',                                                         description: 'CTA heading' },
  { key: 'cta_description',    group: 'cms_catering', value: 'Contact us to discuss your catering needs and get a custom quote for your event',   description: 'CTA description' },
  { key: 'cta_btn_text',       group: 'cms_catering', value: 'Contact Us for Catering',                                                            description: 'CTA button text' },
  { key: 'cta_btn_link',       group: 'cms_catering', value: '/contact',                                                                           description: 'CTA button link' },

  // ── Events page (cms_events) ───────────────────────────────────────────────
  { key: 'hero_title',         group: 'cms_events', value: 'Memorable Event Hosting',                                                              description: 'Hero title' },
  { key: 'hero_description',   group: 'cms_events', value: 'Creating unforgettable moments for your special occasions',                           description: 'Hero subtitle' },
  { key: 'hero_bg',            group: 'cms_events', value: '',                                                                                      description: 'Hero background image URL' },
  { key: 'highlight_1_icon',   group: 'cms_events', value: '🎯',                                                                                   description: 'Highlight card 1 icon' },
  { key: 'highlight_1_title',  group: 'cms_events', value: 'Expert Planning',                                                                       description: 'Highlight card 1 title' },
  { key: 'highlight_1_desc',   group: 'cms_events', value: 'Professional event coordinators to handle every detail',                              description: 'Highlight card 1 description' },
  { key: 'highlight_2_icon',   group: 'cms_events', value: '🏛️',                                                                                  description: 'Highlight card 2 icon' },
  { key: 'highlight_2_title',  group: 'cms_events', value: 'Beautiful Venues',                                                                      description: 'Highlight card 2 title' },
  { key: 'highlight_2_desc',   group: 'cms_events', value: 'Elegant indoor and outdoor spaces for any occasion',                                  description: 'Highlight card 2 description' },
  { key: 'highlight_3_icon',   group: 'cms_events', value: '⭐',                                                                                   description: 'Highlight card 3 icon' },
  { key: 'highlight_3_title',  group: 'cms_events', value: 'Full Service',                                                                          description: 'Highlight card 3 title' },
  { key: 'highlight_3_desc',   group: 'cms_events', value: 'From setup to cleanup, we handle everything',                                         description: 'Highlight card 3 description' },
  { key: 'packages_heading',   group: 'cms_events', value: 'Our Event Packages',                                                                    description: 'Section heading above packages grid' },
  { key: 'cta_heading',        group: 'cms_events', value: 'Ready to Plan Your Event?',                                                             description: 'CTA heading' },
  { key: 'cta_description',    group: 'cms_events', value: 'Contact us to discuss your event needs and get a custom quote for your celebration',  description: 'CTA description' },
  { key: 'cta_btn_text',       group: 'cms_events', value: 'Contact Us for Events',                                                                 description: 'CTA button text' },
  { key: 'cta_btn_link',       group: 'cms_events', value: '/contact',                                                                              description: 'CTA button link' },

  // ── Conference page (cms_conference) ──────────────────────────────────────
  { key: 'hero_title',         group: 'cms_conference', value: 'Professional Conference Facilities',                                               description: 'Hero title' },
  { key: 'hero_description',   group: 'cms_conference', value: 'Modern meeting spaces equipped with cutting-edge technology',                     description: 'Hero subtitle' },
  { key: 'hero_bg',            group: 'cms_conference', value: '',                                                                                  description: 'Hero background image URL' },
  { key: 'highlight_1_icon',   group: 'cms_conference', value: '💻',                                                                              description: 'Highlight card 1 icon' },
  { key: 'highlight_1_title',  group: 'cms_conference', value: 'Modern Technology',                                                                description: 'Highlight card 1 title' },
  { key: 'highlight_1_desc',   group: 'cms_conference', value: 'Latest AV equipment and high-speed internet connectivity',                        description: 'Highlight card 1 description' },
  { key: 'highlight_2_icon',   group: 'cms_conference', value: '🏢',                                                                              description: 'Highlight card 2 icon' },
  { key: 'highlight_2_title',  group: 'cms_conference', value: 'Flexible Spaces',                                                                  description: 'Highlight card 2 title' },
  { key: 'highlight_2_desc',   group: 'cms_conference', value: 'Adaptable rooms for various meeting formats and sizes',                           description: 'Highlight card 2 description' },
  { key: 'highlight_3_icon',   group: 'cms_conference', value: '⚡',                                                                              description: 'Highlight card 3 icon' },
  { key: 'highlight_3_title',  group: 'cms_conference', value: 'Full Support',                                                                     description: 'Highlight card 3 title' },
  { key: 'highlight_3_desc',   group: 'cms_conference', value: 'Technical assistance and professional service staff',                             description: 'Highlight card 3 description' },
  { key: 'packages_heading',   group: 'cms_conference', value: 'Our Conference Packages',                                                          description: 'Section heading above packages grid' },
  { key: 'cta_heading',        group: 'cms_conference', value: 'Ready to Book Your Conference?',                                                   description: 'CTA heading' },
  { key: 'cta_description',    group: 'cms_conference', value: 'Contact us to discuss your conference needs and get a custom quote for your event', description: 'CTA description' },
  { key: 'cta_btn_text',       group: 'cms_conference', value: 'Contact Us for Conference',                                                        description: 'CTA button text' },
  { key: 'cta_btn_link',       group: 'cms_conference', value: '/contact',                                                                         description: 'CTA button link' },

  // ── Services page (cms_services) ──────────────────────────────────────────
  { key: 'page_heading',         group: 'cms_services', value: 'Our Services',                                                                      description: 'Hero title' },
  { key: 'page_subtitle',        group: 'cms_services', value: 'Discover our comprehensive range of services designed to meet your accommodation, conference, catering, and event hosting needs', description: 'Hero subtitle' },
  { key: 'accom_desc',           group: 'cms_services', value: 'Comfortable rooms and suites for your stay',                                       description: 'Accommodation card description' },
  { key: 'conference_desc',      group: 'cms_services', value: 'Modern facilities for meetings and conferences',                                   description: 'Conference card description' },
  { key: 'catering_desc',        group: 'cms_services', value: 'Delicious meals and catering services',                                            description: 'Catering card description' },
  { key: 'events_desc',          group: 'cms_services', value: 'Host memorable events and celebrations',                                           description: 'Events card description' },
  { key: 'highlight_1_icon',     group: 'cms_services', value: '⭐',                                                                               description: 'Highlight card 1 icon' },
  { key: 'highlight_1_title',    group: 'cms_services', value: 'Professional Service',                                                              description: 'Highlight card 1 title' },
  { key: 'highlight_1_desc',     group: 'cms_services', value: 'Our team of experienced professionals ensures seamless service delivery',          description: 'Highlight card 1 description' },
  { key: 'highlight_2_icon',     group: 'cms_services', value: '✅',                                                                               description: 'Highlight card 2 icon' },
  { key: 'highlight_2_title',    group: 'cms_services', value: 'Quality Assurance',                                                                 description: 'Highlight card 2 title' },
  { key: 'highlight_2_desc',     group: 'cms_services', value: 'We maintain the highest standards in all our services',                           description: 'Highlight card 2 description' },
  { key: 'highlight_3_icon',     group: 'cms_services', value: '🔄',                                                                               description: 'Highlight card 3 icon' },
  { key: 'highlight_3_title',    group: 'cms_services', value: 'Flexible Options',                                                                  description: 'Highlight card 3 title' },
  { key: 'highlight_3_desc',     group: 'cms_services', value: 'Customizable packages to meet your specific requirements',                        description: 'Highlight card 3 description' },
  { key: 'highlight_4_icon',     group: 'cms_services', value: '📦',                                                                               description: 'Highlight card 4 icon' },
  { key: 'highlight_4_title',    group: 'cms_services', value: 'All-Inclusive',                                                                     description: 'Highlight card 4 title' },
  { key: 'highlight_4_desc',     group: 'cms_services', value: 'Complete solutions from setup to execution and cleanup',                           description: 'Highlight card 4 description' },
  { key: 'why_choose_heading',   group: 'cms_services', value: 'Why Choose Our Services?',                                                          description: 'Why Choose Us section heading' },
  { key: 'why_choose_bullets',   group: 'cms_services', value: JSON.stringify([
      { icon: '🏆', title: 'Quality Guarantee',  desc: 'We maintain the highest standards in all our services to ensure your satisfaction' },
      { icon: '👨‍💼', title: 'Professional Team', desc: 'Our experienced staff is dedicated to providing exceptional service' },
      { icon: '📍', title: 'Prime Location',     desc: 'Conveniently located with easy access and ample parking' },
    ]),                                                                                                                                              description: 'Why Choose Us bullet points (JSON array)' },
  { key: 'biz_services',         group: 'cms_services', value: JSON.stringify([
      { title: 'Conference Rooms',   desc: 'Professional venues equipped with modern technology' },
      { title: 'Corporate Events',   desc: 'Complete event hosting for business functions' },
      { title: 'Meeting Facilities', desc: 'Flexible spaces for various meeting formats' },
      { title: 'Catering Services',  desc: 'Professional catering for corporate events' },
    ]),                                                                                                                                              description: 'Business services list (JSON array)' },
  { key: 'personal_services',    group: 'cms_services', value: JSON.stringify([
      { title: 'Accommodation',      desc: 'Comfortable rooms and suites for your stay' },
      { title: 'Event Hosting',      desc: 'Perfect venues for weddings, birthdays, and celebrations' },
      { title: 'Special Occasions',  desc: 'Customized services for milestone events' },
      { title: 'Catering Solutions', desc: 'Delicious food for all types of celebrations' },
    ]),                                                                                                                                              description: 'Personal services list (JSON array)' },

  // ── Contact page (cms_contact) ────────────────────────────────────────────
  { key: 'page_heading',        group: 'cms_contact', value: 'Contact Phokela Guest House',                                                         description: 'Page heading' },
  { key: 'page_subtitle',       group: 'cms_contact', value: "Get in touch with us for accommodation, catering, conferences, and event hosting services. We're here to make your experience exceptional.", description: 'Page subtitle' },
  { key: 'hours_weekday',       group: 'cms_contact', value: 'Mon–Fri: 7:00 AM – 9:00 PM',                                                         description: 'Weekday opening hours' },
  { key: 'hours_weekend',       group: 'cms_contact', value: 'Sat–Sun: 8:00 AM – 8:00 PM',                                                         description: 'Weekend opening hours' },
  { key: 'maps_embed_url',      group: 'cms_contact', value: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3584.8995959631353!2d28.0376!3d-26.2041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e950c0b8c0b8c0b%3A0x1e950c0b8c0b8c0b!2sVan%20Riebeck%20Ave%20%26%20Dudu%20Madisha%20Dr%2C%20Johannesburg%2C%20South%20Africa!5e0!3m2!1sen!2sza!4v1640995200000!5m2!1sen!2sza', description: 'Google Maps embed URL' },
  { key: 'contact_services',    group: 'cms_contact', value: JSON.stringify(['Accommodation', 'Catering', 'Conferences', 'Events']),                description: 'Services listed in contact info block (JSON array of strings)' },
  { key: 'form_service_options', group: 'cms_contact', value: JSON.stringify([
      { value: 'accommodation', label: 'Accommodation' },
      { value: 'catering',      label: 'Catering Services' },
      { value: 'conference',    label: 'Conference Facilities' },
      { value: 'events',        label: 'Event Hosting' },
      { value: 'corporate',     label: 'Corporate Packages' },
      { value: 'other',         label: 'Other' },
    ]),                                                                                                                                              description: 'Contact form service dropdown options (JSON array of {value, label})' },
];

// ─── Seeder ───────────────────────────────────────────────────────────────────
const seedCms = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding CMS default content…');

    let inserted = 0;
    let skipped  = 0;

    for (const entry of CMS_DEFAULTS) {
      const [, created] = await Setting.findOrCreate({
        where: { key: entry.key, group: entry.group },
        defaults: {
          key:         entry.key,
          value:       entry.value,
          group:       entry.group,
          description: entry.description,
        },
      });
      created ? inserted++ : skipped++;
    }

    console.log(`✅ CMS seed complete — ${inserted} inserted, ${skipped} already existed (skipped).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ CMS seed failed:', error.message);
    process.exit(1);
  }
};

seedCms();
