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
            case "name":
                validateName(input, value, errorSpan);
                break;
            case "email":
                validateEmail(input, value, errorSpan);
                break;
            case "dob":
                validateDob(input, value, errorSpan);
                break;
            case "password":
                validatePassword(input, value, errorSpan);
                break;
            case "confirm-password":
                validateConfirmPassword(input, value, errorSpan);
                break;
            default:
                break;
        }
    };

    /**
     * Validates the name input field
     * @param {HTMLInputElement} input - The input element to validate
     * @param {string} value - The trimmed value of the input field
     * @param {HTMLElement} errorSpan - The error message container
     */
    const validateName = (input, value, errorSpan) => {
        if (value.length < 2) {
            showError(input, errorSpan, "Name must be at least 2 characters");
        } else {
            showSuccess(input, errorSpan);
        }
    };

    /**
     * Validates the email input field
     * @param {HTMLInputElement} input - The input element to validate
     * @param {string} value - The trimmed value of the input field
     * @param {HTMLElement} errorSpan - The error message container
     */
    const validateEmail = (input, value, errorSpan) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showError(input, errorSpan, "Please enter a valid email address");
        } else {
            showSuccess(input, errorSpan);
        }
    };

    /**
     * Validates the date of birth input field
     * @param {HTMLInputElement} input - The input element to validate
     * @param {string} value - The trimmed value of the input field
     * @param {HTMLElement} errorSpan - The error message container
     */
    const validateDob = (input, value, errorSpan) => {
        if (!value) {
            showError(input, errorSpan, "Please enter your date of birth");
            return;
        }

        const dob = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();

        // Check if birthday hasn't occurred this year
        const hasBirthdayOccurred =
            today.getMonth() > dob.getMonth() ||
            (today.getMonth() === dob.getMonth() &&
                today.getDate() >= dob.getDate());

        const actualAge = hasBirthdayOccurred ? age : age - 1;

        if (actualAge < 13) {
            showError(input, errorSpan, "You must be at least 13 years old");
        } else if (actualAge > 120) {
            showError(input, errorSpan, "Please enter a valid date of birth");
        } else {
            showSuccess(input, errorSpan);
        }
    };

    /**
     * Validates the password input field
     * @param {HTMLInputElement} input - The input element to validate
     * @param {string} value - The trimmed value of the input field
     * @param {HTMLElement} errorSpan - The error message container
     */
    const validatePassword = (input, value, errorSpan) => {
        if (value.length < 6) {
            showError(
                input,
                errorSpan,
                "Password must be at least 6 characters"
            );
        } else {
            showSuccess(input, errorSpan);
        }
    };

    /**
     * Validates the confirm password input field
     * @param {HTMLInputElement} input - The input element to validate
     * @param {string} value - The trimmed value of the input field
     * @param {HTMLElement} errorSpan - The error message container
     */
    const validateConfirmPassword = (input, value, errorSpan) => {
        const password = document.getElementById("password").value;
        if (value !== password) {
            showError(input, errorSpan, "Passwords do not match");
        } else {
            showSuccess(input, errorSpan);
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
                await handleSignUp(submitButton);
            } else if (submitButton.id === "login-btn") {
                await handleLogin(submitButton);
            }
        }
    });

    /**
     * Handles the sign-up process
     * @param {HTMLButtonElement} submitButton - The submit button element
     */
    const handleSignUp = async (submitButton) => {
        submitButton.disabled = true;
        submitButton.textContent = "Signing up...";

        let fullName = form.querySelector("#name").value.trim();
        let nameArray = fullName.split(" ");
        let firstName = nameArray[0];
        let lastName = nameArray.length > 1 ? nameArray.slice(1).join(" ") : "";

        // Ensure date of birth is in yyyy-mm-dd format
        let dob = form.querySelector("#dob").value;
        let formattedDob = new Date(dob).toISOString().split("T")[0];

        try {
            // Attempt signup first
            const { data, error } = await supabase.auth.signUp({
                email: form.querySelector("#email").value,
                password: form.querySelector("#password").value,
                options: {
                    data: {
                        full_name: fullName,
                        first_name: firstName,
                        last_name: lastName,
                        email: form.querySelector("#email").value,
                        dob: formattedDob,
                    },
                },
            });

            if (error) {
                // Check for existing user error
                if (error.message.includes("User already registered")) {
                    showError(
                        form.querySelector("#email"),
                        form.querySelector("#email").nextElementSibling,
                        "Email is already registered"
                    );
                } else {
                    throw error;
                }
                return;
            }

            if (data.user) {
                showSuccessMessage("Successfully signed up!");
                form.reset();
                clearFormState();
            }
        } catch (error) {
            console.error("Error:", error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Sign Up";
        }
    };

    /**
     * Handles the login process
     * @param {HTMLButtonElement} submitButton - The submit button element
     */
    const handleLogin = async (submitButton) => {
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: form.querySelector("#email").value,
                password: form.querySelector("#password").value,
            });

            if (error) {
                if (error.message.includes("Invalid login credentials")) {
                    showError(
                        form.querySelector("#password"),
                        form.querySelector("#password").nextElementSibling,
                        "Incorrect email or password."
                    );
                }
                throw error;
            }

            if (data.user) {
                window.location.href = "../pages/marketplace.html";
            }
        } catch (error) {
            console.error("Login Error:", error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Log In";
        }
    };

    /**
     * Displays a success message after successful sign-up
     * @param {string} message - The success message to display
     */
    const showSuccessMessage = (message) => {
        const successMessage = document.createElement("div");
        successMessage.className = "success-message";
        successMessage.textContent = message;

        const existingMessage = document.querySelector(".success-message");
        if (existingMessage) {
            existingMessage.remove();
        }

        form.insertBefore(successMessage, form.querySelector(".submit-btn"));
    };

    /**
     * Clears the form state by removing success and error classes
     * and hiding error messages
     */
    const clearFormState = () => {
        inputs.forEach((input) => {
            input.classList.remove("success", "error");
            const errorSpan = input.parentNode.querySelector(".error-message");
            errorSpan.style.display = "none";
        });
    };

    /**
     * Real-time validation setup
     * Validates on both blur and input events for immediate feedback
     */
    inputs.forEach((input) => {
        input.addEventListener("blur", () => validateInput(input));
        input.addEventListener("input", () => validateInput(input));
    });
});
