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

// Make hbs accessible
app.locals.hbs = hbs;


// -------------------------------------
// Mount Routes  
// -------------------------------------
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const photosRoutes = require('./routes/photos');
const profileRoutes = require('./routes/profile');
const spotifyRoutes = require('./routes/spotify');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');

app.use('/', indexRoutes); 
app.use('/auth', authRoutes); 
app.use('/chat', chatRoutes);
app.use('/photos', photosRoutes);
app.use('/profile', profileRoutes);
app.use('/spotify', spotifyRoutes);
app.use('/users', userRoutes);
app.use('/settings', settingsRoutes);


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
const PORT = process.env.PORT || 3000;

// change to http_server since this is still an express app, but with additional web services
// was:
// app.listen(...) => ...
http_server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});

module.exports = app; 
