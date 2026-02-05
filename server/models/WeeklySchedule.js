const mongoose = require('mongoose');

const weeklyScheduleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        // Custom validation to ensure user has active Groovo Plus subscription
        validate: {
            validator: async function(userId) {
                const User = mongoose.model('User');
                const user = await User.findById(userId);
                return user && user.isGroovoPlusSubscriptionActive && user.isGroovoPlusSubscriptionActive();
            },
            message: 'Only users with active Groovo Plus subscription can create weekly schedules'
        }
    },
    weeklyItems: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
            max: [50, 'Quantity cannot exceed 50 items']
        }
    }],
    deliveryDay: {
        type: String,
        required: true,
        enum: {
            values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            message: 'Delivery day must be a valid day of the week'
        }
    },
    deliveryTimeSlot: {
        type: String,
        required: true,
        enum: {
            values: [
                '8:00 AM - 10:00 AM',
                '10:00 AM - 12:00 PM',
                '12:00 PM - 2:00 PM',
                '2:00 PM - 4:00 PM',
                '4:00 PM - 6:00 PM',
                '6:00 PM - 8:00 PM'
            ],
            message: 'Delivery time slot must be between 8:00 AM and 8:00 PM'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    nextDeliveryDate: {
        type: Date,
        default: function() {
            // Calculate next delivery date based on deliveryDay
            const today = new Date();
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const targetDayIndex = daysOfWeek.indexOf(this.deliveryDay);

            if (targetDayIndex === -1) return today;

            const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
            let daysUntilNext = (targetDayIndex - currentDayIndex + 7) % 7;

            // If it's the same day and time hasn't passed, schedule for this week
            // Otherwise, schedule for next week
            if (daysUntilNext === 0) {
                // Check if delivery time has passed today
                const [startTime] = this.deliveryTimeSlot.split(' - ');
                const [hourStr] = startTime.split(':');
                const deliveryHour = parseInt(hourStr) + (startTime.includes('PM') && hourStr !== '12' ? 12 : 0);

                if (today.getHours() >= deliveryHour) {
                    daysUntilNext = 7; // Next week
                }
            }

            const nextDelivery = new Date(today);
            nextDelivery.setDate(today.getDate() + daysUntilNext);
            return nextDelivery;
        }
    },
    lastProcessedDate: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

// Index for efficient queries
weeklyScheduleSchema.index({ userId: 1, isActive: 1 });
weeklyScheduleSchema.index({ nextDeliveryDate: 1, isActive: 1 });

// Pre-save middleware to update nextDeliveryDate when deliveryDay changes
weeklyScheduleSchema.pre('save', function(next) {
    if (this.isModified('deliveryDay') || this.isNew) {
        // Recalculate next delivery date
        const today = new Date();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDayIndex = daysOfWeek.indexOf(this.deliveryDay);

        if (targetDayIndex !== -1) {
            const currentDayIndex = today.getDay();
            let daysUntilNext = (targetDayIndex - currentDayIndex + 7) % 7;

            if (daysUntilNext === 0) {
                const [startTime] = this.deliveryTimeSlot.split(' - ');
                const [hourStr] = startTime.split(':');
                const deliveryHour = parseInt(hourStr) + (startTime.includes('PM') && hourStr !== '12' ? 12 : 0);

                if (today.getHours() >= deliveryHour) {
                    daysUntilNext = 7;
                }
            }

            const nextDelivery = new Date(today);
            nextDelivery.setDate(today.getDate() + daysUntilNext);
            this.nextDeliveryDate = nextDelivery;
        }
    }
    next();
});

// Instance method to check if schedule should be processed today
weeklyScheduleSchema.methods.shouldProcessToday = function() {
    if (!this.isActive) return false;

    const today = new Date();
    const nextDelivery = new Date(this.nextDeliveryDate);

    // Check if it's the scheduled day and time
    return today.toDateString() === nextDelivery.toDateString();
};

// Instance method to update next delivery date after processing
weeklyScheduleSchema.methods.scheduleNextDelivery = function() {
    const nextDelivery = new Date(this.nextDeliveryDate);
    nextDelivery.setDate(nextDelivery.getDate() + 7); // Add one week
    this.nextDeliveryDate = nextDelivery;
    this.lastProcessedDate = new Date();
    return this.save();
};

// Static method to find schedules that need processing today
weeklyScheduleSchema.statics.findSchedulesToProcess = function() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.find({
        isActive: true,
        nextDeliveryDate: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }).populate('userId', 'isGroovoPlusActive subscriptionEndDate')
      .populate('weeklyItems.productId', 'name price');
};

// Validation to ensure weeklyItems array is not empty
weeklyScheduleSchema.pre('validate', function(next) {
    if (this.weeklyItems.length === 0) {
        this.invalidate('weeklyItems', 'At least one item must be added to the weekly schedule');
    }
    next();
});

const WeeklySchedule = mongoose.model('WeeklySchedule', weeklyScheduleSchema);

module.exports = WeeklySchedule;