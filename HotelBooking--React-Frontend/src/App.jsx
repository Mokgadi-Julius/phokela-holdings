import { BrowserRouter, Route, Routes, } from 'react-router-dom';
import { Footer, Header, PageNotFound, WhatsAppButton } from './components';
import { Home, RoomDetails, Services } from './pages';
import Contact from './pages/Contact';
import Accommodation from './pages/Accommodation';
import Catering from './pages/Catering';
import Events from './pages/Events';
import Conference from './pages/Conference';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancelled from './pages/PaymentCancelled';
import { AdminLayout, AdminLogin, Dashboard, Bookings, Rooms, NewBooking, Calendar, Services as AdminServices, Reports } from './pages/admin';


const App = () => {

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
          <Route path={'/events'} element={
            <>
              <Header />
              <Events />
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
            <Route path='settings' element={<div className="p-6 text-center"><h2 className="text-2xl font-bold">Settings</h2><p className="mt-2 text-gray-600">Coming soon...</p></div>} />
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