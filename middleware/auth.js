// middleware/auth.js
const jwt = require('jsonwebtoken');

// IMPORTANT: This must match the secret key in authController.js
const JWT_SECRET = 'your-secret-key-here';

const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authorization token not found' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = protect;