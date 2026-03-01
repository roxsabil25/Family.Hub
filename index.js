const express = require('express');
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

const multerconfig = require("./config/multer");
const Product = require("./models/product");

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// static folders
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.get('/', async (req, res) => {
   let products = await Product.find();
   
    console.log(products);
    res.render('user/index', { products });
});

app.get('/admin/products/add', async (req, res) => {
  let products = await Product.find();
  res.render('admin/productadd', { products });
});


// ✅ PRODUCT ADD
app.post(
  "/admin/products/add",
  multerconfig.fields([
    { name: "productsImge", maxCount: 1 }, // main image
    { name: "galleryImages", maxCount: 4 } // extra images
  ]),
  async (req, res) => {

    try {

      // main image
      const mainImage =
        req.files["productsImge"]
          ? `/uploads/products/${req.files["productsImge"][0].filename}`
          : null;

      // gallery images array
      const galleryImages =
        req.files["galleryImages"]
          ? req.files["galleryImages"].map(file =>
              `/uploads/products/${file.filename}`
            )
          : [];

      await Product.create({
        productname: req.body.productname,
        description: req.body.description,
        productsImge: mainImage,
        galleryImages: galleryImages
      });

      res.redirect("/admin/products/add");

    } catch (error) {
      console.log(error);
      res.send("Upload Error");
    }
});


app.get('/products/details/:id', async (req, res) => {

  const product = await Product.findById(req.params.id);

  // related product (same collection থেকে random)
  const relatedProducts = await Product.find({
    _id: { $ne: req.params.id }
  }).limit(4);

  res.render('user/productdetails', {
    product,
    relatedProducts
  });
});

app.get('/admin/products/delete/:id', async (req, res) => {
 let product = await Product.findByIdAndDelete(req.params.id);
  res.redirect("/admin/products/add");
});
 



app.get('/healthz', (req, res) => {
  res.status(200).send("OK");
});
app.listen(port, () => {
  console.log(`Server running http://localhost:${port}`);
});