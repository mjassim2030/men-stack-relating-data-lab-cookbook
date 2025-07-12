const express = require('express');
const router = express.Router();

const User = require('../models/user.js');
const Recipe = require('../models/recipe.js');
const Ingredient = require('../models/ingredient.js');

// Index	/recipes	GET
router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find().populate('owner');
    res.locals.recipes = recipes;
    res.render('recipes/index.ejs');
  } catch (err) {
    res.redirect('/');
  }
});

// New	/recipes/new	GET
router.get('/new', async (req, res) => {
  const ingredients = await Ingredient.find().sort({ name: 1 });
  res.render('recipes/new.ejs', { ingredients });
});

router.post('/', async (req, res, next) => {
  try {
    /* ---------- normalise incoming data ---------- */
    let existingIds = req.body.ingredients || [];        // from check-boxes
    let newNames    = req.body.newIngredients || '';     // textarea string

    if (!Array.isArray(existingIds)) existingIds = [existingIds];
    newNames = newNames
      .split(/\r?\n/)                // one per line
      .map(s => s.trim())
      .filter(Boolean);              // remove blanks

    /* ---------- handle brand-new names ---------- */
    // 1. Fetch any of those names that already exist (case-insensitive)
    const existingDocs = await Ingredient.find({
      name: { $in: newNames }
    });

    const existingLower = existingDocs.map(d => d.name.toLowerCase());
    const toInsert      = newNames.filter(
      n => !existingLower.includes(n.toLowerCase())
    );

    // 2. Insert the truly new ones (ignore dup errors for race conditions)
    const insertedDocs = await Ingredient.insertMany(
      toInsert.map(name => ({ name })),
      { ordered: false }
    ).catch(() => []); // duplication safety

    /* ---------- build the final ingredient ID list ---------- */
    const allIngredientIds = [
      ...existingIds,                        // from check-boxes
      ...existingDocs.map(d => d._id),
      ...insertedDocs.map(d => d._id)
    ];

    /* ---------- create the recipe ---------- */
    await Recipe.create({
      name:         req.body.name.trim(),
      instructions: req.body.instructions.trim(),
      owner: req.session.user._id,
      ingredients:  allIngredientIds
    });

    res.redirect('/recipes');
  } catch (err) {
    res.redirect('/');
  }
});

// Show	/recipes/:recipeId	GET
router.get('/:recipeId', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId).populate('ingredients');;
    res.locals.recipe = recipe;
    res.render('recipes/show.ejs');
  } catch (err) {
    res.redirect('/');
  }
});

// Delete	/recipes/:recipeId	DELETE
router.delete('/:recipeId', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);
    if (recipe.owner.equals(req.session.user._id)) {
      await recipe.deleteOne();
      res.redirect('/recipes');
    } else {
      res.redirect('/');
    }
  } catch (err) {
    res.redirect('/');
  }
});

// Edit	/recipes/:recipeId/edit	GET
router.get('/:recipeId/edit', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId).populate('ingredients');
    const ingredients = await Ingredient.find().sort({ name: 1 });

    res.render('recipes/edit.ejs', { recipe, ingredients });
  } catch (err) {
    res.redirect('/recipes');
  }
});

// Update	/recipes/:recipeId	PUT
router.put('/:recipeId', async (req, res) => {
  try {
    let existingIds = req.body.ingredients || [];
    let newNames = req.body.newIngredients || '';

    if (!Array.isArray(existingIds)) existingIds = [existingIds];
    newNames = newNames
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);

    const existingDocs = await Ingredient.find({ name: { $in: newNames } });
    const existingNamesLower = existingDocs.map(d => d.name.toLowerCase());

    const toCreate = newNames.filter(name => !existingNamesLower.includes(name.toLowerCase()));
    const createdDocs = await Ingredient.insertMany(
      toCreate.map(name => ({ name })),
      { ordered: false }
    ).catch(() => []);

    const allIngredientIds = [
      ...existingIds,
      ...existingDocs.map(d => d._id),
      ...createdDocs.map(d => d._id)
    ];

    await Recipe.findByIdAndUpdate(req.params.recipeId, {
      name: req.body.name.trim(),
      instructions: req.body.instructions.trim(),
      ingredients: allIngredientIds,
      owner: req.session.user._id,
    });

    res.redirect(`/recipes/${req.params.recipeId}`);
  } catch (err) {
    res.redirect('/recipes');
  }

});

module.exports = router;