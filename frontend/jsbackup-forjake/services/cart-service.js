/**
 * @module cart-service
 * @description Service for handling cart-related operations
 */

/**
 * Updates the cart count display
 */
export function updateCartCount() {
    const cartItems = document.querySelectorAll(".cart-item");
    const cartCount = document.getElementById("cart-count");

    if (cartCount) {
        cartCount.textContent = cartItems.length;
        cartCount.style.display = cartItems.length > 0 ? "block" : "none";
    }
}

/**
 * Calculates and updates the cart total
 */
export function updateCartTotal() {
    const cartItems = document.querySelectorAll(".cart-item");
    let total = 0;

    cartItems.forEach((item) => {
        const priceText = item.querySelector(".cart-item-price").textContent;
        const price = parseFloat(priceText.replace(/[^\d.]/g, ""));
        const quantity = parseInt(
            item.querySelector(".quantity-value").textContent
        );
        total += price * quantity;
    });

    const totalElement = document.getElementById("total-cost");
    if (totalElement) {
        totalElement.textContent = `£${total.toFixed(2)}`;
    }

    updateCartCount();
}
