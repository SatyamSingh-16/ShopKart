const mongoose = require('mongoose');
const Product = require('./models/product.model');

const samples = [
  {
    name: 'Studio Wireless Headphones',
    description: 'Comfortable over-ear headphones with noise isolation, rich audio and up to 30 hours of listening time.',
    price: 4999, category: 'Electronics', image: '/images/headphones.svg', stock: 25,
  },
  {
    name: 'Mechanical RGB Keyboard',
    description: 'Tactile mechanical switches, bright RGB backlighting and a durable compact frame for your desk.',
    price: 2999, category: 'Electronics', image: '/images/keyboard.svg', stock: 10,
  },
  {
    name: 'Everyday Running Shoes',
    description: 'Lightweight, breathable sneakers with a cushioned sole for everyday runs and casual wear.',
    price: 3499, category: 'Fashion', image: '/images/shoes.svg', stock: 16,
  },
  {
    name: 'The Modern Developer',
    description: 'An approachable guide to programming fundamentals, practical projects and building software well.',
    price: 799, category: 'Books', image: '/images/book.svg', stock: 40,
  },
  {
    name: 'Warm Glow Desk Lamp',
    description: 'Minimal adjustable lamp with a warm, comfortable glow for study sessions and late-night reading.',
    price: 1899, category: 'Home', image: '/images/lamp.svg', stock: 8,
  },
  {
    name: 'Ceramic Coffee Mug',
    description: 'A sturdy everyday mug with a simple matte finish and a generous capacity for your favourite drink.',
    price: 599, category: 'Home', image: '/images/mug.svg', stock: 0,
  },
];

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing');
  await mongoose.connect(process.env.MONGO_URI);
  let created = 0;
  for (const product of samples) {
    const result = await Product.updateOne(
      { name: product.name, category: product.category },
      { $setOnInsert: product },
      { upsert: true }
    );
    if (result.upsertedCount) created++;
  }
  console.log(`Seed complete: ${created} new sample products; ${samples.length - created} already existed.`);
}

seed().catch((error) => { console.error('Seed failed:', error.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
