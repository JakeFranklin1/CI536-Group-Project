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

// const { createClient } = require("@supabase/supabase-js"); // Supabase client for authentication - not needed for now
// Initialize Supabase client - not needed for now
// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_ANON_KEY;
// const supabase = createClient(supabaseUrl, supabaseKey);

// Configure environment variables
dotenv.config(); // Load environment variables from .env file

// Create Express application instance
const app = express();
const PORT = process.env.PORT || 3000; // Set the port to the value from environment variables or default to 3000

// Middleware Setup
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse incoming JSON requests

// Static File Serving
app.use(express.static(path.join(__dirname, "../frontend"))); // Serve static files from the frontend directory

// Route Configuration
app.use("/api/games", gamesRouter); // Use gamesRouter for routes starting with /api/games

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
const server = app.listen(PORT, () => {
    // Log server start details to the console
    console.log(`
    🚀 Server running on port ${PORT}
    📁 Frontend files served from: ${path.join(__dirname, "../frontend")}
    🌐 API endpoints available at: http://localhost:${PORT}/api
    👨‍💻 See the website at http://localhost:${PORT}
    `);
});

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
