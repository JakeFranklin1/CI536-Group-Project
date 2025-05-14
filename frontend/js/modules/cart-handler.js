import { showToast } from "../utils/toast.js";
import { updateCartCount, updateCartTotal } from "../components/SideCart.js";
import { escapeHTML } from "../utils/sanitise.js";

/**
 * Adds an item to the shopping cart with animation
 * @param {HTMLElement|Object} gameCard - The game card element or object to add to cart
 */
export function addItemToCart(gameCard) {
    // Get game info from the card first, in case we need to skip animation
    let gameTitle, gamePrice, gameImage;

    try {
        gameTitle = gameCard.querySelector(".game-title").textContent;
        gamePrice = gameCard.querySelector(".price").textContent;
        gameImage = gameCard.querySelector(".game-image").src;
    } catch (error) {
        console.error("Error retrieving game information:", error);
        return;
    }

    // Validate game information
    if (!gameTitle || !gamePrice || !gameImage) {
        console.error("Missing game information required for cart");
        return;
    }

    // Create flying animation element
    const addToCartBtn = gameCard.querySelector(".add-to-cart");
    const cartIcon = document.querySelector(".cart-btn");

    if (!addToCartBtn || !cartIcon) {
        console.log(
            "Required elements for cart animation not found, adding directly to cart"
        );
        // Skip animation and add directly to cart
        addToCartDirectly(gameTitle, gamePrice, gameImage);
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
        addToCartDirectly(gameTitle, gamePrice, gameImage);
    };
}

/**
 * Adds an item directly to the cart without animation
 * @param {string} gameTitle - The game title
 * @param {string} gamePrice - The game price
 * @param {string} gameImage - The game image URL
 */
function addToCartDirectly(gameTitle, gamePrice, gameImage) {
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
    updateCartTotal(); // This will also save to localStorage via the updated function

    // Show toast notification
    showToast(`${gameTitle} added to cart`, "success");
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
