// index.js
const express = require('express');
const app = express();
const path = require('path');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const pgp = require('pg-promise')();
const bcrypt = require('bcryptjs');

const injectProfileData = require('./middleware/injectProfileData'); // for setting the profile data as a public var within the session, used in nav bar
const customHelpers = require('./helpers/handlebars_helpers'); // custom functions for use in .hbs files

// socket stuff for live chat messages
const http = require('http');
const socketIo = require('socket.io');

// -------------------------------------
// Database Config and Connection
// -------------------------------------
const dbConfig = {
  host: 'db', // database server hostname
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};
const db = pgp(dbConfig);

db.connect()
.then(obj => {
  console.log('Database connection successful');
  obj.done();
})
.catch(error => {
  console.log('ERROR:', error.message || error);
});

// -------------------------------------
// View Engine Setup (Handlebars)
// -------------------------------------
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: [path.join(__dirname, 'views/partials')],
  helpers: customHelpers
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// -------------------------------------
// Middleware Setup
// -------------------------------------
// serve static files from src/resources to access client side javascript files in there
app.use('/resources', express.static(path.join(__dirname, '/resources')));

// make profile available to the whole session
app.use(injectProfileData);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

// Make session user available in templates
app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;

  if (!req.session?.user) return next();

  // make sure profile picture is available in templates too by a query to the database based on the session user
  try {
    const db = req.app.locals.db;

    const { profile_picture_url } = await db.oneOrNone(
      'SELECT profile_picture_url FROM profiles WHERE user_id = $1',
      [req.session.user.id]
    ) || {};

    // Add profile_picture_url to the existing user object
    res.locals.user.profile_picture_url = profile_picture_url || null;

  } catch (err) {
    console.error('Error fetching profile picture:', err);
  }

  next();
});

// Make db accessible to routes via app.locals
app.locals.db = db;

<<<<<<< HEAD
<<<<<<< HEAD
// -------------------------------------  START THE SERVER   ----------------------------------------------
=======
=======
>>>>>>> 4f05ba3c3580bcac94c1e8bee14115a80add55b3

// -------------------------------------
// Mount Routes  
// -------------------------------------
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const photosRoutes = require('./routes/photos');
<<<<<<< HEAD
const settingsRoutes = require('./routes/settings');
=======
const profileRoutes = require('./routes/profile');
const spotifyRoutes = require('./routes/spotify');
const userRoutes = require('./routes/users');
>>>>>>> 4f05ba3c3580bcac94c1e8bee14115a80add55b3

app.use('/', indexRoutes); 
app.use('/auth', authRoutes); 
app.use('/chat', chatRoutes);
app.use('/photos', photosRoutes);
<<<<<<< HEAD
app.use('/', settingsRoutes);
=======
app.use('/profile', profileRoutes);
app.use('/spotify', spotifyRoutes);
app.use('/users', userRoutes);

>>>>>>> 4f05ba3c3580bcac94c1e8bee14115a80add55b3

// -------------------------------------
// http server setup
// -------------------------------------
const http_server = http.createServer(app); // wraps the express app in an http server to enable socket and http support
const io = socketIo(http_server); // enables socker support on http server

// make io accessible to routes via app.locals
app.locals.io = io;

// Set up the connection handler
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room.`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// -------------------------------------
// Start the Server
// -------------------------------------
<<<<<<< HEAD
>>>>>>> 2beb962 (pulled changes from main and added post route for account settings)
=======
>>>>>>> 4f05ba3c3580bcac94c1e8bee14115a80add55b3
const PORT = process.env.PORT || 3000;

// change to http_server since this is still an express app, but with additional web services
// was:
// app.listen(...) => ...
http_server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});

<<<<<<< HEAD

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
    console.log('Login attempt with username and password:', username, password);
    // Find user in the database
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

    if (!user) {
      // If user is not found, redirect to register page
      return res.redirect('/register');
    }

    // Check if password matches using bcrypt
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      // If password doesn't match, show error message
      console.log('Incorrect password entered');
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
    console.log('Registration attempt with username and password:', username, password);

    // Check if the username already exists
    const userExists = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

    if (userExists) {
      console.log('Username already exists');
      return res.render('pages/register', { 
        message: 'Username already exists. Please choose another.',
        error: true
      });
    }

    // Hash the password before storing it in the database
    console.log("hashing password");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into the users table
    await db.query('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *', [username, hashedPassword]);

    // Create row in user_settings for user
    user = await db.one('SELECT * FROM users WHERE users.username = $1', [username]);
    await db.query('INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *', [user.id]);

    console.log('User registered successfully');
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

// -------------------------------------  SETTINGS ROUTE  ----------------------------------------------

app.get('/settings', async (req, res) => {
  const user = req.session.user; // need to add a check that the user session is actually valid

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized'});
  }
  //getting current user settings
  try {
    const user_settings = await db.oneOrNone(
        `SELECT *
        FROM user_settings
        WHERE user_settings.user_id = $1`,
       [user.id]
    );
    res.render('pages/settings', {user : user, settings : user_settings});
    // res.json(user_settings.apperance_mode);
  } catch (err) {
    console.error('Error querying user settings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
  
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

=======
module.exports = app; 
>>>>>>> 4f05ba3c3580bcac94c1e8bee14115a80add55b3
