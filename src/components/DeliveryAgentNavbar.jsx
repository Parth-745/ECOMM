import { useState } from 'react';
import { 
  FiUser, 
  FiLogOut,
  FiSettings,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DeliveryAgentNavbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear the auth token from localStorage
    localStorage.removeItem('deliveryAgentToken');
    localStorage.removeItem('deliveryAgentData');
    toast.success('Logged out successfully');
    navigate('/delivery_agentlogin');
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 w-full z-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer" 
            onClick={() => navigate('/delivery-agent')}
          >
            <span className="text-xl font-bold text-gray-800">Groovo</span>
          </div>

          {/* Profile section */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center text-gray-500 hover:text-gray-700 p-1 rounded-full"
            >
              <FiUser className="h-6 w-6" />
              <span className="ml-1 text-sm">Profile</span>
              {isProfileOpen ? (
                <FiChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <FiChevronDown className="ml-1 h-4 w-4" />
              )}
            </button>

            {/* Profile dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    navigate('/delivery-agent/settings');
                    setIsProfileOpen(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <FiSettings className="mr-2" />
                  Account Settings
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsProfileOpen(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <FiLogOut className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DeliveryAgentNavbar;
