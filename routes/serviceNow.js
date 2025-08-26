const express = require('express');
const route = express.Router();
const ServCon = require('../controllers/serviceNowController')
// const servi = require('../controllers/courseController')

route.post('/',ServCon.serv);
route.post('/apex',ServCon.getUserData)

module.exports = route;