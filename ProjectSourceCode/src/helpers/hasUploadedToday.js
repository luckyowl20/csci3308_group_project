module.exports = async function hasUploaded(req, res, next){
    const db = req.app.locals.db;
    const userId = req.session.user?.id;

    try{
        const result = await db.any(
            `SELECT id FROM posts
             WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
            [userId]
          );

          res.locals.hasUploadedToday = result.length > 0;
          next();
    } catch{
        console.error('Error checking uploaded status:', error);
        res.status(500).send('Server error while checking upload status');
    }

}