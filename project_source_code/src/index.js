/*
Lines 5-62 are from the lab 8 index.js code, excluding the axios dependency.
*/

// ----------------------------------   DEPENDENCIES  ----------------------------------------------

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords


// -------------------------------------  APP CONFIG   ----------------------------------------------
// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: [
    path.join(__dirname, 'views/partials')
  ]
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// -------------------------------------  DB CONFIG AND CONNECT   ---------------------------------------
const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
  };
  
const db = pgp(dbConfig);

// test your database
db.connect()
.then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
})
.catch(error => {
    console.log('ERROR:', error.message || error);
});

// -------------------------------------  START THE SERVER   ----------------------------------------------
const PORT = process.env.PORT || 3000;
module.exports = app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});


app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/', (req, res) => {
  res.render('pages/about');
});

// -------------------------------------  ABOUT ROUTE  ----------------------------------------------
app.get('/about', (req, res) => {
  res.render('pages/about');
});

// -------------------------------------  LOGIN ROUTE  ----------------------------------------------
// GET /login route to render the login page
app.get('/login', (req, res) => {
  const message = req.session.message;
  req.session.message = null; // Clear message after displaying

  res.render('pages/login', { message });
});

// POST /login route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user in the database
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

    if (!user) {
      // If user is not found, redirect to register page
      return res.redirect('/register');
    }

    // Check if password matches using bcrypt
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      // If password doesn't match, show error message
      return res.render('pages/login', { 
        message: 'Incorrect username or password.', 
        error: true 
      });
    }

    // Save user details in session
    req.session.user = user;
    req.session.save(() => {
      // Redirect to /discover route after successful login
      res.redirect('/discover');
    });

  } catch (error) {
    console.error('Login error:', error.message);
    return res.render('pages/login', { 
      message: 'An error occurred during login. Please try again.', 
      error: true 
    });
  }
});

// -------------------------------------  REGISTER ROUTE  ----------------------------------------------
// GET /register route to render the registration page
app.get('/register', (req, res) => {
  res.render('pages/register'); // Renders the register.hbs file
});

// POST /register route
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the username already exists
    const userExists = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

    if (userExists) {
      return res.render('pages/register', { 
        message: 'Username already exists. Please choose another.',
        error: true
      });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into the users table
    await db.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [username, hashedPassword]);

    // Store success message in session and redirect to login
    req.session.message = { text: 'Registration successful! You can now log in.' };
    res.redirect('/login'); // Redirect to login page after successful registration
  } catch (error) {
    console.error('Registration error details:', error.message);
    return res.render('pages/register', { message: 'Registration failed. Please try again.' });
  }
});



// -------------------------------------  EXPLORE ROUTE  ----------------------------------------------
app.get('/explore', (req, res) => {
  res.render('pages/explore');
});

// -------------------------------------  EXPLORE ROUTE  ----------------------------------------------
app.get('/profile', (req, res) => {
  res.render('pages/personal_profile');
});



// -------------------------------------  REGISTER ROUTE  ----------------------------------------------
app.get('/week_photos', async (req, res) => {
    const user_id = req.session.user_id; // need to add a check that the user session is actually valid
    
    if (!user_id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Query to get photos uploaded in the last 7 days by the user
    try {
        const photos = await db.any(
            `SELECT photos.* FROM photos
            JOIN posts ON photos.id = posts.photo_id
            WHERE posts.user_id = $1
            AND photos.uploaded_at >= NOW() - INTERVAL '7 days'
            ORDER BY photos.uploaded_at DESC`,
           [user_id]
        );
    
        res.json(photos);
      } catch (err) {
        console.error('Error querying photos:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -------------------------------------  CHAT ROUTE  ----------------------------------------------
app.get('/chat', async (req, res) => {
  // const friends = await db.any(
  //   `SELECT u.id, u.display_name, u.profile_picture_url
  //    FROM users u
  //    JOIN friends f ON f.friend_id = u.id
  //    WHERE f.user_id = $1`,
  //   [req.session.user_id]
  // );
  // res.render('pages/chat', {
  //   friends,
  //   chatPartner,
  //   messages,
  // });
  res.render('pages/chat');
});

app.post('/messages/send', (req, res) => {
  const { receiver_id, message_text } = req.body;

  // You can add session check here if needed:
  // if (!req.session.user_id) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  console.log('Receiver ID:', receiver_id);
  console.log('Message Text:', message_text);

  res.status(200).json({ status: 'Message received and logged.' });
});

