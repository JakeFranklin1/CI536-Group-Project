import { initializeMobileMenu } from "../js/modules/ui-initialiser.js";

document.addEventListener("DOMContentLoaded", () => {
    // Initialize mobile menu functionality
    initializeMobileMenu();

    // Handle the contact form submission
    const contactForm = document.getElementById("contact-form");
    const successMessage = document.getElementById("success-message");

    contactForm.addEventListener("submit", function (e) {
        e.preventDefault(); // Prevent actual form submission

        // Show success message
        successMessage.style.display = "block";

        // Clear the form
        contactForm.reset();

        // Hide the success message after 5 seconds
        setTimeout(() => {
            successMessage.style.display = "none";
        }, 5000);

        // Scroll to the success message
        successMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    });
});
