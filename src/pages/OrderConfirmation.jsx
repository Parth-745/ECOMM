import React from 'react';
import { useLocation ,useNavigate} from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center my-10">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-lg mb-6">Your order has been placed successfully.</p>
          
          <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
            <ul className="space-y-3 text-left">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>You'll receive an order confirmation email shortly</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>We'll update your order status as it gets shipped</span>
              </li>
            </ul>
          </div>
          
          <button
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors" onClick={()=>navigate('/order-history')}
          >
            View Your Orders
          </button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OrderConfirmation;