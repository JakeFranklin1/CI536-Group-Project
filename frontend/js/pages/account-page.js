import supabase from "../supabase-client.js";
import { showToast } from "../utils/toast.js";
import { getUserData } from "../services/auth-service.js";
import { initializeMobileMenu } from "../modules/ui-initialiser.js";

document.addEventListener("DOMContentLoaded", async function () {
    // Initialize mobile menu
    initializeMobileMenu();

    // Load user data and populate account settings
    await loadUserData();

    // Set up tab navigation
    setupTabNavigation();
});

/**
 * Load user data and populate account settings
 */
async function loadUserData() {
    try {
        // Show loading indicator
        const loadingEl = document.getElementById("loading");
        if (loadingEl) loadingEl.classList.remove("hidden");

        // Check if user is authenticated
        const currentUser = await getUserData();
        if (!currentUser) {
            // Show authentication modal
            document.getElementById("auth-modal").classList.remove("hidden");
            return;
        }

        // Fetch user data from database
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", currentUser.id)
            .single();

        if (error) throw error;

        // Update UI with user data
        updateProfileUI(data);

        // Add event listeners for forms
        setupEventListeners(data, currentUser);
    } catch (error) {
        console.error("Error loading user data:", error);
        showToast("Failed to load account information", "error");
    } finally {
        // Hide loading indicator
        const loadingEl = document.getElementById("loading");
        if (loadingEl) loadingEl.classList.add("hidden");
        document.getElementById("account-settings-container").style.display =
            "block";
        document.getElementById("account-settings-container").style.opacity =
            "1";
        document.getElementById("account-settings-container").style.transform =
            "translateY(0)";
    }
}

/**
 * Update profile UI with user data
 */
function updateProfileUI(userData) {
    // Set name and email
    document.getElementById("profile-name").textContent =
        `${userData.first_name || ""} ${userData.last_name || ""}`.trim();
    document.getElementById("profile-email").textContent = userData.email || "";

    // Set form values
    document.getElementById("first-name").value = userData.first_name || "";
    document.getElementById("last-name").value = userData.last_name || "";
    document.getElementById("email").value = userData.email || "";

    // Set dark mode preference
    document.getElementById("dark-mode").checked = userData.dark_mode || false;

    // Apply dark mode if enabled
    if (userData.dark_mode) {
        document.body.classList.add("dark-mode");
    }

    // Set balance
    const formattedBalance = new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
    }).format(userData.balance || 0);
    document.getElementById("user-balance").textContent = formattedBalance;

    // Set profile picture with initials
    const initials = getInitials(userData.first_name, userData.last_name);
    const profileColor = generateColorFromName(
        userData.first_name + userData.last_name
    );
    const profilePicture = document.getElementById("profile-picture");
    profilePicture.textContent = initials;
    profilePicture.style.backgroundColor = profileColor;
}

/**
 * Set up tab navigation
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const tabId = button.dataset.tab;

            // Update active tab button
            tabButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");

            // Show selected tab content
            tabContents.forEach((content) =>
                content.classList.remove("active")
            );
            document.getElementById(tabId).classList.add("active");
        });
    });
}

/**
 * Set up event listeners for forms
 */
function setupEventListeners(userData, currentUser) {
    // Personal info form submission
    const personalInfoForm = document.getElementById("personal-info-form");
    personalInfoForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData(personalInfoForm);
            const updatedData = {
                first_name: formData.get("first_name"),
                last_name: formData.get("last_name") || null,
            };

            const { error } = await supabase
                .from("users")
                .update(updatedData)
                .eq("id", currentUser.id);

            if (error) throw error;

            // Update profile UI with new data
            const newUserData = { ...userData, ...updatedData };
            updateProfileUI(newUserData);

            showToast("Personal information updated successfully", "success");
        } catch (error) {
            console.error("Error updating personal information:", error);
            showToast("Failed to update personal information", "error");
        }
    });

    // Password form submission
    const passwordForm = document.getElementById("password-form");
    passwordForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const currentPassword =
            document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword =
            document.getElementById("confirm-password").value;

        if (newPassword !== confirmPassword) {
            showToast("New passwords do not match", "error");
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            // Clear form
            passwordForm.reset();

            showToast("Password updated successfully", "success");
        } catch (error) {
            console.error("Error updating password:", error);
            showToast("Failed to update password", "error");
        }
    });

    // Preferences form submission
    const preferencesForm = document.getElementById("preferences-form");
    preferencesForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData(preferencesForm);
            const updatedPreferences = {
                dark_mode: formData.get("dark_mode") === "on",
            };

            const { error } = await supabase
                .from("users")
                .update(updatedPreferences)
                .eq("id", currentUser.id);

            if (error) throw error;

            // Apply dark mode if needed
            applyDarkMode(updatedPreferences.dark_mode);

            showToast("Preferences updated successfully", "success");
        } catch (error) {
            console.error("Error updating preferences:", error);
            showToast("Failed to update preferences", "error");
        }
    });

    // Add funds button
    const addFundsBtn = document.getElementById("add-funds-btn");
    const addFundsModal = document.getElementById("add-funds-modal");
    const closeFundsModal = document.getElementById("close-funds-modal");
    const addFundsForm = document.getElementById("add-funds-form");
    const amountButtons = document.querySelectorAll(".amount-option");
    const customAmountInput = document.getElementById("custom-amount");

    // Show modal when Add Funds button is clicked
    addFundsBtn.addEventListener("click", () => {
        addFundsModal.classList.add("active");
    });

    // Close modal when X is clicked
    closeFundsModal.addEventListener("click", () => {
        addFundsModal.classList.remove("active");
    });

    // Close modal when clicking outside of it
    window.addEventListener("click", (event) => {
        if (event.target === addFundsModal) {
            addFundsModal.classList.remove("active");
        }
    });

    // Handle amount selection buttons
    amountButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Remove selection from all buttons
            amountButtons.forEach((btn) => btn.classList.remove("selected"));

            // Add selection to clicked button
            button.classList.add("selected");

            // Clear custom amount
            customAmountInput.value = "";
        });
    });

    // Clear button selection when custom amount is entered
    customAmountInput.addEventListener("input", () => {
        amountButtons.forEach((btn) => btn.classList.remove("selected"));
    });

    // Handle form submission
    addFundsForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get selected amount
        let amount = 0;
        const selectedButton = document.querySelector(
            ".amount-option.selected"
        );

        if (selectedButton) {
            amount = parseFloat(selectedButton.dataset.amount);
        } else if (customAmountInput.value) {
            amount = parseFloat(customAmountInput.value);
        }

        // Validate amount
        if (amount <= 0 || amount > 1000) {
            showToast(
                "Please enter a valid amount between £1 and £1000",
                "error"
            );
            return;
        }

        // Show loading state
        const submitBtn = document.getElementById("submit-funds");
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = "Processing...";
        submitBtn.disabled = true;

        try {
            // Get current balance
            const { data: userData, error: fetchError } = await supabase
                .from("users")
                .select("balance")
                .eq("id", currentUser.id)
                .single();

            if (fetchError) throw fetchError;

            // Calculate new balance
            const currentBalance = userData.balance || 0;
            const newBalance = currentBalance + amount;

            // Update balance in database
            const { error: updateError } = await supabase
                .from("users")
                .update({ balance: newBalance })
                .eq("id", currentUser.id);

            if (updateError) throw updateError;

            // Update UI
            const formattedBalance = new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: "GBP",
            }).format(newBalance);

            document.getElementById("user-balance").textContent =
                formattedBalance;

            // Close modal
            addFundsModal.classList.remove("active");

            // Reset form
            addFundsForm.reset();
            amountButtons.forEach((btn) => btn.classList.remove("selected"));

            // Show success message
            showToast(
                `Successfully added £${amount.toFixed(2)} to your account`,
                "success"
            );
        } catch (error) {
            console.error("Error adding funds:", error);
            showToast("Failed to add funds to your account", "error");
        } finally {
            // Reset button state
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Photo button
    const uploadPhotoBtn = document.getElementById("upload-photo-btn");
    uploadPhotoBtn.addEventListener("click", () => {
        showToast("This feature is not implemented in this demo", "info");
    });
}

/**
 * Apply dark mode to the page if enabled
 */
function applyDarkMode(isDarkMode) {
    if (isDarkMode) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}

/**
 * Get initials from first and last name
 */
function getInitials(firstName, lastName) {
    let initials = "";

    if (firstName) {
        initials += firstName.charAt(0).toUpperCase();
    }

    if (lastName) {
        initials += lastName.charAt(0).toUpperCase();
    }

    return initials || "?";
}

/**
 * Generate a consistent color based on a name
 */
function generateColorFromName(name) {
    if (!name) return "#6b00ff"; // Default purple

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = hash % 360;
    return `hsl(${hue}, 80%, 45%)`;
}
