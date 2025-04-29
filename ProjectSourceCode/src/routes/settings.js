const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const app = require('..');
const bcrypt = require('bcryptjs');
const db = require('../utils/database');

router.get('/', isAuthenticated, async (req, res) => {
    // doing this deletes the profile picture from the session
    // const user_id = req.session.user.id //refreshing user information
    // const user = await db.oneOrNone(
    //     `SELECT * FROM users WHERE users.id = $1`, [user_id]
    // )
    // req.session.user = user; //saving user information to session
    user = req.session.user; //getting user from session

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    //getting current user settings
    try {
        user_settings = await db.oneOrNone(
            `SELECT *
            FROM user_settings
            WHERE user_settings.user_id = $1`,
            [user.id]
        );
        if(!user_settings) {
            console.log('creating user settings');
            await db.none(
                `INSERT INTO user_settings (user_id)
                VALUES ($1)`,
                [user.id]
            )
            user_settings = await db.oneOrNone(
                `SELECT *
                FROM user_settings
                WHERE user_settings.user_id = $1`,
                [user.id]
            );
        }
        else {
            console.log('user settings found');
        }
        console.log(user_settings);
        res.render('pages/settings', { user: user, settings: user_settings });
        // res.json(user_settings.apperance_mode);
    } catch (err) {
        
        console.error('Error querying user settings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }

});

router.post('/account', isAuthenticated, async (req, res) => {
    
    user = req.session.user; //getting user from session
    const user_id = user.id //refreshing user information

    const { newUsername, newPassword, passwordCheck, password } = req.body; //getting account settings form results

    let valid = await bcrypt.compare(password, user.password_hash); //checking if password is correct to verify changes to important information
    if (!(valid)) {
        console.log('invalid password')
    }

    else { //updating database based on which of the optional forms were filled
        if (newUsername != '') { //updating username
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
        if (newPassword != '') { //updating password
            console.log('setting new password');
            if (newPassword != passwordCheck) { //password verification (user must enter it twice)
                console.log('passwords do not match');
            }
            else {
                try {
                    const hashedPassword = await bcrypt.hash(newPassword, 10)
                    await db.none(
                        `UPDATE users
                        SET password_hash = $1
                        WHERE id = $2`, [hashedPassword, user.id]
                    );
                    console.log('success');
                }
                catch {
                    console.log('error updating new password');
                }
            }
        }
    }

    // update user information in session
    user = await db.oneOrNone(
        `SELECT * FROM users WHERE users.id = $1`, [user_id]
    )
    req.session.user = user; //saving user information to session

    // make sure the profile picture is available in the session for navbar in all partials
    const { profile_picture_url } = await db.oneOrNone(
        'SELECT profile_picture_url FROM profiles WHERE user_id = $1',
        [user.id]
    ) || {};

    req.session.user.profile_picture_url = profile_picture_url?.profile_picture_url || null; // save url to user
    req.session.save();

    console.log('post complete');
    res.redirect('/settings');
});

router.post('/Privacy', isAuthenticated, async (req, res) => {
    
    user = req.session.user; //getting user from session
    const user_id = user.id //refreshing user information

    const user_settings = await db.oneOrNone(
        `SELECT *
        FROM user_settings
        WHERE user_settings.user_id = $1`,
        [user_id]
    );

    let { public_friends } = req.body;

    if (public_friends != 1) {
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

    // update user information in session
    user = await db.oneOrNone(
        `SELECT * FROM users WHERE users.id = $1`, [user_id]
    )
    req.session.user = user; //saving user information to session

    // make sure the profile picture is available in the session for navbar in all partials
    const { profile_picture_url } = await db.oneOrNone(
        'SELECT profile_picture_url FROM profiles WHERE user_id = $1',
        [user.id]
    ) || {};

    req.session.user.profile_picture_url = profile_picture_url?.profile_picture_url || null; // save url to user
    req.session.save();

    console.log('post complete');
    res.redirect('/settings');
});

router.post('/notifications', isAuthenticated, async (req, res) => {
    
    user = req.session.user; //getting user from session
    const user_id = user.id //refreshing user information

    // query not used, commented out
    // const user_settings = await db.oneOrNone(
    //     `SELECT *
    //     FROM user_settings
    //     WHERE user_settings.user_id = $1`,
    //     [user_id]
    // );

    let { messageNotifs, matchNotifs } = req.body;
    if (messageNotifs != 1) {
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
    if (matchNotifs != 1) {
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

    // update user information in session
    user = await db.oneOrNone(
        `SELECT * FROM users WHERE users.id = $1`, [user_id]
    )
    req.session.user = user; //saving user information to session

    // make sure the profile picture is available in the session for navbar in all partials
    const { profile_picture_url } = await db.oneOrNone(
        'SELECT profile_picture_url FROM profiles WHERE user_id = $1',
        [user.id]
    ) || {};

    req.session.user.profile_picture_url = profile_picture_url?.profile_picture_url || null; // save url to user
    req.session.save();

    console.log(messageNotifs)
    console.log(matchNotifs)
    console.log('post complete');
    res.redirect('/settings');



})

//skipping ahead

router.post('/apperance', isAuthenticated, async (req, res) => {
    
    user = req.session.user; //getting user from session
    const user_id = user.id;

    const user_settings = await db.oneOrNone(
        `SELECT *
        FROM user_settings
        WHERE user_settings.user_id = $1`,
        [user_id]
    );

    const { mode } = req.body;
    if (mode != user_settings.apperance_mode) {
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

    // update user information in session
    user = await db.oneOrNone(
        `SELECT * FROM users WHERE users.id = $1`, [user_id]
    )
    req.session.user = user; //saving user information to session

    // make sure the profile picture is available in the session for navbar in all partials
    const { profile_picture_url } = await db.oneOrNone(
        'SELECT profile_picture_url FROM profiles WHERE user_id = $1',
        [user.id]
    ) || {};

    req.session.user.profile_picture_url = profile_picture_url?.profile_picture_url || null; // save url to user
    req.session.save();

    console.log('post complete');
    res.redirect('/settings');

});

module.exports = router;