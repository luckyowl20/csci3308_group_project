const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const app = require('..');
const bcrypt = require('bcryptjs');

router.get('/',isAuthenticated, async (req, res) => {
    db = req.app.locals.db; 
    const user_id = req.session.user.id //refreshing user information
    const user = await db.oneOrNone(
        `SELECT * FROM users WHERE users.id = $1`, [user_id]
    )
    req.session.user = user; //saving user information to session
    req.session.save();

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
        const colors = await db.any(
            `SELECT * FROM colors`
        )
        const user_color = await db.oneOrNone(
            `SELECT *
            FROM colors
            WHERE id = $1` , [user_settings.color_id]
        )
        
        color_string = JSON.stringify(colors);
        res.render('pages/settings', {user : user, settings : user_settings, color_string : color_string, user_color : user_color});
        // res.json(user_settings.apperance_mode);
    } catch (err) {
        console.error('Error querying user settings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
  
});

router.post('/account',isAuthenticated, async (req,res) => {
    db = req.app.locals.db; 
    const user_id = req.session.user.id //refreshing user information
    const user = await db.oneOrNone(
        `SELECT * FROM users WHERE users.id = $1`, [user_id]
    )
    req.session.user = user; //saving user information to session
    req.session.save();
    
    const {newUsername, newPassword, passwordCheck, password} = req.body; //getting account settings form results

    
    let valid = await bcrypt.compare(password, user.password_hash); //checking if password is correct to verify changes to important information
    if(!(valid)) {
        console.log('invalid password')
    }

    else{ //updating database based on which of the optional forms were filled
        if(newUsername != '') { //updating username
            console.log('setting new username');
            try {
                await db.none(
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
        if(newPassword != '') { //updating password
            console.log('setting new password');
            if(newPassword != passwordCheck) { //password verification (user must enter it twice)
                console.log('passwords do not match');
            }
            else {
                try {
                    const hashedPassword = await bcrypt.hash(newPassword, 10)
                    await db.none(
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

router.post('/Privacy',isAuthenticated, async (req,res) => {
    db = req.app.locals.db;
    const user_id = req.session.user.id
    const user = await db.oneOrNone(
        `SELECT * FROM users WHERE users.id = $1`, [user_id]
    )
    req.session.user = user;
    req.session.save();
    const user_settings = await db.oneOrNone(
        `SELECT *
        FROM user_settings
        WHERE user_settings.user_id = $1`,
        [user_id]
    );

    let{public_friends} = req.body;

    if(public_friends != 1) {
        public_friends = false;
    }
    try {
        await db.none(
            `UPDATE user_settings
            SET public_friends = $1
            WHERE user_id = $2` , [public_friends, user_id]
        )
    }
    catch {

    }

    console.log('post complete');
    res.redirect('/settings');
});

router.post('/notifications', isAuthenticated, async (req, res) => {
    db = req.app.locals.db;
    const user_id = req.session.user.id
    const user = await db.oneOrNone(
        `SELECT * FROM users WHERE users.id = $1`, [user_id]
    );
    req.session.user = user;
    req.session.save();
    const user_settings = await db.oneOrNone(
        `SELECT *
        FROM user_settings
        WHERE user_settings.user_id = $1`,
        [user_id]
    );

    let {messageNotifs, matchNotifs} = req.body;
    if(messageNotifs != 1) {
        messageNotifs = false;
    }
    try {
        await db.none(
            `UPDATE user_settings
            SET message_notifs = $1
            WHERE user_id = $2` , [messageNotifs, user_id]
        )
        console.log('success')
    }
    catch {
        console.log('failure')
    }
    if(matchNotifs != 1) {
        matchNotifs = false;
    }
    try {
        await db.none(
            `UPDATE user_settings
            SET match_notifs = $1
            WHERE user_id = $2` , [matchNotifs, user_id]
        )
        console.log('success')
    }
    catch {
        console.log('failure')
    }
    console.log(messageNotifs)
    console.log(matchNotifs)
    console.log('post complete');
    res.redirect('/settings');



})

//skipping ahead

router.post('/apperance',isAuthenticated, async (req,res) => {
    db = req.app.locals.db;
    const user_id = req.session.user.id
    const user = await db.oneOrNone(
        `SELECT * FROM users WHERE users.id = $1`, [user_id]
    );
    req.session.user = user;
    req.session.save();
    const user_settings = await db.oneOrNone(
        `SELECT *
        FROM user_settings
        WHERE user_settings.user_id = $1`,
        [user_id]
    );

    const {color, mode} = req.body;

    if(color != user_settings.ui_color) {
        try {
            color_id = await db.oneOrNone(`SELECT id FROM colors WHERE name = $1`, [color])
            await db.none(
                `UPDATE user_settings
                SET ui_color = $1, color_id = $2
                WHERE user_id = $3` , [color, color_id.id, user_id]
            )
        }
        catch {

        }
    }
    if(mode != user_settings.apperance_mode) {
        try {
            await db.none(
                `UPDATE user_settings
                SET apperance_mode = $1
                WHERE user_id = $2` , [mode, user_id]
            )
        }
        catch {

        }
    }
    console.log('post complete');
    res.redirect('/settings');

});

module.exports = router;