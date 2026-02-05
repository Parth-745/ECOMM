import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DeliveryAgentNavbar from '../components/DeliveryAgentNavbar';
import OTPVerificationModal from '../components/OTPVerificationModal';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiPackage } from 'react-icons/fi';

const DeliveryAgentOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, accepted, rejected
  const [processingOrder, setProcessingOrder] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [generatingOTP, setGeneratingOTP] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('deliveryAgentToken');
    if (!token) {
      navigate('/delivery_agentlogin');
      toast.error('Please login first');
      return;
    }

    fetchOrders();
  }, [navigate, filter]);

  const fetchOrders = async () => {
    try {
        console.log("Filter: ", filter);
      const token = localStorage.getItem('deliveryAgentToken');
      const response = await fetch(`http://localhost:4000/getDeliveryAgentOrders?status=${filter}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Order Fetched: ",data.orders)
        setOrders(data.orders || []);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      console.log('Error fetching orders:', error);
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    setProcessingOrder(orderId);
    try {
      const token = localStorage.getItem('deliveryAgentToken');
      const response = await fetch('http://localhost:4000/acceptDeliveryOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Order accepted successfully!');
        setOrders(orders.filter(o => o._id !== orderId));
        setTimeout(() => {
          fetchOrders();
        }, 1000);
      } else {
        toast.error(data.message || 'Failed to accept order');
      }
    } catch (error) {
      toast.error('Error accepting order');
      console.log(error);
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleRejectOrder = async (orderId) => {
    setProcessingOrder(orderId);
    try {
      const token = localStorage.getItem('deliveryAgentToken');
      const response = await fetch('http://localhost:4000/rejectDeliveryOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Order rejected');
        setOrders(orders.filter(o => o._id !== orderId));
        setTimeout(() => {
          fetchOrders();
        }, 1000);
      } else {
        toast.error(data.message || 'Failed to reject order');
      }
    } catch (error) {
      toast.error('Error rejecting order');
      console.log(error);
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleGenerateOTP = async (orderId) => {
    setGeneratingOTP(true);
    try {
      const token = localStorage.getItem('deliveryAgentToken');
      const response = await fetch('http://localhost:4000/generateDeliveryOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OTP sent to customer email! 📧');
        setSelectedOrderId(orderId);
        setShowOTPModal(true);
      } else {
        toast.error(data.message || 'Failed to generate OTP');
      }
    } catch (error) {
      toast.error('Error generating OTP');
      console.log(error);
    } finally {
      setGeneratingOTP(false);
    }
  };

  const handleOTPVerifySuccess = () => {
    setTimeout(() => {
      fetchOrders();
    }, 1000);
  };

  if (loading) {
    return (
      <div>
        <DeliveryAgentNavbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DeliveryAgentNavbar />
      <div className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Delivery Orders</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {['pending', 'accepted', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 font-medium capitalize border-b-2 transition ${
                filter === status
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {status === 'pending' && `📦 Pending (${orders.length})`}
              {status === 'accepted' && '✅ Accepted'}
              {status === 'rejected' && '❌ Rejected'}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No orders available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Order #{order._id.slice(-6)}</h3>
                      <p className="text-gray-600 text-sm">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">₹{order.totalAmount}</p>
                    </div>
                  </div>

                  {/* User Information */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-800 mb-2">👤 Customer Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Name</p>
                        <p className="font-semibold text-gray-800">{order.userName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Phone</p>
                        <p className="font-semibold text-gray-800">{order.userPhone || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600 text-sm">Delivery Address</p>
                        <p className="font-semibold text-gray-800">{order.shippingAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">📦 Items</h4>
                    <div className="space-y-2">
                      {order.products.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <span>{item.product?.name || 'Product'}</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {filter === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAcceptOrder(order._id)}
                        disabled={processingOrder === order._id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:bg-green-400 transition"
                      >
                        <FiCheck className="w-5 h-5" />
                        Accept Order
                      </button>
                      <button
                        onClick={() => handleRejectOrder(order._id)}
                        disabled={processingOrder === order._id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:bg-red-400 transition"
                      >
                        <FiX className="w-5 h-5" />
                        Reject Order
                      </button>
                    </div>
                  )}

                  {filter === 'accepted' && (
                    <div className="space-y-3">
                      {order.deliveryOTPVerified ? (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-green-700 font-semibold">🎉 Order Delivered Successfully</p>
                          <p className="text-green-600 text-sm mt-1">Delivery completed and verified</p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-green-700 font-semibold">✅ Order Accepted</p>
                            <p className="text-green-600 text-sm mt-1">You are assigned to deliver this order</p>
                          </div>
                          <button
                            onClick={() => handleGenerateOTP(order._id)}
                            disabled={generatingOTP}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                          >
                            🔐 Generate OTP
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {filter === 'rejected' && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-red-700 font-semibold">❌ Order Rejected</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* OTP Verification Modal */}
        <OTPVerificationModal
          isOpen={showOTPModal}
          orderId={selectedOrderId}
          onClose={() => setShowOTPModal(false)}
          onVerifySuccess={handleOTPVerifySuccess}
        />
      </div>
    </div>
  );
};

export default DeliveryAgentOrders;
