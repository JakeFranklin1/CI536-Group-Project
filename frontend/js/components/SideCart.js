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

export function updateCartCount() {
    const cartItems = document.querySelectorAll(".cart-item");
    const cartCount = document.querySelector(".cart-count");

    if (!cartCount) {
        // Create cart count element if it doesn't exist
        const cartBtn = document.querySelector(".cart-container");
        const countElement = document.createElement("div");
        countElement.className = "cart-count";
        cartBtn.appendChild(countElement);
    }

    const count = cartItems.length;
    const cartCountElement = document.querySelector(".cart-count");

    if (count > 0) {
        cartCountElement.textContent = count;
        cartCountElement.classList.add("active");
    } else {
        cartCountElement.classList.remove("active");
    }
}

export function updateCartTotal() {
    const cartItems = document.querySelectorAll(".cart-item");
    let total = 0;

    cartItems.forEach((item) => {
        const priceElement = item.querySelector(".cart-item-price");
        const quantityElement = item.querySelector(".quantity-value");
        const price = parseFloat(priceElement.textContent.replace("£", ""));
        const quantity = parseInt(quantityElement?.textContent || 1);
        total += price * quantity;
    });

    const totalElement = document.querySelector(".cart-total span:last-child");
    if (totalElement) {
        totalElement.textContent = `£${total.toFixed(2)}`;
    }
    updateCartCount();
}

function handleQuantityChange(controls, increment) {
    const valueSpan = controls.querySelector(".quantity-value");
    let value = parseInt(valueSpan.textContent);

    if (increment) {
        console.log("Incrementing value from: ", value);
        value++;
        console.log("Incremented value: ", value);
    } else if (value > 1) {
        console.log("Decrementing value");
        value--;
    }

    console.log("Value updated: ", value);
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
                updateCartCount();

                if (document.querySelectorAll(".cart-item").length === 0) {
                    const cartItems = document.querySelector(".cart-items");
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
            }, 300);
        }
    });
});
