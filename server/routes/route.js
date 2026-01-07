const express = require('express');
const router = express.Router();
const { SendOtp ,register,login,MatchOtp, AdminLogin,AdminSignup} = require('../controllers/Auth');
const {addProduct, editProduct,deleteProduct,getAllProducts,getAllCategories,getProductDetail,AddReview,seedDatabase}=require('../controllers/Product');
const { isUser, isAdmin } = require('../middlewares/Auth');
const {addToCart,deleteFromCart,getCartItems}= require('../controllers/Cart');
const {createOrder,cancelOrder,getMyOrders,getAllOrders,approveOrder, getAddress, saveAddress, getOrderById,saveUserDetails, fetchUserData} = require('../controllers/Order');

router.post('/SendOtp', SendOtp);
router.post('/MatchOtp', MatchOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/AdminLogin', AdminLogin);
// router.post('/AdminSignup', AdminSignup);

router.post('/addProduct', isAdmin,addProduct);
router.post('/editProduct',isAdmin, editProduct); 
router.post('/deleteProduct', isAdmin, deleteProduct);
router.get('/getAllProducts',getAllProducts);
router.get('/getAllCategories', getAllCategories);
router.get('/getProductDetail/:productId', getProductDetail);
router.post('/AddReview',isUser, AddReview);

router.post('/addtoCart', isUser,addToCart);
router.post('/deleteFromCart', isUser,deleteFromCart);
router.get('/getCartItems', isUser,getCartItems);

router.post('/createOrder', isUser, createOrder);
router.post('/cancelOrder', isUser, cancelOrder);
router.get('/getMyOrders', isUser, getMyOrders);
router.get('/getAllOrders',isAdmin,getAllOrders);
router.post('/approveOrder',isAdmin, approveOrder);
router.post('/saveUserDetails', isUser, saveUserDetails);
router.get('/fetchUserData',isUser,fetchUserData);
router.get('/getOrderById/:orderId',isUser,getOrderById);

router.get('/getAddress',isUser,getAddress);
router.post('/saveAddress',isUser,saveAddress);

router.post('/seedDatabase', seedDatabase);

module.exports = router;