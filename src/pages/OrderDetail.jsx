import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FirebaseContext } from '../context/FirebaseContext';
import { useContext } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaBox, FaShippingFast, FaCheckCircle, FaTimesCircle, FaChevronLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(FirebaseContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`http://localhost:4000/getOrderById/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        console.log("Order data:", data);
        if (data.success) {
          setOrder(data.order);
        } else {
          navigate('/order-history');
          toast.error('Order not found');
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrder();
    }
  }, [orderId, user, navigate]);

const cancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancelling(true);
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:4000/cancelOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order._id }), // Make sure to send just the ID string
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Order cancelled successfully');
        navigate('/order-history');
      } else {
        toast.error(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Order not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-black mb-6"
        >
          <FaChevronLeft className="mr-2" />
          Back to Orders
        </button>

        <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Order #{order._id.toString().slice(-6).toUpperCase()}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Placed on {formatDate(order.orderDate)}
                </p>
              </div>
              <div className="mt-2 sm:mt-0 flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${['Preparing', 'Out for delivery', 'Delivered'].includes(order.status) ? 'bg-black' : 'bg-gray-200'}`}>
                      {['Preparing', 'Out for delivery', 'Delivered'].includes(order.status) ? (
                        <FaCheckCircle className="text-white text-xs" />
                      ) : (
                        <span className="text-xs">1</span>
                      )}
                    </div>
                    <div className={`w-8 h-1 ${['Out for delivery', 'Delivered'].includes(order.status) ? 'bg-black' : 'bg-gray-200'}`}></div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${['Out for delivery', 'Delivered'].includes(order.status) ? 'bg-black' : 'bg-gray-200'}`}>
                      {['Out for delivery', 'Delivered'].includes(order.status) ? (
                        <FaCheckCircle className="text-white text-xs" />
                      ) : (
                        <span className="text-xs">2</span>
                      )}
                    </div>
                    <div className={`w-8 h-1 ${order.status === 'Delivered' ? 'bg-black' : 'bg-gray-200'}`}></div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${order.status === 'Delivered' ? 'bg-black' : 'bg-gray-200'}`}>
                      {order.status === 'Delivered' ? (
                        <FaCheckCircle className="text-white text-xs" />
                      ) : (
                        <span className="text-xs">3</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium ml-2">{order.status}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6">
            {/* Order Items */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">Items</h2>
              <div className="space-y-4">
                {order.products.map((item, index) => (
                  <div key={index} className="flex border-b pb-4">
                    <div className="flex-shrink-0 h-24 w-24 rounded-md overflow-hidden">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>{item.product.name}</h3>
                        <p>₹{item.product.price}</p>
                      </div>
                      {/* <p className="mt-1 text-sm text-gray-500">
                        Size: {item.size || 'One Size'}
                      </p> */}
                      <p className="mt-1 text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal ({order.products.length} item{order.products.length > 1 ? 's' : ''})</span>
                    <span>₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-500">FREE</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between font-medium">
                    <span>Total</span>
                    <span>₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">Shipping Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Shipping Address</h3>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                      {order.shippingAddress}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Delivery Status</h3>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-900">
                        {order.status === 'Delivered' ? 'Delivered on' : 'Expected Delivery'}:{' '}
                        {formatDate(order.status === 'Delivered' ? order.deliveredDate || order.expectedDeliveryDate : order.expectedDeliveryDate)}
                      </p>
                      {order.trackingNumber && (
                        <p className="text-sm text-gray-900">
                          Tracking #: {order.trackingNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Agent Information */}
                  {order.deliveryAgent && order.deliveryStatus === 'accepted' && (
                    <div className="col-span-1 md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                        👤 Delivery Agent Assigned
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-blue-700">Agent Name</p>
                          <p className="text-sm font-semibold text-gray-900">{order.deliveryAgent.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700">Contact Number</p>
                          <p className="text-sm font-semibold text-gray-900">{order.deliveryAgent.phone}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h2 className="text-lg font-medium mb-4">Payment Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {order.paymentMethod || "Cash on Delivery"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
                    <p className={`mt-1 text-sm font-medium ${
                      order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {order.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancel Order Button (only show if order can be cancelled) */}
            {['Preparing', 'Processing'].includes(order.status) && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={cancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OrderDetail;