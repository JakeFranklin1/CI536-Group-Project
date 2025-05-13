import supabase from "../supabase-client.js";
import { showToast } from "../utils/toast.js";
import { updateCartCount } from "./SideCart.js";

document.addEventListener("DOMContentLoaded", function () {
    // Get checkout button
    const checkoutBtn = document.querySelector(".checkout-btn");
    const sideCart = document.querySelector(".side-cart");

    if (!checkoutBtn || !sideCart) return;

    // Use a MutationObserver to detect when the button text changes
    // This ensures we only attach our handler after FullCart.js changes the button text
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (
                mutation.target === checkoutBtn &&
                mutation.type === "childList" &&
                checkoutBtn.textContent === "Complete Purchase"
            ) {
                // Remove existing click handlers from complete purchase state
                const newBtn = checkoutBtn.cloneNode(true);
                checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);

                // Add our handler to the new button
                newBtn.addEventListener("click", async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await processCheckout();
                });
            }
        });
    });

    // Start observing the button for changes
    observer.observe(checkoutBtn, {
        childList: true,
        characterData: true,
        subtree: true,
    });

    // Process checkout function
    async function processCheckout() {
        // Get reference to button again since we replaced it
        const completeBtn = document.querySelector(".checkout-btn");

        try {
            // Show processing state
            completeBtn.textContent = "Processing...";
            completeBtn.disabled = true;

            // Get cart items for order details
            const cartItems = document.querySelectorAll(".cart-item");
            if (cartItems.length === 0) {
                throw new Error("Your cart is empty");
            }

            // Get total price from cart
            const totalElement = document.querySelector(
                ".cart-total span:last-child"
            );
            let cartTotal = 0;
            if (totalElement) {
                cartTotal = parseFloat(
                    totalElement.textContent.replace("£", "")
                );
            }

            // Get user information from Supabase
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error(
                    userError
                        ? userError.message
                        : "Please log in to complete your purchase"
                );
            }

            const userId = user.id;
            const orderId = crypto.randomUUID();
            const orderDate = new Date().toISOString().split("T")[0];

            // Insert order into Supabase
            const { error: orderError } = await supabase.from("orders").insert([
                {
                    order_id: orderId,
                    user_id: userId,
                    order_date: orderDate,
                    total_price: cartTotal,
                },
            ]);

            if (orderError) {
                throw new Error(
                    "There was an issue with your checkout. Please try again."
                );
            }

            // Success handling
            const cartItemsContainer = document.querySelector(".cart-items");
            if (cartItemsContainer) {
                cartItemsContainer.innerHTML = `
                    <div class="checkout-success">
                        <i class="fa fa-check-circle"></i>
                        <h3>Order Successful!</h3>
                        <p>Your order #${orderId.substring(0, 8)} is being processed.</p>
                        <button id="continue-shopping" class="continue-shopping-btn">Continue Shopping</button>
                    </div>
                `;

                document
                    .getElementById("continue-shopping")
                    .addEventListener("click", () => {
                        // Close cart completely
                        closeNav();

                        // Reset the cart with a delay to ensure the animation completes
                        setTimeout(() => {
                            resetCart();
                        }, 300);
                    });
            }

            // Hide checkout button
            document.querySelector(".cart-summary").style.display = "none";

            // Clear localStorage
            localStorage.removeItem("cartItems");

            // Reset cart badge
            const cartCountElement = document.querySelector(".cart-count");
            if (cartCountElement) {
                cartCountElement.classList.remove("active");
                cartCountElement.textContent = "";
            }

            // Show toast notification
            showToast("Order placed successfully!", "success");
        } catch (error) {
            console.error("Checkout error:", error);

            // Reset button
            completeBtn.disabled = false;
            completeBtn.textContent = "Complete Purchase";

            // Show error
            showToast(
                error.message || "Checkout failed. Please try again.",
                "error"
            );
        }
    }

    // Function to reset cart to empty state
    function resetCart() {
        const cartItemsContainer = document.querySelector(".cart-items");
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fa fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
        }

        // Hide summary
        const cartSummary = document.querySelector(".cart-summary");
        if (cartSummary) {
            cartSummary.style.display = "none";
        }

        // Reset checkout button
        const checkoutBtn = document.querySelector(".checkout-btn");
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = "Checkout";
        }

        // Exit fullscreen if active
        sideCart.classList.remove("fullscreen-cart");
        const cartOverlay = document.querySelector(".cart-overlay");
        if (cartOverlay) {
            cartOverlay.classList.remove("fullscreen-overlay");
        }

        // Hide back button
        const backBtn = document.getElementById("back-to-cart-btn");
        if (backBtn) {
            backBtn.style.display = "none";
        }

        // Reset cart badge
        updateCartCount();
    }

    // Helper function to close the nav
    function closeNav() {
        const sideCart = document.querySelector(".side-cart");
        const cartOverlay = document.querySelector(".cart-overlay");

        if (sideCart) sideCart.style.width = "0";
        if (cartOverlay)
            cartOverlay.classList.remove("active", "fullscreen-overlay");
        document.body.style.overflow = "";
    }
});
