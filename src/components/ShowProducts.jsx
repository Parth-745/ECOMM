import { useContext } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { FirebaseContext } from "../context/FirebaseContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ShowProducts = ({ visibleProducts }) => {
    const { user, setcart } = useContext(FirebaseContext);
    const navigate = useNavigate();
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function addtocart(item) {
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
                            size: "US 8" // Default size, can be made dynamic
                        }),
                    }),
                    delay(1500)
                ]),
                {
                    loading: 'Adding to cart...',
                    success: 'Item added successfully!',
                    error: 'Failed to add item',
                }
            );

            const data = await response.json();

            if (data.success) {
                setcart(data.cart);
            } else {
                toast.error(data.message || "Add to cart failed.");
            }
        } catch (e) {
            console.error("Error adding to cart:", e);
            toast.error("An error occurred while adding to cart");
        }
    }

    return (
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

                            <button 
                                className={`mt-4 w-full py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                                    product.quantity <= 0 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-black text-white hover:bg-gray-800'
                                }`}
                                onClick={() => addtocart(product)}
                                disabled={product.quantity <= 0}
                            >
                                {product.quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

export default ShowProducts;