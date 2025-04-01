import { showToast } from "../utils/toast.js";
import { updateCartCount, updateCartTotal } from "../components/SideCart.js";
import { escapeHTML } from "../utils/sanitise.js";

/**
 * Adds an item to the shopping cart with animation
 * @param {HTMLElement} gameCard - The game card element to add to cart
 */
export function addItemToCart(gameCard) {
    // Create flying animation element
    const addToCartBtn = gameCard.querySelector(".add-to-cart");
    const cartIcon = document.querySelector(".cart-btn");

    // Code from your original addItemToCart function...
    if (!addToCartBtn || !cartIcon) {
        console.error("Required elements for cart animation not found");
        return;
    }

    // Get the coordinates
    const start = addToCartBtn.getBoundingClientRect();
    const end = cartIcon.getBoundingClientRect();

    // Create the animation element
    const circle = document.createElement("div");
    circle.className = "add-to-cart-animation";

    // Set initial position
    circle.style.left = `${start.left + start.width / 2}px`;
    circle.style.top = `${start.top + start.height / 2}px`;

    // Calculate the animation path
    const keyframes = [
        {
            left: `${start.left + start.width / 2}px`,
            top: `${start.top + start.height / 2}px`,
            transform: "scale(1)",
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

    // Add the item to cart after animation
    animation.onfinish = () => {
        circle.remove();

        const gameTitle = gameCard.querySelector(".game-title").textContent;
        const gamePrice = gameCard.querySelector(".price").textContent;
        const gameImage = gameCard.querySelector(".game-image").src;

        // Check if the item already exists in cart
        const existingItem = findExistingCartItem(gameTitle);

        if (existingItem) {
            // Increment quantity of existing item
            const quantityValue = existingItem.querySelector(".quantity-value");
            quantityValue.textContent = parseInt(quantityValue.textContent) + 1;
            updateCartTotal();

            // Show toast notification
            showToast(`Increased quantity of ${gameTitle}`, "info");
            return;
        }

        const cartItemHTML = `
            <div class="cart-item" data-game-title="${escapeHTML(gameTitle)}">
                <div class="cart-item-details">
                    <div class="cart-item-title">${escapeHTML(gameTitle)}</div>
                    <div class="cart-item-info">
                        <img src="${escapeHTML(gameImage)}" alt="${escapeHTML(gameTitle)}" class="cart-item-image">
                        <div>
                            <div class="cart-item-platform">Platform</div>
                            <div class="cart-item-price">${escapeHTML(gamePrice)}</div>
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
        const emptyCart = cartItemsContainer?.querySelector(".empty-cart");
        if (emptyCart) {
            emptyCart.remove();
            document.querySelector(".cart-summary").style.display = "block";
        }

        cartItemsContainer?.insertAdjacentHTML("beforeend", cartItemHTML);
        updateCartTotal();
        updateCartCount();

        // Show toast notification
        showToast(`${gameTitle} added to cart`, "success");
    };
}

/**
 * Finds an existing cart item by game title
 * @param {string} gameTitle - The title of the game to find
 * @returns {HTMLElement|null} - The cart item element or null if not found
 */
function findExistingCartItem(gameTitle) {
    const cartItems = document.querySelectorAll(".cart-item");
    for (const item of cartItems) {
        const title = item.querySelector(".cart-item-title").textContent;
        if (title === gameTitle) {
            return item;
        }
    }
    return null;
}
