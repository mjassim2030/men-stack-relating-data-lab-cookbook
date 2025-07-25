// Packages & Variables Declaration
const express = require("express")
const app = express()
const mongoose = require("mongoose")
const methodOverride = require("method-override");
const morgan = require("morgan");
const session = require("express-session");
const redirectUser = require('./middleware/redirectUser')
const signedIn = require('./middleware/signedIn')
const dotenv = require("dotenv");
const path = require("path")
dotenv.config();

const port = process.env.PORT ? process.env.PORT : '3000';

// Connect to mongoDB
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// Middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(morgan('dev'));

// Session Details
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(redirectUser);


// Index Page Route
app.get("/", async(req, res) => {
  res.render("index.ejs");
});


// Controllers
const authController = require('./controllers/auth.js');
const recipesController = require('./controllers/recipes.js');
const ingredientsController = require('./controllers/ingredients.js');

app.use('/auth', authController);
app.use('/recipes', signedIn, recipesController);
app.use('/ingredients', signedIn, ingredientsController);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});