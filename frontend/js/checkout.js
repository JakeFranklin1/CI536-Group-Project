import supabase from './supabase-client.js';

document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.querySelector(".checkout-btn");

    if (!checkoutBtn) {
        console.warn("Checkout button not found.");
        return;
    }

    checkoutBtn.addEventListener("click", async () => {
        // Need to get the current user ID and the total amount from the cart
        const userId = "9a1a036b-fe16-4780-8494-701f21f9f66d";
        const cartTotal = 50.0;
        const orderDate = "2025-03-24";

        // Insert the order into the 'orders' table
        const { data, error } = await supabase.from("orders").insert([
            {
                user_id: userId,
                order_date: orderDate,
                total_price: cartTotal,
            },
        ]);

        if (error) {
            console.error("Error inserting order:", error);
            alert("There was an issue with your checkout. Please try again.");
            return;
        }

        // If successful, notify the user
        alert("Checkout successful! Your order is being processed.");
    });
});
