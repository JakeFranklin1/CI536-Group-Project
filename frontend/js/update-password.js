import supabase from "./supabase-client.js";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".signup-form");

    /**
     * Updates user's password
     * @param {Event} e - Submit event
     */
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector(".submit-btn");
        const password = form.querySelector("#password").value;
        const confirmPassword = form.querySelector("#confirm-password").value;

        if (password !== confirmPassword) {
            showError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            showError("Password must be at least 6 characters");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Updating...";

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            showSuccess("Password updated successfully!");
            setTimeout(() => {
                window.location.href = "./login.html";
            }, 2000);

        } catch (error) {
            showError(error.message);
            console.error("Update Error:", error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Update Password";
        }
    };

    // Helper functions for error/success handling
    const showError = (message) => {
        const errorSpan = document.querySelector(".error-message") ||
            (() => {
                const span = document.createElement("span");
                span.className = "error-message";
                form.insertBefore(span, form.querySelector(".submit-btn"));
                return span;
            })();

        errorSpan.textContent = message;
        errorSpan.style.display = "block";
    };

    const showSuccess = (message) => {
        const successDiv = document.createElement("div");
        successDiv.className = "success-message";
        successDiv.textContent = message;
        successDiv.style.marginBottom = "0";

        const existingSuccess = form.querySelector(".success-message");
        if (existingSuccess) {
            existingSuccess.remove();
        }

        form.insertBefore(successDiv, form.querySelector(".submit-btn"));
    };

    // Event Listeners
    form.addEventListener("submit", handlePasswordUpdate);
});
