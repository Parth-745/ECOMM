
const mongoose=require('mongoose');

const userschema=new mongoose.Schema({
    firebaseUid:{
        type:String,
        required:true,
    },
    username:{
        type:String,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
    },
    phone:{
        type:Number,
    },
    address:{
        type:String
    },
    cart: [
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 },
        size:{type:String}
    }
    ]
,
    order:[{type:mongoose.Schema.Types.ObjectId, ref:'Order'}],
    // Groovo Plus subscription fields
    isGroovoPlusActive: {
        type: Boolean,
        default: false
    },
    subscriptionStartDate: {
        type: Date
    },
    subscriptionEndDate: {
        type: Date
    }
})

// Helper method to check if subscription is currently active
userschema.methods.isGroovoPlusSubscriptionActive = function() {
    if (!this.isGroovoPlusActive || !this.subscriptionStartDate || !this.subscriptionEndDate) {
        return false;
    }
    const now = new Date();
    return now >= this.subscriptionStartDate && now <= this.subscriptionEndDate;
};

// Method to start a new Groovo Plus subscription
userschema.methods.startGroovoPlusSubscription = function() {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3); // Add 3 months

    this.isGroovoPlusActive = true;
    this.subscriptionStartDate = startDate;
    this.subscriptionEndDate = endDate;

    return this.save();
};

// Method to cancel Groovo Plus subscription
userschema.methods.cancelGroovoPlusSubscription = function() {
    this.isGroovoPlusActive = false;
    // Optionally keep the dates for history, or set to null
    // this.subscriptionStartDate = null;
    // this.subscriptionEndDate = null;

    return this.save();
};

const User=mongoose.model('User',userschema);
module.exports=User;