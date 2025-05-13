// Allows for database access
import supabase from "./supabase-client.js";
import { showToast } from "./utils/toast.js";

// Makes sure page is loaded
document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.querySelector(".checkout-btn");

    if (!checkoutBtn) {
        console.warn("Checkout button not found.");
        return;
    }

    checkoutBtn.addEventListener("click", async (e) => {
        // Only process checkout when in fullscreen cart mode
        const sideCart = document.querySelector(".side-cart");
        if (!sideCart || !sideCart.classList.contains("fullscreen-cart")) {
            return; // Let the FullCart.js handle transitioning to fullscreen
        }

        // Prevent default to avoid conflicts
        e.preventDefault();
        e.stopPropagation();

        // Show loading state
        checkoutBtn.textContent = "Processing...";
        checkoutBtn.disabled = true;

        try {
            // Defines relevant variables
            const orderId = crypto.randomUUID();
            const {
                data: { user },
                error: error1,
            } = await supabase.auth.getUser();

            let userId;

            if (error1) {
                console.error("Error getting user:", error1.message);
                throw new Error("Authentication error");
            } else if (!user) {
                console.warn("No user found. User may not be logged in.");
                throw new Error("Please log in to complete your purchase");
            } else {
                userId = user.id;
            }

            // Get actual cart total from DOM
            const totalElement = document.querySelector(
                ".cart-total span:last-child"
            );
            let cartTotal = 0;
            if (totalElement) {
                cartTotal = parseFloat(
                    totalElement.textContent.replace("£", "")
                );
            }

            const orderDate = new Date().toISOString().split("T")[0];

            // Inserts order into 'orders' table in database
            const { data, error2 } = await supabase.from("orders").insert([
                {
                    order_id: orderId,
                    user_id: userId,
                    order_date: orderDate,
                    total_price: cartTotal,
                },
            ]);

            if (error2) {
                console.error("Error inserting order:", error2);
                throw new Error(
                    "There was an issue with your checkout. Please try again."
                );
            }

            // Success - clear cart and show success message
            const cartItems = document.querySelector(".cart-items");
            if (cartItems) {
                cartItems.innerHTML = `
                    <div class="checkout-success">
                        <i class="fa fa-check-circle"></i>
                        <h3>Order Successful!</h3>
                        <p>Your order #${orderId.substring(0, 8)} is being processed.</p>
                        <button id="continue-shopping" class="continue-shopping-btn">Continue Shopping</button>
                    </div>
                `;

                // Add event listener to continue shopping button
                document
                    .getElementById("continue-shopping")
                    .addEventListener("click", () => {
                        // Close the cart
                        document.querySelector(".side-cart").style.width = "0";
                        document
                            .querySelector(".cart-overlay")
                            .classList.remove("active", "fullscreen-overlay");
                        document.body.style.overflow = "";

                        // Reset the cart
                        setTimeout(() => {
                            cartItems.innerHTML = `
                            <div class="empty-cart">
                                <i class="fa fa-shopping-cart"></i>
                                <p>Your cart is empty</p>
                            </div>
                        `;
                            document.querySelector(
                                ".cart-summary"
                            ).style.display = "none";
                        }, 300);
                    });
            }

            // Hide checkout button
            document.querySelector(".cart-summary").style.display = "none";

            // Show toast
            if (typeof showToast === "function") {
                showToast("Order placed successfully!", "success");
            }
        } catch (error) {
            console.error("Checkout error:", error);

            // Show error in UI
            if (typeof showToast === "function") {
                showToast(
                    error.message || "Checkout failed. Please try again.",
                    "error"
                );
            } else {
                alert(error.message || "Checkout failed. Please try again.");
            }

            // Reset button
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = "Complete Purchase";
        }
    });
});
