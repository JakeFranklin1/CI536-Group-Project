/* eslint-disable no-unused-vars */
/**
 * @module GameService
 * @description Handles game display, search functionality, and related operations
 */

import { escapeHTML } from "../utils/sanitise.js";
import { showToast } from "../utils/toast.js";
import { fetchFilteredGames } from "./FilterService.js";

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
    window.addEventListener("resize", () => {
        positionSearchResults(searchBar, searchResults);
    });

    // Setup event listeners
    setupSearchEventListeners(searchInput, searchButton, searchResults);
}

/**
 * Positions the search results dropdown relative to the search bar
 * @param {HTMLElement} searchBar - The search bar element
 * @param {HTMLElement} searchResults - The search results container
 */
function positionSearchResults(searchBar, searchResults) {
    if (!searchBar || !searchResults) return;

    const searchBarRect = searchBar.getBoundingClientRect();

    // Position directly under the search bar and ensure minimum width of 400px
    const width = Math.max(searchBarRect.width, 400);

    searchResults.style.width = `${width}px`;

    // Calculate left position to center the dropdown if it's wider than the search bar
    const leftOffset =
        searchBarRect.width < width
            ? searchBarRect.left - (width - searchBarRect.width) / 2
            : searchBarRect.left;

    // Make sure the dropdown doesn't go off screen on the left
    const finalLeft = Math.max(leftOffset, 10);

    searchResults.style.left = `${finalLeft}px`;
    searchResults.style.top = `${searchBarRect.bottom}px`;
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

    const searchBar = searchInput.closest(".search-bar");

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
            searchBar.classList.remove("results-visible");
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
        const searchContainer =
            searchInput.closest(".search-container") ||
            searchInput.closest(".header-content");
        if (searchContainer && !searchContainer.contains(event.target)) {
            searchResults.classList.remove("visible");
            searchBar.classList.remove("results-visible");
            setTimeout(() => {
                if (!searchResults.classList.contains("visible")) {
                    searchResults.style.display = "none";
                }
            }, 300); // Match the CSS transition duration
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
export async function searchGames(query, limit = 12, isPreview = false) {
    const searchResults = document.getElementById("search-results");
    const gamesGrid = document.querySelector(".games-grid");

    if (!searchResults || !gamesGrid) {
        console.error("Required elements not found");
        return;
    }

    try {
        // Show loading state
        if (isPreview) {
            searchResults.innerHTML =
                '<div class="search-loading">Searching...</div>';
            searchResults.style.display = "block";
        } else {
            // Update the page header to show search
            const currentSectionHeader =
                document.getElementById("current-section");
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
            searchResults.innerHTML =
                '<div class="search-error">Error searching games</div>';
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
                retryBtn.addEventListener("click", () =>
                    searchGames(query, limit, isPreview)
                );
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
    // Find the search bar element
    const searchBar = document.querySelector(".header-content .search-bar");

    if (games.length === 0) {
        searchResults.innerHTML = `<div class="no-results">No games found matching "${escapeHTML(query)}"</div>`;
        // Add the results-visible class to the search bar for styling
        searchBar.classList.add("results-visible");
        searchResults.classList.add("visible");
        return;
    }

    let resultsHtml = "";

    games.forEach((game) => {
        // Get cover image URL
        let coverUrl = getGameCoverUrl(game, "small");

        // Get platform icons (simplified for preview)
        const platforms = game.platforms
            ? game.platforms
                  .slice(0, 3)
                  .map((p) => p.name)
                  .join(", ")
            : "Unknown platform";

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

    // Add the results-visible class to the search bar for styling
    searchBar.classList.add("results-visible");

    setTimeout(() => searchResults.classList.add("visible"), 10);

    // Add click handlers for search results
    const resultItems = document.querySelectorAll(".search-result-item");
    resultItems.forEach((item) => {
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

    // Use the common display function
    displayGames(
        games,
        gamesGrid,
        window.addItemToCart ||
            function (card) {
                showToast("Added to cart functionality not available");
            }
    );
}

/**
 * Gets the appropriate cover URL for a game
 * @param {Object} game - Game object from API
 * @param {string} size - Size of cover image ("small" or "large")
 * @returns {string} - URL for the game cover
 */
function getGameCoverUrl(game, size = "large") {
    // Special case handling for certain games
    if (
        game.name?.toLowerCase().includes("grand theft auto v") ||
        game.name?.toLowerCase().includes("gta v") ||
        game.name?.toLowerCase().includes("gta 5")
    ) {
        return "../assets/images/gta5.webp";
    } else if (
        game.name?.toLowerCase().includes("cyberpunk") ||
        game.name?.toLowerCase().includes("2077")
    ) {
        return "../assets/images/cp2077_game-thumbnail.webp";
    } else if (
        game.name?.toLowerCase().includes("grand theft auto: san andreas") ||
        game.name?.toLowerCase().includes("gta iv") ||
        game.name?.toLowerCase().includes("gta 4")
    ) {
        return "../assets/images/gta4.jpg";
    }

    // Use default IGDB cover for other games
    if (game.cover?.url) {
        if (size === "small") {
            return game.cover.url
                .replace("t_thumb", "t_cover_small")
                .replace("http:", "https:");
        } else {
            return game.cover.url
                .replace("t_thumb", "t_720p")
                .replace("t_cover_big", "t_720p")
                .replace("t_cover_big_2x", "t_720p")
                .replace("http:", "https:");
        }
    }

    return "../assets/images/placeholder-game.webp";
}

/**
 * Shows loading state in the games grid
 * @param {HTMLElement} gamesGrid - The games grid element
 * @param {number} count - Number of placeholder cards to show
 */
function showLoadingPlaceholders(gamesGrid, count) {
    gamesGrid.innerHTML = ""; // Clear existing content

    for (let i = 0; i < count; i++) {
        const placeholderCard = document.createElement("div");
        placeholderCard.className = "game-card loading";
        placeholderCard.style.height = "300px";
        gamesGrid.appendChild(placeholderCard);
    }
}

/**
 * Creates a game card DOM element with proper security measures
 * @param {Object} game - Game data from API
 * @param {string} coverUrl - URL for the game cover image
 * @param {string} platforms - HTML for platform icons
 * @param {string} price - Formatted price string
 * @param {Function} addToCartCallback - Callback for add to cart button
 * @returns {HTMLElement} - Complete game card DOM element
 */
export function createGameCard(
    game,
    coverUrl,
    platforms,
    price,
    addToCartCallback
) {
    // Create main card element
    const card = document.createElement("div");
    card.className = "game-card";
    if (game.age_rating_string) {
        card.dataset.ageRating = escapeHTML(game.age_rating_string);
    }

    // Store game data in dataset for later retrieval
    card.dataset.gameId = game.id || "";
    card.dataset.gameName = escapeHTML(game.name || "");
    card.dataset.gameSummary = escapeHTML(
        game.summary || "No description available"
    );

    // Make the card clickable except for the add to cart button
    card.addEventListener("click", (e) => {
        // Don't show game details if the add to cart button was clicked
        if (!e.target.closest(".add-to-cart")) {
            if (typeof window.showGameDetails === "function") {
                window.showGameDetails(game, coverUrl, platforms, price);
            }
        }
    });

    // Create and add game image
    const img = document.createElement("img");
    img.src = escapeHTML(coverUrl);
    img.className = "game-image";
    img.loading = "lazy";
    img.alt = escapeHTML(game.name || "Game Cover");
    card.appendChild(img);

    // Create details container
    const details = document.createElement("div");
    details.className = "game-details";

    // Create purchase row
    const purchaseRow = document.createElement("div");
    purchaseRow.className = "purchase-row";

    // Add to cart button
    const addToCart = document.createElement("span");
    addToCart.className = "add-to-cart";
    addToCart.textContent = "Add to Cart";
    addToCart.addEventListener("click", function () {
        addToCartCallback(card);
    });

    // Price element
    const priceElement = document.createElement("span");
    priceElement.className = "price";
    priceElement.textContent = `£${escapeHTML(price)}`;

    // Add elements to purchase row
    purchaseRow.appendChild(addToCart);
    purchaseRow.appendChild(priceElement);
    details.appendChild(purchaseRow);

    // Platform icons
    const platformsContainer = document.createElement("div");
    platformsContainer.className = "platform-icons";
    // Use DOMParser to safely convert HTML string to DOM elements
    const parser = new DOMParser();
    const platformDoc = parser.parseFromString(platforms, "text/html");
    const platformElements = platformDoc.body.children;
    // Append each platform icon to the container
    while (platformElements.length > 0) {
        platformsContainer.appendChild(platformElements[0]);
    }
    details.appendChild(platformsContainer);

    // Game title
    const title = document.createElement("h2");
    title.className = "game-title";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = escapeHTML(game.name || "Unknown Game");
    title.textContent = tempDiv.textContent;
    details.appendChild(title);

    // Age rating
    const ageRating = document.createElement("p");
    ageRating.className = "game-age-rating";
    ageRating.textContent = `Age rating: ${escapeHTML(game.age_rating_string || "Unknown")}`;
    details.appendChild(ageRating);

    // Add details to card
    card.appendChild(details);

    return card;
}

/**
 * Gets platform icons HTML based on platform data
 * @param {Array} platforms - Array of platform objects
 * @returns {string} - HTML string for platform icons
 */
export function getPlatformIcons(platforms = []) {
    if (!platforms || platforms.length === 0) {
        return "";
    }

    // Common platform name parts and their corresponding icons
    const platformIconMap = {
        PC: "../assets/icons/windows.svg",
        Windows: "../assets/icons/windows.svg",
        PlayStation: "../assets/icons/playstation.svg",
        "PlayStation 4": "../assets/icons/playstation.svg",
        "PlayStation 5": "../assets/icons/playstation.svg",
        "PlayStation 3": "../assets/icons/playstation.svg",
        Xbox: "../assets/icons/xbox.svg",
        "Xbox One": "../assets/icons/xbox.svg",
        "Xbox Series X": "../assets/icons/xbox.svg",
        "Xbox Series S": "../assets/icons/xbox.svg",
        "Nintendo Switch": "../assets/icons/nintendo.svg",
        Nintendo: "../assets/icons/nintendo.svg",
        "Wii U": "../assets/icons/nintendo.svg",
        Wii: "../assets/icons/nintendo.svg",
        iOS: "../assets/icons/apple.svg",
        Mac: "../assets/icons/apple.svg",
        Android: "../assets/icons/android.svg",
    };

    // Used icons for unique platforms to avoid duplicates
    const usedIcons = new Set();

    // Map each platform to an icon, avoiding duplicates
    return platforms
        .filter((platform) => platform?.name)
        .map((platform) => {
            // Try exact match first
            let iconPath = platformIconMap[platform.name];

            // If no exact match, try partial match
            if (!iconPath) {
                if (platform.name?.includes("PlayStation")) {
                    iconPath = "../assets/icons/playstation.svg";
                } else if (platform.name?.includes("Xbox")) {
                    iconPath = "../assets/icons/xbox.svg";
                } else if (
                    platform.name?.includes("Nintendo") ||
                    platform.name?.includes("Wii") ||
                    platform.name?.includes("Switch")
                ) {
                    iconPath = "../assets/icons/nintendo.svg";
                } else if (
                    platform.name?.includes("PC") ||
                    platform.name?.includes("Windows")
                ) {
                    iconPath = "../assets/icons/windows.svg";
                } else if (
                    platform.name?.includes("Mac") ||
                    platform.name?.includes("iOS") ||
                    platform.name?.includes("Apple")
                ) {
                    iconPath = "../assets/icons/apple.svg";
                } else if (platform.name?.includes("Android")) {
                    iconPath = "../assets/icons/android.svg";
                } else {
                    // Skip if no match found
                    return "";
                }
            }

            // Check if we've already used this icon type (to avoid duplicates)
            if (usedIcons.has(iconPath)) {
                return "";
            }

            // Add to used icons
            usedIcons.add(iconPath);
            return `<img src="${escapeHTML(iconPath)}" alt="${escapeHTML(platform.name || "Platform")}" class="platform-icon" title="${escapeHTML(platform.name)}">`;
        })
        .filter((icon) => icon !== "") // Remove empty strings
        .join("");
}

/**
 * Generates a random price for demo purposes
 * @returns {string} - Formatted price string
 */
export function generateRandomPrice() {
    const prices = ["59.99", "49.99", "39.99", "29.99", "19.99", "9.99"];
    return prices[Math.floor(Math.random() * prices.length)];
}

/**
 * Displays games in the games grid
 * @param {Array} games - Array of game objects from API
 * @param {HTMLElement} gamesGrid - The games grid element
 * @param {Function} addToCartCallback - Callback function for add to cart button
 */
export function displayGames(games, gamesGrid, addToCartCallback) {
    gamesGrid.innerHTML = ""; // Clear any existing content

    if (!games || games.length === 0) {
        gamesGrid.innerHTML =
            '<div class="no-games-message">No games found matching your criteria.</div>';
        return;
    }

    // Generate cards for each game
    games.forEach((game) => {
        // Get cover URL
        const coverUrl = getGameCoverUrl(game, "large");

        // Get platform icons and price
        const platforms = getPlatformIcons(game.platforms);
        const price = generateRandomPrice();

        // Create and append the game card
        const gameCard = createGameCard(
            game,
            coverUrl,
            platforms,
            price,
            addToCartCallback
        );
        gamesGrid.appendChild(gameCard);
    });
}

/**
 * Loads and displays games with filters
 * @param {Object} filterParams - Filter parameters
 * @param {number} count - Number of games to display
 * @param {boolean} showFullScreenLoader - Whether to show full-screen loader
 * @param {Function} addToCartCallback - Callback for add to cart button
 */
export async function loadGames(
    filterParams = {},
    count = 24,
    showFullScreenLoader = false,
    addToCartCallback
) {
    const gamesGrid = document.querySelector(".games-grid");
    if (!gamesGrid) {
        console.error("Games grid element not found");
        return;
    }

    try {
        // Show loading state
        if (showFullScreenLoader) {
            document.getElementById("loading").classList.remove("hidden");
        } else {
            showLoadingPlaceholders(gamesGrid, count);
        }

        // Fetch games with filters
        const games = await fetchFilteredGames(filterParams, count);

        // Display games
        displayGames(games, gamesGrid, addToCartCallback);
    } catch (error) {
        console.error("Error loading games:", error);
        gamesGrid.innerHTML =
            '<div class="error-message">Failed to load games. Please try again later.</div>';
    } finally {
        // Hide full-screen loader if it was shown
        document.getElementById("loading")?.classList.add("hidden");
        console.log("Games loading process completed.");
    }
}
