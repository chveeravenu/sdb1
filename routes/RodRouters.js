const express = require('express');
const route = express.Router();

const Ro = require('../controllers/Rod1Con')

route.post('/',Ro.Rodabc)

module.exports = route;