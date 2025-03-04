const axios = require("axios");
require("dotenv").config();

// Platform name mappings for IGDB API compatibility
const platformMappings = {
    PC: "Windows",
    PlayStation: "PlayStation 5",
    Xbox: "Xbox Series X",
    Nintendo: "Nintendo Switch",
    Android: "Android",
    Apple: "iOS",
};

// Genre name mappings for IGDB API compatibility
const genreMappings = {
    Action: "Shooter",
    Adventure: "Adventure",
    RPG: "Role-playing (RPG)",
    Strategy: "Strategy",
    Sports: "Sport",
};

/**
 * IGDBService class to interact with the IGDB API.
 * This class handles authentication, token management, and API requests.
 */
class IGDBService {
    constructor() {
        // Initialize axios instance, access token, and token expiry
        this.axios = null;
        this.accessToken = null;
        this.tokenExpiry = null;
        // Set up axios with authentication headers
        this.initializeAxios();
    }

    /**
     * Initialize the axios instance with the necessary headers.
     * Refresh the access token if it is missing or expired.
     */
    async initializeAxios() {
        // Check if access token is missing or expired, then refresh it
        if (!this.accessToken || this.isTokenExpired()) {
            await this.refreshAccessToken();
        }

        // Create an axios instance with the necessary headers
        this.axios = axios.create({
            baseURL: "https://api.igdb.com/v4",
            headers: {
                "Client-ID": process.env.IGDB_CLIENT_ID,
                Authorization: `Bearer ${this.accessToken}`,
                Accept: "application/json",
                "Content-Type": "text/plain",
            },
        });
    }

    /**
     * Refresh the access token by making a request to Twitch's OAuth endpoint.
     * Store the new access token and set its expiry time.
     * @throws {Error} If the token refresh fails
     */
    async refreshAccessToken() {
        try {
            // Request a new access token from Twitch's OAuth endpoint
            const response = await axios.post(
                "https://id.twitch.tv/oauth2/token",
                null,
                {
                    params: {
                        client_id: process.env.IGDB_CLIENT_ID,
                        client_secret: process.env.IGDB_CLIENT_SECRET,
                        grant_type: "client_credentials",
                    },
                }
            );

            // Store the new access token and set its expiry time
            this.accessToken = response.data.access_token;
            // Subtract 1 hour from the expiry time for a safety margin
            this.tokenExpiry =
                Date.now() + (response.data.expires_in - 3600) * 1000;

            console.log("IGDB access token refreshed");
        } catch (error) {
            console.error("Error refreshing IGDB access token:", error.message);
            throw error;
        }
    }

    /**
     * Check if the access token has expired.
     * @returns {boolean} True if the token has expired, false otherwise
     */
    isTokenExpired() {
        // Check if the token expiry time has passed
        return !this.tokenExpiry || Date.now() >= this.tokenExpiry;
    }

    /**
     * Execute an API request to the IGDB endpoint.
     * Refresh the access token if it has expired.
     * @param {string} endpoint - The IGDB API endpoint
     * @param {string} query - The query string for the API request
     * @returns {Promise<Object>} The response data from the API
     * @throws {Error} If the API request fails
     */
    async executeRequest(endpoint, query) {
        try {
            // Refresh the access token if it has expired
            if (this.isTokenExpired()) {
                await this.initializeAxios();
            }
            // Make the API request using the axios instance
            const response = await this.axios.post(endpoint, query);
            return response.data;
        } catch (error) {
            // If the request fails with a 401 error, refresh the token and retry
            if (error.response?.status === 401) {
                await this.initializeAxios();
                const response = await this.axios.post(endpoint, query);
                return response.data;
            }
            throw error;
        }
    }

    /**
     * Search for games by name/keyword.
     * @param {string} query - Search term
     * @param {number} [limit=5] - Maximum number of results (default: 5)
     * @returns {Promise<Array>} Array of game objects
     * @throws {Error} If search fails
     */
    async searchGames(query, limit = 5) {
        try {
            // Clean and encode the search query
            const sanitizedQuery = query
                .trim()
                .replace(/"/g, '\\"') // Escape double quotes
                .replace(/[\u2018\u2019]/g, "'"); // Handle smart quotes

            const igdbQuery = `
                fields
                    name,
                    summary,
                    platforms.name,
                    cover.url,
                    rating,
                    total_rating,
                    total_rating_count,
                    first_release_date,
                    genres.name;
                search "${sanitizedQuery}";
                where
                    version_parent = null
                    & cover != null
                    & category = 0;
                limit ${limit};
            `;

            console.log("IGDB Search Query:", igdbQuery); // Debug log

            const results = await this.executeRequest("/games", igdbQuery);

            // Transform cover URLs to HTTPS and larger size
            return results.map((game) => ({
                ...game,
                cover: game.cover
                    ? {
                          ...game.cover,
                          url: game.cover.url
                              ? game.cover.url
                                    .replace("t_thumb", "t_cover_big")
                                    .replace("http:", "https:")
                              : null,
                      }
                    : null,
            }));
        } catch (error) {
            console.error("Search error:", {
                query,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Get a list of popular games.
     * @param {number} [limit=12] - Maximum number of results (default: 12)
     * @returns {Promise<Array>} Array of popular game objects
     * @throws {Error} If the request fails
     */

    async getGames(limit = 24, filters = {}) {
        try {
            let queryWhere = ["cover != null"];

            // Add platform filter with mapping
            if (filters.platforms) {
                const platformValue =
                    platformMappings[filters.platforms] || filters.platforms;

                // Special handling for Xbox and PC which may need ID-based filtering
                if (filters.platforms === "Xbox") {
                    // Use platform IDs for Xbox (169 = Xbox Series X)
                    queryWhere.push(`platforms = 169`);
                } else if (filters.platforms === "PC") {
                    // Use platform IDs for PC (6 = Windows)
                    queryWhere.push(`platforms = 6`);
                } else {
                    queryWhere.push(`platforms.name = "${platformValue}"`);
                }
            }

            // Add genre filter with mapping
            if (filters.genres) {
                const genreValue =
                    genreMappings[filters.genres] || filters.genres;
                queryWhere.push(`genres.name = "${genreValue}"`);
            }

            // Special handling for "Popular in 2025"
            if (filters.timeframe === "Popular in 2025") {
                const startDate = new Date(2024, 9, 1).getTime() / 1000; // Oct 2024
                const endDate = new Date(2025, 11, 31).getTime() / 1000; // Dec 2025
                queryWhere.push(
                    `first_release_date >= ${startDate} & first_release_date <= ${endDate}`
                );
                queryWhere.push("total_rating > 70");
            }

            // Add year filter (for other year-specific filters)
            else if (filters.year) {
                const year = parseInt(filters.year);
                const startDate = new Date(year, 0, 1).getTime() / 1000;
                const endDate = new Date(year, 11, 31).getTime() / 1000;
                queryWhere.push(
                    `first_release_date >= ${startDate} & first_release_date <= ${endDate}`
                );
            }

            // Determine sort order
            let sortBy = "total_rating_count desc";
            if (filters.sort) {
                switch (filters.sort) {
                    case "newest":
                        sortBy = "first_release_date desc";
                        break;
                    case "name":
                        sortBy = "name asc";
                        break;
                }
            }

            const query = `
            fields
                name,
                summary,
                platforms.name,
                cover.url,
                age_ratings.category,
                age_ratings.rating,
                rating,
                total_rating,
                total_rating_count,
                first_release_date,
                screenshots.game,
                screenshots.url,
                genres.name;
            where ${queryWhere.join(" & ")};
            sort ${sortBy};
            limit ${limit};
        `;

            const results = await this.executeRequest("/games", query);

            // Transform the results as before
            return results.map((game) => ({
                ...game,
                cover: game.cover
                    ? {
                          ...game.cover,
                          url: game.cover.url
                              ? game.cover.url
                                    .replace("t_thumb", "t_cover_big")
                                    .replace("http:", "https:")
                              : null,
                      }
                    : null,
            }));
        } catch (error) {
            console.error("Error getting games:", error);
            throw error;
        }
    }

    async getPopularGames(limit = 12) {
        try {
            const results = await this.executeRequest(
                "/games",
                `
            fields
                name,
                summary,
                platforms.name,
                cover.url,
                age_ratings.category,
                age_ratings.rating,
                rating,
                total_rating,
                total_rating_count,
                first_release_date,
                screenshots.game,
                screenshots.url,
                genres.name;
            where
                total_rating_count > 50
                & cover != null
                & total_rating > 70;
            sort total_rating_count desc;
            limit ${limit};
            `
            );

            // Transform the results to include properly formatted cover URLs
            return results.map((game) => ({
                ...game,
                cover: game.cover
                    ? {
                          ...game.cover,
                          url: game.cover.url
                              ? game.cover.url
                                    .replace("t_thumb", "t_cover_big")
                                    .replace("http:", "https:")
                              : null,
                      }
                    : null,
            }));
        } catch (error) {
            console.error("Error getting popular games:", error);
            throw error;
        }
    }
}

module.exports = new IGDBService();
