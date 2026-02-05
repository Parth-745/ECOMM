const User=require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const mailSender = require('../util/mailSender');
const { calculateOrderTotal } = require('../util/priceCalculator');

exports.createOrder = async (req, res) => {
    try {
        const { address, isCOD, isSubscription, amount } = req.body;
        const userid = req.payload.uid;

        const user = await User.findOne({ firebaseUid: userid }).populate('cart.product');

        if (!user) {
            return res.status(404).json({ success:false, message: 'User not found' });
        }

        if (!user.phone) {
            return res.status(400).json({ success:false, message: 'Please set a phone number in Account settings' });
        }

        let orderData = {};

        // ===============================
        // 🟡 IF SUBSCRIPTION ORDER
        // ===============================
        if (isSubscription) {
            const subscriptionAmount = amount || 99;

            orderData = {
                userId: user._id,
                products: [],
                subtotal: subscriptionAmount,
                deliveryCharge: 0,
                totalAmount: subscriptionAmount,
                shippingAddress: address || user.address || 'Subscription',
                userName: user.username || user.name || 'Unknown',
                userPhone: user.phone || '',
                userEmail: user.email || '',
                paymentMethod: 'Online Payment',
                paymentStatus: 'Paid',
                isSubscription: true
            };
        }
        // ===============================
        // 🟢 NORMAL CART ORDER
        // ===============================
        else {
            if (user.cart.length === 0) {
                return res.status(400).json({ success:false, message: 'Cart is empty' });
            }

            // Calculate order total
            const priceBreakdown = calculateOrderTotal(user.cart, user);

            orderData = {
                userId: user._id,
                products: user.cart,
                subtotal: priceBreakdown.subtotal,
                deliveryCharge: priceBreakdown.deliveryCharge,
                totalAmount: priceBreakdown.totalAmount,
                shippingAddress: address || user.address,
                userName: user.username || user.name || 'Unknown',
                userPhone: user.phone || '',
                userEmail: user.email || '',
                paymentMethod: isCOD ? 'Cash on Delivery' : 'Online Payment',
                paymentStatus: isCOD ? 'Unpaid' : 'Paid'
            };
        }

        // Create order
        const order = await Order.create(orderData);

        // Save order to user only for normal orders
        if (!isSubscription) {
            user.order.push(order._id);
            user.cart = [];
            await user.save();
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order
        });

    } catch (e) {
        console.error("Error creating order:", e);
        res.status(500).json({ success:false, message: "Internal server error" });
    }
};


exports.cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.payload.uid;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required' });
        }

        const user = await User.findOne({ firebaseUid: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const orderIndex = user.order.findIndex(id => id.toString() === orderId.toString());
        if (orderIndex === -1) {
            return res.status(404).json({ message: 'Order not found' });
        }

        user.order.splice(orderIndex, 1);
        await user.save();

        // Fix: Pass orderId directly instead of an object
        await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' });

        res.status(200).json({ success: true, message: 'Order cancelled successfully' });
    } catch (e) {
        console.error("Error cancelling order:", e);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}
exports.getMyOrders=async(req,res)=>{
    try{
        const userId = req.payload.uid;

        const user = await User.findOne({ firebaseUid: userId })
            .populate({
                path: 'order',  // assuming your user schema has an 'orders' array field
                populate: {
                path: 'products.product',  // assuming your Order schema has 'products' array with 'product' references
                model: 'Product'  // name of your Product model
                }
            });

        if (!user) {
            return res.status(404).json({ success:false,message: 'User not found' });
        }

        if (user.order.length === 0) {
            return res.status(200).json({ success:true,message: 'No orders found', orders: [] });
        }

        res.status(200).json({ success:true,message: 'Orders fetched successfully', orders: user.order });
    }
    catch(e){
        console.error("Error fetching orders:", e);
        res.status(500).json({ success:false,message: "Internal server error" });
    }
}

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('userId', 'username email').populate('products.product');

        if (orders.length === 0) {
            return res.status(200).json({ success:true,message: 'No orders found', orders: [] });
        }

        res.status(200).json({ success:true,message: 'Orders fetched successfully', orders });
    } catch (e) {
        console.error("Error fetching all orders:", e);
        res.status(500).json({ success:false,message: "Internal server error" });
    }
}

exports.approveOrder = async (req, res) => {
    try {
        const { orderId ,status} = req.body;

        if (!orderId) {
            return res.status(400).json({ success:false,message: 'Order ID is required' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success:false,message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        if (status === 'Delivered') {
        for (const item of order.products) {
            await Product.findByIdAndUpdate(
            item.product, 
            {
                $inc: {
                unitSold: item.quantity, 
                quantity: -item.quantity 
                }
            }
            );
        }
        }
        res.status(200).json({ success:true,message: 'Order approved successfully', order });
    } catch (e) {
        console.error("Error approving order:", e);
        res.status(500).json({ success:false,message: "Internal server error" });
    }
}

exports.getAddress=async(req,res)=>{
    try{
        const userId = req.payload.uid;

        const user = await User.findOne({firebaseUid:userId});
        if (!user) {
            return res.status(404).json({ success:false,message: 'User not found' });
        }

        if (!user.address) {
            return res.status(404).json({ success:false,message: 'Address not found' });
        }
        res.status(200).json({ success:true,message: 'Address fetched successfully', address: user.address });
    }
    catch(e){
        console.error("Error fetching address:", e);
        res.status(500).json({ success:false,message: "Internal server error" });
    }
}

exports.saveAddress=async(req,res)=>{
    try{
        const {address} = req.body;
        const userId = req.payload.uid;

        if (!address) {
            return res.status(400).json({ success:false,message: 'Address is required' });
        }

        const user = await User.findOne({firebaseUid:userId});
        if (!user) {
            return res.status(404).json({ success:false,message: 'User not found' });
        }

        user.address = address;
        await user.save();

        res.status(200).json({ success:true,message: 'Address saved successfully', address: user.address });
    }
    catch(e){
        console.error("Error saving address:", e);
        res.status(500).json({ success:false,message: "Internal server error" });
    }
}

exports.getOrderById=async(req,res)=>{
    try{
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({ success:false,message: 'Order ID is required' });
        }

        const order = await Order.findById(orderId)
            .populate('userId', 'username email')
            .populate('products.product')
            .populate('deliveryAgent', 'name phone vehicle vehicleNumber');

        if (!order) {
            return res.status(404).json({ success:false,message: 'Order not found' });
        }

        res.status(200).json({ success:true,message: 'Order fetched successfully', order });
    }
    catch(e){
        console.error("Error fetching order by ID:", e);
        res.status(500).json({ success:false,message: "Internal server error" });
    }
}

exports.saveUserDetails = async (req, res) => {
    try {
        const { username, phone,address } = req.body;
        const userId = req.payload.uid;

        if (!username && !phone && !address) {
            return res.status(400).json({ success: false, message: 'Fill atleast one field' });
        }

        const user = await User.findOneAndUpdate(
            { firebaseUid: userId },
            { username, phone, address },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'User details updated successfully', user });
    } catch (e) {
        console.error("Error saving user details:", e);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

exports.fetchUserData = async (req, res) => {
    try{
        const userId = req.payload.uid;

        const user = await User.findOne({ firebaseUid: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({
            success: true,
            user
        });
    }
    catch(e){
        console.error("Error fetching user data:", e);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching user data",
        });
    }
}

// Get Delivery Agent Orders
exports.getDeliveryAgentOrders = async (req, res) => {
    try{
        const deliveryAgentId = req.payload.id;
        const status = req.query.status || 'pending';

        let query = {};
        
        if (status === 'pending') {
            // ✅ Show orders that:
            // - Don't have an assigned agent (truly pending)
            // - This agent hasn't rejected yet
            query = {
                deliveryAgent: null,                          
                rejectedBy: { 
                    $not: { $elemMatch: { agentId: deliveryAgentId } } // Agent didn't reject
                },
                status: { $ne: 'Delivered' }
            };
        } else if (status === 'accepted') {
            // Get orders accepted by THIS agent
            query = { 
                deliveryAgent: deliveryAgentId,
                deliveryStatus: 'accepted'
            };
        } else if (status === 'rejected') {
            // ✅ Get orders rejected by THIS agent (agent-specific)
            query = {
                rejectedBy: { 
                    $elemMatch: { agentId: deliveryAgentId } // Only this agent's rejections
                }
            };
        }

        const orders = await Order.find(query)
            .populate('products.product', 'name price')
            .sort({ orderDate: -1 });

        return res.status(200).json({
            success: true,
            orders: orders
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error fetching orders"
        });
    }
}

// Accept Delivery Order
exports.acceptDeliveryOrder = async (req, res) => {
    try{
        const deliveryAgentId = req.payload.id;
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.deliveryStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Order is no longer available"
            });
        }

        // ✅ Check if this agent already rejected it
        const agentRejected = order.rejectedBy.some(
            r => r.agentId.toString() === deliveryAgentId
        );
        if (agentRejected) {
            return res.status(400).json({
                success: false,
                message: "You have already rejected this order"
            });
        }

        // ✅ Check if already assigned to someone else
        if (order.deliveryAgent && order.deliveryAgent.toString() !== deliveryAgentId) {
            return res.status(400).json({
                success: false,
                message: "Order already accepted by another agent"
            });
        }

        // Update order with delivery agent
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                deliveryAgent: deliveryAgentId,
                deliveryStatus: 'accepted',
                status: 'Assigned',
                deliveryStartTime: new Date()
            },
            { new: true }
        ).populate('deliveryAgent', 'name phone');

        return res.status(200).json({
            success: true,
            message: "Order accepted successfully",
            order: updatedOrder
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error accepting order"
        });
    }
}

// Reject Delivery Order
exports.rejectDeliveryOrder = async (req, res) => {
    try{
        const deliveryAgentId = req.payload.id;
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // ✅ Check if agent already rejected
        const alreadyRejected = order.rejectedBy.some(
            r => r.agentId.toString() === deliveryAgentId
        );
        if (alreadyRejected) {
            return res.status(400).json({
                success: false,
                message: "You have already rejected this order"
            });
        }

        // ✅ Add this agent to rejectedBy array (agent-specific rejection)
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                $push: {
                    rejectedBy: {
                        agentId: deliveryAgentId,
                        rejectedAt: new Date()
                    }
                },
                // If the rejecting agent had accepted it, unassign them
                ...(order.deliveryAgent?.toString() === deliveryAgentId && {
                    deliveryAgent: null,
                    deliveryStatus: 'pending',
                    status: 'Preparing'
                })
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Order rejected successfully",
            order: updatedOrder
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error rejecting order"
        });
    }
}

// Generate Delivery OTP
exports.generateDeliveryOTP = async (req, res) => {
    try{
        const { orderId } = req.body;
        const deliveryAgentId = req.payload.id;

        const order = await Order.findById(orderId).populate('userId', 'email');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.deliveryAgent.toString() !== deliveryAgentId) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this order"
            });
        }

        // Generate random 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Update order with OTP
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                deliveryOTP: otp,
                deliveryOTPVerified: false
            },
            { new: true }
        );

        // Send OTP email to user
        if (order.userId && order.userId.email) {
            await mailSender(
                order.userId.email,
                'Delivery OTP - GROOVO',
                otp
            );
        }

        return res.status(200).json({
            success: true,
            message: "OTP generated and sent to customer email",
            order: updatedOrder
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error generating OTP"
        });
    }
}

// Verify Delivery OTP
exports.verifyDeliveryOTP = async (req, res) => {
    try{
        const { orderId, otp } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.deliveryOTP !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Update order as delivered and mark payment as Paid for COD orders
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                deliveryOTPVerified: true,
                status: 'Delivered',
                deliveryCompleteTime: new Date(),
                paymentStatus: 'Paid' // Mark as Paid when COD order is delivered
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Order delivered successfully",
            order: updatedOrder
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error verifying OTP"
        });
    }
}

// Verify Payment (Razorpay) - Update payment status to Paid immediately
exports.verifyPayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Update order payment status to Paid for online payment
        const order = await Order.findByIdAndUpdate(
            orderId,
            {
                paymentStatus: 'Paid' // Online payment is completed, so mark as Paid
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            order
        });
    } catch (error) {
        console.log("Payment verification error:", error);
        return res.status(500).json({
            success: false,
            message: "Error verifying payment"
        });
    }
}