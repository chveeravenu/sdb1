const express = require('express');
const route = express.Router();
const ServCon = require('../controllers/serviceNowController')

route.post('/',ServCon.serv);

module.exports = route;