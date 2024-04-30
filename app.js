if(process.env.NODE_ENV != "production") {
  require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
// const { reviewSchema, listingSchema } = require("./schema.js");
// const wrapAsync = require("./utils/wrapAsync");
// const Review = require("./models/review.js");
// const Listing = require("./models/listing.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
// const { error } = require("console");



const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlusts";
const dbUrl = process.env.ATLASDB_URL;

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });  

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true})); 
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
});

store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE", err);
});
 
const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge:  7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

// app.get("/", (req, res) => {
//     res.send("Hi, Im root");
// });


 

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session()); 
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});


// app.get("/demouser", async (req, res) => {
//     let fakeUser = new User({
//         email: "stud@gmail.com",
//         username: "deltaa-student"
//     })

//     let registeredUser = await User.register(fakeUser, "helloraja"); //hello world is password
//     res.send(registeredUser);
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);




// Index route
// app.get("/listings", wrapAsync(async (req, res) => {
//     const allListings = await Listing.find({});
//     res.render("listings/index.ejs", { allListings });
//     }));

// //New Route
// app.get("/listings/new", (req, res) => {
//     if(!req.isAuthenticated()) {
//         req.flash("error", "you must be logged in to create listings!");
//         return res.redirect("/listings");
//     }
//     res.render("listings/new.ejs")
//  });
 
// //Show Route
// app.get("/listings/:id", wrapAsync(async (req, res) => {
//     let {id} = req.params;
//     const listing = await Listing.findById(id).populate("reviews");
//     res.render("listings/show.ejs", { listing });
// }));

// //Create route
// app.post(
//     "/listings",
//     wrapAsync(async (req, res, next) => { 
//         const newListing = new Listing(req.body.Listing);
//         await newListing.save();
//         req.flash("success", "New Listing Created!");
//         res.redirect("/listings");
//     })
// );

//Edit Route
// app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
//     let {id} = req.params;
//     const listing = await Listing.findById(id);
//     res.render("listings/edit.ejs", { listing });
// }));

//Update Route
// app.put("/listings/:id", wrapAsync(async (req, res) => {
//     let {id} = req.params;
//     await Listing.findByIdAndUpdate(id, { ...req.body.Listing });
//     req.flash("success", "Listing Updated!");
//     res.redirect(`/listings/${id}`);
// }));

//Delete route
// app.delete("/listings/:id", wrapAsync(async (req, res) => {
//     let {id} = req.params;
//     let deltedListing = await Listing.findByIdAndDelete(id);
//     console.log(deltedListing);
//     req.flash("success", "Listing Deleted!");
//     res.redirect("/listings");
// }));

// Review route
//post route
// app.post("/listings/:id/reviews", async (req, res) => {
//     let listing = await Listing.findById(req.params.id);
//     let newReview = new Review(req.body.review);

//     listing.reviews.push(newReview);

//     await newReview.save();
//     await listing.save();
//     req.flash("success", "New Review Created!");
//     res.redirect(`/listings/${listing._id}`);
// });

// Delete review route 

// app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
//     let {id, reviewId} = req.params;

//     await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
//     await Review.findByIdAndDelete(reviewId);
//     req.flash("success", "Review Deleted!");
//     res.redirect(`/listings/${id}`);

// }));

// Sign up form
// app.get("/signup", (req, res) => {
//     res.render("users/signup.ejs");
// });

// app.post("/signup", wrapAsync(async (req, res) =>{
    
//         let {username, email, password} = req.body;
//         const newUser = new User({ email, username });
//         const registerdUser = await User.register(newUser, password);
//         console.log(registerdUser);
//         req.flash("success", "Welcome to Wanderlust");
//         res.redirect("/listings"); 
// })
// );

//login form
// app.get("/login", (req, res) => {
//     res.render("users/login.ejs");
// });

// app.post("/login", passport.authenticate("local", {
//     failureRedirect: "/login", 
//     failureFlash: true,
// }), 
//  async (req, res) => {
//     req.flash("success", "Welcome to Wanderlust! You are logged in!");
//     res.redirect("/listings");
// });

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "page not found"));
});
 
app.use((err, req, res, next) => {
   let {statusCode = 500, message = "something went wrong"} = err;
   res.status(statusCode).render("error.ejs", { message });
//    res.status(statusCode).send(message);
});

app.listen(8080, ()=>{
    console.log("server is listening to port 8080")
});