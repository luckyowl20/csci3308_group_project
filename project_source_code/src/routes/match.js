// sql query to match users by shared interests
/*
SELECT 
  u.id, 
  u.username,
  COUNT(*) AS shared_interest_count
FROM user_interests ui1
JOIN user_interests ui2 ON ui1.interest_id = ui2.interest_id
JOIN users u ON u.id = ui2.user_id
WHERE ui1.user_id = $1 -- current user
  AND ui2.user_id != $1 -- exclude current user
GROUP BY u.id
ORDER BY shared_interest_count DESC
LIMIT 10;
*/

router.get('/', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const userId = req.session.user.id;
  
    try {
      const matches = await db.any(`
        SELECT 
          u.id, 
          u.username,
          p.profile_picture_url,
          COUNT(*) AS shared_interest_count
        FROM user_interests ui1
        JOIN user_interests ui2 ON ui1.interest_id = ui2.interest_id
        JOIN users u ON u.id = ui2.user_id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE ui1.user_id = $1 AND ui2.user_id != $1
        GROUP BY u.id, p.profile_picture_url
        ORDER BY shared_interest_count DESC
        LIMIT 10
      `, [userId]);
  
      res.render('pages/match', {
        layout: 'main',
        matches
      });
    } catch (err) {
      console.error('Error loading matches:', err);
      res.status(500).send('Unable to load matches.');
    }
  });
  