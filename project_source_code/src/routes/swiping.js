const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const geoip = require('geoip-lite');
const ip = req.ip || req.connection.remoteAddress;
const geo = geoip.lookup(ip);

router.get('/', isAuthenticated, (req, res) =>{
    res.render('pages/swipe');
});
 