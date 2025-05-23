/**
 * Express Server Configuration
 * This is the main server file that sets up our Express application.
 */

// Import required modules
const dotenv = require("dotenv"); // Module to load environment variables from a .env file
const express = require("express"); // Express framework for building web applications
const cors = require("cors"); // Middleware to enable Cross-Origin Resource Sharing
const path = require("path"); // Module to handle and transform file paths
const gamesRouter = require("./routes/games"); // Router for handling game-related API routes
const axios = require('axios'); // Added for keep-alive functionality

// Configure environment variables
dotenv.config(); // Load environment variables from .env file

// Create Express application instance
const app = express();
const PORT = process.env.PORT || 10000; // Set the port to the value from environment variables or default to 10000

// Middleware Setup
app.use(
    cors({
        origin: [
            "https://ci536-gamestore.netlify.app",
            "http://localhost:3000",
            "https://gamestore-backend-9v90.onrender.com",
        ],
        methods: ["GET", "POST"],
        credentials: true,
    })
);
app.use(express.json()); // Parse incoming JSON requests

// Static File Serving
app.use(express.static(path.join(__dirname, "../frontend"))); // Serve static files from the frontend directory

// Route Configuration
app.use("/api/games", gamesRouter); // Use gamesRouter for routes starting with /api/games

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

/**
 * Error Handling Middleware
 * This middleware handles errors that occur during request processing.
 * It logs the error details and sends a 500 Internal Server Error response.
 *
 * @param {Error} err - The error object
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 * @param {Function} next - The next middleware function
 */

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // Log the error details to the console
    console.error("Server Error:", {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
    });

    // Send a 500 Internal Server Error response with error details
    res.status(500).json({
        error: "Something went wrong!",
        requestId: req.id,
        path: req.path,
    });
});

// Start Server
const server = app.listen(PORT, "0.0.0.0", () => {
    // Add host binding
    console.log(`
    🚀 Server running on port ${PORT}
    📁 Frontend files served from: ${path.join(__dirname, "../frontend")}
    🌐 API endpoints available at: ${
        process.env.NODE_ENV === "production"
            ? "https://gamestore-backend-9v90.onrender.com/api"
            : `http://localhost:${PORT}`
    }
    `);

    // Start the keep-alive functionality in all environments
    startKeepAlive();
});

/**
 * Keep-Alive Functionality
 * Prevents Render from spinning down the service due to inactivity
 * by sending periodic requests to the application
 */
function startKeepAlive() {
    // Use the appropriate URL based on environment
    const baseUrl = process.env.NODE_ENV === "production"
        ? 'https://gamestore-backend-9v90.onrender.com'
        : `http://localhost:${PORT}`;
    const url = `${baseUrl}/health`;
    const interval = 600000; // 10 minutes in milliseconds

    function pingServer() {
        console.log(`[Keep-Alive] Pinging server at ${new Date().toISOString()}`);

        axios.get(url)
            .then(response => {
                console.log(`[Keep-Alive] Pinged at ${new Date().toISOString()}: Status Code ${response.status}`);
            })
            .catch(error => {
                console.error(`[Keep-Alive] Error pinging at ${new Date().toISOString()}:`, error.message);
            });
    }

    // Initial ping when server starts
    pingServer();

    // Schedule regular pings
    setInterval(pingServer, interval);

    console.log(`[Keep-Alive] Service started. Pinging ${url} every ${interval/1000} seconds.`);
}

/**
 * Handle EADDRINUSE error
 * This event listener handles the case where the port is already in use.
 * It logs an error message and exits the process with a failure code.
 *
 * @param {Error} error - The error object
 */
server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        // Log error message if the port is already in use
        console.error(
            `Port ${PORT} is already in use. Please use a different port.`
        );
        process.exit(1); // Exit the process with a failure code
    } else {
        throw error; // Rethrow the error if it's not EADDRINUSE
    }
});

/**
 * Error Handling for Uncaught Exceptions
 * This event listener handles uncaught exceptions and logs them to the console.
 *
 * @param {Error} error - The error object
 */
process.on("uncaughtException", (error) => {
    // Log uncaught exceptions to the console
    console.error("🔥 Uncaught Exception:", error);
});
