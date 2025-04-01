import {
    createGameCard,
    getPlatformIcons,
    generateRandomPrice,
} from "../services/GameService.js";
import { escapeHTML } from "../utils/sanitise.js";

const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://gamestore-backend-9v90.onrender.com";

let currentPage = 1;
let isLoading = false;
let currentFilter = { timeframe: "Popular in 2025" };

/**
 * Loads more games when the "Load More" button is clicked
 * @function loadMoreGames
 */
export async function loadMoreGames() {
    // Don't load more if we're already loading
    if (isLoading) return;

    // Update button to show loading state
    const loadMoreBtn = document.querySelector(".load-more-btn");
    if (loadMoreBtn) {
        document.getElementById("loading").classList.remove("hidden");
    }

    isLoading = true;
    currentPage++;

    try {
        // Get the current filter from the header to maintain context
        const currentSectionHeader = document.getElementById("current-section");
        if (currentSectionHeader) {
            const headerText = currentSectionHeader.textContent;

            // Update the current filter based on the section header
            if (headerText.startsWith("Games from")) {
                const year = headerText.replace("Games from ", "");
                currentFilter = { year };
            } else if (
                [
                    "PC",
                    "PlayStation",
                    "Xbox",
                    "Nintendo",
                    "Android",
                    "Apple",
                ].includes(headerText)
            ) {
                currentFilter = { platforms: headerText };
            } else if (
                ["Action", "Adventure", "RPG", "Strategy", "Sport"].includes(
                    headerText
                )
            ) {
                currentFilter = { genres: headerText };
            } else if (
                ["Popular in 2025", "All Time", "Recently Added"].includes(
                    headerText
                )
            ) {
                currentFilter = { timeframe: headerText };
            }
        }

        // Calculate offset for pagination (skip already loaded items)
        const offset = (currentPage - 1) * 12;

        // Fetch additional games
        const games = await fetchFilteredGamesWithOffset(
            currentFilter,
            12,
            offset
        );

        // Display the new games
        appendGames(games);
    } catch (error) {
        console.error("Error loading more games:", error);
        // Show error message
        const container = document.querySelector(".load-more-container");
        if (container) {
            container.innerHTML =
                '<div class="load-error">Failed to load more games. <button class="retry-btn">Try Again</button></div>';
            document
                .querySelector(".retry-btn")
                ?.addEventListener("click", () => {
                    container.innerHTML = "";
                    setupLoadMoreButton();
                    loadMoreGames();
                });
        }
    } finally {
        isLoading = false;
        document.getElementById("loading")?.classList.add("hidden");
        // Reset button state
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML =
                '<i class="fa fa-refresh"></i> Load More Games';
        }
    }
}

/**
 * Fetches games with an offset for pagination
 * @param {Object} filterParams - Filter parameters
 * @param {number} limit - Number of games to fetch
 * @param {number} offset - Number of games to skip
 * @returns {Promise<Array>} Array of games
 */
async function fetchFilteredGamesWithOffset(
    filterParams = {},
    limit = 12,
    offset = 0
) {
    try {
        // Build the API URL with appropriate query parameters
        let apiUrl = `${API_URL}/api/games?limit=${limit}&offset=${offset}`;

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

        console.log(`LoadMore: Fetching additional games from: ${apiUrl}`);

        // Make the API call
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error("Error fetching more games:", error);
        throw error;
    }
}

/**
 * Appends additional games to the existing games grid
 * @param {Array} games - Array of game objects from API
 */
function appendGames(games) {
    const gamesGrid = document.querySelector(".games-grid");
    if (!gamesGrid) return;

    // Handle case with no more games
    if (!games || games.length === 0) {
        const loadMoreContainer = document.querySelector(
            ".load-more-container"
        );
        if (loadMoreContainer) {
            loadMoreContainer.innerHTML =
                '<div class="no-more-games">No more games to display</div>';
        }
        return;
    }

    // Generate cards for each additional game
    games.forEach((game) => {
        // Get cover URL with special cases for certain games
        let coverUrl;
        if (
            game.name?.toLowerCase().includes("grand theft auto v") ||
            game.name?.toLowerCase().includes("gta v") ||
            game.name?.toLowerCase().includes("gta 5")
        ) {
            coverUrl = "../assets/images/gta5.webp";
        } else {
            // Use default IGDB cover for other games
            coverUrl = game.cover?.url
                ? game.cover.url
                      .replace("t_thumb", "t_720p")
                      .replace("t_cover_big", "t_720p")
                      .replace("t_cover_big_2x", "t_720p")
                      .replace("http:", "https:")
                : "../assets/images/placeholder-game.webp";
        }

        // Get platform icons and price (reusing existing functionality)
        const platforms = getPlatformIcons(game.platforms);
        const price = generateRandomPrice();

        // Create and append the game card
        const gameCard = createGameCard(
            game,
            coverUrl,
            platforms,
            price,
            window.addItemToCart
        );
        gamesGrid.appendChild(gameCard);
    });
}

/**
 * Sets up the load more button
 */
export function setupLoadMoreButton() {
    const gamesGrid = document.querySelector(".games-grid");
    if (!gamesGrid) return;

    // Remove any existing load more container
    const existingContainer = document.querySelector(".load-more-container");
    if (existingContainer) existingContainer.remove();

    const container = document.createElement("div");
    container.className = "load-more-container";

    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.className = "load-more-btn";
    loadMoreBtn.innerHTML = '<i class="fa fa-refresh"></i> Load More Games';
    loadMoreBtn.addEventListener("click", loadMoreGames);

    container.appendChild(loadMoreBtn);

    // Insert after games grid
    gamesGrid.parentNode.insertBefore(container, gamesGrid.nextSibling);
}

/**
 * Updates the current filter
 * @param {Object} filter - The new filter to set
 */
export function setCurrentFilter(filter) {
    currentFilter = filter;
}

/**
 * Gets the current filter
 * @returns {Object} The current filter
 */
export function getCurrentFilter() {
    return currentFilter;
}

/**
 * Resets pagination to first page
 */
export function resetPagination() {
    currentPage = 1;
}
