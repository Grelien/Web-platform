// middleware/auth.js - Authentication middleware

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');

// JWT Secret - MUST be set in production via environment variable
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

// Validate JWT secret is set
if (!JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET environment variable is not set!');
    console.error('⚠️  Set JWT_SECRET in your .env file or environment variables before running in production.');
    console.error('⚠️  For development, use: JWT_SECRET=your-random-secure-secret-here');

    // Exit in production, allow in development with warning
    if (process.env.NODE_ENV === 'production') {
        console.error('🛑 Cannot run in production without JWT_SECRET. Exiting...');
        process.exit(1);
    } else {
        console.warn('⚠️  Using temporary JWT secret for DEVELOPMENT ONLY');
        // Use a temporary secret only for development
        module.exports.JWT_SECRET = 'dev-only-temp-secret-' + Date.now();
    }
} else {
    module.exports.JWT_SECRET = JWT_SECRET;
}

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 1 * 60 * 1000, // 15 min in prod, 1 min in dev
    max: process.env.NODE_ENV === 'production' ? 5 : 1000, // 5 in production, 1000 in development
    message: {
        error: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => process.env.NODE_ENV === 'development', // Skip rate limiting in development
});

// Password validation
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!hasUpperCase) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!hasLowerCase) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!hasNumbers) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!hasSpecialChar) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }

    return { valid: true };
};

// Hash password
const hashPassword = async (password) => {
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 8; // Faster in development
    return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (userId, email) => {
    const secret = module.exports.JWT_SECRET || JWT_SECRET;
    return jwt.sign(
        {
            userId,
            email,
            timestamp: Date.now()
        },
        secret,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Access denied. No token provided.'
        });
    }

    try {
        const secret = module.exports.JWT_SECRET || JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired. Please login again.'
            });
        }
        return res.status(403).json({
            error: 'Invalid token.'
        });
    }
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const secret = module.exports.JWT_SECRET || JWT_SECRET;
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
        } catch (error) {
            // Silent fail for optional auth
            req.user = null;
        }
    }
    next();
};

module.exports = {
    authLimiter,
    validatePassword,
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    optionalAuth,
    handleValidationErrors
};
