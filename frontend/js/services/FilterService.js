import supabase from "../supabase-client.js";

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

export function isCommunityGamesFilter(filter) {
    return filter.timeframe === "Community Games";
}

export async function fetchCommunityGames(sortOrder = "recent") {
    try {
        // Build the query based on sort order
        let query = supabase.from("game_listings").select(`
            id, title, description, release_date, price, cover_image,
            users!user_id (id, first_name, last_name, email),
            game_screenshots!game_listing_id (id, screenshot_url)
        `);

        // Apply sorting
        switch (sortOrder) {
            case "recent":
                query = query.order("created_at", { ascending: false });
                break;
            case "price-asc":
                query = query.order("price", { ascending: true });
                break;
            case "price-desc":
                query = query.order("price", { ascending: false });
                break;
            case "name-asc":
                query = query.order("title", { ascending: true });
                break;
            default:
                query = query.order("created_at", { ascending: false });
        }

        const { data: games, error } = await query;

        if (error) throw error;

        console.log("Raw community games data:", games);

        // Format the games to match the structure expected by the marketplace
        const formattedGames = games.map((game) => ({
            id: game.id,
            name: game.title,
            summary: game.description || "No description available",
            first_release_date: game.release_date, // Ensure this is mapped correctly
            cover_image: game.cover_image || "../assets/images/placeholder-game.webp",
            game_screenshots: game.game_screenshots,
            screenshots: game.game_screenshots?.map((screenshot) => ({
                url: screenshot.screenshot_url,
            })) || [],
            platforms: [{ name: "PC" }],
            age_rating_string: "Not Rated",
            price: game.price,
            isCommunityGame: true,
            creator: game.users
                ? `${game.users.first_name || ""} ${game.users.last_name || ""}`.trim() || "Anonymous User"
                : "Anonymous User",
            users: game.users,
        }));

        console.log("Formatted community games:", formattedGames);

        return formattedGames;
    } catch (error) {
        console.error("Error fetching community games:", error);
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
            if (filterValue === "Community Games") {
                filterParams.isCommunity = true;
            }
            break;
        case "year":
            filterParams.year = filterValue;
            break;
    }

    return filterParams;
}
