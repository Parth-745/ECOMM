import React, { useContext, useState, useEffect } from "react";
import { FirebaseContext } from "../context/FirebaseContext";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { toast } from "react-hot-toast";

const MyCart = () => {
  const { cart, weeklyCart, user, setcart, setweeklycart } =
    useContext(FirebaseContext);
  const navigate = useNavigate();

  // Tab and Subscription state
  const [activeTab, setActiveTab] = useState("cart"); // 'cart' or 'weekly'
  const [hasGroovoPlus, setHasGroovoPlus] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [weeklyDay, setWeeklyDay] = useState("");
  const [weeklyTime, setWeeklyTime] = useState("");
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [isSubmittingWeekly, setIsSubmittingWeekly] = useState(false);

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Check Groovo Plus subscription status
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) {
        setHasGroovoPlus(false);
        setIsLoadingSubscription(false);
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
          // Check if user has active Groovo Plus subscription
          const userData = data.user;
          const isActive =
            userData.isGroovoPlusActive &&
            userData.subscriptionStartDate &&
            userData.subscriptionEndDate &&
            new Date() >= new Date(userData.subscriptionStartDate) &&
            new Date() <= new Date(userData.subscriptionEndDate);

          setHasGroovoPlus(isActive);
        } else {
          setHasGroovoPlus(false);
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
        setHasGroovoPlus(false);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    checkSubscriptionStatus();
  }, [user]);

  useEffect(() => {
    const fetchWeeklySchedule = async () => {
      if (!user) {
        setWeeklyDay("");
        setWeeklyTime("");
        setWeeklyEnabled(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch("http://localhost:4000/weekly-schedule", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.schedule) {
          setWeeklyDay(data.schedule.deliveryDay || "");
          setWeeklyTime(data.schedule.deliveryTimeSlot || "");
          setWeeklyEnabled(true);
        } else {
          setWeeklyEnabled(false);
        }
      } catch (error) {
        console.error("Error fetching weekly schedule:", error);
      }
    };

    fetchWeeklySchedule();
  }, [user]);

  const calculateTotal = () =>
    cart?.reduce(
      (total, item) => total + item.product?.price * item.quantity,
      0,
    ) || 0;
  const calculateTotalItems = () =>
    cart?.reduce((total, item) => total + item.quantity, 0) || 0;

  // Save weekly schedule to backend
  const saveWeeklyScheduleToBackend = async () => {
    if (!weeklyCart || weeklyCart.length === 0) {
    toast.error("At least one item must be added to the weekly schedule");
    return;
    }
    if (!weeklyDay || !weeklyTime) {
      toast.error("Please select delivery day and time");
      return;
    }

    setIsSubmittingWeekly(true);

    try {
      const token = await user.getIdToken();

      const activeWeeklyItems = weeklyCart.filter(
        (item) => !item.skipNextDelivery,
      );

      if (activeWeeklyItems.length === 0) {
        toast.error(
          "All weekly items are skipped for the next delivery. Unskip or add another item.",
        );
        return;
      }

      // Format weekly items from cart
      const weeklyItems = activeWeeklyItems.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
      }));

      const response = await fetch("http://localhost:4000/weekly-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weeklyItems: weeklyItems,
          deliveryDay: weeklyDay,
          deliveryTimeSlot: weeklyTime,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          "Weekly schedule created successfully! Payment by default is Cash on Delivery.",
        );
        setShowPaymentModal(false);
        setSelectedPaymentMethod("");
        setWeeklyEnabled(true);
        setweeklycart(data.weeklyCart || []);
      } else {
        toast.error(data.message || "Failed to create weekly schedule");
      }
    } catch (error) {
      console.error("Error saving weekly schedule:", error);
      toast.error("Failed to save weekly schedule. Please try again.");
    } finally {
      setIsSubmittingWeekly(false);
    }
  };

  async function handleSkipWeekly() {
    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:4000/weekly/skip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.success) {
        setweeklycart(data.weeklyCart || []);
        toast.success(data.message || "Next delivery skipped");
      } else {
        toast.error(data.message || "Failed to skip next delivery");
      }
    } catch (error) {
      console.error("Error skipping weekly delivery:", error);
      toast.error("Failed to skip next delivery");
    }
  }

  async function handleDeleteWeekly() {
    const confirmed = window.confirm(
      "Delete weekly cart items permanently? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:4000/weekly/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.success) {
        setweeklycart(data.weeklyCart || []);
        toast.success(data.message || "Weekly cart updated");
      } else {
        toast.error(data.message || "Failed to remove weekly items");
      }
    } catch (error) {
      console.error("Error deleting weekly items:", error);
      toast.error("Failed to remove weekly items");
    }
  }

  // Update weekly schedule
  const updateWeeklyScheduleToBackend = async () => {
    if (!weeklyDay || !weeklyTime) {
      toast.error("Please select delivery day and time");
      return;
    }

    setIsSubmittingWeekly(true);

    try {
      const token = await user.getIdToken();

      const response = await fetch(
        "http://localhost:4000/weekly-schedule/time",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            deliveryDay: weeklyDay,
            deliveryTimeSlot: weeklyTime,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Weekly schedule updated successfully!");
        setShowPaymentModal(false);
        setSelectedPaymentMethod("");
      } else {
        // Check for 1-hour lock error
        if (data.message && data.message.includes("1 hour")) {
          toast.error("⏱️ " + data.message);
        } else {
          toast.error(data.message || "Failed to update weekly schedule");
        }
      }
    } catch (error) {
      console.error("Error updating weekly schedule:", error);
      toast.error("Failed to update weekly schedule. Please try again.");
    } finally {
      setIsSubmittingWeekly(false);
    }
  };

  async function handleIncrease(item, cartType = "regular") {
    try {
      const token = await user.getIdToken();

      const [response] = await toast.promise(
        Promise.all([
          fetch("http://localhost:4000/addtoCart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId: item.product._id,
              quantity: 1,
              size: item.size,
              cartType: cartType,
            }),
          }),
          delay(1500), // ensures at least 1.5s delay
        ]),
        {
          loading: "Adding...",
        },
      );

      const data = await response.json();

      if (data.success) {
        if (cartType === "weekly") {
          setweeklycart(data.weeklyCart || []);
        } else {
          setcart(data.cart || []);
          setweeklycart(data.weeklyCart || []);
        }
        toast.success("Item added to cart!");
      } else {
        toast.error(data.message || "Add to cart failed.");
      }
    } catch (e) {
      console.error("Error adding to cart:", e);
    }
  }

  async function handleDecrease(item, cartType = "regular") {
    try {
      const token = await user.getIdToken();

      const [response] = await toast.promise(
        Promise.all([
          fetch("http://localhost:4000/deleteFromCart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId: item.product._id,
              quantity: 1,
              size: item.size,
              cartType: cartType,
            }),
          }),
          delay(1500), // ensures at least 1.5s delay
        ]),
        {
          loading: "Removing...",
          success: "Item Removed!",
          error: "Failed to remove item",
        },
      );

      const data = await response.json();

      if (data.success) {
        if (cartType === "weekly") {
          setweeklycart(data.weeklyCart || []);
        } else {
          setcart(data.cart || []);
        }
      } else {
        toast.error(data.message || "Add to cart failed.");
      }
    } catch (e) {
      console.error("Error deleting from cart:", e);
    }
  }

  async function handleRemove(item, cartType = "regular") {
    try {
      const token = await user.getIdToken();

      const [response] = await toast.promise(
        Promise.all([
          fetch("http://localhost:4000/deleteFromCart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId: item.product._id,
              quantity: item.quantity,
              size: item.size,
              cartType: cartType,
            }),
          }),
          delay(1500), // ensures at least 1.5s delay
        ]),
        {
          loading: "Removing...",
          success: "Item Removed!",
          error: "Failed to remove item",
        },
      );

      const data = await response.json();

      if (data.success) {
        if (cartType === "weekly") {
          setweeklycart(data.weeklyCart || []);
        } else {
          setcart(data.cart || []);
        }
      } else {
        toast.error(data.message || "Add to cart failed.");
      }
    } catch (e) {
      console.error("Error removing from cart:", e);
    }
  }

  if (
    (!cart || cart.length === 0) &&
    (!weeklyCart || weeklyCart.length === 0)
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8 text-center border border-gray-200">
            <div className="mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20 mx-auto text-[#1A2433]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1A2433] mb-3">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-6">
              Start shopping to add items to your cart
            </p>
            <Link
              to="/"
              className="inline-block bg-[#1A2433] hover:bg-[#0f172a] text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render cart items section
  const CartItemsSection = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    {cart.map((item) => (
      <div
        key={item._id}
        className="p-6 border-b border-gray-100 last:border-b-0 flex flex-col sm:flex-row gap-6 hover:bg-gray-50 transition-colors"
      >
        {/* Product Image */}
        <div className="w-full sm:w-40 h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          <img
            loading="lazy"
            src={item?.product?.imageUrl}
            alt={item?.product?.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://via.placeholder.com/300/1A2433/FFFFFF?text=Product";
            }}
          />
        </div>

        {/* Product Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Row */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-xl text-[#1A2433]">
                {item?.product?.name}
              </h3>

              <p className="text-gray-600 mt-1">
                {item?.product?.category}
              </p>

              {item?.product?.offer && (
                <span className="inline-block bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                  {item?.product?.offer}
                </span>
              )}
            </div>

            {/* Price */}
            <p className="font-bold text-lg text-[#1A2433]">
              ₹{item?.product?.price?.toFixed(2)}
            </p>
          </div>

          {/* Bottom Row */}
          <div className="mt-auto pt-4 flex items-center justify-between">
            {/* Quantity Controls */}
            <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
              <button
                className="px-4 py-2 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                onClick={() => handleDecrease(item, "regular")}
              >
                −
              </button>

              <span className="px-4 text-gray-800 font-medium">
                {item?.quantity}
              </span>

              <button
                className="px-4 py-2 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                onClick={() => handleIncrease(item, "regular")}
              >
                +
              </button>
            </div>

            {/* Remove Button */}
            <button
              className="text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors cursor-pointer"
              onClick={() => handleRemove(item, "regular")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Remove
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
);


  // Render weekly cart section
  const WeeklyCartSection = () => {
    if (!hasGroovoPlus) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-12 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Weekly Cart Locked
            </h2>
            <p className="text-grey-600 mb-6">
              Weekly Cart is available only for Groovo Plus members.
            </p>
            <Link
              to="/groovo-plus"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg"
            >
              Get Groovo Plus
            </Link>
          </div>
        </div>
      );
    }

    // Weekly cart with Groovo Plus
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {weeklyCart && weeklyCart.length > 0 ? (
          <>
            {weeklyCart.map((item) => (
              <div
                key={item._id}
                className="p-6 border-b border-gray-100 last:border-b-0 flex flex-col sm:flex-row gap-6 hover:bg-gray-50 transition-colors"
              >
                <div className="w-full sm:w-40 h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    loading="lazy"
                    src={item?.product?.imageUrl}
                    alt={item?.product?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://via.placeholder.com/300/1A2433/FFFFFF?text=Product";
                    }}
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-xl text-[#1A2433]">
                        {item?.product?.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-600">
                          {item?.product?.category}
                        </p>
                      </div>
                      {item?.product?.offer && (
                        <span className="inline-block bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                          {item?.product?.offer}
                        </span>
                      )}
                      {item?.skipNextDelivery && (
                        <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full mt-2 ml-2">
                          Skipped Next Delivery
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-lg text-[#1A2433]">
                      ₹{item?.product?.price?.toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                      <button
                        className="px-4 py-2 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                        onClick={() => handleDecrease(item, "weekly")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 12H4"
                          />
                        </svg>
                      </button>
                      <span className="px-4 text-gray-800 font-medium">
                        {item?.quantity}
                      </span>
                      <button
                        className="px-4 py-2 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                        onClick={() => handleIncrease(item, "weekly")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>
                    <button
                      className="text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors cursor-pointer"
                      onClick={() => handleRemove(item, "weekly")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-600">
              No items in your cart for weekly delivery.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-4">
        {/* Tab Navigation */}
        <div className="flex gap-0 mb-8 bg-white rounded-t-xl border border-b-0 border-gray-200">
          <button
            onClick={() => setActiveTab("cart")}
            className={`flex-1 py-4 px-6 font-medium transition-all duration-200 ${
              activeTab === "cart"
                ? "text-[#1A2433] border-b-2 border-[#1A2433] bg-white"
                : "text-gray-600 hover:text-gray-900 bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Cart
            </div>
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`flex-1 py-4 px-6 font-medium transition-all duration-200 ${
              activeTab === "weekly"
                ? "text-[#1A2433] border-b-2 border-[#1A2433] bg-white"
                : "text-gray-600 hover:text-gray-900 bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Weekly Cart
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* LEFT: Cart / Weekly Items */}
          <div className="lg:col-span-2">
            {activeTab === "cart" ? (
              <CartItemsSection />
            ) : (
              <WeeklyCartSection />
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-[#1A2433] rounded-xl shadow-lg text-white sticky top-8">
              <div className="p-3 border-b border-gray-700">
                <h2 className="text-xl font-bold">
                  {activeTab === "cart"
                    ? "Order Summary"
                    : "Weekly Delivery Setup"}
                </h2>
                <p className="text-gray-300 text-sm mt-1">
                  {activeTab === "cart"
                    ? `${calculateTotalItems()} ${calculateTotalItems() === 1 ? "item" : "items"}`
                    : "Configure your weekly delivery"}
                </p>
              </div>

              {activeTab === "cart" ? (
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div
                        key={item._id}
                        className="flex justify-between items-center"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-300">
                              {item?.quantity} ×
                            </span>
                            <span className="font-medium text-gray-100 line-clamp-1">
                              {item?.product?.name}
                            </span>
                          </div>
                        </div>
                        <span className="font-medium">
                          ₹{(item.product?.price * item?.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}

                    <div className="border-t border-gray-700 pt-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Subtotal</span>
                        <span>₹{calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Shipping</span>
                        <span className="text-green-400">Free</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-xl text-white">
                        ₹{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    className="w-full bg-white hover:bg-gray-100 text-[#1A2433] font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={() => {
                      navigate("/payment");
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    Proceed to Checkout
                  </button>

                  <div className="mt-4 text-center">
                    <Link
                      to="/"
                      className="text-gray-300 hover:text-white hover:underline inline-flex items-center gap-1 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  {hasGroovoPlus && (
                    <div className="space-y-5">
                      {/* Delivery Day */}
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Delivery Day
                        </label>
                        <select
                          value={weeklyDay}
                          onChange={(e) => setWeeklyDay(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="" className="text-gray-400">
                            Select a day
                          </option>
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </div>

                      {/* Delivery Time */}
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Delivery Time Slot
                        </label>
                        <select
                          value={weeklyTime}
                          onChange={(e) => setWeeklyTime(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="" className="text-gray-400">
                            Select a time slot
                          </option>
                          <option value="8:00 AM - 10:00 AM">
                            8:00 AM - 10:00 AM
                          </option>
                          <option value="10:00 AM - 12:00 PM">
                            10:00 AM - 12:00 PM
                          </option>
                          <option value="12:00 PM - 2:00 PM">
                            12:00 PM - 2:00 PM
                          </option>
                          <option value="2:00 PM - 4:00 PM">
                            2:00 PM - 4:00 PM
                          </option>
                          <option value="4:00 PM - 6:00 PM">
                            4:00 PM - 6:00 PM
                          </option>
                          <option value="6:00 PM - 8:00 PM">
                            6:00 PM - 8:00 PM
                          </option>
                        </select>
                      </div>
                      <div classname="flex justify-between gap-4">
                        <button
                          className="w-40  bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-3xl transition "
                          onClick={handleSkipWeekly}
                        >
                          Skip 
                        </button>

                        <button
                          className="w-40 bg-red-600 hover:bg-red-700 text-white py-2 rounded-3xl transition ml-6"
                          onClick={handleDeleteWeekly}
                        >
                          Delete
                        </button>
                      </div>

                      {weeklyDay && weeklyTime && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-green-800">
                            <span className="block mb-1">Weekly Delivery:</span>
                            <span className="text-lg font-bold">
                              {weeklyDay}, {weeklyTime}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <h3 className="text-sm font-medium text-yellow-800">
                              How Weekly Cart Works
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              Items in your regular cart will be automatically
                              delivered every week on your chosen day and time.
                              You can modify this anytime.
                            </p>
                          </div>
                        </div>
                      </div> */}

                      {weeklyDay && weeklyTime && (
                        <div className="space-y-4 mt-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <div>
                                <h3 className="text-sm font-medium text-green-800">
                                  Payment Method
                                </h3>
                                <p className="text-sm text-green-700 mt-1">
                                  Weekly deliveries are paid by{" "}
                                  <strong>Cash on Delivery (COD)</strong> by
                                  default. No advance payment required.
                                </p>
                              </div>
                            </div>
                          </div>

                          <button
                            className="w-full bg-white hover:bg-gray-100 text-[#1A2433] font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                            onClick={() => saveWeeklyScheduleToBackend()}
                            disabled={isSubmittingWeekly}
                          >
                            {isSubmittingWeekly ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1A2433]"></div>
                                Setting up...
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                  />
                                </svg>
                                Confirm Weekly Schedule
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Delivery Configuration Modal - kept for regular cart compatibility */}
      {showWeeklyModal && activeTab === "cart" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Setup Weekly Delivery
                </h2>
                <button
                  onClick={() => setShowWeeklyModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Day
                  </label>
                  <select
                    value={weeklyDay}
                    onChange={(e) => setWeeklyDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select a day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Time Slot
                  </label>
                  <select
                    value={weeklyTime}
                    onChange={(e) => setWeeklyTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select a time slot</option>
                    <option value="8:00 AM - 10:00 AM">
                      8:00 AM - 10:00 AM
                    </option>
                    <option value="10:00 AM - 12:00 PM">
                      10:00 AM - 12:00 PM
                    </option>
                    <option value="12:00 PM - 2:00 PM">
                      12:00 PM - 2:00 PM
                    </option>
                    <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</option>
                    <option value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</option>
                    <option value="6:00 PM - 8:00 PM">6:00 PM - 8:00 PM</option>
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-yellow-600 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">
                        Groovo Plus Feature
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your current cart items will be delivered weekly at the
                        selected time. You can modify this schedule anytime from
                        your profile.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowWeeklyModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors"
                  onClick={() => {
                    if (!weeklyDay || !weeklyTime) {
                      toast.error("Please select day and time");
                      return;
                    }
                    setWeeklyEnabled(true);
                    setShowWeeklyModal(false);
                    toast.success("Weekly delivery enabled");
                  }}
                >
                  Enable Weekly Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCart;
