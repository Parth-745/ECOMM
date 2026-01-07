import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const AdminInventory = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        category: '',
        quantity: 0,
        offer: ''
    });
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [priceRangeFilter, setPriceRangeFilter] = useState('');
    const [stockStatusFilter, setStockStatusFilter] = useState('');

    // Fetch all products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:4000/getAllProducts', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            if (data.success) {
                setProducts(data.products);
                setFilteredProducts(data.products);
            } else {
                toast.error('Failed to fetch products');
            }
        } catch (error) {
            toast.error('Error fetching products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Apply filters whenever filter criteria or products change
    useEffect(() => {
        let result = [...products];
        
        // Apply search filter
        if (searchTerm) {
            result = result.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply category filter
        if (categoryFilter) {
            result = result.filter(product =>
                product.category.toLowerCase() === categoryFilter.toLowerCase()
            );
        }
        
        // Apply price range filter
        if (priceRangeFilter) {
            switch (priceRangeFilter) {
                case 'under50':
                    result = result.filter(product => product.price < 50);
                    break;
                case '50to100':
                    result = result.filter(product => product.price >= 50 && product.price <= 100);
                    break;
                case 'over100':
                    result = result.filter(product => product.price > 100);
                    break;
                default:
                    break;
            }
        }
        
        // Apply stock status filter
        if (stockStatusFilter) {
            switch (stockStatusFilter) {
                case 'inStock':
                    result = result.filter(product => product.quantity > 0);
                    break;
                case 'outOfStock':
                    result = result.filter(product => product.quantity <= 0);
                    break;
                case 'lowStock':
                    result = result.filter(product => product.quantity > 0 && product.quantity < 10);
                    break;
                default:
                    break;
            }
        }
        
        setFilteredProducts(result);
    }, [searchTerm, categoryFilter, priceRangeFilter, stockStatusFilter, products]);

    // Get unique categories for filter dropdown
    const getUniqueCategories = () => {
        const categories = products.map(product => product.category);
        return [...new Set(categories)];
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'quantity' ? Number(value) : value
        }));
    };

    // Reset all filters
    const resetFilters = () => {
        setSearchTerm('');
        setCategoryFilter('');
        setPriceRangeFilter('');
        setStockStatusFilter('');
    };

    // Rest of your existing functions (openModal, handleSubmit, deleteProduct) remain the same
    // Open modal for adding/editing product
    const openModal = (product = null) => {
        if (product) {
            setCurrentProduct(product._id);
            setFormData({
                name: product.name,
                description: product.description,
                price: product.price,
                imageUrl: product.imageUrl,
                category: product.category,
                quantity: product.quantity,
                offer: product.offer
            });
        } else {
            setCurrentProduct(null);
            setFormData({
                name: '',
                description: '',
                price: 0,
                imageUrl: '',
                category: '',
                quantity: 0,
                offer: ''
            });
        }
        setIsModalOpen(true);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (currentProduct) {
                // Update existing product
                response = await fetch('http://localhost:4000/editProduct', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId: currentProduct,
                        ...formData
                    }),
                    credentials: 'include'
                });
            } else {
                // Add new product
                response = await fetch('http://localhost:4000/addProduct', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include'
                });
            }

            const data = await response.json();
            if (data.success) {
                toast.success(`Product ${currentProduct ? 'updated' : 'added'} successfully`);
                fetchProducts();
                setIsModalOpen(false);
            } else {
                toast.error(data.message || 'Operation failed');
            }
        } catch (error) {
            toast.error('Error performing operation');
        }
    };

    // Delete product
    const deleteProduct = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const response = await fetch('http://localhost:4000/deleteProduct', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ productId }),
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.success) {
                    toast.success('Product deleted successfully');
                    fetchProducts();
                } else {
                    toast.error(data.message || 'Failed to delete product');
                }
            } catch (error) {
                toast.error('Error deleting product');
            }
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Inventory Management</h1>
            
            {/* Search and Filter Section */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    {/* Category Filter */}
                    <div>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {getUniqueCategories().map((category, index) => (
                                <option key={index} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Price Range Filter */}
                    <div>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={priceRangeFilter}
                            onChange={(e) => setPriceRangeFilter(e.target.value)}
                        >
                            <option value="">All Prices</option>
                            <option value="under50">Under ₹50</option>
                            <option value="50to100">₹50 - ₹100</option>
                            <option value="over100">Over ₹100</option>
                        </select>
                    </div>
                    
                    {/* Stock Status Filter */}
                    <div>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={stockStatusFilter}
                            onChange={(e) => setStockStatusFilter(e.target.value)}
                        >
                            <option value="">All Stock Status</option>
                            <option value="inStock">In Stock</option>
                            <option value="outOfStock">Out of Stock</option>
                            <option value="lowStock">Low Stock</option>
                        </select>
                    </div>
                </div>
                
                {/* Reset Filters Button */}
                {(searchTerm || categoryFilter || priceRangeFilter || stockStatusFilter) && (
                    <div className="mt-3">
                        <button
                            onClick={resetFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Reset All Filters
                        </button>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Product List</h2>
                <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-3">
                        Showing {filteredProducts.length} of {products.length} products
                    </span>
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
                    >
                        <FiPlus className="mr-2" /> Add Product
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left">Image</th>
                                <th className="py-3 px-4 text-left">Name</th>
                                <th className="py-3 px-4 text-left">Category</th>
                                <th className="py-3 px-4 text-left">Price</th>
                                <th className="py-3 px-4 text-left">Stock</th>
                                <th className="py-3 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <img 
                                            src={product.imageUrl} 
                                            alt={product.name} 
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    </td>
                                    <td className="py-3 px-4 font-medium">{product.name}</td>
                                    <td className="py-3 px-4 capitalize">{product.category}</td>
                                    <td className="py-3 px-4">₹{product.price.toFixed(2)}</td>
                                    <td className={`py-3 px-4 ${
                                        product.quantity === 0 ? 'text-red-600' : 
                                        product.quantity < 10 ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                        {product.quantity}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openModal(product)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <FiEdit size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(product._id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Product Modal (keep the same as before) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                {currentProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-md"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-md"
                                        required
                                        rows="3"
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-gray-700 mb-2">Price (₹)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 mb-2">Quantity</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Image URL</label>
                                    <input
                                        type="text"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-md"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Category</label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-md"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Offer</label>
                                    <input
                                        type="text"
                                        name="offer"
                                        value={formData.offer}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 border rounded-md"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md"
                                    >
                                        {currentProduct ? 'Update' : 'Add'} Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventory;