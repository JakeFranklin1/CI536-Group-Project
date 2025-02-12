const axios = require("axios");
require("dotenv").config();

class IGDBService {
  constructor() {
    // Initialize axios instance, access token, and token expiry
    this.axios = null;
    this.accessToken = null;
    this.tokenExpiry = null;
    // Set up axios with authentication headers
    this.initializeAxios();
  }

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
        },
      );

      // Store the new access token and set its expiry time
      this.accessToken = response.data.access_token;
      // Subtract 1 hour from the expiry time for a safety margin
      this.tokenExpiry = Date.now() + (response.data.expires_in - 3600) * 1000;

      console.log("IGDB access token refreshed");
    } catch (error) {
      console.error("Error refreshing IGDB access token:", error.message);
      throw error;
    }
  }

  isTokenExpired() {
    // Check if the token expiry time has passed
    return !this.tokenExpiry || Date.now() >= this.tokenExpiry;
  }

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
   * Search for games by name/keyword
   * @param {string} query - Search term
   * @param {number} limit - Maximum number of results (default: 5)
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
                    cover.*,
                    platforms.name,
                    rating,
                    first_release_date;
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

  async getPopularGames(limit = 6) {
    try {
      return await this.executeRequest(
        "/games",
        `
                fields
                    name,
                    summary,
                    cover.*,
                    rating,
                    total_rating,
                    total_rating_count,
                    follows,
                    hypes,
                    first_release_date,
                    screenshots.*,
                    genres.*;
                where
                    total_rating_count > 50
                    & cover != null
                    & total_rating > 70;
                sort total_rating_count desc;
                limit ${limit};
            `,
      );
    } catch (error) {
      console.error("Error getting popular games:", error);
      throw error;
    }
  }

  // Additional methods should be added here, using executeRequest for API calls
}

module.exports = new IGDBService();
