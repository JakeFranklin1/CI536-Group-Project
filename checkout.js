// Allows for database access
import supabase from "./supabase-client.js";

// Makes sure page is loaded
document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.querySelector(".checkout-btn");

    // Listen out for checkout button click
    checkoutBtn.addEventListener("click", async () => {
        const buttonText = checkoutBtn.textContent.trim();
        if (buttonText == "Complete Purchase") {
            // Define OrderID
            const orderId = crypto.randomUUID();

            // Define userID
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

            // Define cartTotal
            const totalElement = document.getElementById("total-cost");
            const totalText = totalElement.textContent.trim();
            const numericTotal = parseFloat(
                totalText.replace(/[^0-9.-]+/g, "")
            );
            const cartTotal = numericTotal;

            // Define orderDate
            const orderDate = new Date().toISOString().split("T")[0];

            // Inserts order into 'orders' table in database using variables
            const { data, error2 } = await supabase.from("orders").insert([
                {
                    order_id: orderId,
                    user_id: userId,
                    order_date: orderDate,
                    total_price: numericTotal,
                },
            ]);

            if (error2) {
                console.error("Error inserting order:", error2);
                alert(
                    "There was an issue with your checkout. Please try again."
                );
                return;
            } else {
                alert("Checkout successful! Your order is being processed.");
            }
        }
    });
});
