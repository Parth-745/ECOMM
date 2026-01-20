import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FirebaseContext } from "../context/FirebaseContext";
import { useContext } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FaGooglePay, FaPhoneAlt } from "react-icons/fa";
import { SiPaytm, SiVisa, SiMastercard } from "react-icons/si";
import { RiBankFill } from "react-icons/ri";
import { BsCashCoin } from "react-icons/bs";
import { toast } from "react-hot-toast";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PaymentPage = () => {
  const { user, cart, setcart } = useContext(FirebaseContext);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  const [isCOD, setIsCOD] = useState(true);

  const navigate = useNavigate();

  // Fetch user address
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("http://localhost:4000/getAddress", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log("Address data:", data);
        if (data.success && data.address) {
          setAddress(data.address);
        } else {
          setShowAddAddress(true);
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAddress();
    }
  }, [user]);

  const handleAddressSubmit = async (e) => {
    try {
      console.log("Saving address:", newAddress);
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:4000/saveAddress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address: newAddress }),
      });

      const data = await response.json();
      console.log("Save address response:", data);
      if (data.success) {
        setAddress(data.address);
        setShowAddAddress(false);
      }
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  const handlePayment = async () => {
    const toastid = toast.loading("Processing order...");

    if (!address) {
      toast.error("Please add a delivery address");
      toast.dismiss(toastid);
      return;
    }

    try {
      const token = await user.getIdToken();

      // 1️⃣ Create order first
      const response = await fetch("http://localhost:4000/createOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address,
          isCOD: isCOD ,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message);
        toast.dismiss(toastid);
        return;
      }

      // 2️⃣ COD → DONE
      if (isCOD) {
        setcart([]);
        navigate("/confirmation");
        toast.dismiss(toastid);
        return;
      }

      // 3️⃣ ONLINE → Razorpay popup
      const res = await loadRazorpay();
      if (!res) {
        toast.error("Razorpay SDK failed to load");
        toast.dismiss(toastid);
        return;
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_API_KEY;

      if (!razorpayKey) {
        toast.error("Razorpay key missing");
        toast.dismiss(toastid);
        return;
      }

      toast.dismiss(toastid);

      const options = {
        key: razorpayKey,
        amount: data.order.totalAmount * 100,
        currency: "INR",
        name: "Step Up",
        description: "Order Payment",
        order_id:data.order.razorpayOrderId,

        handler: async function (razorpayResponse) {
          // console.log(razorpayResponse);
          try {
            // 4️⃣ VERIFY PAYMENT (backend)
            
            await fetch("http://localhost:4000/verifyPayment", {
              method: "POST",
              headers: { "Content-Type": "application/json"},
              body: JSON.stringify({
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                orderId: data.order._id,
              }),
            });

            setcart([]);
            navigate("/confirmation");
            toast.success("Payment successful");
          } catch (err) {
            toast.error("Payment verification failed");
            console.log(err);
          }
        },

        prefill: {
          email: user.email,
        },

        theme: { color: "#000000" },
      };

      const rzp = new window.Razorpay(options);

      // Optional: handle failure
      rzp.on("payment.failed", () => {
        toast.error("Payment failed");
      });

      rzp.open();
    } catch (e) {
      console.error(e);
      toast.error("Order failed");
      toast.dismiss(toastid);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 my-10">
        <h1 className="text-3xl font-bold mb-8">Complete Your Purchase</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Address and Payment */}
          <div className="space-y-8">
            {/* Address Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>

              {address && !showAddAddress ? (
                <div className="space-y-2">
                  <p>{address}</p>
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="text-gray-800 mt-4 text-sm font-medium cursor-pointer hover:underline"
                  >
                    Change Address
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    New Address
                  </label>
                  <textarea
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                  />

                  <div className="flex justify-end space-x-4 pt-4">
                    {address && (
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      className="px-4 py-2 bg-black text-white rounded-md cursor-pointer hover:bg-gray-900 transition-colors"
                      onClick={handleAddressSubmit}
                    >
                      Save Address
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

              {/* Cash on Delivery */}
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  isCOD ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
                onClick={() => setIsCOD(true)}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={isCOD}
                    readOnly
                    className="h-4 w-4 text-blue-600"
                  />
                  <label className="ml-3 font-medium flex items-center">
                    <BsCashCoin className="mr-2" />
                    Cash on Delivery
                  </label>
                </div>
              </div>

              {/* Pay Online */}
              <div
                className={`border rounded-lg p-4 cursor-pointer mt-4 ${
                  !isCOD ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
                onClick={() => setIsCOD(false)}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={!isCOD}
                    readOnly
                    className="h-4 w-4 text-blue-600"
                  />
                  <label className="ml-3 block font-medium">
                    Pay Online
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow h-fit sticky top-8">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  ₹
                  {cart
                    .reduce(
                      (sum, item) => sum + item.product.price * item.quantity,
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-500">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>
                  ₹
                  {(
                    cart.reduce(
                      (sum, item) => sum + item.product.price * item.quantity,
                      0
                    ) * 0.18
                  ).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>
                  ₹
                  {(
                    cart.reduce(
                      (sum, item) => sum + item.product.price * item.quantity,
                      0
                    ) * 1.18
                  ).toFixed(2)}
                </span>
              </div>

              <button
                onClick={handlePayment}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Proceed to checkout
              </button>

              <p className="text-sm text-gray-500 mt-4">
                By placing your order, you agree to our Terms of Service and
                Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentPage;