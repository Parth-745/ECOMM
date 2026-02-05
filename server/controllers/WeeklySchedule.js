const User = require('../models/User');
const WeeklySchedule = require('../models/WeeklySchedule');
const Product = require('../models/Product');

// Try to load razorpay, but don't fail if it's not installed
let Razorpay;
let crypto;
try {
    Razorpay = require('razorpay');
    crypto = require('crypto');
    console.log('Razorpay loaded successfully');
} catch (error) {
    console.log('Razorpay not installed. Subscription payments will not work. Install with: npm install razorpay');
    console.log('Error details:', error.message);
    Razorpay = null;
    crypto = null;
}

// Save or update weekly schedule
exports.saveWeeklySchedule = async (req, res) => {
    try {
        const { weeklyItems, deliveryDay, deliveryTimeSlot } = req.body;
        const firebaseUid = req.payload.uid;

        // Validate required fields
        if (!weeklyItems || !Array.isArray(weeklyItems) || weeklyItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one item must be added to the weekly schedule'
            });
        }

        if (!deliveryDay || !deliveryTimeSlot) {
            return res.status(400).json({
                success: false,
                message: 'Delivery day and time slot are required'
            });
        }

        // Find user and validate Groovo Plus subscription
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has active Groovo Plus subscription
        const hasActiveSubscription = user.isGroovoPlusSubscriptionActive &&
                                    user.isGroovoPlusSubscriptionActive() &&
                                    user.subscriptionEndDate &&
                                    new Date() <= new Date(user.subscriptionEndDate);

        if (!hasActiveSubscription) {
            return res.status(403).json({
                success: false,
                message: 'Active Groovo Plus subscription is required to create weekly schedules'
            });
        }

        // Validate weekly items - check if products exist and format is correct
        const validatedItems = [];
        for (const item of weeklyItems) {
            if (!item.productId || !item.quantity || item.quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid item format. Each item must have productId and quantity (min 1)'
                });
            }

            // Check if product exists
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product with ID ${item.productId} not found`
                });
            }

            validatedItems.push({
                productId: item.productId,
                quantity: item.quantity
            });
        }

        // Check if user already has a weekly schedule
        let schedule = await WeeklySchedule.findOne({ userId: user._id });

        if (schedule) {
            // Update existing schedule
            schedule.weeklyItems = validatedItems;
            schedule.deliveryDay = deliveryDay;
            schedule.deliveryTimeSlot = deliveryTimeSlot;
            schedule.isActive = true;
            schedule.updatedAt = new Date();

            await schedule.save();

            return res.status(200).json({
                success: true,
                message: 'Weekly schedule updated successfully',
                schedule: schedule
            });
        } else {
            // Create new schedule
            const newSchedule = new WeeklySchedule({
                userId: user._id,
                weeklyItems: validatedItems,
                deliveryDay: deliveryDay,
                deliveryTimeSlot: deliveryTimeSlot,
                isActive: true
            });

            await newSchedule.save();

            return res.status(201).json({
                success: true,
                message: 'Weekly schedule created successfully',
                schedule: newSchedule
            });
        }

    } catch (error) {
        console.error('Error saving weekly schedule:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save weekly schedule. Please try again.'
        });
    }
};


// Get user's weekly schedule
exports.getWeeklySchedule = async (req, res) => {
    try {
        const firebaseUid = req.payload.uid;

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const schedule = await WeeklySchedule.findOne({ userId: user._id })
            .populate('weeklyItems.productId', 'name price image');

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'No weekly schedule found'
            });
        }

        return res.status(200).json({
            success: true,
            schedule: schedule
        });

    } catch (error) {
        console.error('Error fetching weekly schedule:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch weekly schedule'
        });
    }
};

// Delete weekly schedule
exports.deleteWeeklySchedule = async (req, res) => {
    try {
        const firebaseUid = req.payload.uid;

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const schedule = await WeeklySchedule.findOneAndDelete({ userId: user._id });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'No weekly schedule found to delete'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Weekly schedule deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting weekly schedule:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete weekly schedule'
        });
    }
};

// Confirm weekly delivery (public endpoint for email links)
exports.confirmWeeklyDelivery = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        const schedule = await WeeklySchedule.findById(scheduleId).populate('userId', 'email username');
        if (!schedule) {
            return res.status(404).send(`
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2>Invalid Link</h2>
                    <p>The delivery confirmation link is invalid or has expired.</p>
                    <p>Please check your email for the latest reminder.</p>
                </body>
                </html>
            `);
        }

        if (!schedule.isActive) {
            return res.status(400).send(`
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2>Schedule Not Active</h2>
                    <p>Your weekly delivery schedule is no longer active.</p>
                    <p>Please update your schedule in your account settings.</p>
                </body>
                </html>
            `);
        }

        // Mark as confirmed (you could add a confirmation field to the schema if needed)
        // For now, we'll just show a success message

        return res.send(`
            <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
                <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="color: #4caf50; font-size: 48px; margin-bottom: 20px;">✅</div>
                    <h2 style="color: #333; margin-bottom: 20px;">Delivery Confirmed!</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Thank you for confirming your weekly delivery. Your order will be delivered as scheduled.
                    </p>
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #1976d2;">
                            <strong>Delivery Date:</strong> ${schedule.nextDeliveryDate.toLocaleDateString('en-IN')}<br/>
                            <strong>Time Slot:</strong> ${schedule.deliveryTimeSlot}
                        </p>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        You can manage your weekly schedule anytime from your Groovo Plus account.
                    </p>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error confirming weekly delivery:', error);
        return res.status(500).send(`
            <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2>Error</h2>
                <p>Something went wrong. Please try again later.</p>
            </body>
            </html>
        `);
    }
};

// Cancel weekly delivery for this week (public endpoint for email links)
exports.skipWeeklyDelivery = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        const schedule = await WeeklySchedule.findById(scheduleId).populate('userId', 'email username');
        if (!schedule) {
            return res.status(404).send(`
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2>Invalid Link</h2>
                    <p>The delivery cancellation link is invalid or has expired.</p>
                    <p>Please check your email for the latest reminder.</p>
                </body>
                </html>
            `);
        }

        if (!schedule.isActive) {
            return res.status(400).send(`
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2>Schedule Not Active</h2>
                    <p>Your weekly delivery schedule is no longer active.</p>
                </body>
                </html>
            `);
        }

        // Skip this week's delivery by updating nextDeliveryDate to next week
        const nextDelivery = new Date(schedule.nextDeliveryDate);
        nextDelivery.setDate(nextDelivery.getDate() + 7);
        schedule.nextDeliveryDate = nextDelivery;
        schedule.lastProcessedDate = new Date();
        await schedule.save();

        return res.send(`
            <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
                <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="color: #ff9800; font-size: 48px; margin-bottom: 20px;">⏭️</div>
                    <h2 style="color: #333; margin-bottom: 20px;">Delivery Skipped!</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Your weekly delivery has been skipped for this week. Your next delivery is scheduled for:
                    </p>
                    <div style="background: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #e65100;">
                            <strong>Next Delivery:</strong> ${nextDelivery.toLocaleDateString('en-IN')}<br/>
                            <strong>Time Slot:</strong> ${schedule.deliveryTimeSlot}
                        </p>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        You can reactivate or modify your weekly schedule anytime from your Groovo Plus account.
                    </p>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error cancelling weekly delivery:', error);
        return res.status(500).send(`
            <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2>Error</h2>
                <p>Something went wrong. Please try again later.</p>
            </body>
            </html>
        `);
    }
};

// Create Razorpay order for subscription
// exports.createSubscriptionOrder = async (req, res) => {
//     try {
//         // Check if Razorpay is available
//         if (!Razorpay) {
//             return res.status(500).json({
//                 success: false,
//                 message: 'Payment system is currently unavailable. Please try again later or contact support.'
//             });
//         }

//         const { amount, currency = 'INR' } = req.body;
//         const firebaseUid = req.payload.uid;

//         // Validate amount (should be ₹99)
//         if (amount !== 99) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid subscription amount'
//             });
//         }

//         // Find user
//         const user = await User.findOne({ firebaseUid });
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }

//         // Check if user already has active subscription
//         const hasActiveSubscription = user.isGroovoPlusSubscriptionActive &&
//                                     user.isGroovoPlusSubscriptionActive() &&
//                                     user.subscriptionEndDate &&
//                                     new Date() <= new Date(user.subscriptionEndDate);

//         if (hasActiveSubscription) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'User already has an active Groovo Plus subscription'
//             });
//         }

//         // Initialize Razorpay
//         const razorpay = new Razorpay({
//             key_id: process.env.RAZORPAY_KEY_ID,
//             key_secret: process.env.RAZORPAY_KEY_SECRET,
//         });

//         // Create order
//         const options = {
//             amount: amount * 100, // Razorpay expects amount in paisa
//             currency: currency,
//             receipt: `groovo_plus_${user._id}_${Date.now()}`,
//             notes: {
//                 userId: user._id.toString(),
//                 subscriptionType: 'groovo_plus',
//                 duration: '3_months'
//             }
//         };

//         const order = await razorpay.orders.create(options);

//         return res.status(200).json({
//             success: true,
//             order: {
//                 id: order.id,
//                 amount: order.amount,
//                 currency: order.currency,
//                 receipt: order.receipt
//             },
//             key: process.env.RAZORPAY_KEY_ID
//         });

//     } catch (error) {
//         console.error('Error creating subscription order:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Failed to create subscription order'
//         });
//     }
// }

// // Verify subscription payment
// exports.verifySubscriptionPayment = async (req, res) => {
//     try {
//         // Check if crypto is available
//         if (!crypto) {
//             return res.status(500).json({
//                 success: false,
//                 message: 'Payment verification system not configured. Please contact administrator.'
//             });
//         }

//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
//         const firebaseUid = req.payload.uid;

//         // Find user
//         const user = await User.findOne({ firebaseUid });
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }

//         // Verify payment signature
//         const sign = razorpay_order_id + '|' + razorpay_payment_id;
//         const expectedSign = crypto
//             .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//             .update(sign.toString())
//             .digest('hex');

//         if (razorpay_signature !== expectedSign) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Payment verification failed'
//             });
//         }

//         // Payment verified successfully
//         return res.status(200).json({
//             success: true,
//             message: 'Payment verified successfully',
//             paymentId: razorpay_payment_id,
//             orderId: razorpay_order_id
//         });

//     } catch (error) {
//         console.error('Error verifying subscription payment:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Failed to verify payment'
//         });
//     }
// };


exports.updateWeeklyScheduleTime = async (req, res) => {
    try {
        const { deliveryDay, deliveryTimeSlot } = req.body;
        const firebaseUid = req.payload.uid;

        if (!deliveryDay || !deliveryTimeSlot) {
            return res.status(400).json({
                success: false,
                message: "Delivery day and time slot are required"
            });
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const schedule = await WeeklySchedule.findOne({ userId: user._id });
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Weekly schedule not found"
            });
        }

        // ⛔ 1-hour lock rule
        if (schedule.nextDeliveryDate) {
            const now = new Date();
            const deliveryTime = new Date(schedule.nextDeliveryDate);
            const diffInMinutes = (deliveryTime - now) / (1000 * 60);

            if (diffInMinutes <= 60) {
                return res.status(400).json({
                    success: false,
                    message: "Schedule cannot be changed within 1 hour of delivery"
                });
            }
        }

        // Update schedule
        schedule.deliveryDay = deliveryDay;
        schedule.deliveryTimeSlot = deliveryTimeSlot;
        schedule.updatedAt = new Date();

        await schedule.save();

        return res.status(200).json({
            success: true,
            message: "Weekly schedule updated successfully",
            schedule
        });

    } catch (error) {
        console.error("Error updating weekly schedule:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update weekly schedule"
        });
    }
};


exports.deleteWeeklySchedule = async (req, res) => {
    try {
        const firebaseUid = req.payload.uid;

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const schedule = await WeeklySchedule.findOneAndDelete({
            userId: user._id
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "No weekly schedule found to delete"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Weekly schedule deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting weekly schedule:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete weekly schedule"
        });
    }
};
