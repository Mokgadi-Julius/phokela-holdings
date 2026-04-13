import { BrowserRouter, Route, Routes, } from 'react-router-dom';
import { useEffect } from 'react';
import { Footer, Header, PageNotFound, WhatsAppButton } from './components';
import { Home, RoomDetails, Services, Blog, BlogPost } from './pages';
import Contact from './pages/Contact';
import Accommodation from './pages/Accommodation';
import Catering from './pages/Catering';
import CateringDetails from './pages/CateringDetails';
import EventDetails from './pages/EventDetails';
import ConferenceDetails from './pages/ConferenceDetails';
import Events from './pages/Events';
import Conference from './pages/Conference';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancelled from './pages/PaymentCancelled';
import { AdminLayout, AdminLogin, Dashboard, Bookings, Rooms, NewBooking, Calendar, Services as AdminServices, Reports, Settings, Expenses, ContentManager, AdminBlog } from './pages/admin';
import { settingsAPI } from './services/api';

// CM-43: Inject SEO meta tags from CMS into <head>
const useSeoMeta = () => {
  useEffect(() => {
    settingsAPI.getByGroup('cms_general')
      .then(res => {
        if (!res.success) return;
        const d = res.data;
        if (d.seo_title)       document.title = d.seo_title;
        const setMeta = (name, content) => {
          if (!content) return;
          let el = document.querySelector(`meta[name="${name}"]`);
          if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
          el.setAttribute('content', content);
        };
        setMeta('description', d.seo_description);
        setMeta('keywords',    d.seo_keywords);
      })
      .catch(() => {});
  }, []);
};

const App = () => {
  useSeoMeta();

  // const paths = [
  //   { path: '/', element: <Home /> },
  //   { path: '/room/:id', element: <RoomDetails /> },
  //   { path: '*', element: <PageNotFound /> },
  // ]

  // const router = createBrowserRouter(paths);
  // <RouterProvider router={router} />

  return (

    <main className=''>
      <BrowserRouter>

        <Routes>
          {/* Public Routes */}
          <Route path={'/'} element={
            <>
              <Header />
              <Home />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/accommodation'} element={
            <>
              <Header />
              <Accommodation />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/catering'} element={
            <>
              <Header />
              <Catering />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/catering/:id'} element={
            <>
              <Header />
              <CateringDetails />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/events'} element={
            <>
              <Header />
              <Events />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/events/:id'} element={
            <>
              <Header />
              <EventDetails />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/conference'} element={
            <>
              <Header />
              <Conference />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/conference/:id'} element={
            <>
              <Header />
              <ConferenceDetails />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/room/:id'} element={
            <>
              <Header />
              <RoomDetails />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/contact'} element={
            <>
              <Header />
              <Contact />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/services'} element={
            <>
              <Header />
              <Services />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/blog'} element={
            <>
              <Header />
              <Blog />
              <Footer />
              <WhatsAppButton />
            </>
          } />
          <Route path={'/blog/:slug'} element={
            <>
              <Header />
              <BlogPost />
              <Footer />
              <WhatsAppButton />
            </>
          } />

          {/* Payment Routes */}
          <Route path={'/payment/success'} element={<PaymentSuccess />} />
          <Route path={'/payment/cancelled'} element={<PaymentCancelled />} />

          {/* Admin Routes */}
          <Route path='/admin/login' element={<AdminLogin />} />
          <Route path='/admin' element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path='calendar' element={<Calendar />} />
            <Route path='bookings' element={<Bookings />} />
            <Route path='bookings/new' element={<NewBooking />} />
            <Route path='rooms' element={<Rooms />} />
            <Route path='services' element={<AdminServices />} />
            <Route path='contacts' element={<div className="p-6 text-center"><h2 className="text-2xl font-bold">Contacts Management</h2><p className="mt-2 text-gray-600">Coming soon...</p></div>} />
            <Route path='reports' element={<Reports />} />
            <Route path='expenses' element={<Expenses />} />
            <Route path='settings' element={<Settings />} />
            <Route path='content' element={<ContentManager />} />
            <Route path='blog' element={<AdminBlog />} />
          </Route>

          {/* 404 Route */}
          <Route path={'*'} element={
            <>
              <Header />
              <PageNotFound />
              <Footer />
            </>
          } />
        </Routes>

      </BrowserRouter>
    </main>
  )
}

export default App