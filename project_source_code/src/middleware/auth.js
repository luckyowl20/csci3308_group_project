// middleware/auth.js
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

   // If this is an AJAX request, return 401 instead of redirecting
   if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Redirect to login if the user is not authenticated
  res.redirect('/auth/login');
}

module.exports = {
  isAuthenticated,
};
