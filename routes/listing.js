const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schema.js");
const flash = require("connect-flash");
const {isLoggedIn} = require("../middleware.js");

// Middleware to validate the listing data before saving or updating
const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        // Passes the error message to a custom error handler
        throw new ExpressError(400, error.details.map(el => el.message).join(', '));
    } else {
        next();
    }
};

// Index route to display all listings
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listing/index.ejs", { allListings });
}));

// Route to display form for creating a new listing
router.get("/new",(req, res) => {
    res.render("listing/new.ejs");
});

// Route to save a new listing
router.post("/",validateListing, wrapAsync(async (req, res) => {
    const { image, ...listingData } = req.body;
    const newListing = new Listing({
        ...listingData,
        image: image
    });
    await newListing.save();
    req.flash("success", "New listing created successfully!");
    res.redirect("/listings");
}));

// Route to display details of a single listing
router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }
    res.render("listing/show.ejs", { listing });
}));

// Route to display edit form for a specific listing
router.get("/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }
    res.render("listing/edit.ejs", { listing });
}));

// Route to update a specific listing
router.put("/:id",validateListing, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { image, ...listingData } = req.body;

    const updatedListing = {
        ...listingData,
        image: image
    };

    const updated = await Listing.findByIdAndUpdate(id, updatedListing, { new: true });
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${updated._id}`);
}));

// Route to delete a specific listing
router.delete("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
}));

module.exports = router;
