import { showToast } from "../utils/toast.js";

function openNav() {
    document.querySelector(".side-cart").style.width = "350px";
    document.querySelector(".cart-overlay").classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeNav() {
    document.querySelector(".side-cart").style.width = "0";
    document.querySelector(".cart-overlay").classList.remove("active");
    document.body.style.overflow = "";
}

// New function to save cart to localStorage
function saveCartToLocalStorage() {
    const cartItems = document.querySelectorAll(".cart-item");
    const cartData = [];

    cartItems.forEach((item) => {
        const title = item.querySelector(".cart-item-title").textContent;
        const price = item.querySelector(".cart-item-price").textContent;
        const image = item.querySelector(".cart-item-image").src;
        const quantity = parseInt(
            item.querySelector(".quantity-value").textContent
        );

        cartData.push({ title, price, image, quantity });
    });

    localStorage.setItem("cartItems", JSON.stringify(cartData));
}

// New function to load cart from localStorage
function loadCartFromLocalStorage() {
    const cartData = localStorage.getItem("cartItems");
    if (!cartData) return;

    const cartItems = JSON.parse(cartData);
    const cartItemsContainer = document.querySelector(".cart-items");

    if (cartItems.length > 0) {
        // Clear empty cart message if it exists
        const emptyCart = cartItemsContainer?.querySelector(".empty-cart");
        if (emptyCart) {
            emptyCart.remove();
            document.querySelector(".cart-summary").style.display = "block";
        }

        // Add items from localStorage
        cartItems.forEach((item) => {
            const cartItemHTML = `
                <div class="cart-item" data-game-title="${item.title}">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.title}</div>
                        <div class="cart-item-info">
                            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                            <div>
                                <div class="cart-item-price">${item.price}</div>
                                <div class="cart-item-quantity">
                                    <label>Qty:</label>
                                    <div class="quantity-controls">
                                        <button class="quantity-decrement">-</button>
                                        <span class="quantity-value">${item.quantity}</span>
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
            cartItemsContainer?.insertAdjacentHTML("beforeend", cartItemHTML);
        });

        updateCartTotal();
    }
}

export function updateCartCount() {
    const cartItems = document.querySelectorAll(".cart-item");
    const cartCount = document.querySelector(".cart-count");

    if (!cartCount) {
        // Create cart count element if it doesn't exist
        const cartBtn = document.querySelector(".cart-container");
        if (!cartBtn) return; // Exit if container doesn't exist

        const countElement = document.createElement("div");
        countElement.className = "cart-count";
        cartBtn.appendChild(countElement);
    }

    const count = cartItems.length;
    const cartCountElement = document.querySelector(".cart-count");

    if (!cartCountElement) return;

    if (count > 0) {
        cartCountElement.textContent = count;
        cartCountElement.classList.add("active");
    } else {
        cartCountElement.textContent = "";
        cartCountElement.classList.remove("active");
    }
}

export function updateCartTotal() {
    const cartItems = document.querySelectorAll(".cart-item");
    let total = 0;

    cartItems.forEach((item) => {
        const priceElement = item.querySelector(".cart-item-price");
        const quantityElement = item.querySelector(".quantity-value");

        if (priceElement && quantityElement) {
            const price = parseFloat(priceElement.textContent.replace("£", ""));
            const quantity = parseInt(quantityElement.textContent || 1);
            total += price * quantity;
        }
    });

    const totalElement = document.querySelector(".cart-total span:last-child");
    if (totalElement) {
        totalElement.textContent = `£${total.toFixed(2)}`;
    }

    updateCartCount();
    saveCartToLocalStorage(); // Save changes to localStorage
}

function handleQuantityChange(controls, increment) {
    const valueSpan = controls.querySelector(".quantity-value");
    let value = parseInt(valueSpan.textContent);

    if (increment) {
        value++;
    } else if (value > 1) {
        value--;
    }

    valueSpan.textContent = value;
    updateCartTotal();
}

// Remove duplicate event listeners and simplify the code
document.addEventListener("DOMContentLoaded", function () {
    const openCartBtn = document.getElementById("open-cart-btn");
    const closeCartBtn = document.getElementById("close-cart-btn");
    const cartOverlay = document.getElementById("cart-overlay");

    openCartBtn?.addEventListener("click", openNav);
    closeCartBtn?.addEventListener("click", closeNav);
    cartOverlay?.addEventListener("click", closeNav);

    // Load cart items from localStorage
    loadCartFromLocalStorage();

    // Single event listener for quantity controls
    document.addEventListener("click", function (e) {
        if (e.target.matches(".quantity-increment")) {
            const controls = e.target.closest(".quantity-controls");
            handleQuantityChange(controls, true);
        } else if (e.target.matches(".quantity-decrement")) {
            const controls = e.target.closest(".quantity-controls");
            handleQuantityChange(controls, false);
        } else if (e.target.matches(".cart-remove, .cart-remove *")) {
            const cartItem = e.target.closest(".cart-item");
            cartItem.style.opacity = "0";
            setTimeout(() => {
                cartItem.remove();
                updateCartTotal();

                if (document.querySelectorAll(".cart-item").length === 0) {
                    const cartItems = document.querySelector(".cart-items");
                    if (cartItems) {
                        const emptyCart = document.createElement("div");
                        emptyCart.className = "empty-cart";
                        emptyCart.innerHTML = `
                            <i class="fa fa-shopping-cart"></i>
                            <p>Your cart is empty</p>
                        `;
                        cartItems.appendChild(emptyCart);
                        document.querySelector(".cart-summary").style.display =
                            "none";
                    }
                }
            }, 300);
        }
    });
});
