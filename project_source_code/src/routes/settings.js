const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const app = require('..');
const bcrypt = require('bcryptjs');

router.get('/settings',isAuthenticated, async (req, res) => {
  const user = req.session.user;
  const db = req.app.locals.db;

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

router.post('/settings/account',isAuthenticated, async (req,res) => {
    const user = req.session.user;
    db = req.app.locals.db;

    const {newUsername, newPassword, passwordCheck, password} = req.body;

    data = await db.oneOrNone(
        `SELECT * FROM users WHERE users.id = $1`, [user.id]
    )
    let valid = await bcrypt.compare(password, data.password_hash);
    if(!(valid)) {
        console.log('invalid password')
    }
    else{
        if(newUsername != '') {
            console.log('setting new username');
            try {
                await db.any(
                    `UPDATE users
                    SET username = $1
                    WHERE id = $2`, [newUsername, user.id]
                );
                console.log('success');
            } 
            catch {
                console.log('error updating new username');
            }
        }
        if(newPassword != '') {
            console.log('setting new password');
            if(newPassword != passwordCheck) {
                console.log('passwords do not match');
            }
            else {
                try {
                    const hashedPassword = await bcrypt.hash(newPassword, 10)
                    await db.any(
                        `UPDATE users
                        SET password_hash = $1
                        WHERE id = $2`, [hashedPassword,user.id]
                    );
                    console.log('success');
                }
                catch {
                    console.log('error updating new password');
                }
            }
        }
    }
    console.log('post complete');
    res.redirect('/settings');
});

module.exports = router;