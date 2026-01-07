const sampleGroceries = [
  // Rice & Grains
  {
    name: "Basmati Rice 5kg",
    description: "Premium long-grain basmati rice with rich aroma and fluffy texture.",
    price: 899,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80",
    category: "Rice & Grains",
    quantity: 100,
    ratings: 4.6,
    unitSold: 320,
    offer: "10% off"
  },
  {
    name: "Brown Rice 2kg",
    description: "Organic brown rice packed with fiber and nutrients.",
    price: 340,
    imageUrl: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800&q=80",
    category: "Rice & Grains",
    quantity: 85,
    ratings: 4.5,
    unitSold: 180
  },
  {
    name: "Quinoa 500g",
    description: "High-protein quinoa grain for healthy meals.",
    price: 425,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80",
    category: "Rice & Grains",
    quantity: 45,
    ratings: 4.7,
    unitSold: 95,
    offer: "New arrival"
  },
  
  // Atta & Flour
  {
    name: "Whole Wheat Atta 10kg",
    description: "High-quality whole wheat flour for soft and healthy rotis.",
    price: 545,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
    category: "Atta & Flour",
    quantity: 80,
    ratings: 4.7,
    unitSold: 410
  },
  {
    name: "Multigrain Atta 5kg",
    description: "Nutritious blend of wheat, oats, and millets.",
    price: 395,
    imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80",
    category: "Atta & Flour",
    quantity: 60,
    ratings: 4.6,
    unitSold: 225
  },
  
  // Pulses & Lentils
  {
    name: "Toor Dal 1kg",
    description: "Unpolished toor dal rich in protein and nutrients.",
    price: 185,
    imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&q=80",
    category: "Pulses & Lentils",
    quantity: 120,
    ratings: 4.5,
    unitSold: 260,
    offer: "5% off"
  },
  {
    name: "Moong Dal 1kg",
    description: "Green moong dal for healthy soups and curries.",
    price: 165,
    imageUrl: "https://images.unsplash.com/photo-1601997187592-72d854e230fb?w=800&q=80",
    category: "Pulses & Lentils",
    quantity: 95,
    ratings: 4.6,
    unitSold: 210
  },
  {
    name: "Masoor Dal 1kg",
    description: "Red lentils perfect for quick cooking.",
    price: 145,
    imageUrl: "https://images.unsplash.com/photo-1596040033229-a0b8d1ab487a?w=800&q=80",
    category: "Pulses & Lentils",
    quantity: 110,
    ratings: 4.4,
    unitSold: 195
  },
  
  // Edible Oils
  {
    name: "Sunflower Oil 1L",
    description: "Refined sunflower oil for light and healthy cooking.",
    price: 145,
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80",
    category: "Edible Oils",
    quantity: 90,
    ratings: 4.4,
    unitSold: 300
  },
  {
    name: "Olive Oil 500ml",
    description: "Extra virgin olive oil for salads and cooking.",
    price: 685,
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80",
    category: "Edible Oils",
    quantity: 40,
    ratings: 4.8,
    unitSold: 125,
    offer: "Premium quality"
  },
  
  // Dairy Products
  {
    name: "Butter 500g",
    description: "Creamy butter with rich taste and smooth texture.",
    price: 295,
    imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&q=80",
    category: "Dairy Products",
    quantity: 70,
    ratings: 4.8,
    unitSold: 380,
    offer: "Free delivery"
  },
  {
    name: "Condensed Milk 400g",
    description: "Sweetened condensed milk for desserts.",
    price: 145,
    imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80",
    category: "Dairy Products",
    quantity: 60,
    ratings: 4.8,
    unitSold: 160
  },
  {
    name: "Paneer 200g",
    description: "Fresh cottage cheese for curries and snacks.",
    price: 85,
    imageUrl: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80",
    category: "Dairy Products",
    quantity: 55,
    ratings: 4.7,
    unitSold: 290
  },
  
  // Bakery
  {
    name: "Fresh Bread",
    description: "Soft and fresh bread for daily meals.",
    price: 45,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
    category: "Bakery",
    quantity: 150,
    ratings: 4.3,
    unitSold: 500
  },
  {
    name: "Whole Wheat Bread",
    description: "Nutritious whole wheat bread.",
    price: 55,
    imageUrl: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&q=80",
    category: "Bakery",
    quantity: 120,
    ratings: 4.5,
    unitSold: 380
  },
  
  // Instant Food
  {
    name: "Instant Noodles Pack",
    description: "Quick and tasty instant noodles.",
    price: 168,
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
    category: "Instant Food",
    quantity: 200,
    ratings: 4.6,
    unitSold: 620,
    offer: "Buy 2 Get 1"
  },
  {
    name: "Instant Pasta",
    description: "Quick cook pasta for easy meals.",
    price: 125,
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
    category: "Instant Food",
    quantity: 140,
    ratings: 4.4,
    unitSold: 310
  },
  
  // Spreads & Jams
  {
    name: "Fruit Jam 500g",
    description: "Sweet and fruity jam made from real fruits.",
    price: 165,
    imageUrl: "https://images.unsplash.com/photo-1599904149065-24c29a1d9b1f?w=800&q=80",
    category: "Spreads & Jams",
    quantity: 85,
    ratings: 4.5,
    unitSold: 210
  },
  
  // Beverages
  {
    name: "Tea Powder 1kg",
    description: "Premium tea leaves with strong aroma and taste.",
    price: 625,
    imageUrl: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80",
    category: "Beverages",
    quantity: 60,
    ratings: 4.6,
    unitSold: 190
  },
  {
    name: "Coffee Powder 500g",
    description: "Rich and aromatic filter coffee powder.",
    price: 485,
    imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80",
    category: "Beverages",
    quantity: 50,
    ratings: 4.7,
    unitSold: 160
  },
  
  // Fruits
  {
    name: "Fresh Apples 1kg",
    description: "Crisp and juicy fresh apples.",
    price: 180,
    imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&q=80",
    category: "Fruits",
    quantity: 100,
    ratings: 4.4,
    unitSold: 240,
    offer: "Seasonal offer"
  },
  {
    name: "Fresh Bananas 1 dozen",
    description: "Ripe yellow bananas rich in potassium.",
    price: 60,
    imageUrl: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800&q=80",
    category: "Fruits",
    quantity: 150,
    ratings: 4.3,
    unitSold: 420
  },
  
  // Vegetables
  {
    name: "Fresh Onions 1kg",
    description: "Farm fresh onions for everyday cooking.",
    price: 40,
    imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?w=800&q=80",
    category: "Vegetables",
    quantity: 300,
    ratings: 4.2,
    unitSold: 520
  },
  {
    name: "Fresh Tomatoes 1kg",
    description: "Juicy red tomatoes for curries and salads.",
    price: 45,
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80",
    category: "Vegetables",
    quantity: 280,
    ratings: 4.3,
    unitSold: 480
  },
  {
    name: "Fresh Potatoes 2kg",
    description: "Quality potatoes for all your cooking needs.",
    price: 50,
    imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80",
    category: "Vegetables",
    quantity: 250,
    ratings: 4.1,
    unitSold: 550
  },
  
  // Snacks
  {
    name: "Namkeen Snacks 500g",
    description: "Crunchy Indian namkeen snacks.",
    price: 210,
    imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800&q=80",
    category: "Snacks",
    quantity: 90,
    ratings: 4.7,
    unitSold: 280
  },
  {
    name: "Potato Chips 200g",
    description: "Crispy and tasty potato chips.",
    price: 95,
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80",
    category: "Snacks",
    quantity: 140,
    ratings: 4.5,
    unitSold: 390
  },
  
  // Personal Care
  {
    name: "Toothpaste",
    description: "Toothpaste for strong and healthy teeth.",
    price: 99,
    imageUrl: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&q=80",
    category: "Personal Care",
    quantity: 140,
    ratings: 4.5,
    unitSold: 360
  },
  
  // Household Essentials
  {
    name: "Laundry Detergent 1kg",
    description: "Detergent powder for powerful stain removal.",
    price: 230,
    imageUrl: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&q=80",
    category: "Household Essentials",
    quantity: 75,
    ratings: 4.6,
    unitSold: 190
  },
  {
    name: "Dish Wash Liquid 500ml",
    description: "Effective dishwashing liquid with lemon fragrance.",
    price: 125,
    imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80",
    category: "Household Essentials",
    quantity: 95,
    ratings: 4.5,
    unitSold: 245
  }
];

module.exports = sampleGroceries;