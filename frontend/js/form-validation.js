import supabase from "./supabase-client.js";

/**
 * Form Validation Module
 * This module handles client-side validation for the signup form.
 * It includes real-time validation and submission handling.
 */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".signup-form");
    const inputs = form.querySelectorAll("input");

    /**
     * Adds error message elements after each input field
     * These elements are initially hidden and shown when validation fails
     */
    inputs.forEach((input) => {
        const errorSpan = document.createElement("span");
        errorSpan.className = "error-message";
        input.parentNode.appendChild(errorSpan);
    });

    /**
     * Validates individual input fields based on their type
     * @param {HTMLInputElement} input - The input element to validate
     */
    const validateInput = (input) => {
        const value = input.value.trim();
        const errorSpan = input.parentNode.querySelector(".error-message");

        switch (input.id) {
            case "name": {
                // Name must be at least 2 characters long
                if (value.length < 2) {
                    showError(
                        input,
                        errorSpan,
                        "Name must be at least 2 characters"
                    );
                } else {
                    showSuccess(input, errorSpan);
                }
                break;
            }

            case "email": {
                // Email must match standard email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    showError(
                        input,
                        errorSpan,
                        "Please enter a valid email address"
                    );
                } else {
                    showSuccess(input, errorSpan);
                }
                break;
            }

            case "password": {
                const email = document.getElementById("email").value;
                // Special validation for test account
                if (email === "a@a.com") {
                    if (value.length < 1) {
                        showError(input, errorSpan, "");
                    } else {
                        showSuccess(input, errorSpan);
                    }
                } else {
                    // Regular password validation
                    if (value.length < 6) {
                        showError(
                            input,
                            errorSpan,
                            "Password must be at least 6 characters"
                        );
                    } else {
                        showSuccess(input, errorSpan);
                    }
                }
                break;
            }

            case "confirm-password": {
                // Confirmation password must match original password
                const password = document.getElementById("password").value;
                if (value !== password) {
                    showError(input, errorSpan, "Passwords do not match");
                } else {
                    showSuccess(input, errorSpan);
                }
                break;
            }

            default:
                break;
        }
    };

    /**
     * Displays error state and message for an input field
     * @param {HTMLInputElement} input - The input element with error
     * @param {HTMLElement} errorSpan - The error message container
     * @param {string} message - The error message to display
     */
    const showError = (input, errorSpan, message) => {
        input.classList.add("error");
        input.classList.remove("success");
        errorSpan.textContent = message;
        errorSpan.style.display = "block";
    };

    /**
     * Displays success state for an input field
     * @param {HTMLInputElement} input - The input element that passed validation
     * @param {HTMLElement} errorSpan - The error message container to hide
     */
    const showSuccess = (input, errorSpan) => {
        input.classList.remove("error");
        input.classList.add("success");
        errorSpan.style.display = "none";
    };

    /**
     * Form submission handler
     * Prevents default form submission if validation fails
     */
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        let isValid = true;

        // Validate all inputs before submission
        inputs.forEach((input) => {
            validateInput(input);
            if (input.classList.contains("error")) {
                isValid = false;
            }
        });

        if (isValid) {
            const submitButton = form.querySelector(".submit-btn");
            if (submitButton.id === "register-btn") {
                // SIGNUP FORM SUBMISSION
                submitButton.disabled = true;
                submitButton.textContent = "Signing up...";

                try {
                    const { data, error } = await supabase.auth.signUp({
                        email: form.querySelector("#email").value,
                        password: form.querySelector("#password").value,
                        options: {
                            data: {
                                full_name: form.querySelector("#name").value,
                            },
                        },
                    });

                    if (error) throw error;

                    if (data.user) {
                        // Show success message
                        const successMessage = document.createElement("div");
                        successMessage.className = "success-message";
                        successMessage.textContent = "Successfully signed up!";
                        form.insertBefore(successMessage, submitButton);

                        // Clear form
                        form.reset();
                        inputs.forEach((input) => {
                            input.classList.remove("success", "error");
                            const errorSpan =
                                input.parentNode.querySelector(
                                    ".error-message"
                                );
                            errorSpan.style.display = "none";
                        });
                    }
                } catch (error) {
                    console.error("Error:", error.message);
                    const errorMessage = document.createElement("div");
                    errorMessage.className = "error-message";
                    errorMessage.textContent = error.message;
                    errorMessage.style.display = "block";
                    form.insertBefore(errorMessage, submitButton);
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = "Sign Up";
                }
            } else if (submitButton.id === "login-btn") {
                // LOGIN FORM SUBMISSION
                submitButton.disabled = true;
                submitButton.textContent = "Logging in...";

                try {
                    const { data, error } =
                        await supabase.auth.signInWithPassword({
                            email: form.querySelector("#email").value,
                            password: form.querySelector("#password").value,
                        });

                    if (error) throw error;

                    if (data.user) {
                        // Redirect to marketplace
                        window.location.href = "../pages/marketplace.html";
                    }
                } catch (error) {
                    console.error("Login Error:", error.message);
                    const errorMessage = document.createElement("div");
                    errorMessage.className = "error-message";
                    errorMessage.textContent = error.message;
                    errorMessage.style.display = "block";
                    form.insertBefore(errorMessage, submitButton);
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = "Log In";
                }
            }
        }
    });

    /**
     * Real-time validation setup
     * Validates on both blur and input events for immediate feedback
     */
    inputs.forEach((input) => {
        input.addEventListener("blur", () => validateInput(input));
        input.addEventListener("input", () => validateInput(input));
    });
});
