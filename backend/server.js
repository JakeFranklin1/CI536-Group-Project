// Load environment variables from .env file into process.env
require('dotenv').config();

// Import required Node.js modules and frameworks
const express = require('express');     // Web application framework
const cors = require('cors');           // Cross-Origin Resource Sharing middleware
const path = require('path');           // Node.js path utility

// Initialize Express application
const app = express();

// Set server port, use environment variable or fallback to 3000
const PORT = process.env.PORT || 3000;

// Middleware Configuration
// ------------------------

// Enable CORS for all routes
// This allows the frontend to make requests to this server from different origins
app.use(cors());

// Parse JSON payloads in HTTP requests
// This allows the server to handle JSON data in request bodies
app.use(express.json());

// Serve static files from the frontend directory
// This makes frontend assets (HTML, CSS, JS) accessible via HTTP
app.use(express.static(path.join(__dirname, '../frontend')));

// Route Configuration
// ------------------

// Import route handlers
const gamesRouter = require('./routes/games');    // Handles game-related endpoints
const authRouter = require('./routes/auth');      // Handles authentication endpoints

// Register routes with their base paths
app.use('/api/games', gamesRouter);  // All game routes will be prefixed with /api/games
app.use('/api/auth', authRouter);    // All auth routes will be prefixed with /api/auth

// Error Handling
// -------------

// Global error handling middleware
// This catches any errors thrown in route handlers
app.use((err, req, res, next) => {
    // Log the error stack trace to the console
    console.error(err.stack);
    // Send a generic error response to the client
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
// -----------

// Start listening for HTTP requests on the specified port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
