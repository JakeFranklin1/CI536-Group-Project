/**
 * @module GameCard
 * @description Component for creating and managing game cards
 */

import { escapeHTML } from "../utils/sanitise.js";
import CartActions from "./CartActions.js";

/**
 * Creates a game card DOM element
 * @param {Object} game - Game data from API
 * @param {string} coverUrl - URL for game cover image
 * @param {string} platforms - HTML for platform icons
 * @param {string} price - Formatted price string
 * @returns {HTMLElement} - Game card DOM element
 */
export function createGameCard(game, coverUrl, platforms, price) {
    // Create main card element
    const card = document.createElement("div");
    card.className = "game-card";
    if (game.age_rating_string) {
        card.dataset.ageRating = escapeHTML(game.age_rating_string);
    }

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
        CartActions.addItemToCart(card);
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
    title.textContent = escapeHTML(game.name || "Unknown Game");
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
