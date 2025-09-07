const express = require('express');
const route = express.Router();
const ServCon = require('../controllers/serviceNowController')
// const servi = require('../controllers/courseController')
const sendretmail = require('../controllers/mailcontroller')
const userController = require('../controllers/userController');

route.post('/',ServCon.serv);
route.post('/apex',ServCon.getUserData);
route.post('/retentionMailSend',sendretmail.retmailsend);
// route.post('/Rod1',sende.Rodabc)
route.post('/offer-free-trial', userController.offerFreeTrial);

// NEW: Endpoint for ServiceNow to offer premium extension
route.post('/offer-premium-extension', userController.offerPremiumExtension);

route.post('/offer-time-limited-discount', userController.offerTimeLimitedDiscount);

module.exports = route;