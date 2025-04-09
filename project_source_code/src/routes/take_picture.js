
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

//pulling supabase url and API key to send to database
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_API_KEY
  );


router.get('/', isAuthenticated, (req, res) => {
  res.render('pages/take_picture');
});
  
const storage = multer.memoryStorage(); 
const upload = multer({ storage });

router.post('/take_picture', upload.single('file'), async (req, res) =>{

  const file = req.file;

  if(!file) return res.status(400).send('No file uploaded');


  const ext = file.originalname.split('.').pop();
  const fileName = `${uuidv4()}.${ext}`;

  try {
    //uploading to supabase storage
    const {error} = await supabase.storage
    .from('images')
    .upload(fileName, file.buffer, {contentType: file.mimetype,
    });

    //this is the url that references the images store in supa base
    const { data: publicUrlData } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    const db = req.app.locals.db;
    const caption = req.body.caption || null;
    const userID = req.session.user.id;
    const title = req.body.title || 'Untitled';


    //inserting photo url and cation into our sql database
  const photoResult = await db.one(
  'INSERT INTO photos (url, description) VALUES ($1, $2) RETURNING id',
  [publicUrl, caption]
  );

  const photoId = photoResult.id;

    await db.none(
      'INSERT INTO posts (user_id, photo_id, title, body) VALUES ($1,$2,$3,$4)',
      [userID, photoId, title, caption]
    );
    //working upload message
    res.status(200).json({
      message: 'Uploaded!'
    });

  }catch (err) {console.error('Error on Upload', err);
    res.status(500).send('Upload failed');
  }
  });

module.exports = router;





