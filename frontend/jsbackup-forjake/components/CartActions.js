/**
 * @module CartActions
 * @description Handles cart-related functionality
 */

import { updateCartCount, updateCartTotal } from "../services/cart-service.js";

/**
 * Adds an item to the cart with animation
 * @param {HTMLElement} gameCard - The game card element to add to cart
 */
function addItemToCart(gameCard) {
    // Create flying animation element
    const addToCartBtn = gameCard.querySelector(".add-to-cart");
    const cartIcon = document.querySelector(".cart-btn");

    // Get coordinates
    const start = addToCartBtn.getBoundingClientRect();
    const end = cartIcon.getBoundingClientRect();

    // Create animation element
    const circle = document.createElement("div");
    circle.className = "add-to-cart-animation";

    // Set initial position
    circle.style.left = `${start.left + start.width / 2}px`;
    circle.style.top = `${start.top + start.height / 2}px`;

    // Calculate animation path
    const keyframes = [
        {
            left: `${start.left + start.width / 2}px`,
            top: `${start.top + start.height / 2}px`,
            transform: "scale(2)",
            opacity: 1,
        },
        {
            left: `${end.left + end.width / 2}px`,
            top: `${end.top + end.height / 2}px`,
            transform: "scale(0.1)",
            opacity: 0,
        },
    ];

    document.body.appendChild(circle);

    // Animate the circle
    const animation = circle.animate(keyframes, {
        duration: 1000,
        easing: "cubic-bezier(0.47, 0, 0.745, 0.715)",
    });

    // Add item to cart after animation
    animation.onfinish = () => {
        circle.remove();

        const gameTitle = gameCard.querySelector(".game-title").textContent;
        const gamePrice = gameCard.querySelector(".price").textContent;
        const gameImage = gameCard.querySelector(".game-image").src;

        const cartItemHTML = `
            <div class="cart-item">
                <div class="cart-item-details">
                    <div class="cart-item-title">${gameTitle}</div>
                    <div class="cart-item-info">
                        <img src="${gameImage}" alt="${gameTitle}" class="cart-item-image">
                        <div>
                            <div class="cart-item-platform">Platform</div>
                            <div class="cart-item-price">${gamePrice}</div>
                            <div class="cart-item-quantity">
                                <label>Qty:</label>
                                <div class="quantity-controls">
                                    <button class="quantity-decrement">-</button>
                                    <span class="quantity-value">1</span>
                                    <button class="quantity-increment">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="cart-remove" title="Remove item">
                    <i class="fa fa-times"></i>
                </button>
            </div>
        `;

        const cartItemsContainer = document.querySelector(".cart-items");
        const emptyCart = cartItemsContainer.querySelector(".empty-cart");
        if (emptyCart) {
            emptyCart.remove();
            document.querySelector(".cart-summary").style.display = "block";
        }

        cartItemsContainer.insertAdjacentHTML("beforeend", cartItemHTML);
        updateCartTotal();
        updateCartCount();
    };
}

/**
 * Initialize cart event listeners
 */
function initializeCartEvents() {
    // Add event listeners to quantity buttons
    document.addEventListener('click', function(e) {
        // Increment button
        if (e.target.matches('.quantity-increment')) {
            const valueSpan = e.target.previousElementSibling;
            valueSpan.textContent = parseInt(valueSpan.textContent) + 1;
            updateCartTotal();
        }

        // Decrement button
        if (e.target.matches('.quantity-decrement')) {
            const valueSpan = e.target.nextElementSibling;
            if (parseInt(valueSpan.textContent) > 1) {
                valueSpan.textContent = parseInt(valueSpan.textContent) - 1;
                updateCartTotal();
            }
        }

        // Remove button
        if (e.target.matches('.cart-remove') || e.target.closest('.cart-remove')) {
            const cartItem = e.target.closest('.cart-item');
            cartItem.remove();
            updateCartTotal();
            updateCartCount();
        }
    });
}

export default {
    addItemToCart,
    initializeCartEvents
};
