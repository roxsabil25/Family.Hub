const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productname: { type: String, required: true },
    price: { type: Number, required: true }, // String থেকে Number করা হয়েছে ভালো ক্যালকুলেশনের জন্য
    productsImge: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'Spices' }, // নতুন ফিল্ড যোগ করা হলো
    galleryImages: [String]
});

module.exports = mongoose.model('product', productSchema);