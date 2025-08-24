const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/', courseController.getAllCourses);
router.get('/search', courseController.searchCourses);
router.get('/category/:category', courseController.getCoursesByCategory);
router.get('/:id', courseController.getCourseById);
router.post('/:id/enroll', courseController.enrollInCourse);

module.exports = router;


