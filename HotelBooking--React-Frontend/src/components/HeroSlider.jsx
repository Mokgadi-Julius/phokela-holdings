import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { sliderData } from '../constants/data';
import { EffectFade, Autoplay } from 'swiper';
import { Link } from 'react-router-dom';
import { settingsAPI } from '../services/api';
import 'swiper/css/effect-fade';
import 'swiper/css';

const parseSlides = (json, fallback) => {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
};

// Hardcoded fallback slides — bg values are the imported asset URLs from sliderData
const FALLBACK_SLIDES = sliderData.map(s => ({
  id: String(s.id),
  title: s.title,
  subheading: 'Professional catering, comfortable accommodation, modern conference facilities, and memorable events at the heart of hospitality.',
  bg: s.bg,
  btnNext: s.btnNext,
  link: s.link,
}));

const HeroSlider = () => {
  const [slides, setSlides] = useState(null);

  useEffect(() => {
    settingsAPI.getByGroup('cms_home')
      .then(res => {
        if (res.success && res.data?.home_slides) {
          const parsed = parseSlides(res.data.home_slides, FALLBACK_SLIDES);
          // If a saved slide has no bg, fall back to the matching fallback slide's image
          const merged = parsed.map((s, i) => ({
            ...s,
            bg: s.bg || FALLBACK_SLIDES[i]?.bg || FALLBACK_SLIDES[0].bg,
          }));
          setSlides(merged);
        } else {
          setSlides(FALLBACK_SLIDES);
        }
      })
      .catch(() => setSlides(FALLBACK_SLIDES));
  }, []);

  // Don't mount Swiper until we have final slide data — prevents stacking on re-render
  if (!slides) return <div className='heroSlider h-[600px] lg:h-[860px] bg-gray-900' />;

  return (
    // key forces a full Swiper remount if slide count changes (avoids loop-clone stacking)
    <Swiper
      key={slides.length}
      modules={[EffectFade, Autoplay]}
      effect='fade'
      loop={false}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      className='heroSlider h-[600px] lg:h-[860px]'
    >
      {slides.map((slide) => (
        <SwiperSlide className='h-full relative flex justify-center items-center' key={slide.id}>

          <div className='z-20 text-white text-center'>
            <div className='uppercase font-tertiary tracking-[6px] mb-5'>Experience Excellence</div>
            <h1 className='font-primary text-[32px] uppercase tracking-[2px] max-w-[920px] lg:text-[68px] leading-tight mb-6'>
              {slide.title}
            </h1>
            {slide.subheading && (
              <p className='text-[18px] mb-8 max-w-[600px] mx-auto'>
                {slide.subheading}
              </p>
            )}
            {slide.btnNext && (
              <Link to={slide.link || '/'} className='btn btn-lg btn-primary mx-auto'>
                {slide.btnNext}
              </Link>
            )}
          </div>

          <div className='absolute top-0 w-full h-full'>
            <img className='object-cover h-full w-full' src={slide.bg} alt={slide.title} />
          </div>

          <div className='absolute w-full h-full bg-black/70' />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default HeroSlider;
