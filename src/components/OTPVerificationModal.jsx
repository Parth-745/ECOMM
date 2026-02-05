import { useState, useEffect } from 'react';
import { FiX, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const OTPVerificationModal = ({ isOpen, orderId, onClose, onVerifySuccess }) => {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          toast.error('OTP verification time expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }

    setVerifying(true);
    try {
      const token = localStorage.getItem('deliveryAgentToken');
      const response = await fetch('http://localhost:4000/verifyDeliveryOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, otp }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Order delivered successfully! ✅');
        setOtp('');
        onVerifySuccess();
        onClose();
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Error verifying OTP');
      console.log(error);
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Verify Delivery OTP</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Timer */}
        <div className={`flex items-center justify-center gap-2 p-4 rounded-lg mb-6 ${
          timeLeft < 60 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
        }`}>
          <FiClock className={timeLeft < 60 ? 'text-red-600' : 'text-blue-600'} />
          <span className={`text-lg font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
            Time Left: {formatTime(timeLeft)}
          </span>
        </div>

        {/* OTP Info */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 text-sm">
            📧 An OTP has been sent to the customer's email address. Ask them to provide the 4-digit OTP.
          </p>
        </div>

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 4-Digit OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength="4"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={verifying || timeLeft === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {verifying ? 'Verifying...' : '✅ Verify OTP'}
          </button>
        </form>

        {timeLeft === 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-center font-semibold">Time Expired</p>
            <p className="text-red-600 text-sm text-center mt-1">Please close and try again</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OTPVerificationModal;
