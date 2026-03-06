require('dotenv').config();  
const express = require('express');
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));
  

const multerconfig = require("./config/multer");
const Product = require("./models/product");
const User = require("./models/user");


const  sendOTP  = require("./config/nodemailer");

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// static folders
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Global middleware to pass user data to all EJS views
app.use(async (req, res, next) => {
    const token = req.cookies.token;
    res.locals.user = null; // ডিফল্টভাবে ইউজার নাল থাকবে

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, { expiresIn: '1h' }); // token verify
            const user = await User.findById(decoded.userid).lean();
            if (user) {
                res.locals.user = user; // এখন সব ইজেএস ফাইলে 'user' ভেরিয়েবলটি পাওয়া যাবে
            }
        } catch (err) {
            console.log("JWT Verify Error in Middleware:", err.message);
        }
    }
    next();
});


// routes
app.get('/', async (req, res) => {
   let products = await Product.find();
  
   
    
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
        price: req.body.price,
        productname: req.body.productname,
        description: req.body.description,
        productsImge: mainImage,
        galleryImages: galleryImages,
        category: req.body.category || 'Spices' // ক্যাটাগরি সেট করা হলো, ডিফল্ট 'Spices'
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
 
               //signup/////
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.get('/signup', (req, res) => {
  res.render('user/signup');
});


app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.send("Email already registered");
  }

      bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, async function(err, hash) {

    const otp = generateOTP();
    const otpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
    const user = await User.create({
    name,
    email,
    password: hash,
    otp,
    otpExpire,
    isVerified: false
  });
  await sendOTP(email, otp);

    console.log(`OTP for ${password} ${email}: ${otp}`); // For testing, remove in production
      
      let token = jwt.sign({email:email, userid: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.cookie("token", token)
      res.render("user/verify", { email });
      });
  });

  
});




app.post("/verify", async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.send("User not found");

  if (user.otp !== otp) {
    return res.send("Invalid OTP");
  }

  if (user.otpExpire < Date.now()) {
    return res.send("OTP Expired");
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpire = null;
  await user.save();

  res.redirect("/");
});




app.get('/login', (req, res) => {
  res.render('user/signup');
});



app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.send("Invalid credentials or account not verified");

  } else {
    
   await bcrypt.compare(password, user.password, function(err, result) {
    // result == true
     if (result) {
            let token = jwt.sign({email:email, userid: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
           res.cookie("token", token)
           res.redirect('/');
           
        }else{
            return res.send("Somthing want Wrong")
        }
});

  }
});



async function requireLogin (req, res, next) {
    const token = req.cookies.token; // cookie থেকে token নাও
    
    
    if (!token) {
        return res.redirect("/login"); // login না থাকলে redirect
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { expiresIn: '1h' }); // token verify

        const user = await User.findById(decoded.userid).lean(); // DB থেকে user fetch
        if (!user) return res.redirect("/login");
        req.user = user; // middleware এ user attach
        next();
    } catch (err) {
        console.log(err);
        return res.redirect("/login");
    }
};

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});








app.get('/sourcing', (req, res) => {
  res.render('user/sourcing');
});

app.get("/about", (req, res) => {
  res.render("user/about");
});


app.get('/profile', requireLogin, (req, res) => {

  const user = req.user; // middleware থেকে user নাও

  res.render('user/profile' , { user });
});

app.get('/products', async (req, res) => {
    try {
        const { search, category, maxPrice, sort } = req.query;
        let query = {};

        // ১. ক্যাটাগরিগুলো ইউনিকভাবে নিয়ে আসা (যাতে লিস্টে ডুপ্লিকেট না হয়)
        const categories = await Product.distinct("category");

        // ২. ফিল্টার লজিক
        if (search) query.productname = { $regex: search, $options: 'i' };
        if (category && category !== 'All') query.category = category;
        if (maxPrice) query.price = { $lte: Number(maxPrice) };

        // ৩. সর্টিং
        let sortOption = {};
        if (sort === 'lowToHigh') sortOption.price = 1;
        if (sort === 'highToLow') sortOption.price = -1;

        const products = await Product.find(query).sort(sortOption);
        
        // categories ভেরিয়েবলটি ইজেএস-এ পাঠিয়ে দিন
        res.render('user/products', { products, categories, query: req.query });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});



app.get('/healthz', (req, res) => {
  res.status(200).send("OK");
});
app.listen(port, () => {
  console.log(`Server running http://localhost:${port}`);
});