// Reading this guide will help you understand how the games route works in the backend.
// https://expressjs.com/en/guide/routing.html
// This route is used to get data from the igdbService and return it to the client.

// Import the necessary modules
const express = require("express");
const router = express.Router();
const igdbService = require("../services/igdbService");

/**
 * Route to get popular games.
 * @route GET /api/games
 * @group Games - Operations about games
 * @returns {Array.<Object>} 200 - An array of popular game objects
 * @returns {Error} 500 - Unexpected error
 */
router.get("/", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 12;
        // Call the IGDB service to get popular games, passing the limit parameter
        const games = await igdbService.getPopularGames(limit);
        // Respond with the list of popular games
        res.json(games);
    } catch (error) {
        // Handle any errors by responding with a 500 status and error message
        res.status(500).json({ error: error.message });
    }
});

/**
 * Route to search games by query.
 * @route GET /api/games/search/:query
 * @group Games - Operations about games
 * @param {string} query.path.required - The search query
 * @param {number} limit.query.optional - The maximum number of results (default: 5)
 * @returns {Array.<Object>} 200 - An array of game objects matching the search query
 * @returns {Error} 400 - Invalid search query
 * @returns {Error} 500 - Unexpected error
 */
router.get("/search/:query", async (req, res) => {
    try {
        // Decode the search query from the URL
        const searchQuery = decodeURIComponent(req.params.query);
        // Get the limit from the query parameters or default to 5
        const limit = parseInt(req.query.limit) || 5;

        // Validate the search query
        if (!searchQuery || searchQuery.length < 2) {
            return res.status(400).json({
                error: "Search query must be at least 2 characters",
                endpoint: "/api/games/search",
                method: "GET",
                query: searchQuery,
            });
        }

        console.log("Processing search:", {
            query: searchQuery,
            limit: limit,
        });

        // Call the IGDB service to search for games
        const games = await igdbService.searchGames(searchQuery, limit);

        // If no games are found, respond with an empty array
        if (!games || games.length === 0) {
            return res.json([]);
        }

        // Respond with the list of games matching the search query
        res.json(games);
    } catch (error) {
        console.error("Search route error:", {
            query: req.params.query,
            error: error.message,
            stack: error.stack,
        });

        // Handle any errors by responding with a 500 status and error message
        res.status(500).json({
            error: error.message,
            endpoint: "/api/games/search",
            method: "GET",
            query: req.params.query,
        });
    }
});

// Export the router to be used in other parts of the application
module.exports = router;
