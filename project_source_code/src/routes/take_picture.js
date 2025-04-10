
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const express = require('express');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);


router.get('/', (req, res) => {
  res.render('pages/take_picture');
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

    await db.none(
      'INSERT INTO photos (url, description) VALUES ($1, $2)',
      [publicUrl, caption]
    );

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





