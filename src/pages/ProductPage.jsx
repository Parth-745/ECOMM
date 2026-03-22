import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FirebaseContext } from '../context/FirebaseContext';
import { useContext } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaUser,FaCalendarAlt,FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart, FaRuler } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ShowProducts from '../components/ShowProducts';

const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, setcart, setweeklycart, products } = useContext(FirebaseContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('US 8');
  const [quantity, setQuantity] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [hasGroovoPlus, setHasGroovoPlus] = useState(false);
  const [showCartOptions, setShowCartOptions] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:4000/getProductDetail/${productId}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.product);
      } else {
        navigate('/products');
        toast.error('Product not found');
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single product data
  useEffect(() => {
    fetchProduct();
  }, [productId, navigate]);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) {
        setHasGroovoPlus(false);
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

          setHasGroovoPlus(isActive);
        } else {
          setHasGroovoPlus(false);
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
        setHasGroovoPlus(false);
      }
    };

    checkSubscriptionStatus();
  }, [user]);

  // Get related products (same category)
  const relatedProducts = products
    ? products.filter(p => 
        p.category === product?.category && 
        p._id !== product?._id
      ).slice(0, 4)
    : [];

  async function addToCart(cartType = 'regular') {
    try {
      if (!user) {
        toast.error("Please login to add items to cart.");
        return;
      }

      if (product.quantity <= 0) {
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
              productId: product._id,
              quantity: quantity,
              size: selectedSize,
              cartType
            }),
          }),
          new Promise(resolve => setTimeout(resolve, 1500))
        ]),
        {
          loading: cartType === 'weekly' ? 'Adding to weekly cart...' : 'Adding to cart...',
          success: cartType === 'weekly' ? 'Item added to weekly cart!' : 'Item added to cart!',
          error: 'Failed to add item',
        }
      );

      const data = await response.json();
      if (data.success) {
        if (cartType === 'weekly') {
          setweeklycart(data.weeklyCart || []);
        } else {
          setcart(data.cart || []);
        }
        setShowCartOptions(false);
      }
    } catch (e) {
      console.error("Error adding to cart:", e);
    }
  }

  const handleAddToCartClick = () => {
    if (!user) {
      toast.error("Please login to add items to cart.");
      return;
    }

    if (product.quantity <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    if (hasGroovoPlus) {
      setShowCartOptions(true);
      return;
    }

    addToCart('regular');
  };

  const submitProductReview = async () => {
    try {
      if (!user) {
        toast.error('Please login to add a review');
        return;
      }

      if (!reviewRating) {
        toast.error('Please select a rating');
        return;
      }

      setIsSubmittingReview(true);
      const token = await user.getIdToken();
      const response = await fetch('http://localhost:4000/AddReview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Review added successfully!');
        setReviewRating(0);
        setReviewComment('');
        await fetchProduct();
      } else {
        toast.error(data.message || 'Failed to add review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 my-12">
        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="h-96 w-full overflow-hidden rounded-lg">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          
          {/* Product Info */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            
            <div className="flex items-center space-x-2">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>
                    {product.ratings >= star ? (
                      <FaStar className="w-5 h-5" />
                    ) : product.ratings >= star - 0.5 ? (
                      <FaStarHalfAlt className="w-5 h-5" />
                    ) : (
                      <FaRegStar className="w-5 h-5" />
                    )}
                  </span>
                ))}
              </div>
              <span className="text-gray-600">
                ({product.reviewCount || 0} reviews)
              </span>
            </div>
            
            <p className="text-2xl font-bold">₹{product.price}</p>
            
            {product.offer && (
              <p className="text-green-600 font-medium">{product.offer}</p>
            )}
            
            <p className="text-gray-700">{product.description}</p>
            
            {/* Size Selection */}
            {/* <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">Size (US Men's)</p>
                <button 
                  onClick={() => setShowSizeChart(true)}
                  className="text-sm flex items-center text-gray-600 hover:text-black cursor-pointer"
                >
                  <FaRuler className="mr-1" /> Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'].map((size) => (
                  <button
                    key={size}
                    className={`py-2 border rounded-md flex items-center justify-center cursor-pointer ${
                      selectedSize === size
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-800 border-gray-300'
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div> */}
            
            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <p className="font-medium">Quantity</p>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="px-4 py-1">{quantity}</span>
                <button
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
            
            {showCartOptions ? (
              <div className="w-full space-y-2">
                <button
                  onClick={() => addToCart('regular')}
                  className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <FaShoppingCart />
                  <span>Cart</span>
                </button>
                <button
                  onClick={() => addToCart('weekly')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Weekly</span>
                </button>
                <button
                  onClick={() => setShowCartOptions(false)}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCartClick}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <FaShoppingCart />
                <span>Add to Cart</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-3">Write a Review</h3>
            <div className="flex mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="mr-1"
                >
                  <FaStar
                    className={`w-5 h-5 ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write your review..."
              className="w-full p-3 border border-gray-300 rounded-md mb-3"
            />
            <button
              onClick={submitProductReview}
              disabled={isSubmittingReview}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
          
          {product.reviews?.length > 0 ? (
            <div className="space-y-6">
              {product.reviews.map((review, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center mb-3">
                    <div className="bg-gray-200 rounded-full p-2 mr-3">
                      <FaUser className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium"> {review.userId.username || review.userId.email.substr(0,5)}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-1" />
                        <span>
                          {new Date(review.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar 
                        key={star}
                        className={`w-5 h-5 ${
                          review.rating >= star ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-500">No reviews yet for this product</p>
            </div>
          )}
        </div>
        
        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">You may also like</h2>
            <ShowProducts visibleProducts={relatedProducts} />
          </div>
        )}
      </main>

      {/* Shoe Size Chart Modal */}
      {showSizeChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Shoe Size Guide</h3>
                <button 
                  onClick={() => setShowSizeChart(false)}
                  className="text-gray-500 hover:text-black"
                >
                  ✕
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">US Men's</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">US Women's</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UK</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foot Length (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">US 7</td>
                      <td className="px-6 py-4 whitespace-nowrap">US 8.5</td>
                      <td className="px-6 py-4 whitespace-nowrap">UK 6</td>
                      <td className="px-6 py-4 whitespace-nowrap">EU 39</td>
                      <td className="px-6 py-4 whitespace-nowrap">24.5 cm</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">US 8</td>
                      <td className="px-6 py-4 whitespace-nowrap">US 9.5</td>
                      <td className="px-6 py-4 whitespace-nowrap">UK 7</td>
                      <td className="px-6 py-4 whitespace-nowrap">EU 41</td>
                      <td className="px-6 py-4 whitespace-nowrap">26 cm</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">US 9</td>
                      <td className="px-6 py-4 whitespace-nowrap">US 10.5</td>
                      <td className="px-6 py-4 whitespace-nowrap">UK 8</td>
                      <td className="px-6 py-4 whitespace-nowrap">EU 42.5</td>
                      <td className="px-6 py-4 whitespace-nowrap">27.5 cm</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">US 10</td>
                      <td className="px-6 py-4 whitespace-nowrap">US 11.5</td>
                      <td className="px-6 py-4 whitespace-nowrap">UK 9</td>
                      <td className="px-6 py-4 whitespace-nowrap">EU 44</td>
                      <td className="px-6 py-4 whitespace-nowrap">28.5 cm</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">US 11</td>
                      <td className="px-6 py-4 whitespace-nowrap">US 12.5</td>
                      <td className="px-6 py-4 whitespace-nowrap">UK 10</td>
                      <td className="px-6 py-4 whitespace-nowrap">EU 45.5</td>
                      <td className="px-6 py-4 whitespace-nowrap">29.5 cm</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">US 12</td>
                      <td className="px-6 py-4 whitespace-nowrap">US 13.5</td>
                      <td className="px-6 py-4 whitespace-nowrap">UK 11</td>
                      <td className="px-6 py-4 whitespace-nowrap">EU 47</td>
                      <td className="px-6 py-4 whitespace-nowrap">30.5 cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 text-sm text-gray-600">
                <p className="font-medium">How to measure your shoe size:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Stand on a piece of paper with your heel against a wall</li>
                  <li>Mark the longest part of your foot (usually the big toe)</li>
                  <li>Measure from the wall to your mark in centimeters</li>
                  <li>Compare with our size chart above</li>
                  <li>For best fit, measure both feet and use the larger measurement</li>
                </ul>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSizeChart(false)}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default ProductPage;
