// src/middleware/injectProfileData.js

module.exports = async function injectProfileData(req, res, next) {
    const db = req.app.locals.db;
  
    // No session? Skip
    if (!req.session?.user) {
      return next();
    }
  
    try {
      // Get profile pic for logged-in user
      const profile = await db.oneOrNone(
        'SELECT profile_picture_url FROM profiles WHERE user_id = $1',
        [req.session.user.id]
      );
  
      // Make it available in templates under `user`
      res.locals.user = {
        ...req.session.user,
        profile_picture_url: profile?.profile_picture_url || null
      };
    } catch (err) {
      console.error('Error injecting profile data:', err);
      // Even if this fails, continue
      res.locals.user = req.session.user;
    }
  
    next();
  };
  