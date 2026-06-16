const mongoose = require("mongoose");
const connectDB = require("../config/db");
const env = require("../config/env");
const Product = require("../models/Product");
const Admin = require("../models/Admin");

const products = [
  {
    name: "Spag + 2 Eggs",
    category: "Main Dishes",
    description: "Classic loaded spaghetti topped with two perfectly peppered eggs. Comfort in every bite.",
    price: 5500,
    image: "assets/food-1.jpg",
    available: true,
    availableFrom: null
  },
  {
    name: "Spag + Pepper Beef or Goat Meat",
    category: "Main Dishes",
    description: "Rich spaghetti loaded with slow-cooked peppered beef or tender goat meat.",
    price: 7500,
    image: "assets/food-2.jpg",
    available: true,
    availableFrom: null
  },
  {
    name: "Spag + Chicken",
    category: "Main Dishes",
    description: "Juicy chicken pieces sitting atop our signature loaded spaghetti. Fan favourite.",
    price: 8500,
    image: "assets/food-3.jpg",
    available: true,
    availableFrom: null
  },
  {
    name: "Spag + Turkey",
    category: "Main Dishes",
    description: "Premium turkey over loaded spaghetti, our most indulgent combination yet.",
    price: 11000,
    image: "assets/food-4.jpg",
    available: true,
    availableFrom: null
  },
  {
    name: "2 Eggs",
    category: "Extras",
    description: "Two extra peppered eggs for a fuller plate.",
    price: 1200,
    image: "assets/paper-bag.jpg",
    available: true,
    availableFrom: null
  },
  {
    name: "Extra Egg (+1)",
    category: "Extras",
    description: "One extra peppered egg.",
    price: 600,
    image: "assets/paper-bag.jpg",
    available: true,
    availableFrom: null
  },
  {
    name: "Peppered Beef or Goat Meat",
    category: "Extras",
    description: "Extra peppered beef or goat meat.",
    price: 3500,
    image: "assets/paper-bag.jpg",
    available: true,
    availableFrom: null
  },
  {
    name: "Chicken",
    category: "Extras",
    description: "Extra chicken portion.",
    price: 4500,
    image: "assets/paper-bag.jpg",
    available: true,
    availableFrom: null
  },
  {
    name: "Turkey",
    category: "Extras",
    description: "Extra turkey portion.",
    price: 7000,
    image: "assets/paper-bag.jpg",
    available: true,
    availableFrom: null
  },
  {
    name: "Fried Plantain",
    category: "Extras",
    description: "Sweet fried plantain add-on.",
    price: 1000,
    image: "assets/paper-bag.jpg",
    available: true,
    availableFrom: null
  },
  {
    name: "Sausage",
    category: "Extras",
    description: "Extra sausage add-on.",
    price: 1000,
    image: "assets/paper-bag.jpg",
    available: true,
    availableFrom: null
  }
];

const seedProducts = async () => {
  for (const product of products) {
    await Product.findOneAndUpdate(
      { name: product.name },
      product,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

const seedAdmin = async () => {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    console.log("Skipping admin seed: ADMIN_USERNAME or ADMIN_PASSWORD is missing");
    return;
  }

  const existing = await Admin.findOne({ username: env.ADMIN_USERNAME });
  if (existing) {
    console.log(`Admin already exists: ${env.ADMIN_USERNAME}`);
    return;
  }

  await Admin.create({
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD
  });
  console.log(`Admin created: ${env.ADMIN_USERNAME}`);
};

const run = async () => {
  try {
    await connectDB();
    await seedProducts();
    await seedAdmin();
    console.log("Pasta House seed complete");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
