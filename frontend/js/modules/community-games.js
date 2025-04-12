import { showToast } from "../utils/toast.js";
import { escapeHTML } from "../utils/sanitise.js";
import supabase from "../supabase-client.js";
import { addItemToCart } from "./cart-handler.js";

document.addEventListener("DOMContentLoaded", async function () {
    // Check if user is authenticated
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
        return;
    }

    // Initialize page
    initializeCommunityGames();
    setupSortingDropdown();

    /**
     * Initializes the community games page
     */
    async function initializeCommunityGames() {
        // Show loading indicator
        document.getElementById("loading").classList.remove("hidden");

        try {
            // Load games with default sort (most recent)
            await loadCommunityGames("recent");
        } catch (error) {
            console.error("Failed to initialize community games:", error);
            showToast("Failed to load community games", "error");
        } finally {
            // Hide loading indicator
            document.getElementById("loading").classList.add("hidden");
        }
    }

    /**
     * Loads community games from Supabase with sorting
     * @param {string} sortOrder - How to sort the games (recent, price-low, price-high, name)
     */
    async function loadCommunityGames(sortOrder = "recent") {
        const gamesGrid = document.getElementById("community-games-grid");

        if (!gamesGrid) {
            console.error("Games grid not found");
            return;
        }

        // Clear grid and show loading message
        gamesGrid.innerHTML =
            '<div class="loading-placeholder">Loading community games...</div>';

        try {
            // Build the query based on sort order
            let query = supabase.from("game_listings").select(`
                    *,
                    users!user_id (id, first_name, last_name, email),
                    game_screenshots(id, screenshot_url)
                `);

            // Apply sorting
            switch (sortOrder) {
                case "recent":
                    query = query.order("created_at", { ascending: false });
                    break;
                case "price-low":
                    query = query.order("price", { ascending: true });
                    break;
                case "price-high":
                    query = query.order("price", { ascending: false });
                    break;
                case "name":
                    query = query.order("title", { ascending: true });
                    break;
                default:
                    query = query.order("created_at", { ascending: false });
            }

            // Execute the query
            const { data: games, error } = await query;

            if (error) throw error;

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
            document
                .querySelector(".retry-btn")
                ?.addEventListener("click", () => {
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
        );
        img.alt = escapeHTML(game.title);
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
        title.textContent = escapeHTML(game.title);
        details.appendChild(title);

        // Creator name
        const creator = document.createElement("p");
        creator.className = "game-age-rating";
        const authorName =
            game.users?.first_name && game.users?.last_name
                ? `${game.users.first_name} ${game.users.last_name}`
                : "Anonymous User";
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
    function showCommunityGameDetails(game) {
        // Create a game object that matches the structure expected by the game details viewer
        const formattedGame = {
            id: game.id,
            name: game.title,
            summary: game.description || "No description available",
            first_release_date: game.release_date
                ? new Date(game.release_date).getTime() / 1000
                : null,
            cover: { url: game.cover_image },
            screenshots:
                game.game_screenshots?.map((screenshot) => ({
                    url: screenshot.screenshot_url,
                })) || [],
            platforms: [{ name: "PC" }], // Default platform
            age_rating_string: "Not Rated",
        };

        // If we have the global showGameDetails function, use it
        if (typeof window.showGameDetails === "function") {
            window.showGameDetails(
                formattedGame,
                game.cover_image,
                '<img src="../assets/icons/windows.svg" alt="PC" title="PC">', // Default platform icon
                `£${parseFloat(game.price).toFixed(2)}`
            );
        } else {
            // Fallback if showGameDetails is not available
            window.location.href = `game-details.html?id=${game.id}&type=community`;
        }
    }

    /**
     * Sets up the sorting dropdown functionality
     */
    function setupSortingDropdown() {
        const dropdownBtn = document.querySelector(".dropdown-btn");
        const dropdownContent = document.querySelector(".dropdown-content");
        const filterChoice = document.getElementById("filter-choice");
        const sortButtons = document.querySelectorAll(
            ".dropdown-content button"
        );

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
                    btn.querySelector("i").classList.add("hidden");
                });
                this.querySelector("i").classList.remove("hidden");

                // Close dropdown
                dropdownContent.classList.remove("active");

                // Load games with the selected sort
                loadCommunityGames(sortType);
            });
        });
    }
});

// Make functions available globally
window.showCommunityGames = function () {
    window.location.href = "community.html";
};
