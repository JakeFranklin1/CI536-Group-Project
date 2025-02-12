// Reading this guide will help you understand how the games route works in the backend.
// https://expressjs.com/en/guide/routing.html
// This route is used to get data from the igdbService and return it to the client.

// Import the necessary modules
const express = require("express");
const router = express.Router();
const igdbService = require("../services/igdbService");

// Route to get popular games
router.get("/", async (req, res) => {
  try {
    // Call the IGDB service to get popular games
    const games = await igdbService.getPopularGames();
    // Respond with the list of popular games
    res.json(games);
  } catch (error) {
    // Handle any errors by responding with a 500 status and error message
    res.status(500).json({ error: error.message });
  }
});

// Search games by query
router.get("/search/:query", async (req, res) => {
  try {
    const searchQuery = decodeURIComponent(req.params.query);
    const limit = parseInt(req.query.limit) || 5;

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

    const games = await igdbService.searchGames(searchQuery, limit);

    if (!games || games.length === 0) {
      return res.json([]);
    }

    res.json(games);
  } catch (error) {
    console.error("Search route error:", {
      query: req.params.query,
      error: error.message,
      stack: error.stack,
    });

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
