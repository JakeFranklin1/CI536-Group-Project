// Allows for database access
import supabase from "./supabase-client.js";

// Makes sure page is loaded
document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.querySelector(".checkout-btn");

    // Listen out for checkout button click
    checkoutBtn.addEventListener("click", async () => {

        const buttonText = checkoutBtn.textContent.trim();
        if (buttonText == "Complete Purchase") {

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
            const numericTotal = parseFloat(totalText.replace(/[^0-9.-]+/g, '')); 

            const cartTotal = numericTotal

            // Define orderDate
            const orderDate = new Date().toISOString().split("T")[0];

           // Get user's balance from the database
            const { data: userData, error: balanceError } = await supabase
                .from("users")  
                .select("balance")  
                .eq("id", userId)  
                .single(); 

              if (balanceError) {
                console.error("Error fetching balance:", balanceError.message);
                alert("There was an issue checking your balance. Please try again.");
                return;
            }

            if (userData.balance < cartTotal) {
                alert("Insufficient balance. Please top up your account and try again.");
                return;
            }

            // Inserts order into 'orders' table in database using variables
            const { data, error2 } = await supabase.from("orders").insert([
                {
                    user_id: userId,
                    order_date: orderDate,
                    total_price: numericTotal,
                },
            ]);

            if (error2) {
                console.error("Error inserting order:", error2);
                alert("There was an issue with your checkout. Please try again.");
                return;
            } else { 
                alert("Checkout successful! Your order is being processed.");
                // Close cart if checkout successful
                const closeCartBtn = document.getElementById("close-cart-btn");
                if (closeCartBtn) {
                    closeCartBtn.click();  
                }
            }

        }
    });
});
