import { useState, useEffect } from 'react';
import { FiPackage, FiCheck, FiX, FiDollarSign, FiBarChart2, FiCalendar, FiTruck } from 'react-icons/fi';
import { FaBox, FaShippingFast, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AdminLanding = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('monthly');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:4000/getAllOrders', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const data = await response.json();
        if (data.success !== true) {
          navigate('/');
          return;
        }

        const statusPriority = {
          Preparing: 1,
          Assigned: 2,
          'Out for delivery': 3,
          Delivered: 4,
          Cancelled: 5,
        };

        const sortedOrders = [...data.orders].sort((a, b) => {
          return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
        });

        setOrders(sortedOrders);
      } catch (error) {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  useEffect(() => {
    const calculateAnalytics = () => {
      const deliveredOrders = orders.filter((order) => order.status === 'Delivered');
      const currentYear = new Date().getFullYear();

      const monthly = MONTH_LABELS.map((month, monthIndex) => {
        const monthDeliveries = deliveredOrders.filter((order) => {
          const deliveryDate = new Date(order.deliveryCompleteTime || order.expectedDeliveryDate || order.orderDate);
          return deliveryDate.getFullYear() === currentYear && deliveryDate.getMonth() === monthIndex;
        });

        return {
          month,
          deliveries: monthDeliveries.length,
          revenue: monthDeliveries.reduce((sum, order) => sum + order.totalAmount, 0),
        };
      });

      return {
        totalDeliveries: deliveredOrders.length,
        totalRevenue: deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        maxRevenue: Math.max(...monthly.map((entry) => entry.revenue), 0),
        maxDeliveries: Math.max(...monthly.map((entry) => entry.deliveries), 0),
        monthly,
      };
    };

    setAnalytics(calculateAnalytics());
  }, [orders, timeRange]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch('http://localhost:4000/approveOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status,
                ...(status === 'Delivered' ? { deliveryCompleteTime: new Date().toISOString() } : {}),
              }
            : order,
        ),
      );
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return <FaCheckCircle className="text-green-500" />;
      case 'Out for delivery':
      case 'Assigned':
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
      <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <span className="hidden h-6 w-px bg-gray-200 md:inline-block"></span>
          <p className="hidden text-sm text-gray-500 md:block">Manage your store products and inventory</p>
        </div>
        <button
          className="flex cursor-pointer items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
          onClick={() => navigate('/admin/inventory')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          <span>Manage Inventory</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="flex items-center text-xl font-semibold">
              <FiBarChart2 className="mr-2" /> Delivery Analytics
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange('monthly')}
                className={`rounded px-3 py-1 ${timeRange === 'monthly' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {analytics ? (
            <div>
              <div className="mb-4 grid grid-cols-1 gap-4 rounded-lg bg-blue-50 p-4 sm:grid-cols-2">
                <div className="flex items-center">
                  <FiTruck className="mr-2 text-blue-500" />
                  <span className="font-semibold">Total Deliveries:</span>
                  <span className="ml-2 text-xl">{analytics.totalDeliveries}</span>
                </div>
                <div className="flex items-center">
                  <FiDollarSign className="mr-2 text-blue-500" />
                  <span className="font-semibold">Delivery Revenue:</span>
                  <span className="ml-2 text-xl">Rs. {analytics.totalRevenue.toLocaleString()}</span>
                </div>
              </div>

              <div className="h-64 rounded-lg bg-gray-50 p-4">
                <div className="flex h-48 items-end justify-between gap-2">
                  {analytics.monthly.map((month) => (
                    <div key={month.month} className="flex min-w-0 flex-1 flex-col items-center">
                      <div
                        className={`w-full max-w-10 rounded-t-md ${
                          month.deliveries > 0 ? 'bg-blue-500' : 'bg-blue-100'
                        }`}
                        style={{
                          height: `${
                            month.deliveries > 0
                              ? Math.max(
                                  (month.deliveries / Math.max(analytics.maxDeliveries, 1)) * 100,
                                  12,
                                )
                              : 8
                          }%`,
                        }}
                        title={`${month.month}: ${month.deliveries} deliveries, Rs. ${month.revenue}`}
                      ></div>
                      <span className="mt-2 text-xs">{month.month}</span>
                      <span className="text-xs font-semibold">Rs. {month.revenue}</span>
                      <span className="text-[10px] text-gray-500">{month.deliveries} deliveries</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="mb-4 flex items-center text-xl font-semibold">
            <FiCalendar className="mr-2" /> Order Stats
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-3">
              <div className="text-sm text-green-600">Delivered</div>
              <div className="text-2xl font-bold">{orders.filter((o) => o.status === 'Delivered').length}</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="text-sm text-blue-600">Out for delivery</div>
              <div className="text-2xl font-bold">{orders.filter((o) => o.status === 'Out for delivery').length}</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3">
              <div className="text-sm text-yellow-600">Preparing</div>
              <div className="text-2xl font-bold">{orders.filter((o) => o.status === 'Preparing').length}</div>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <div className="text-sm text-red-600">Cancelled</div>
              <div className="text-2xl font-bold">{orders.filter((o) => o.status === 'Cancelled').length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="mb-4 flex items-center text-xl font-semibold">
          <FiPackage className="mr-2" /> Recent Orders
        </h2>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">Rs. {order.totalAmount.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(order.orderDate)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.deliveryCompleteTime || order.expectedDeliveryDate)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <span className="ml-2">{order.status}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium space-x-2">
                      {order.status === 'Preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Out for delivery')}
                          className="p-1 text-blue-600 hover:text-blue-900"
                          title="Mark as Out for delivery"
                        >
                          <FiTruck className="h-5 w-5" />
                        </button>
                      )}
                      {order.status === 'Out for delivery' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Delivered')}
                          className="p-1 text-green-600 hover:text-green-900"
                          title="Mark as Delivered"
                        >
                          <FiCheck className="h-5 w-5" />
                        </button>
                      )}
                      {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this order?')) {
                              updateOrderStatus(order._id, 'Cancelled');
                            }
                          }}
                          className="p-1 text-red-600 hover:text-red-900"
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
