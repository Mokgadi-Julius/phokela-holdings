import { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * PayFast Payment Button Component
 * Generates and submits PayFast payment form
 */
const PayFastButton = ({ bookingId, amount, bookingReference, onError, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Call backend to generate PayFast payment data
      const response = await axios.post(`${API_URL}/payfast/initiate`, {
        bookingId: bookingId
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to initialize payment');
      }

      const { paymentUrl, paymentData } = response.data.data;

      // Create and submit form programmatically
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentUrl;
      form.style.display = 'none';

      // Add all payment data as hidden inputs
      Object.keys(paymentData).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = paymentData[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

    } catch (error) {
      console.error('Payment initiation error:', error);
      setLoading(false);

      if (onError) {
        onError(error.response?.data?.message || error.message || 'Failed to initialize payment');
      } else {
        alert(error.response?.data?.message || error.message || 'Failed to initialize payment. Please try again.');
      }
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={className || `
        w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold
        hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
        transition duration-200 flex items-center justify-center gap-2
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Pay R{amount ? amount.toFixed(2) : '0.00'} - Secure Payment</span>
        </>
      )}
    </button>
  );
};

export default PayFastButton;
