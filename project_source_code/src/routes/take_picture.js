
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const hasUploadedToday = require('../helpers/hasUploadedToday');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);


// Route for Instagram-style post (NOT profile)
router.get('/', isAuthenticated, hasUploadedToday, (req, res) => {
  res.render('pages/take_picture', {
    isProfile: false,
    hasUploadedToday: res.locals.hasUploadedToday  // <== pass it to the template
  });
});

// Route for updating profile picture
router.get('/profile', isAuthenticated, (req, res) => {
  res.render('pages/take_picture', { isProfile: true, hideNav: true});
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/take_picture', upload.single('file'), async (req, res) => {

  const file = req.file;

  if (!file) return res.status(400).send('No file uploaded');

  const ext = file.originalname.split('.').pop();
  const fileName = `${uuidv4()}.${ext}`;

  try {
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,

      });

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    const db = req.app.locals.db;
    const caption = req.body.caption || null;
    const userID = req.session.user.id;
    const title = req.body.title || 'Untitled';
    const profileIS = req.body.isProfile === 'true';


    //inserting photo url and cation into our sql database

  if (profileIS){
    await db.none(
      `INSERT INTO profiles (user_id, profile_picture_url)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET profile_picture_url = EXCLUDED.profile_picture_url`,
      [userID, publicUrl]
    );
  }else{
    const photoResult = await db.one(
      'INSERT INTO photos (url, description) VALUES ($1, $2) RETURNING id',
      [publicUrl, caption]
      );

      const photoId = photoResult.id;

      //inserting photo id, caption, and user id to link the user and the photo together. 
      // Use this table to fetch a post matching with a user. 
      // THe below line is an inqury for a photo using a user id. It pulls the most recent id. 
      // 'SELECT photos.url FROM posts JOIN photos ON posts.photo_id = photos.id WHERE posts.user_id = $1 ORDER BY posts.created_at DESC LIMIT 1'
    
        await db.none(
          'INSERT INTO posts (user_id, photo_id, title, body) VALUES ($1,$2,$3,$4)',
          [userID, photoId, title, caption]
        );
  }

    //working upload message
    res.status(200).json({
      message: 'Upload successful',
      url: publicUrlData.publicUrl,
    });

  } catch (err) {
    console.error('Error on Upload', err);
    res.status(500).send('Upload failed');
  }
});

module.exports = router;





