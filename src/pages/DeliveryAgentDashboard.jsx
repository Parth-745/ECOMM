import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DeliveryAgentNavbar from '../components/DeliveryAgentNavbar';
import toast from 'react-hot-toast';

const DeliveryAgentDashboard = () => {
  const navigate = useNavigate();
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if delivery agent is logged in
    const token = localStorage.getItem('deliveryAgentToken');
    if (!token) {
      navigate('/delivery_agentlogin');
      toast.error('Please login first');
      return;
    }

    // Fetch delivery agent data
    const fetchAgentData = async () => {
      try {
        const response = await fetch('http://localhost:4000/deliveryAgentData', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setAgentData(data.deliveryAgent);
        } else {
          navigate('/delivery_agentlogin');
        }
      } catch (error) {
        console.log('Error fetching agent data:', error);
        toast.error('Error loading dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <DeliveryAgentNavbar />
      <div className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome, {agentData?.name || 'Delivery Agent'}!</h1>
          <p className="text-gray-600 mb-8">Manage your deliveries and account from here.</p>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button 
              onClick={() => navigate('/delivery-agent/orders')}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 hover:shadow-lg transition text-left cursor-pointer"
            >
              <h3 className="text-gray-700 text-sm font-semibold mb-2">Active Deliveries</h3>
              <p className="text-4xl font-bold text-blue-600">📦</p>
              <p className="text-gray-600 text-xs mt-2">View pending orders</p>
            </button>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <h3 className="text-gray-700 text-sm font-semibold mb-2">Completed Today</h3>
              <p className="text-4xl font-bold text-green-600">1</p>
              <p className="text-gray-600 text-xs mt-2">Deliveries completed</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <h3 className="text-gray-700 text-sm font-semibold mb-2">Account Status</h3>
              <p className="text-lg font-bold text-purple-600 capitalize">{agentData?.status || 'active'}</p>
              <p className="text-gray-600 text-xs mt-2">Current status</p>
            </div>
          </div>

          {/* Agent Information */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Full Name</p>
                <p className="text-gray-800 font-semibold">{agentData?.name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Email</p>
                <p className="text-gray-800 font-semibold">{agentData?.email}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Phone</p>
                <p className="text-gray-800 font-semibold">{agentData?.phone}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Vehicle Type</p>
                <p className="text-gray-800 font-semibold capitalize">{agentData?.vehicle}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Vehicle Number</p>
                <p className="text-gray-800 font-semibold">{agentData?.vehicleNumber}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Address</p>
                <p className="text-gray-800 font-semibold">{agentData?.address}</p>
              </div>
            </div>
          </div>

          {/* Coming Soon Features */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h2 className="text-lg font-bold text-blue-900 mb-4">Coming Soon</h2>
            <ul className="text-blue-800 space-y-2">
              <li>📦 Real-time delivery tracking</li>
              <li>📍 Route optimization</li>
              <li>💬 Customer communication</li>
              <li>📊 Performance analytics</li>
              <li>💰 Earnings summary</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAgentDashboard;
