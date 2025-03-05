/**
 * @module SearchService
 * @description Handles search functionality for the marketplace
 */

import { showToast } from "../utils/toast.js";
import { escapeHTML } from "../utils/sanitise.js";

const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://gamestore-backend-9v90.onrender.com";
/**
 * Initializes search functionality using the existing header search bar
 */
export function initializeSearchBar() {
    // Get existing search elements from the header
    const searchBar = document.querySelector(".header-content .search-bar");
    const searchInput = searchBar?.querySelector("input");
    const searchButton = searchBar?.querySelector(".search-btn");

    if (!searchBar || !searchInput || !searchButton) {
        console.error("Header search elements not found");
        return;
    }

    // Create search results container if it doesn't exist
    let searchResults = document.querySelector(".search-results");
    if (!searchResults) {
        searchResults = document.createElement("div");
        searchResults.className = "search-results";
        searchResults.id = "search-results";

        // Add the search results directly inside the header content, after the search bar
        searchBar.parentNode.insertBefore(searchResults, searchBar.nextSibling);
    }

    // Position the search results correctly
    positionSearchResults(searchBar, searchResults);

    // Reposition on window resize
    window.addEventListener('resize', () => {
        positionSearchResults(searchBar, searchResults);
    });

    // Setup event listeners
    setupSearchEventListeners(searchInput, searchButton, searchResults);
}

/**
 * Positions the search results container relative to the search bar
 * @param {HTMLElement} searchBar - The search bar element
 * @param {HTMLElement} searchResults - The search results container
 */
function positionSearchResults(searchBar, searchResults) {
    if (!searchBar || !searchResults) return;

    // Get the search bar's dimensions and position
    const searchBarRect = searchBar.getBoundingClientRect();

    // Set the search results styles to match the search bar width and position
    searchResults.style.position = 'absolute';
    searchResults.style.top = `${searchBarRect.bottom}px`;
    searchResults.style.left = `${searchBarRect.left}px`;
    searchResults.style.width = `${searchBarRect.width}px`;
    searchResults.style.zIndex = '1001'; // Higher than header z-index
}

/**
 * Sets up event listeners for search functionality
 * @param {HTMLElement} searchInput - The search input element
 * @param {HTMLElement} searchButton - The search button element
 * @param {HTMLElement} searchResults - The search results container
 */
function setupSearchEventListeners(searchInput, searchButton, searchResults) {
    if (!searchInput || !searchButton || !searchResults) {
        console.error("Search elements not found");
        return;
    }

    // Search on button click
    searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();
        handleSearch(query);
    });

    // Search on Enter key
    searchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            const query = searchInput.value.trim();
            handleSearch(query);
        }
    });

    // Implement search-as-you-type with debounce
    let debounceTimer;
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();

        // Hide results if query is empty
        if (query.length === 0) {
            searchResults.style.display = "none";
            return;
        }

        // Debounce to prevent too many API calls
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (query.length >= 3) {
                searchGames(query, 5, true);
            }
        }, 300);
    });

    // Close search results when clicking outside
    document.addEventListener("click", (event) => {
        const searchContainer = searchInput.closest(".search-container") ||
                               searchInput.closest(".header-content");
        if (searchContainer && !searchContainer.contains(event.target)) {
            searchResults.style.display = "none";
        }
    });
}

/**
 * Handles search action
 * @param {string} query - Search query
 */
function handleSearch(query) {
    if (!query) {
        showToast("Please enter a search term");
        return;
    }

    if (query.length < 2) {
        showToast("Search term must be at least 2 characters");
        return;
    }

    // Search with full results display
    searchGames(query, 12, false);
}

/**
 * Searches games by query
 * @param {string} query - Search term
 * @param {number} limit - Maximum number of results
 * @param {boolean} isPreview - Whether this is a preview (dropdown) or full results
 * @returns {Promise<Array>} - Promise resolving to array of games
 */
async function searchGames(query, limit = 12, isPreview = false) {
    const searchResults = document.getElementById("search-results");
    const gamesGrid = document.querySelector(".games-grid");

    if (!searchResults || !gamesGrid) {
        console.error("Required elements not found");
        return;
    }

    try {
        // Show loading state
        if (isPreview) {
            searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
            searchResults.style.display = "block";
        } else {
            // Update the page header to show search
            const currentSectionHeader = document.getElementById("current-section");
            if (currentSectionHeader) {
                currentSectionHeader.textContent = `Search results for: "${escapeHTML(query)}"`;
            }

            // Show full page loading indicator
            document.getElementById("loading")?.classList.remove("hidden");

            // Hide the search results dropdown
            searchResults.style.display = "none";
        }

        // Build API URL
        const apiUrl = `${API_URL}/api/games/search/${encodeURIComponent(query)}?limit=${limit}`;

        // Make the API call
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Search failed with status: ${response.status}`);
        }

        const games = await response.json();

        if (isPreview) {
            // Display preview results in dropdown
            displaySearchPreview(games, searchResults, query);
        } else {
            // Display full results in the main games grid
            displayFullSearchResults(games, gamesGrid, query);
        }

        return games;
    } catch (error) {
        console.error("Search error:", error);

        if (isPreview) {
            searchResults.innerHTML = '<div class="search-error">Error searching games</div>';
        } else {
            // Hide loading indicator
            document.getElementById("loading")?.classList.add("hidden");

            // Show error in games grid
            gamesGrid.innerHTML = `
                <div class="search-error-full">
                    <i class="fa fa-exclamation-circle"></i>
                    <h2>Search Error</h2>
                    <p>Sorry, we couldn't complete your search for "${escapeHTML(query)}"</p>
                    <button class="retry-search-btn">Try Again</button>
                </div>
            `;

            // Add retry handler
            const retryBtn = document.querySelector(".retry-search-btn");
            if (retryBtn) {
                retryBtn.addEventListener("click", () => searchGames(query, limit, isPreview));
            }
        }

        throw error;
    }
}

/**
 * Displays search preview results in the dropdown
 * @param {Array} games - Game results
 * @param {HTMLElement} searchResults - Search results container
 * @param {string} query - Original search query
 */
function displaySearchPreview(games, searchResults, query) {
    if (games.length === 0) {
        searchResults.innerHTML = `<div class="no-results">No games found matching "${escapeHTML(query)}"</div>`;
        return;
    }

    let resultsHtml = '';

    games.forEach(game => {
        // Get cover image URL
        let coverUrl = game.cover?.url
            ? game.cover.url
                  .replace("t_thumb", "t_cover_small")
                  .replace("http:", "https:")
            : "../assets/images/placeholder-game.webp";

        // Get platform icons (simplified for preview)
        const platforms = game.platforms ? game.platforms.slice(0, 3).map(p => p.name).join(", ") : "Unknown platform";

        resultsHtml += `
            <div class="search-result-item" data-game-id="${game.id}">
                <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(game.name)}" class="search-result-image">
                <div class="search-result-info">
                    <h3>${escapeHTML(game.name)}</h3>
                    <p class="search-result-platform">${escapeHTML(platforms)}</p>
                </div>
            </div>
        `;
    });

    // Add "View all results" option
    resultsHtml += `
        <div class="view-all-results">
            <button id="view-all-results-btn">
                <i class="fa fa-search"></i>
                View all results for "${escapeHTML(query)}"
            </button>
        </div>
    `;

    searchResults.innerHTML = resultsHtml;
    searchResults.style.display = "block";

    // Add click handlers for search results
    const resultItems = document.querySelectorAll(".search-result-item");
    resultItems.forEach(item => {
        item.addEventListener("click", () => {
            // Here you would navigate to the game details page
            // For now, we'll just perform the full search
            handleSearch(query);
        });
    });

    // Add handler for "View all results"
    const viewAllBtn = document.getElementById("view-all-results-btn");
    if (viewAllBtn) {
        viewAllBtn.addEventListener("click", () => handleSearch(query));
    }
}

/**
 * Displays full search results in the main games grid
 * @param {Array} games - Game results
 * @param {HTMLElement} gamesGrid - Games grid container
 * @param {string} query - Original search query
 */
function displayFullSearchResults(games, gamesGrid, query) {
    // Hide loading indicator
    document.getElementById("loading")?.classList.add("hidden");

    if (games.length === 0) {
        gamesGrid.innerHTML = `
            <div class="no-results-full">
                <i class="fa fa-search"></i>
                <h2>No games found</h2>
                <p>We couldn't find any games matching "${escapeHTML(query)}"</p>
                <p>Try different keywords or check your spelling</p>
            </div>
        `;
        return;
    }

    // Clear the existing games
    gamesGrid.innerHTML = '';

    // Add each game to the grid using the existing createGameCard function from marketplace
    games.forEach(game => {
        // Get cover image URL with special case handling (similar to GameDisplayService)
        let coverUrl;
        if (
            game.name?.toLowerCase().includes("cyberpunk") ||
            game.name?.toLowerCase().includes("2077")
        ) {
            coverUrl = "../assets/images/cp2077_game-thumbnail.webp";
        } else if (
            game.name?.toLowerCase().includes("grand theft auto: san andreas") ||
            game.name?.toLowerCase().includes("gta iv") ||
            game.name?.toLowerCase().includes("gta 4")
        ) {
            coverUrl = "../assets/images/gta4.jpg";
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

        // Get platform icons (reuse existing functionality if available)
        const platforms = getPlatformIcons(game.platforms);

        // Use random price for demo purposes (similar to GameDisplayService)
        const price = generateRandomPrice();

        // Create game card using window.addItemToCart for the callback
        // If createGameCard is available in window scope, use it
        if (typeof window.createGameCard === 'function') {
            const gameCard = window.createGameCard(
                game,
                coverUrl,
                platforms,
                price,
                window.addItemToCart
            );
            gamesGrid.appendChild(gameCard);
        } else {
            // Fallback to a simplified card if createGameCard isn't available
            createSimpleGameCard(game, coverUrl, platforms, price, gamesGrid);
        }
    });
}

/**
 * Generates platform icons HTML based on game platforms
 * @param {Array} platforms - Array of platform objects from API
 * @returns {string} - HTML string for platform icons
 */
function getPlatformIcons(platforms) {
    if (!platforms || platforms.length === 0) {
        return "";
    }

    const platformIconMap = {
        PC: "../assets/icons/windows.svg",
        Windows: "../assets/icons/windows.svg",
        PlayStation: "../assets/icons/playstation.svg",
        "PlayStation 4": "../assets/icons/playstation.svg",
        "PlayStation 5": "../assets/icons/playstation.svg",
        Xbox: "../assets/icons/xbox.svg",
        "Xbox One": "../assets/icons/xbox.svg",
        "Xbox Series X": "../assets/icons/xbox.svg",
        Nintendo: "../assets/icons/nintendo.svg",
        "Nintendo Switch": "../assets/icons/nintendo.svg",
        Android: "../assets/icons/android.svg",
        iOS: "../assets/icons/apple.svg",
        Mac: "../assets/icons/apple.svg"
    };

    return platforms
        .filter(platform => platform?.name)
        .map(platform => {
            const iconPath = platformIconMap[platform.name] || null;
            if (iconPath) {
                return `<img src="${iconPath}" title="${escapeHTML(platform.name)}">`;
            }
            return "";
        })
        .join("");
}

/**
 * Generates a random price for demo purposes
 * @returns {string} - Formatted price string
 */
function generateRandomPrice() {
    const prices = ["59.99", "49.99", "39.99", "29.99", "19.99", "9.99"];
    return prices[Math.floor(Math.random() * prices.length)];
}

/**
 * Creates a simple game card when the main createGameCard function is not available
 * @param {Object} game - Game object from API
 * @param {string} coverUrl - URL for game cover image
 * @param {string} platformsHtml - HTML for platform icons
 * @param {string} price - Formatted price string
 * @param {HTMLElement} container - Container to append the card to
 */
function createSimpleGameCard(game, coverUrl, platformsHtml, price, container) {
    const gameCard = document.createElement("div");
    gameCard.className = "game-card";

    gameCard.innerHTML = `
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(game.name)}" class="game-image">
        <div class="game-details">
            <div class="purchase-row">
                <span class="add-to-cart">Add to Cart</span>
                <span class="price">$${escapeHTML(price)}</span>
            </div>
            <div class="platform-icons">
                ${platformsHtml}
            </div>
            <h2 class="game-title">${escapeHTML(game.name)}</h2>
            <p class="game-age-rating">Age rating: ${game.age_rating_string || "Not rated"}</p>
        </div>
    `;

    // Add event listener to add to cart button
    const addToCartBtn = gameCard.querySelector(".add-to-cart");
    if (addToCartBtn) {
        addToCartBtn.addEventListener("click", () => {
            if (typeof window.addItemToCart === 'function') {
                window.addItemToCart(gameCard);
            } else {
                showToast("Added to cart functionality not available");
            }
        });
    }

    container.appendChild(gameCard);
}

// Get a reference to the search container for document click handler
const searchContainer = document.querySelector(".search-container");
