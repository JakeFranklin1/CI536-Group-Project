const express = require("express");
const router = express.Router();
const igdbService = require("../services/igdbService");

const ageRatingMappings = {
    1: "PEGI 3", // PEGI 3
    2: "PEGI 7", // PEGI 7
    3: "PEGI 12", // PEGI 12
    4: "PEGI 16", // PEGI 16
    5: "PEGI 18", // PEGI 18
    6: "RP", // Rating Pending
    7: "EC", // Early Childhood
    8: "E", // Everyone
    9: "E10+", // Everyone 10+
    10: "T", // Teen
    11: "M", // Mature
    12: "AO", // Adults Only
};

const esrbToPegi = {
    EC: "PEGI 3",
    E: "PEGI 3",
    "E10+": "PEGI 7",
    T: "PEGI 12",
    M: "PEGI 16",
    AO: "PEGI 18",
    RP: "Rating Pending",
};

/**
 * Route to get popular games.
 * @route GET /api/games
 * @group Games - Operations about games
 * @param {number} limit.query.optional - Maximum number of results (default: 24)
 * @param {number} offset.query.optional - Number of results to skip (default: 0)
 * @returns {Array.<Object>} 200 - An array of popular game objects
 * @returns {Error} 500 - Unexpected error
 */
router.get("/", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 24;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;

        // Extract filter parameters from the request
        const filters = {
            platforms: req.query.platforms,
            genres: req.query.genres,
            sort: req.query.sort,
            timeframe: req.query.timeframe,
            year: req.query.year,
            offset: offset, // Add offset to filters object
        };

        // Validate limit and offset
        if (isNaN(limit) || limit <= 0 || limit > 50) {
            return res.status(400).json({
                error: "Invalid limit parameter. Must be a number between 1 and 50.",
            });
        }

        if (isNaN(offset) || offset < 0) {
            return res.status(400).json({
                error: "Invalid offset parameter. Must be a non-negative number.",
            });
        }

        // Pass filters to the getGames method
        const games = await igdbService.getGames(limit, filters);

        const filteredGames = games.filter((game) => {
            // Filter out games with certain keywords in title or description
            const adultContentRegex = /hentai|erotic|xxx|adult\s+only/i;
            if (game.name && adultContentRegex.test(game.name)) {
                return false;
            }
            if (game.summary && adultContentRegex.test(game.summary)) {
                return false;
            }

            // Filter by age rating (if available)
            if (
                game.age_ratings &&
                game.age_ratings.some(
                    (rating) =>
                        (rating.category === 1 && rating.rating === 12) || // ESRB AO
                        (rating.category === 2 && rating.rating === 5) // PEGI 18
                )
            ) {
                // Only filter PEGI 18/ESRB AO if they also have adult themes
                const hasAdultThemes = game.themes?.some((theme) =>
                    EXCLUDED_CONTENT?.THEMES?.includes(theme.id)
                );
                return !hasAdultThemes;
            }

            return true;
        });

        // Map the games to include the age rating
        const gamesWithAgeRating = filteredGames.map((game) => {
            let ageRatingString = "Not Rated"; // Default value

            if (game.age_ratings && game.age_ratings.length > 0) {
                // Find the PEGI rating, if available
                let pegiRating = game.age_ratings.find(
                    (rating) => rating.category === 2
                ); // 2 is PEGI

                // If no PEGI rating, find the first available rating
                if (!pegiRating) {
                    pegiRating = game.age_ratings[0];
                }

                if (pegiRating) {
                    ageRatingString =
                        ageRatingMappings[pegiRating.rating] || "Unknown";
                } else {
                    // Convert ESRB to PEGI if PEGI rating is not available
                    let esrbRating = game.age_ratings.find(
                        (rating) => rating.category === 1
                    ); // 1 is ESRB

                    if (esrbRating) {
                        ageRatingString =
                            esrbToPegi[ageRatingMappings[esrbRating.rating]] ||
                            "Unknown";
                    }
                }
            }

            return {
                ...game,
                age_rating_string: ageRatingString,
            };
        });

        res.json(gamesWithAgeRating);
    } catch (error) {
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
        const query = req.params.query;
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;

        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const games = await igdbService.searchGames(query, limit);
        res.json(games);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Export the router to be used in other parts of the application
module.exports = router;
