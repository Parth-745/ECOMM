import { useState, useEffect } from 'react';
import { FiPackage, FiCheck, FiX, FiDollarSign, FiBarChart2, FiCalendar, FiTruck } from 'react-icons/fi';
import { FaBox, FaShippingFast, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminLanding = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('monthly');
  const navigate = useNavigate();

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:4000/getAllOrders',{
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies for session management
      });
        const data = await response.json();
        if(data.success !== true) navigate('/');
        const sortedOrders = data.orders.sort((a, b) => {
      const statusPriority = {
        'Preparing': 1,
        'Out for delivery': 2,
        'Delivered': 3
      };
      return statusPriority[a.status] - statusPriority[b.status];
    });

    setOrders(sortedOrders);
      } catch (error) {
        
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Mock analytics data (replace with real API call)
  useEffect(() => {
    // Calculate analytics from orders data
    const calculateAnalytics = () => {
      const totalRevenue = orders
        .filter(order => order.status === 'Delivered')
        .reduce((sum, order) => sum + order.totalAmount, 0);

      const monthlyData = Array(12).fill(0).map((_, i) => {
        const monthOrders = orders.filter(order => 
          new Date(order.orderDate).getMonth() === i && 
          order.status === 'Delivered'
        );
        return {
          month: new Date(0, i).toLocaleString('default', { month: 'short' }),
          revenue: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          count: monthOrders.length
        };
      });

      return { totalRevenue, monthly: monthlyData };
    };

    if (orders.length > 0) {
      setAnalytics(calculateAnalytics());
    }
  }, [orders, timeRange]);

  const updateOrderStatus = async (orderId,status) => {
    try {
      const response = await fetch(`http://localhost:4000/approveOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId,status }),
        credentials: 'include' // Include cookies for session management
      });

      if (response.ok) {
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: status} : order
        ));
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return <FaCheckCircle className="text-green-500" />;
      case 'Out for delivery':
        return <FaShippingFast className="text-blue-500" />;
      default:
        return <FaBox className="text-yellow-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
<div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
  <div className="flex items-center space-x-4">
    <h1 className="text-2xl font-bold text-gray-800">
      Admin Dashboard
    </h1>
    <span className="hidden md:inline-block h-6 w-px bg-gray-200"></span>
    <p className="hidden md:block text-sm text-gray-500">
      Manage your store products and inventory
    </p>
  </div>
  <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer" onClick={() => navigate('/admin/inventory')}>
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
    <span>Manage Inventory</span>
  </button>
</div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Card */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <FiBarChart2 className="mr-2" /> Sales Analytics
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange('monthly')}
                className={`px-3 py-1 rounded ${timeRange === 'monthly' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {analytics ? (
            <div>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex items-center">
                  <FiDollarSign className="text-blue-500 mr-2" />
                  <span className="font-semibold">Total Revenue:</span>
                  <span className="ml-2 text-xl">₹{analytics.totalRevenue.toLocaleString()}</span>
                </div>
              </div>

              <div className="h-64 bg-gray-50 rounded-lg p-4">
                <div className="flex items-end h-48 justify-between">
                  {analytics.monthly.map((month, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-blue-500 w-8 rounded-t-md"
                        style={{ height: `${(month.revenue / analytics.totalRevenue) * 100}%` }}
                      ></div>
                      <span className="text-xs mt-2">{month.month}</span>
                      <span className="text-xs font-semibold">₹{month.revenue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
                        
        {/* Quick Stats Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiCalendar className="mr-2" /> Order Stats
          </h2>
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600">Delivered</div>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === 'Delivered').length}
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600">Out for delivery</div>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === 'Out for delivery').length}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm text-yellow-600">Preparing</div>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === 'Preparing').length}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm text-red-600">Cancelled</div>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === 'Cancelled').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiPackage className="mr-2" /> Recent Orders
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.expectedDeliveryDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <span className="ml-2">{order.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {order.status === 'Preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Out for delivery')}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Mark as Out for delivery"
                        >
                          <FiTruck className="h-5 w-5" />
                        </button>
                      )}
                      {order.status === 'Out for delivery' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Delivered')}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Mark as Delivered"
                        >
                          <FiCheck className="h-5 w-5" />
                        </button>
                      )}
                      {order.status !== 'Delivered' &&order.status!=='Cancelled' && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this order?')) {
                              updateOrderStatus(order._id, 'Cancelled');
                            }
                          }}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Cancel Order"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLanding;