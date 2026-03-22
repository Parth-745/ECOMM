import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FirebaseContext } from "../context/FirebaseContext";
import { useContext } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  FaBoxOpen,
  FaShippingFast,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const OrderHistory = () => {
  const { user } = useContext(FirebaseContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState({});
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [activeReviewForm, setActiveReviewForm] = useState(null);
  const navigate = useNavigate();
    
  const fetchOrders = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("http://localhost:4000/getMyOrders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          const sortedOrders = data.orders.sort((a, b) => {
            if (a.status === "Preparing" && b.status !== "Preparing") return -1;
            if (a.status !== "Preparing" && b.status === "Preparing") return 1;
            return new Date(b.orderDate) - new Date(a.orderDate);
          });
          setOrders(sortedOrders);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  
    const fetchWeeklySchedules = async () => {
  const token = await user.getIdToken();

  const res = await fetch("http://localhost:4000/weekly-schedules", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (data.success) {
    setWeeklySchedules(data.schedules);
  }
    };

    useEffect(() => {
  if (user) {
    fetchOrders();
    fetchWeeklySchedules();
  }
}, [user]);

  const handleReviewChange = (orderId, field, value) => {
    setReviewData((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  };

  const submitReview = async (orderId, productId) => {
    try {
      const token = await user.getIdToken();
      console.log(reviewData);
      const response = await fetch("http://localhost:4000/AddReview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          rating: reviewData[orderId]?.rating,
          comment: reviewData[orderId]?.comment,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Review submitted successfully!");
        setActiveReviewForm(null);
        // Update local state to reflect the review
        setOrders((prevOrders) =>
          prevOrders.map((order) => {
            if (order._id === orderId) {
              const updatedProducts = order.products.map((product) => {
                if (product.product._id === productId) {
                  return {
                    ...product,
                    reviewed: true,
                  };
                }
                return product;
              });
              return { ...order, products: updatedProducts };
            }
            return order;
          }),
        );
      } else {
        toast.error(data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Delivered":
        return <FaCheckCircle className="text-green-500" />;
      case "Cancelled":
        return <FaTimesCircle className="text-red-500" />;
      case "Out for delivery":
        return <FaShippingFast className="text-blue-500" />;
      default:
        return <FaBoxOpen className="text-yellow-500" />;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 my-10">
        <h1 className="text-3xl font-bold mb-8">Your Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <FaBoxOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No orders yet
            </h3>
            <p className="mt-1 text-gray-500">
              Start shopping to see your orders here.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                navigate={navigate}
                formatDate={formatDate}
                getStatusIcon={getStatusIcon}
                reviewData={reviewData}
                handleReviewChange={handleReviewChange}
                submitReview={submitReview}
                activeReviewForm={activeReviewForm}
                setActiveReviewForm={setActiveReviewForm}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

const OrderCard = ({
  order,
  navigate,
  formatDate,
  getStatusIcon,
  reviewData,
  handleReviewChange,
  submitReview,
  activeReviewForm,
  setActiveReviewForm,
}) => {
  const remainingProducts = order.products.length - 1;
  const getOrderMinutes = (orderId) => {
    const id = String(orderId || "");
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 46) + 15;
  };

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Order #{order._id.toString().slice(-6).toUpperCase()}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Placed on {formatDate(order.orderDate)}
            </p>
            {order.isWeeklyOrder && (
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  Weekly Order
                </span>
                <span className="text-xs text-gray-600">
                  {order.weeklyDeliveryDay}, {order.weeklyDeliveryTimeSlot}
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 sm:mt-0 flex items-center">
            <span className="mr-2">{getStatusIcon(order.status)}</span>
            <span className="text-sm font-medium">{order.status}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-medium mb-4">Items</h4>
            <div className="space-y-4">
              {order.products.slice(0, 3).map((item, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex">
                    <div className="flex-shrink-0 h-20 w-20 rounded-md overflow-hidden">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
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

                  {/* Review Section for Delivered Orders */}
                  {order.status === "Delivered" && !item.reviewed && (
                    <div className="mt-3 pl-24">
                      {activeReviewForm ===
                      `${order._id}-${item.product._id}` ? (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  handleReviewChange(order._id, "rating", star)
                                }
                                className="mr-1"
                              >
                                <FaStar
                                  className={`h-5 w-5 ${reviewData[order._id]?.rating >= star ? "text-yellow-400" : "text-gray-300"}`}
                                />
                              </button>
                            ))}
                          </div>
                          <textarea
                            placeholder="Your review..."
                            className="w-full p-2 border rounded"
                            value={reviewData[order._id]?.comment || ""}
                            onChange={(e) =>
                              handleReviewChange(
                                order._id,
                                "comment",
                                e.target.value,
                              )
                            }
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              onClick={() => setActiveReviewForm(null)}
                              className="px-3 py-1 text-sm text-gray-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() =>
                                submitReview(order._id, item.product._id)
                              }
                              disabled={!reviewData[order._id]?.rating}
                              className={`px-3 py-1 text-sm rounded ${reviewData[order._id]?.rating ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setActiveReviewForm(
                              `${order._id}-${item.product._id}`,
                            )
                          }
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Write a Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {remainingProducts > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  and {remainingProducts} more product
                  {remainingProducts > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium mb-4"></h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div>
                <h4 className="text-lg font-medium mb-4">Order Summary</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>
                        Subtotal ({order.products.length} item
                        {order.products.length > 1 ? "s" : ""})
                      </span>
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

                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">
                      Shipping Address
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {order.shippingAddress}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-1">
                      {order.status === "Delivered"
                        ? "Delivered In"
                        : "Expected In"}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {getOrderMinutes(order._id)} mins
                    </p>
                  </div>

                  {order.isWeeklyOrder && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-1">
                        Weekly Schedule
                      </h4>
                      <p className="text-sm text-gray-700">
                        {order.weeklyDeliveryDay}, {order.weeklyDeliveryTimeSlot}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 bg-gray-50 sm:px-6">
        <div className="flex justify-between items-center">
          {/* //Left side buttons */}
          {/* <div className="flex gap-4">
            <button
              className="w-40 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-3xl transition"
              onClick={() => {
                // Skip logic
                setWeeklyDay("");
                setWeeklyTime("");
              }}
            >
              Skip
            </button>

            <button
              className="w-40 bg-red-600 hover:bg-red-700 text-white py-2 rounded-3xl transition"
              onClick={() => {
                // Delete logic
                setWeeklyDay("");
                setWeeklyTime("");
              }}
            >
              Delete
            </button>
          </div> */}

          {/* Right side button */}
          <button
            onClick={() => navigate(`/order-detail/${order._id}`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View Order Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
