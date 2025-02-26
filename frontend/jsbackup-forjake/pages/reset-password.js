import supabase from "../api/supabase-client.js";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".signup-form");
    const emailInput = form.querySelector("#email");

    /**
     * Validates email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if email is valid
     */
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    /**
     * Shows error message
     * @param {string} message - Error message to display
     */
    const showError = (message) => {
        const errorSpan =
            emailInput.parentNode.querySelector(".error-message") ||
            (() => {
                const span = document.createElement("span");
                span.className = "error-message";
                emailInput.parentNode.appendChild(span);
                return span;
            })();

        errorSpan.textContent = message;
        errorSpan.style.display = "block";
        emailInput.classList.add("error");
    };

    /**
     * Shows success message
     * @param {string} message - Success message to display
     */
    const showSuccess = (message) => {
        const successDiv = document.createElement("div");
        successDiv.className = "success-message";
        successDiv.textContent = message;
        successDiv.style.marginBottom = "0"; // Add this line

        const existingSuccess = form.querySelector(".success-message");
        if (existingSuccess) {
            existingSuccess.remove();
        }

        form.insertBefore(successDiv, form.querySelector(".submit-btn"));
    };

    /**
     * Handles password reset request
     * @param {Event} e - Submit event
     */
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const submitButton = form.querySelector(".submit-btn");

        if (!isValidEmail(email)) {
            showError("Please enter a valid email address");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Sending...";

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/pages/update-password.html`,
            });

            if (error) {
                throw error;
            }

            showSuccess("Password reset link sent! Please check your email.");
            form.reset();
        } catch (error) {
            showError(error.message);
            console.error("Reset Error:", error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Reset";
        }
    };

    // Event Listeners
    form.addEventListener("submit", handlePasswordReset);
});
