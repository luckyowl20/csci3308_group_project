/*
Lines 5-62 are from the lab 8 index.js code, excluding the axios dependency.
*/

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
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

// placeholder endpoint for now
app.length('/week_photos', async (req, res) => {
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