const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productname:{
        type: String,
        required: true
    },
    productsImge:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true  
    },
    // extra images
  galleryImages: [String]
});
module.exports = mongoose.model('product', productSchema);