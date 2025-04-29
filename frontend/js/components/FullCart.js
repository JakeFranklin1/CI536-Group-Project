document.addEventListener("DOMContentLoaded", function() {
    // Side cart elements
    const checkoutBtn = document.querySelector('.checkout-btn');
    const sideCart = document.querySelector('.side-cart');
    // Fullscreen cart elements
    const cartOverlay = document.querySelector('.cart-overlay');
    const closeBtn = document.getElementById('close-cart-btn');
    
    // Create back to cart button
    const backBtn = document.createElement('button');
    backBtn.id = 'back-to-cart-btn';
    backBtn.className = 'back-to-cart-btn';
    backBtn.innerHTML = '&larr; Back to Cart';
    backBtn.onclick = exitFullscreenCart; // Back to side cart

    const sideCartHeader = sideCart.querySelector('.side-cart-header');
    sideCartHeader.insertBefore(backBtn, sideCartHeader.firstChild);
    
    // If checkout button click
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Fullscreen cart
            sideCart.classList.add('fullscreen-cart');
            cartOverlay.classList.add('fullscreen-overlay');
            
            // Back button
            backBtn.style.display = 'block';
            
            // Change the checkout text
            checkoutBtn.textContent = 'Complete Purchase';
            
            if (closeBtn) {
                const originalCloseFunc = closeBtn.onclick;
                closeBtn.onclick = function() {
                    if (sideCart.classList.contains('fullscreen-cart')) {
                        // Go back to normal cart view
                        exitFullscreenCart();
                    } else if (originalCloseFunc) {
                        // Use the original close function
                        originalCloseFunc.call(this);
                    } else {
                        // Fallback close behavior
                        sideCart.style.width = "0";
                        cartOverlay.classList.remove("active");
                        document.body.style.overflow = "";
                    }
                };
            }
            
            // 
            cartOverlay.onclick = function() {
                if (sideCart.classList.contains('fullscreen-cart')) {
                    // Exit fullscreen, don't close completely
                    exitFullscreenCart();
                } else {
                    // Normal close behavior
                    sideCart.style.width = "0";
                    cartOverlay.classList.remove("active");
                    document.body.style.overflow = "";
                }
            };
        });
    }
    
    // Function to go back to normal cart view
    function exitFullscreenCart() {
        // Remove fullscreen mode
        sideCart.classList.remove('fullscreen-cart');
        cartOverlay.classList.remove('fullscreen-overlay');
        
        // Hide the back button
        backBtn.style.display = 'none';
        
        // Reset checkout button text
        if (checkoutBtn) {
            checkoutBtn.textContent = 'Checkout';
        }
    }
});