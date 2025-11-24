import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingReference = searchParams.get('m_payment_id') || searchParams.get('booking_ref');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Cancelled Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Cancelled Message */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Payment Cancelled</h2>
        <p className="text-center text-gray-600 mb-6">
          Your payment was cancelled and your booking has not been confirmed.
        </p>

        {/* Booking Info */}
        {bookingReference && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Booking Reference:</p>
            <p className="font-semibold text-gray-800">{bookingReference}</p>
            <p className="text-xs text-gray-500 mt-2">
              Your booking is still saved but requires payment to be confirmed.
            </p>
          </div>
        )}

        {/* Information Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            What happened?
          </h3>
          <p className="text-sm text-yellow-800">
            The payment process was cancelled before completion. This can happen if you:
          </p>
          <ul className="text-sm text-yellow-800 mt-2 space-y-1 ml-4 list-disc">
            <li>Clicked the cancel button</li>
            <li>Closed the payment window</li>
            <li>Navigated away from the payment page</li>
          </ul>
        </div>

        {/* What to Do Next */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What would you like to do?</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Try the payment again using a different method</span>
            </p>
            <p className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Contact us for alternative payment options</span>
            </p>
            <p className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Make a new booking if you've changed your plans</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Try Payment Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Return to Home
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Need assistance?</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Email:</span>{' '}
              <a href="mailto:admin@phokelaholdings.co.za" className="text-blue-600 hover:underline">
                admin@phokelaholdings.co.za
              </a>
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Phone:</span>{' '}
              <a href="tel:+27123456789" className="text-blue-600 hover:underline">
                +27 12 345 6789
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
