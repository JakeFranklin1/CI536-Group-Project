/**
 * @module FilterService
 * @description Handles filter operations for the marketplace
 */

const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://gamestore-backend-9v90.onrender.com";

/**
 * Fetches games based on specified filter parameters
 * @param {Object} filterParams - Filter parameters to apply
 * @param {number} limit - Number of games to fetch
 * @returns {Promise<Array>} - Promise resolving to array of games
 */
export async function fetchFilteredGames(filterParams = {}, limit = 24) {
    try {
        // Build the API URL with appropriate query parameters
        let apiUrl = `${API_URL}/api/games?limit=${limit}`;

        // Add platform filter
        if (filterParams.platforms) {
            apiUrl += `&platforms=${encodeURIComponent(filterParams.platforms)}`;
        }

        // Add genre/category filter
        if (filterParams.genres) {
            apiUrl += `&genres=${encodeURIComponent(filterParams.genres)}`;
        }

        // Add sorting options
        if (filterParams.sort) {
            apiUrl += `&sort=${encodeURIComponent(filterParams.sort)}`;
        }

        // Add timeframe filters
        if (filterParams.timeframe) {
            apiUrl += `&timeframe=${encodeURIComponent(filterParams.timeframe)}`;
        }

        // Add year filter
        if (filterParams.year) {
            apiUrl += `&year=${encodeURIComponent(filterParams.year)}`;
        }

        // Log the final URL for debugging
        console.log(`FilterService: Fetching games from: ${apiUrl}`);

        // Make the API call
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error("Error fetching filtered games:", error);
        throw error;
    }
}

/**
 * Maps filter types to their API parameters
 * @param {string} filterType - The type of filter (platform, category, etc)
 * @param {string} filterValue - The value of the filter
 * @returns {Object} - Filter parameters for API
 */
export function createFilterParams(filterType, filterValue) {
    const filterParams = {};

    switch (filterType) {
        case "platform":
            filterParams.platforms = filterValue;
            break;
        case "category":
            filterParams.genres = filterValue;
            break;
        case "timeframe":
            filterParams.timeframe = filterValue;
            break;
        case "community":
            filterParams.community = filterValue;
            break;
        case "year":
            filterParams.year = filterValue;
            break;
    }

    return filterParams;
}
