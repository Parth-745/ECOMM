/**
 * Price calculation utilities for orders
 *
 * Usage Examples:
 *
 * // In order creation controller
 * const { calculateOrderTotal, hasFreeDelivery } = require('../util/priceCalculator');
 *
 * // Calculate order total with delivery charges
 * const priceBreakdown = calculateOrderTotal(user.cart, user);
 * // Returns: { subtotal: 1000, deliveryCharge: 0, totalAmount: 1000 }
 *
 * // Check if user has free delivery
 * const freeDelivery = hasFreeDelivery(user);
 * // Returns: true/false
 *
 * // Calculate delivery charge only
 * const deliveryCharge = calculateDeliveryCharge(user, 50);
 * // Returns: 0 (for Groovo Plus) or 50 (normal)
 */

/**
 * Calculate delivery charge based on user's subscription status
 * @param {Object} user - User object with subscription information
 * @param {number} baseDeliveryCharge - Base delivery charge amount (default: 50)
 * @returns {number} - Delivery charge amount
 */
const calculateDeliveryCharge = (user, baseDeliveryCharge = 50) => {
    // Check if user has active Groovo Plus subscription
    if (user.isGroovoPlusSubscriptionActive && user.isGroovoPlusSubscriptionActive()) {
        return 0; // Free delivery for Groovo Plus subscribers
    }
    return baseDeliveryCharge; // Normal delivery charge
};

/**
 * Calculate total order amount including products and delivery
 * @param {Array} cartItems - Array of cart items with product and quantity
 * @param {Object} user - User object with subscription information
 * @param {number} baseDeliveryCharge - Base delivery charge amount (default: 50)
 * @returns {Object} - Object containing subtotal, deliveryCharge, and totalAmount
 */
const calculateOrderTotal = (cartItems, user, baseDeliveryCharge = 50) => {
    // Calculate subtotal (product prices only)
    const subtotal = cartItems.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
    }, 0);

    // Calculate delivery charge based on subscription
    const deliveryCharge = calculateDeliveryCharge(user, baseDeliveryCharge);

    // Calculate total amount
    const totalAmount = subtotal + deliveryCharge;

    return {
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        totalAmount: totalAmount
    };
};

/**
 * Check if user has free delivery (Groovo Plus active)
 * @param {Object} user - User object with subscription information
 * @returns {boolean} - True if user has free delivery
 */
const hasFreeDelivery = (user) => {
    return user.isGroovoPlusSubscriptionActive && user.isGroovoPlusSubscriptionActive();
};

module.exports = {
    calculateDeliveryCharge,
    calculateOrderTotal,
    hasFreeDelivery
};