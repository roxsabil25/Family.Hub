const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://roxmarjuk25_db_user:f50M7tvwOZ0UHwaZ@cluster0.boatikm.mongodb.net/?appName=Cluster0');   
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