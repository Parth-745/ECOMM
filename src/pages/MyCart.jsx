import React, { useContext } from 'react';
import { FirebaseContext } from '../context/FirebaseContext';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { toast } from 'react-hot-toast';

const MyCart = () => {
  const { cart,user,setcart } = useContext(FirebaseContext);
  const navigate=useNavigate();
  function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  
  const calculateTotal = () => cart?.reduce((total, item) => total + (item.product?.price * item.quantity), 0) || 0;
  const calculateTotalItems = () => cart?.reduce((total, item) => total + item.quantity, 0) || 0;

  async function handleIncrease(item) {
    try {
    const token = await user.getIdToken();

    const [response] = await toast.promise(
      Promise.all([
        fetch('http://localhost:4000/addtoCart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item.product._id,
            quantity: 1,
            size:item.size
          }),
        }),
        delay(1500) // ensures at least 1.5s delay
      ]),
      {
        loading: 'Adding...',
      }
    );

    const data = await response.json();

    if (data.success) {
      // console.log(data.cart)
      setcart(data.cart);
      toast.success('Item added to cart!');
    } else {
      toast.error(data.message || "Add to cart failed.");
    }
  } catch (e) {
    console.error("Error adding to cart:", e);
  }
  }

  async function handleDecrease(item) {
    try {
    const token = await user.getIdToken();

    const [response] = await toast.promise(
      Promise.all([
        fetch('http://localhost:4000/deleteFromCart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item.product._id,
            quantity: 1,
            size:item.size
          }),
        }),
        delay(1500) // ensures at least 1.5s delay
      ]),
      {
        loading: 'Removing...',
        success: 'Item Removed!',
        error: 'Failed to remove item',
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log(data.cart)
      setcart(data.cart);
    } else {
      toast.error(data.message || "Add to cart failed.");
    }
  } catch (e) {
    console.error("Error adding to cart:", e);
  }
  }

    async function handleRemove(item) {
    try {
    const token = await user.getIdToken();

    const [response] = await toast.promise(
      Promise.all([
        fetch('http://localhost:4000/deleteFromCart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item.product._id,
            quantity: item.quantity,
            size:item.size
          }),
        }),
        delay(1500) // ensures at least 1.5s delay
      ]),
      {
        loading: 'Removing...',
        success: 'Item Removed!',
        error: 'Failed to remove item',
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log(data.cart)
      setcart(data.cart);
    } else {
      toast.error(data.message || "Add to cart failed.");
    }
  } catch (e) {
    console.error("Error adding to cart:", e);
  }
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8 text-center border border-gray-200">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-[#1A2433]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1A2433] mb-3">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
            <Link 
              to="/" 
              className="inline-block bg-[#1A2433] hover:bg-[#0f172a] text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12 mt-8">        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {cart.map((item) => (
                <div key={item._id} className="p-6 border-b border-gray-100 last:border-b-0 flex flex-col sm:flex-row gap-6 hover:bg-gray-50 transition-colors">
                  <div className="w-full sm:w-40 h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img loading='lazy'  
                      src={item?.product?.imageUrl} 
                      alt={item?.product?.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/300/1A2433/FFFFFF?text=Product';
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-xl text-[#1A2433]">{item?.product?.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-600">{item?.product?.category}</p>
                          {/* {item.size && (
                            <span className="text-gray-600">• Size: {item?.size}</span>
                          )} */}
                        </div>
                        {item?.product?.offer && (
                          <span className="inline-block bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                            {item?.product?.offer}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-lg text-[#1A2433]">₹{item?.product?.price?.toFixed(2)}</p>
                    </div>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                        <button 
                          className="px-4 py-2 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                          onClick={() => handleDecrease(item)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="px-4 text-gray-800">{item?.quantity}</span>
                        <button 
                          className="px-4 py-2 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                          onClick={() => handleIncrease(item)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <button 
                        className="text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors cursor-pointer"
                        onClick={() => handleRemove(item)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-[#1A2433] rounded-xl shadow-lg text-white sticky top-8">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold">Order Summary</h2>
                <p className="text-gray-300 text-sm mt-1">{calculateTotalItems()} {calculateTotalItems() === 1 ? 'item' : 'items'}</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item._id} className="flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300">{item?.quantity} ×</span>
                          <span className="font-medium text-gray-100 line-clamp-1">{item?.product?.name}</span>
                        </div>
                        {/* {item.size && (
                          <span className="text-gray-400 text-xs">Size: {item.size}</span>
                        )} */}
                      </div>
                      <span className="font-medium">₹{(item.product?.price * item?.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="border-t border-gray-700 pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Subtotal</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Shipping</span>
                      <span className="text-green-400">Free</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-xl text-white">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <button className="w-full bg-white hover:bg-gray-100 text-[#1A2433] font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2" onClick={()=>{navigate('/payment')}}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Proceed to Checkout
                </button>
                
                <div className="mt-4 text-center">
                  <Link to="/" className="text-gray-300 hover:text-white hover:underline inline-flex items-center gap-1 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCart;