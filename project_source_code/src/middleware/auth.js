// middleware/auth.js
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Redirect to login if the user is not authenticated
  res.redirect('/auth/login');
}

module.exports = {
  isAuthenticated,
};
