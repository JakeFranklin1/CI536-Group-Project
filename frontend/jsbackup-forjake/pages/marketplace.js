/**
 * @module marketplace
 * @description Main controller for the marketplace page
 */

import { checkAuth } from "./services/auth-service.js";
import { updateCartCount } from "./services/cart-service.js";
import { createGameCard } from "./components/GameCard.js";
import {
    setSelectedNavItem,
    initializeMobileMenu,
    handleBrandClick,
} from "./components/Navigation.js";
import CartActions from "./components/CartActions.js";
import {
    fetchGames,
    getCoverUrl,
    getPlatformIcons,
    generateRandomPrice,
} from "./services/game-service.js";
import supabase from "./api/supabase-client.js";

/**
 * Initializes the marketplace page
 */
async function initializeMarketplace() {
    try {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (user) {
            // Extract only needed user data
            const filteredUserData = {
                email: user.email,
                id: user.id,
                confirmed_at: user.confirmed_at,
            };
            console.log("User Data:", filteredUserData);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

/**
 * Loads games into the games grid
 */
async function loadGameCards(count) {
    const gamesGrid = document.querySelector(".games-grid");

    if (!gamesGrid) {
        console.warn("Games grid not found on this page.");
        return;
    }

    // Clear the grid and add loading cards
    gamesGrid.innerHTML = Array(count)
        .fill('<div class="game-card loading"></div>')
        .join("");

    try {
        const games = await fetchGames(count);

        // Clear the grid again for real content
        gamesGrid.innerHTML = "";

        // Generate cards for each game
        games.forEach((game) => {
            const coverUrl = getCoverUrl(game);
            const platforms = getPlatformIcons(game.platforms);
            const price = generateRandomPrice();

            // Create and append the game card
            const gameCard = createGameCard(game, coverUrl, platforms, price);
            gamesGrid.appendChild(gameCard);
        });
    } catch (error) {
        console.error("Error loading games:", error);
        gamesGrid.innerHTML =
            '<div class="error-message">Failed to load games. Please try again later.</div>';
    } finally {
        console.log("Games loaded successfully.");
    }
}

/**
 * Initialize page event listeners
 */
function initializeEventListeners() {
    const brandContainer = document.querySelector(".brand-container");
    if (brandContainer) {
        brandContainer.addEventListener("click", handleBrandClick);
    }
}

/**
 * Main initialization function
 */
document.addEventListener("DOMContentLoaded", async () => {
    await initializeMarketplace();
    loadGameCards(24);
    initializeMobileMenu();
    setSelectedNavItem();
    updateCartCount();
    CartActions.initializeCartEvents();
    initializeEventListeners();
});

// Make global functions available
window.handleSignOut = async () => {
    const { signOut } = await import("./services/auth-service.js");
    await signOut();
};
