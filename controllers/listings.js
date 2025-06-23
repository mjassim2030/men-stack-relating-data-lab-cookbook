const router = require('express').Router()

const Listing = require('../models/listing');

// API's/ Routes/ Main Functionality

router.get('/', async(req, res) => {
  const listings = await Listing.find().populate('owner');
  res.render('listings/index.ejs', { listings });
});

router.get('/new', async (req, res) => {
  res.render('listings/new.ejs');
});

router.post('/', async (req, res) => {
  req.body.owner = req.session.user._id;
  await Listing.create(req.body);
  res.redirect('/listings');
});

router.get("/:listingId", async (req, res) => {
  const listing = await Listing.findById(req.params.listingId).populate('owner');

  const userHasFavorited = listing.favoritedByUser.some((user) => 
    user.equals(req.session.user._id)
  );

  res.render('listings/show.ejs', { listing, userHasFavorited });
});

router.delete('/:listingId', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId);
    if (listing.owner.equals(req.session.user._id)) {
      await listing.deleteOne();
      res.redirect('/listings');
    } else {
      res.send("You don't have permission to do that.");
    }
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

router.get('/:listingId/edit', async (req, res) => {
  try {
    const currentListing = await Listing.findById(req.params.listingId);
    res.render('listings/edit.ejs', {
      listing: currentListing,
    });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

router.put('/:listingId', async (req, res) => {
  try {
    const currentListing = await Listing.findById(req.params.listingId);
    if (currentListing.owner.equals(req.session.user._id)) {
      await currentListing.updateOne(req.body);
      res.redirect('/listings');
    } else {
      res.send("You don't have permission to do that.");
    }
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

router.post('/:listingId/favorited-by/:userId', async (req, res) => {
  await Listing.findByIdAndUpdate(req.params.listingId, {
    $push: {favoritedByUser: req.params.userId}
  });
  res.redirect(`/listings/${req.params.listingId}`);
});

router.delete('/:listingId/favorited-by/:userId', async (req, res) => {
  await Listing.findByIdAndUpdate(req.params.listingId, {
    $pull: {favoritedByUser: req.params.userId}
  });
  res.redirect(`/listings/${req.params.listingId}`);
});

module.exports = router;