// Reading this guide will help you understand how the games route works in the backend.
// https://expressjs.com/en/guide/routing.html
// This route is used to get data from the igdbService and return it to the client.

// Import the necessary modules
const express = require('express');
const router = express.Router();
const igdbService = require('../services/igdbService');

// Route to get popular games
router.get('/', async (req, res) => {
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
router.get('/search/:query', async (req, res) => {
    try {
        const games = await igdbService.searchGames(req.params.query);
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export the router to be used in other parts of the application
module.exports = router;
