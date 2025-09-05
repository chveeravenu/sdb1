const express = require('express');
const route = express.Router();
const ServCon = require('../controllers/serviceNowController')
// const servi = require('../controllers/courseController')
const sendretmail = require('../controllers/mailcontroller')

route.post('/',ServCon.serv);
route.post('/apex',ServCon.getUserData);
route.post('/retentionMailSend',sendretmail.retmailsend);

module.exports = route;