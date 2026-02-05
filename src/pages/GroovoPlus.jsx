import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FirebaseContext } from "../context/FirebaseContext";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

const GroovoPlus = () => {
  const { user } = useContext(FirebaseContext);
  const navigate = useNavigate();

  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Razorpay Script Loader
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Check subscription status on component mount
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch("http://localhost:4000/fetchUserData", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          const userData = data.user;
          const isActive =
            userData.isGroovoPlusActive &&
            userData.subscriptionStartDate &&
            userData.subscriptionEndDate &&
            new Date() >= new Date(userData.subscriptionStartDate) &&
            new Date() <= new Date(userData.subscriptionEndDate);

          setHasActiveSubscription(isActive);
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
        toast.error("Failed to check subscription status");
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, [user]);

  // Handle Groovo Plus purchase
  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please login to purchase Groovo Plus");
      navigate("/auth");
      return;
    }

    if (hasActiveSubscription) {
      toast.error("You already have an active Groovo Plus subscription");
      return;
    }

    setIsPaymentLoading(true);

    try {
      const token = await user.getIdToken();

      // 1️⃣ Create order using SAME endpoint as cart
      const response = await fetch("http://localhost:4000/createOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isSubscription: true,
          amount: 99, // fixed ₹99
          isCOD: false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create order");
      }

      // 2️⃣ Load Razorpay
      const res = await loadRazorpay();
      if (!res) {
        toast.error("Razorpay SDK failed to load");
        setIsPaymentLoading(false);
        return;
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_API_KEY;

      const options = {
        key: razorpayKey,
        amount: 99 * 100, // always ₹99
        currency: "INR",
        name: "Groovo",
        description: "Groovo Plus Subscription",
        order_id: data.order.razorpayOrderId,

        handler: async function (razorpayResponse) {
          try {
            await fetch("http://localhost:4000/verifyPayment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                orderId: data.order._id,
                isSubscription: true,
              }),
            });

            // Activate subscription
            await fetch("http://localhost:4000/activateGroovoPlus", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });

            setHasActiveSubscription(true);
            toast.success("Groovo Plus activated!");
            navigate("/");
          } catch (err) {
            toast.error("Subscription activation failed");
          }
        },

        prefill: {
          email: user.email,
        },

        theme: { color: "#000000" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Payment failed");
      setIsPaymentLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-lg">
            <svg
              className="w-10 h-10 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
            Groovo Plus
          </h1>
          <p className="text-xl text-blue-100 font-medium max-w-2xl mx-auto leading-relaxed">
            Elevate your grocery shopping experience with premium benefits and
            convenience
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <svg
              className="w-5 h-5 text-yellow-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span className="text-white font-semibold">
              Premium Subscription
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Subscription Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Groovo Plus</h2>
                  <p className="text-yellow-100">Premium Subscription</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">₹99</div>
                  <div className="text-yellow-100 text-sm">3 months</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Free Delivery on All Orders
                    </h3>
                    <p className="text-gray-600 text-sm">
                      No delivery charges on any order during your subscription
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Weekly Scheduled Delivery
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Set up recurring deliveries with your favorite items
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Smart Reminders
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Email notifications 1 hour before delivery with
                      confirmation options
                    </p>
                  </div>
                </div>
              </div>

              {hasActiveSubscription ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="font-medium">
                      Groovo Plus already active
                    </span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    You're enjoying all premium benefits!
                  </p>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={isPaymentLoading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-black font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {isPaymentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Buy Groovo Plus - ₹99
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Features Detail Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              How Weekly Delivery Works
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Save Your Weekly Items
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Choose your favorite products and quantities for weekly
                    delivery
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Select Delivery Schedule
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Pick your preferred day (Monday-Sunday) and time slot (8 AM
                    - 8 PM)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Smart Reminders
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Receive email notification 1 hour before delivery with
                    YES/NO options
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Automatic Delivery
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Your groceries arrive at your doorstep on schedule
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">💡 Pro Tip</h4>
              <p className="text-gray-600 text-sm">
                You can modify your weekly schedule anytime from your account
                settings. Skip weeks or change items as needed!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroovoPlus;
