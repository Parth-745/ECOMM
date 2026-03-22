const mongoose= require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number, default: 1 },
            size:{type:String}
        }],
    subtotal: { type: Number, required: true }, // Product prices only
    deliveryCharge: { type: Number, required: true, default: 0 }, // Delivery charge (0 for Groovo Plus)
    totalAmount: { type: Number, required: true }, // subtotal + deliveryCharge
    orderDate: { type: Date, default: Date.now },
    status: { type: String, default: 'Preparing' }, // Preparing, Ready for Delivery, Assigned, In Transit, Delivered
    shippingAddress: { type: String, required: true },
    expectedDeliveryDate: { type: Date , default: () => new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) },
    
    // Delivery Agent Fields
    deliveryAgent: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'DeliveryAgent',
        default: null 
    },
    deliveryStatus: { 
        type: String, 
        enum: ['pending', 'accepted', 'delivered'], 
        default: 'pending' 
    },
    // ✅ Track which agents have rejected this order (agent-specific)
    rejectedBy: [{
        agentId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'DeliveryAgent' 
        },
        rejectedAt: { type: Date, default: Date.now }
    }],
    deliveryOTP: {
        type: String,
        default: null
    },
    deliveryOTPVerified: {
        type: Boolean,
        default: false
    },
    deliveryStartTime: {
        type: Date,
        default: null
    },
    deliveryCompleteTime: {
        type: Date,
        default: null
    },
    userName: { type: String }, // Store user name for quick access in delivery dashboard
    userPhone: { type: String }, // Store user phone for delivery agent
    userEmail: { type: String }, // Store user email
    paymentMethod: { 
        type: String, 
        enum: ['Cash on Delivery', 'Online Payment'],
        default: 'Cash on Delivery'
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Pending'],
        default: 'Unpaid'
    },
    isSubscription: {
        type: Boolean,
        default: false
    },
    isWeeklyOrder: {
        type: Boolean,
        default: false
    },
    weeklyDeliveryDay: {
        type: String,
        default: null
    },
    weeklyDeliveryTimeSlot: {
        type: String,
        default: null
    }
})

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
