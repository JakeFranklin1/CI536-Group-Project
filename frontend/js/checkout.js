// Allows for database access
import supabase from "./supabase-client.js";

// Makes sure page is loaded
document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.querySelector(".checkout-btn");

    if (!checkoutBtn) {
        console.warn("Checkout button not found.");
        return;
    }

    checkoutBtn.addEventListener("click", async () => {
        // Defines relevant variables
        const orderId = crypto.randomUUID();
        const {
            data: { user },
            error: error1,
        } = await supabase.auth.getUser();

        let userId;

        if (error1) {
            console.error("Error getting user:", error1.message);
        } else if (!user) {
            console.warn("No user found. User may not be logged in.");
        } else {
            userId = user.id;
        }

        const cartTotal = 129.98;
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
            alert("There was an issue with your checkout. Please try again.");
            return;
        }

        alert("Checkout successful! Your order is being processed.");
    });
});
