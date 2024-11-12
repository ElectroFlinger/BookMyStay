const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { reviewSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/reviews.js");

const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        throw new ExpressError(404, error);
    } else {
        next();
    }
};

// Create review route
router.post("/", validateReview, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        return res.status(404).send("Listing not found");
    }

    const newReview = new Review({
        comment: req.body.comment,
        rating: req.body.rating
    });

    await newReview.save();
    listing.reviews.push(newReview._id);
    await listing.save();
    req.flash("success","review submitted");

    res.redirect(`/listings/${id}`);
}));

// Delete review route
router.delete("/:reviewId", wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","review deleted");

    res.redirect(`/listings/${id}`);
}));

module.exports = router;
