const mongoose = require('mongoose');
const { options } = require('../controllers/auth');

const recipeSchema = new mongoose.Schema({
  // The name of the recipe.
  name: {                   
    type: String,
    required: true
  },
  // The cooking instructions for the recipe.
   instructions: {
    type: String,
  },
  // A reference to the User model.
   owner: {
    type: mongoose.Schema.Types.ObjectId,   
    required: true,
    ref: "User"
  },
  // An array of references to the Ingredient model.
    ingredients: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Ingredient"
  },
});

const Recipe = mongoose.model('Recipe', recipeSchema);
module.exports = Recipe;