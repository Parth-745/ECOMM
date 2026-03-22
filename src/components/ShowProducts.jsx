import { useContext, useState, useEffect } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { FirebaseContext } from "../context/FirebaseContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ShowProducts = ({ visibleProducts }) => {
    const { user, setcart, setweeklycart } = useContext(FirebaseContext);
    const navigate = useNavigate();
    const [showOptions, setShowOptions] = useState(null); // Track which product is showing options
    const [hasGroovoPlus, setHasGroovoPlus] = useState(false);
    const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    async function addtocart(item, cartType = 'regular') {
        try {
            if (!user) {
                toast.error("Please login to add items to cart.");
                return;
            }

            // Check product availability before adding to cart
            if (item.quantity <= 0) {
                toast.error("This product is out of stock");
                return;
            }

            const token = await user.getIdToken();

            const [response] = await toast.promise(
                Promise.all([
                    fetch('http://localhost:4000/addtoCart', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            productId: item._id,
                            quantity: 1,
                            size: "US 8", // Default size, can be made dynamic
                            cartType: cartType // Send the cart type to backend
                        }),
                    }),
                    delay(1500)
                ]),
                {
                    loading: cartType === 'weekly' ? 'Adding to weekly cart...' : 'Adding to cart...',
                    success: cartType === 'weekly' ? 'Item added to weekly cart!' : 'Item added successfully!',
                    error: 'Failed to add item',
                }
            );

            const data = await response.json();

            if (data.success) {
                // Set the appropriate cart based on cartType
                if (cartType === 'weekly') {
                    setweeklycart(data.weeklyCart || []);
                } else {
                    setcart(data.cart || []);
                }
                setShowOptions(null);
            } else {
                toast.error(data.message || "Add to cart failed.");
            }
        } catch (e) {
            console.error("Error adding to cart:", e);
        }
    }

    const handleAddToCartClick = (product) => {
        if (!user) {
            toast.error("Please login to add items to cart.");
            return;
        }

        if (product.quantity <= 0) {
            toast.error("This product is out of stock");
            return;
        }

        if (hasGroovoPlus) {
            // Show options on the card
            setShowOptions(product._id);
        } else {
            // Direct add to regular cart for non-Groovo Plus users
            addtocart(product, 'regular');
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 cursor-pointer">
                {visibleProducts?.length > 0 && 
                    visibleProducts.map((product, index) => (
                        <div key={index} className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                            {/* Stock indicator ribbon */}
                            {product.quantity <= 0 && (
                                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 text-xs font-bold rounded-full z-10">
                                    SOLD OUT
                                </div>
                            )}
                            {product.quantity > 0 && product.quantity <= 10 && (
                                <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-full z-10">
                                    ONLY {product.quantity} LEFT
                                </div>
                            )}

                            <div className="h-80 overflow-hidden relative">
                                <img 
                                    loading='lazy'
                                    src={product.imageUrl} 
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onClick={() => navigate(`/single-products/${product._id}`)}
                                />
                            </div>
                            
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {product.name.length > 12 ? `${product.name.substring(0, 12)}...` : product.name}
                                        </h3>
                                        <p className="text-gray-600">{product.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold">₹{product.price}</p>
                                        <div className="flex items-center justify-end mt-1">
                                            {[1, 2, 3, 4, 5].map((star) => {
                                                const rating = product.ratings || 0;
                                                return (
                                                    <span key={star} className="text-yellow-400">
                                                        {rating >= star ? (
                                                            <FaStar className="w-4 h-4" />
                                                        ) : rating >= star - 0.5 ? (
                                                            <FaStarHalfAlt className="w-4 h-4" />
                                                        ) : (
                                                            <FaRegStar className="w-4 h-4" />
                                                        )}
                                                    </span>
                                                );
                                            })}
                                            <span className="text-xs text-gray-500 ml-1">({product.reviews.length || 0})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quantity indicator */}
                                {product.quantity > 0 && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        {product.quantity} units available
                                    </p>
                                )}

                                {product.quantity <= 0 && (
                                    <p className="mt-2 text-sm text-red-500">
                                        Will be restocked soon
                                    </p>)}

                                {showOptions === product._id ? (
                                    // Show cart type options on the card
                                    <div className="mt-4 flex flex-col gap-2">
                                        <button 
                                            className="w-full py-2 px-3 bg-black text-white hover:bg-gray-800 rounded-lg font-medium transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
                                            onClick={() => addtocart(product, 'regular')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Cart
                                        </button>
                                        <button 
                                            className="w-full py-2 px-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
                                            onClick={() => addtocart(product, 'weekly')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Weekly
                                        </button>
                                        <button 
                                            className="w-full py-2 px-3 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors cursor-pointer text-sm"
                                            onClick={() => setShowOptions(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    // Show Add to Cart button
                                    <button 
                                        className={`mt-4 w-full py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                                            product.quantity <= 0 
                                                ? 'bg-gray-400 cursor-not-allowed' 
                                                : 'bg-black text-white hover:bg-gray-800'
                                        }`}
                                        onClick={() => handleAddToCartClick(product)}
                                        disabled={product.quantity <= 0}
                                    >
                                        {product.quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                }
            </div>
        </>
    );
}

export default ShowProducts;