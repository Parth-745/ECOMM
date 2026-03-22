const User=require('../models/User');

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity, size, cartType = 'regular' } = req.body;
        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                message: "Please provide productId and quantity",
            });
        }

        const targetCartKey = cartType === 'weekly' ? 'weeklyCart' : 'cart';

        let user = await User.findOne({ firebaseUid: req.payload.uid })
            .populate('cart.product')
            .populate('weeklyCart.product');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!Array.isArray(user[targetCartKey])) {
            user[targetCartKey] = [];
        }
        const targetCart = user[targetCartKey];

        const existingProductIndex = targetCart.findIndex(
            item => item.product._id.toString() === productId && item.size === size
        );
        if (existingProductIndex > -1) {
            if(targetCart[existingProductIndex].product.quantity <= targetCart[existingProductIndex].quantity){ 
                return res.status(400).json({
                    success: false,
                    message: "We don't have enough stock for this product",
                });
            }
            targetCart[existingProductIndex].quantity += quantity;
        } else {
            targetCart.push({ product: productId, quantity: quantity, size: size });
        }

        // Save the user first
        await user.save();

        // Then find the user again with populated carts
        user = await User.findOne({ firebaseUid: req.payload.uid })
            .populate('cart.product')
            .populate('weeklyCart.product');

        return res.status(200).json({
            success: true,
            message: cartType === 'weekly'
                ? "Product added to weekly cart successfully"
                : "Product added to cart successfully",
            cart: user.cart,
            weeklyCart: user.weeklyCart,
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "Internal server error while adding to cart",
        });
    }
}

exports.deleteFromCart = async (req, res) => {
    try {
        const { productId, quantity, size, cartType = 'regular' } = req.body;
        const targetCartKey = cartType === 'weekly' ? 'weeklyCart' : 'cart';

        // Input validation
        if (!productId || !quantity || !size) {
            return res.status(400).json({
                success: false,
                message: "Please provide productId, quantity, and size",
            });
        }

        if (isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive number",
            });
        }

        // Find user without populating cart for better performance
        const user = await User.findOne({ firebaseUid: req.payload.uid });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const targetCart = user[targetCartKey] || [];

        // Find item in target cart
        const existingProductIndex = targetCart.findIndex(
            item => item.product.toString() === productId && item.size === size
        );

        if (existingProductIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart",
            });
        }

        // Update or remove item
        if (targetCart[existingProductIndex].quantity <= quantity) {
            targetCart.splice(existingProductIndex, 1);
        } else {
            targetCart[existingProductIndex].quantity -= quantity;
        }

        await user.save();

        const updatedUser = await User.findById(user._id)
            .populate('cart.product')
            .populate('weeklyCart.product');

        return res.status(200).json({
            success: true,
            message: "Product updated in cart",
            cart: updatedUser.cart,
            weeklyCart: updatedUser.weeklyCart
        });
    } catch (e) {
        console.error("Error deleting from cart:", e);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting from cart",
        });
    }
}

exports.getCartItems=async(req,res)=>{
    try{
        const user=await User.findOne({firebaseUid:req.payload.uid})
            .populate('cart.product')
            .populate('weeklyCart.product');

        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found",
            });
        }

        return res.status(200).json({
            success:true,
            message:"Cart items fetched successfully",
            cart:user.cart,
            weeklyCart:user.weeklyCart || [],
        });
    }
    catch(e){
        console.log(e);
        return res.status(500).json({
            success:false,
            message:"Internal server error while fetching cart items",
        });
    }
}

exports.skipWeeklyDeliveryItem = async (req, res) => {
    try {
        const { productId, size } = req.body;

        const user = await User.findOne({ firebaseUid: req.payload.uid });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!Array.isArray(user.weeklyCart) || user.weeklyCart.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Weekly cart is empty",
            });
        }

        let updatedCount = 0;

        if (productId) {
            const index = user.weeklyCart.findIndex(
                (item) =>
                    item.product.toString() === productId &&
                    (!size || item.size === size),
            );

            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found in weekly cart",
                });
            }

            user.weeklyCart[index].skipNextDelivery = true;
            updatedCount = 1;
        } else {
            user.weeklyCart.forEach((item) => {
                item.skipNextDelivery = true;
                updatedCount += 1;
            });
        }

        await user.save();

        const updatedUser = await User.findById(user._id).populate('weeklyCart.product');

        return res.status(200).json({
            success: true,
            message:
                updatedCount === 1
                    ? "Item will be skipped for next delivery"
                    : "All weekly items will be skipped for next delivery",
            weeklyCart: updatedUser.weeklyCart || [],
        });
    } catch (e) {
        console.error("Error skipping weekly delivery item:", e);
        return res.status(500).json({
            success: false,
            message: "Internal server error while skipping weekly item",
        });
    }
};

exports.removeWeeklyDeliveryItem = async (req, res) => {
    try {
        const { productId, size } = req.body;

        const user = await User.findOne({ firebaseUid: req.payload.uid });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!Array.isArray(user.weeklyCart) || user.weeklyCart.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Weekly cart is empty",
            });
        }

        let removedCount = 0;

        if (productId) {
            const previousLength = user.weeklyCart.length;
            user.weeklyCart = user.weeklyCart.filter(
                (item) =>
                    !(
                        item.product.toString() === productId &&
                        (!size || item.size === size)
                    ),
            );
            removedCount = previousLength - user.weeklyCart.length;
        } else {
            removedCount = user.weeklyCart.length;
            user.weeklyCart = [];
        }

        if (removedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found in weekly cart",
            });
        }

        await user.save();

        const updatedUser = await User.findById(user._id).populate('weeklyCart.product');

        return res.status(200).json({
            success: true,
            message:
                removedCount === 1
                    ? "Item removed from weekly cart"
                    : "Weekly cart cleared successfully",
            weeklyCart: updatedUser.weeklyCart || [],
        });
    } catch (e) {
        console.error("Error removing weekly delivery item:", e);
        return res.status(500).json({
            success: false,
            message: "Internal server error while removing weekly item",
        });
    }
};
