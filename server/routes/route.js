const express = require('express');
const router = express.Router();
const { SendOtp ,register,login,MatchOtp, AdminLogin,AdminSignup, getUser, DeliveryAgentLogin, DeliveryAgentSignup, getDeliveryAgentData, updateDeliveryAgentDetails, activateGroovoPlus} = require('../controllers/Auth');
const {addProduct, editProduct,deleteProduct,getAllProducts,getAllCategories,getProductDetail,AddReview,seedDatabase}=require('../controllers/Product');
const { isUser, isAdmin,isUser2, isDeliveryAgent } = require('../middlewares/Auth');
const {addToCart,deleteFromCart,getCartItems}= require('../controllers/Cart');
const {createOrder,cancelOrder,getMyOrders,getAllOrders,approveOrder, getAddress, saveAddress, getOrderById,saveUserDetails, fetchUserData, getDeliveryAgentOrders, acceptDeliveryOrder, rejectDeliveryOrder, generateDeliveryOTP, verifyDeliveryOTP, verifyPayment} = require('../controllers/Order');
const {
  saveWeeklySchedule,
  getWeeklySchedule,
  updateWeeklyScheduleTime,
  deleteWeeklySchedule,
  skipWeeklyDelivery,
  confirmWeeklyDelivery
} = require('../controllers/WeeklySchedule');


router.post('/SendOtp', SendOtp);
router.post('/MatchOtp', MatchOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/AdminLogin', AdminLogin);
router.post('/AdminSignup', AdminSignup);
router.post('/deliveryAgentLogin', DeliveryAgentLogin);
router.post('/deliveryAgentSignup', DeliveryAgentSignup);
router.get('/deliveryAgentData', getDeliveryAgentData);
router.post('/updateDeliveryAgentDetails', updateDeliveryAgentDetails);

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
router.post('/verifyPayment', isUser, verifyPayment);

router.post('/seedDatabase', seedDatabase);
router.get('/getUser',isUser2,getUser);

// Groovo Plus subscription route
router.post('/activateGroovoPlus', isUser, activateGroovoPlus);

// Weekly Schedule Routes (Groovo Plus users only)
router.post('/weekly-schedule', isUser, saveWeeklySchedule);
router.get('/weekly-schedule', isUser, getWeeklySchedule);
router.patch('/weekly-schedule/time', isUser, updateWeeklyScheduleTime);
router.delete('/weekly-schedule', isUser, deleteWeeklySchedule);
router.post('/weekly-schedule/skip', isUser, skipWeeklyDelivery);
// Public route for email confirmation
router.get('/weekly-delivery/confirm/:scheduleId', confirmWeeklyDelivery);


// Delivery Agent Order Routes
router.get('/getDeliveryAgentOrders', isDeliveryAgent, getDeliveryAgentOrders);
router.post('/acceptDeliveryOrder', isDeliveryAgent, acceptDeliveryOrder);
router.post('/rejectDeliveryOrder', isDeliveryAgent, rejectDeliveryOrder);
router.post('/generateDeliveryOTP', isDeliveryAgent, generateDeliveryOTP);
router.post('/verifyDeliveryOTP', verifyDeliveryOTP);

module.exports = router;