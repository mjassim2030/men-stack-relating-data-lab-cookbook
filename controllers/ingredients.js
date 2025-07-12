const router = require('express').Router()

const Ingredient = require('../models/ingredient.js');

// GET /ingredients - list all ingredients and show form
router.get('/', async (req, res) => {
  const ingredients = await Ingredient.find().sort({ name: 1 });
  res.render('ingredients/index.ejs', { ingredients, error: null });
});

// POST /ingredients - add a new ingredient
router.post('/', async (req, res) => {
  const name = req.body.name.trim();

  try {
    const existing = await Ingredient.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      const ingredients = await Ingredient.find().sort({ name: 1 });
      return res.render('ingredients/index.ejs', { ingredients, error: 'Ingredient already exists.' });
    }

    await Ingredient.create({ name });
    res.redirect('/ingredients');
  } catch (err) {
    const ingredients = await Ingredient.find().sort({ name: 1 });
    res.render('ingredients/index.ejs', { ingredients, error: 'An error occurred. Try again.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Ingredient.findByIdAndDelete(req.params.id);
    res.redirect('/ingredients');
  } catch (err) {
    res.redirect('/ingredients');
  }
});

module.exports = router;


