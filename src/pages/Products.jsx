import React, { useEffect, useState } from 'react';
import { FirebaseContext } from '../context/FirebaseContext';
import { useContext } from 'react';
import Navbar from '../components/Navbar';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { toast } from "react-hot-toast";
import { useParams } from 'react-router-dom';
import ShowProducts from '../components/ShowProducts';
import Footer from '../components/Footer';

const Products = () => {
    const { category } = useParams();
    const { products, user, setcart } = useContext(FirebaseContext);

    const [visibleProducts, setVisibleProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [priceFilter, setPriceFilter] = useState('');
    const [ratingFilter, setRatingFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Calculate average rating for a product
    const calculateAverageRating = (reviews) => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [category]);

    useEffect(() => {
        let filteredProducts = [...products];
        
        // Apply category filter from URL first
        if (category !== 'all') {
            filteredProducts = filteredProducts.filter(
                product => product.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        // Apply search filter
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply price filter
        if (priceFilter) {
            switch (priceFilter) {
                case 'under50':
                    filteredProducts = filteredProducts.filter(product => product.price < 50);
                    break;
                case '50to100':
                    filteredProducts = filteredProducts.filter(product => product.price >= 50 && product.price <= 100);
                    break;
                case 'over100':
                    filteredProducts = filteredProducts.filter(product => product.price > 100);
                    break;
                default:
                    break;
            }
        }
        
        // Apply rating filter (using reviews array)
        if (ratingFilter) {
            filteredProducts = filteredProducts.filter(product => {
                const avgRating = calculateAverageRating(product.reviews);
                return avgRating >= parseInt(ratingFilter);
            });
        }
        
        // Apply additional category filter (if not already filtered by URL)
        if (categoryFilter && category === 'all') {
            filteredProducts = filteredProducts.filter(
                product => product.category.toLowerCase() === categoryFilter.toLowerCase()
            );
        }
        
        setVisibleProducts(filteredProducts);
    }, [products, category, searchTerm, priceFilter, ratingFilter, categoryFilter]);

    const resetFilters = () => {
        setSearchTerm('');
        setPriceFilter('');
        setRatingFilter('');
        setCategoryFilter('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <section className="my-10 px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        {category === 'all' ? (
                            <h2 className="text-3xl font-bold mb-4">All Products</h2>
                        ) : (
                            <h2 className="text-3xl font-bold mb-4 capitalize">{category}</h2>
                        )}
                        {category === 'all' ? (
                            <p className="text-gray-600 max-w-2xl mx-auto">Browse our complete collection</p>
                        ) : (
                            <p className="text-gray-600 max-w-2xl mx-auto">Browse our {category} collection</p>
                        )}
                    </div>

                    {/* Search and Filter Section */}
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Search Input */}
                            <div>
                                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                                    Search by Name
                                </label>
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Search products..."
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Price Filter */}
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                    Price Range
                                </label>
                                <select
                                    id="price"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={priceFilter}
                                    onChange={(e) => setPriceFilter(e.target.value)}
                                >
                                    <option value="">All Prices</option>
                                    <option value="under50">Under ₹50</option>
                                    <option value="50to100">₹50 - ₹100</option>
                                    <option value="over100">Over ₹100</option>
                                </select>
                            </div>

                            {/* Rating Filter */}
                            <div>
                                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                                    Minimum Rating
                                </label>
                                <select
                                    id="rating"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={ratingFilter}
                                    onChange={(e) => setRatingFilter(e.target.value)}
                                >
                                    <option value="">All Ratings</option>
                                    <option value="4">4 Stars & Up</option>
                                    <option value="3">3 Stars & Up</option>
                                    <option value="2">2 Stars & Up</option>
                                    <option value="1">1 Star & Up</option>
                                </select>
                            </div>

                            {/* Category Filter (only shown when viewing all products) */}
                            {category === 'all' && (
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                    >
                                        <option value="">All Categories</option>
                                        {[...new Set(products.map(product => product.category))].map((cat, index) => (
                                            <option key={index} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Reset Filters Button */}
                        {(searchTerm || priceFilter || ratingFilter || categoryFilter) && (
                            <div className="mt-4">
                                <button
                                    onClick={resetFilters}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="mb-4 text-gray-600">
                        Showing {visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}
                    </div>

                    <ShowProducts visibleProducts={visibleProducts} />
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Products;