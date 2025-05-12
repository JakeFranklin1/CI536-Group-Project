import { showToast } from "../utils/toast.js";
import { escapeHTML } from "../utils/sanitise.js";
import supabase from "../supabase-client.js";
import { addItemToCart } from "./cart-handler.js";
import { fetchCommunityGames } from "../services/FilterService.js";

// MOVE EXPORT OUTSIDE OF EVENT LISTENER - This was the critical issue
export function initializeCommunityGames() {
    console.log("Initializing community games...");
    // Show loading indicator
    document.getElementById("loading")?.classList.remove("hidden");

    try {
        // Use the regular games grid instead of looking for a specific community one
        loadCommunityGames("recent");
        return true;
    } catch (error) {
        console.error("Failed to initialize community games:", error);
        showToast("Failed to load community games", "error");
        return false;
    } finally {
        // Hide loading indicator
        document.getElementById("loading")?.classList.add("hidden");
    }
}

/**
 * Loads community games from Supabase with sorting
 * @param {string} sortOrder - How to sort the games (recent, price-low, price-high, name)
 */
async function loadCommunityGames(sortOrder = "recent") {
    // Use the standard games grid instead of community-specific
    const gamesGrid = document.querySelector(".games-grid");

    if (!gamesGrid) {
        console.error("Games grid not found");
        return;
    }

    // Clear grid and show loading message
    gamesGrid.innerHTML =
        '<div class="loading-placeholder">Loading community games...</div>';

    try {
        // Convert sort order to match FilterService format if needed
        const normalizedSortOrder =
            sortOrder === "price-low"
                ? "price-asc"
                : sortOrder === "price-high"
                  ? "price-desc"
                  : sortOrder === "name"
                    ? "name-asc"
                    : sortOrder;

        // Use the shared service function to get games
        const games = await fetchCommunityGames(normalizedSortOrder);

        // Display the games
        displayCommunityGames(games, gamesGrid);
    } catch (error) {
        console.error("Error loading community games:", error);
        gamesGrid.innerHTML = `
            <div class="error-message">
                <i class="fa fa-exclamation-circle"></i>
                <h3>Failed to load community games</h3>
                <p>${error.message || "Please try again later"}</p>
                <button class="retry-btn">Try Again</button>
            </div>
        `;

        // Add retry functionality
        document.querySelector(".retry-btn")?.addEventListener("click", () => {
            loadCommunityGames(sortOrder);
        });
    }
}

/**
 * Displays community games in the grid
 * @param {Array} games - Array of game objects from Supabase
 * @param {HTMLElement} gamesGrid - The games grid element
 */
function displayCommunityGames(games, gamesGrid) {
    // Clear the grid
    gamesGrid.innerHTML = "";

    // Handle empty state
    if (!games || games.length === 0) {
        gamesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa fa-gamepad"></i>
                <h3>No community games yet</h3>
                <p>Be the first to add a game to the community! Share your creation with other players.</p>
                <a href="list-game.html" class="create-game-btn">
                    <i class="fa fa-plus"></i> Add Your Game
                </a>
            </div>
        `;
        return;
    }

    // Create a card for each game
    games.forEach((game) => {
        const gameCard = createCommunityGameCard(game);
        gamesGrid.appendChild(gameCard);
    });
}

/**
 * Creates a game card for a community game
 * @param {Object} game - Game data from Supabase
 * @returns {HTMLElement} - Game card element
 */
function createCommunityGameCard(game) {
    const card = document.createElement("div");
    card.className = "game-card community-game-card";
    card.dataset.gameId = game.id;

    // Create community badge
    const badge = document.createElement("div");
    badge.className = "community-badge";
    badge.textContent = "Community";
    card.appendChild(badge);

    // Create game image
    const img = document.createElement("img");
    img.src = escapeHTML(
        game.cover_image || "../assets/images/placeholder-game.webp"
    ); // Use cover_image directly
    img.alt = escapeHTML(game.name); // Use game.name here
    img.className = "game-image";
    img.loading = "lazy";
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
    addToCart.addEventListener("click", function (e) {
        e.stopPropagation();
        addItemToCart(card);
    });

    // Price element
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = `£${parseFloat(game.price).toFixed(2)}`;

    // Append purchase elements
    purchaseRow.appendChild(addToCart);
    purchaseRow.appendChild(price);
    details.appendChild(purchaseRow);

    // Game title
    const title = document.createElement("h2");
    title.className = "game-title";
    title.textContent = escapeHTML(game.name); // Use game.name here
    details.appendChild(title);

    // Creator name
    const creator = document.createElement("p");
    creator.className = "game-age-rating";
    const authorName = game.creator || "Anonymous User";
    creator.textContent = `Created by: ${escapeHTML(authorName)}`;
    details.appendChild(creator);

    // Add details to card
    card.appendChild(details);

    // Make the card clickable to show game details
    card.addEventListener("click", function (e) {
        if (!e.target.closest(".add-to-cart")) {
            showCommunityGameDetails(game);
        }
    });

    return card;
}

/**
 * Shows detailed view for a community game
 * @param {Object} game - Game data from Supabase
 */
async function showCommunityGameDetails(game) {
    // Create a game object that will be updated with screenshots
    let formattedGame = {
        id: game.id,
        name: game.name || "Unknown Game", // Use game.name instead of game.title
        summary: game.summary || "No description available", // Use game.summary instead of game.description
        first_release_date: game.first_release_date
            ? new Date(game.first_release_date).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
              })
            : "Unknown release date", // Format release date or show "Unknown"
        cover: { url: game.cover_image },
        screenshots: [], // Will be populated
        platforms: [{ name: "PC" }], // Default platform
        age_rating_string: "PEGI 12",
        price: `${parseFloat(game.price).toFixed(2)}`,
    };

    console.log("Raw release date:", game.first_release_date);

    // Check if screenshots exist in the game object
    if (game.game_screenshots && game.game_screenshots.length > 0) {
        console.log("Screenshots found in game object:", game.game_screenshots);
        formattedGame.screenshots = game.game_screenshots.map((screenshot) => ({
            url: screenshot.screenshot_url,
        }));
    } else {
        // No screenshots in game object, fetch directly from DB
        try {
            const { data: data1, error: error1 } = await supabase
                .from("game_screenshots")
                .select("*")
                .eq("game_listing_id", game.id);

            if (error1) {
                console.error("Error with query 1:", error1);
            } else {
                console.log(
                    `Query 1 results: Found ${data1.length} screenshots:`,
                    data1
                );

                if (data1.length > 0) {
                    formattedGame.screenshots = data1.map((screenshot) => ({
                        url: screenshot.screenshot_url,
                    }));
                    console.log(
                        "Updated screenshots from Query 1:",
                        formattedGame.screenshots
                    );
                    // If we found screenshots, no need to try other queries
                    return showFormattedGame(formattedGame, game);
                }
            }
        } catch (err) {
            console.error("Exception while fetching screenshots:", err);
        }
    }

    // Show the formatted game
    return showFormattedGame(formattedGame, game);
}

// Helper function to show the formatted game (extracted for cleaner code)
function showFormattedGame(formattedGame, originalGame) {
    console.log("Formatted game with screenshots:", formattedGame);

    // If we have the global showGameDetails function, use it
    if (typeof window.showGameDetails === "function") {
        window.showGameDetails(
            formattedGame,
            formattedGame.cover.url, // Use formattedGame.cover.url
            '<img src="../assets/icons/windows.svg" alt="PC" title="PC">', // Default platform icon
            formattedGame.price // Use formatted price
        );
    } else {
        // Fallback if showGameDetails is not available
        window.location.href = `game-details.html?id=${originalGame.id}&type=community`;
    }
}

/**
 * Sets up the sorting dropdown functionality
 */
function setupSortingDropdown() {
    const dropdownBtn = document.querySelector(".dropdown-btn");
    const dropdownContent = document.querySelector(".dropdown-content");
    const filterChoice = document.getElementById("filter-choice");
    const sortButtons = document.querySelectorAll(".dropdown-content button");

    // Toggle dropdown visibility
    dropdownBtn?.addEventListener("click", function () {
        dropdownContent.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
        if (
            !dropdownBtn?.contains(e.target) &&
            !dropdownContent?.contains(e.target)
        ) {
            dropdownContent?.classList.remove("active");
        }
    });

    // Handle sort selection
    sortButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const sortType = this.dataset.sort;

            // Update filter choice text
            if (filterChoice) {
                switch (sortType) {
                    case "recent":
                        filterChoice.textContent = "Most Recent";
                        break;
                    case "price-low":
                        filterChoice.textContent = "Price: Low to High";
                        break;
                    case "price-high":
                        filterChoice.textContent = "Price: High to Low";
                        break;
                    case "name":
                        filterChoice.textContent = "Name: A to Z";
                        break;
                    default:
                        filterChoice.textContent = "Most Recent";
                }
            }

            // Update check icons
            sortButtons.forEach((btn) => {
                btn.querySelector("i")?.classList.add("hidden");
            });
            this.querySelector("i")?.classList.remove("hidden");

            // Close dropdown
            dropdownContent.classList.remove("active");

            // Load games with the selected sort
            loadCommunityGames(sortType);
        });
    });
}

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
    // Check if user is authenticated
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
        // Don't redirect to login for community games
        // This allows non-logged in users to browse
        // window.location.href = "login.html";
        // return;
    }

    // Only initialize if we're on the community page
    if (window.location.pathname.includes("community.html")) {
        // Initialize page
        initializeCommunityGames();
        setupSortingDropdown();
    }
});

// Make functions available globally
window.showCommunityGames = function () {
    window.location.href = "community.html";
};

// Make the detail function available globally too
window.showCommunityGameDetails = showCommunityGameDetails;
