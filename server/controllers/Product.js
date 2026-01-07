const Product = require('../models/Product');
const Category = require('../models/Category');
const sampleGroceries=require('../ProductData');
const Order = require('../models/Order');
const User = require('../models/User');

exports.seedDatabase = async (req, res) => {
  try {

    await Product.deleteMany({});
    await Category.deleteMany({});

    // Process each sample shoe
    for (const shoe of sampleGroceries) {
      // Create or update product
      const newProduct = new Product({
        name: shoe.name,
        description: shoe.description,
        price: shoe.price,
        imageUrl: shoe.imageUrl,
        category: shoe.category,
        quantity: shoe.quantity,
        ratings: shoe.ratings,
        unitSold: shoe.unitSold,
        offer: shoe.offer || ''
      });

      await newProduct.save();

      // Handle category
      let category = await Category.findOne({ name: shoe.category });
      
      if (!category) {
        // Create new category if it doesn't exist
        category = new Category({
          name: shoe.category,
          products: [newProduct._id],
          description: `${shoe.category} shoes collection`,
          imageUrl: shoe.imageUrl
        });
      } else {
        // Add product to existing category
        if (!category.products.includes(newProduct._id)) {
          category.products.push(newProduct._id);
        }
      }
      
      await category.save();
    }

    return res.status(200).json({
      success: true,
      message: "Database seeded successfully with sample products and categories",
      productCount: sampleGroceries.length
    });

  } catch (error) {
    console.error("Error seeding database:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while seeding database"
    });
  }
};

exports.addProduct = async (req, res) => {
    try {
        const { name, description, price, imageUrl, category} = req.body;

        const newProduct = new Product({
            name,
            description,
            price,
            imageUrl,
            category
        });

        await newProduct.save();

        const exist=await Category.findOne({ name: category });
        if (!exist) {
            const newCategory = new Category({
                name: category,
                products: [newProduct._id],
                imageUrl: imageUrl
            });
            await newCategory.save();
        }
        else {
            exist.products.push(newProduct._id);
            await exist.save();
        }

        return res.status(201).json({
            success: true,
            message: "Product added successfully",
            product: newProduct
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while adding product"
        });
    }
}

exports.editProduct = async (req, res) => {
    try{
        const { productId, name, description, price, imageUrl, category,quantity,offer } = req.body;

        
        const oldProduct = await Product.findById(productId);
        const oldCategoryName = oldProduct.category;

        const product = await Product.findByIdAndUpdate(productId, {name, description, price, imageUrl, category, quantity, offer}, { new: true });

    // If category has changed, remove product from old category
        if (oldCategoryName && oldCategoryName !== category) {
            const oldCategory = await Category.findOne({ name: oldCategoryName }).populate('products');
            if (oldCategory) {
                oldCategory.products = oldCategory.products.filter(
                    (id) => id.toString() !== productId
                );
                await oldCategory.save();
            }
        }
        if(category){
            const exist = await Category.findOne({ name: category }).populate('products');
            if (!exist) {
                const newCategory = new Category({
                    name: category,
                    products: [product._id],
                    imageUrl: "default_image_url.jpg"
                });
                await newCategory.save();
            } else {
                if (!exist.products.includes(product._id)) {
                    exist.products.push(product._id);
                    await exist.save();
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Product edited successfully",
            product: product
        });
    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            success: false,
            message: "Internal server error while editing product"
        });
    }
}

exports.deleteProduct = async (req, res) => {
    try{
        const { productId } = req.body;

        const product = await Product.findByIdAndDelete(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        const category = await Category.findOne({ name: product.category }).populate('products');
        if (category) {
            category.products = category.products.filter(id => id.toString() !== productId);
            await category.save();

            if (category.products.length === 0) {
                await Category.findByIdAndDelete(category._id);
            }
        }
        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting product"
        });
    }
}

exports.getAllProducts=async(req,res)=>{
    try{
        const products=await Product.find({}).populate('reviews.userId');
        return res.json({success:true,products:products})
    }
    catch(e){
        return res.json({success:false,message:"Error during fetching products"})
    }
}

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).populate('products');
        return res.status(200).json({
            success: true,
            categories: categories
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching categories"
        });
    }
}

exports.getProductDetail=async(req,res)=>{
    try{
        const { productId } = req.params;

        const product = await Product.findById(productId).populate('reviews.userId');
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            product: product
        });
    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching product details"
        });
    }
}

exports.AddReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const userId = await User.findOne({ firebaseUid: req.payload.uid }).select('_id');

    // Validate input
    if (!orderId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Invalid review data' });
    }

    const order = await Order.findById(orderId);
    console.log(order)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Use for...of instead of forEach for async operations
    for (const item of order.products) {
      try {
        const product = await Product.findById(item.product);
        console.log(product)
        const newReview = {
          userId,
          rating,
          comment,
          date: new Date()
        };

        product.reviews.push(newReview);
        const totalRatings = product.reviews.reduce((sum, review) => sum + review.rating, 0);
        product.ratings = parseFloat((totalRatings / product.reviews.length).toFixed(1));
        
        console.log(product)
        await product.save();
      } catch (error) {
        console.error(`Error processing product review: ${error}`);
        // Continue with next product even if one fails
      }
    }

    return res.json({ success: true, message: 'Review added successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};