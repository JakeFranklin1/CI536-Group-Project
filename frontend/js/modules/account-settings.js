import supabase from "../supabase-client.js";
import { showToast } from "../utils/toast.js";
import { getUserData } from "../services/auth-service.js";

let currentUser = null;
let userData = null;

/**
 * Shows the account settings with smooth transitions
 */
export async function showAccountSettings() {
    // Store current scroll position
    window.marketplaceScrollPosition = window.scrollY;

    // Force scroll to top
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    let settingsContainer = document.getElementById(
        "account-settings-container"
    );
    if (!settingsContainer) {
        settingsContainer = document.createElement("div");
        settingsContainer.id = "account-settings-container";
        document.querySelector(".main-content").appendChild(settingsContainer);
    }

    // Get elements for animation
    const sideNav = document.querySelector(".side-nav");
    const gamesGrid = document.querySelector(".games-grid");
    const loadMoreContainer = document.querySelector(".load-more-container");
    const currentSection = document.getElementById("current-section");
    const dropdownMenu = document.querySelector(".dropdown-menu");
    const chooseYearBtn = document.querySelector(".choose-year-btn-container");
    const hamburgerMenu = document.querySelector(".hamburger-menu");
    const footer = document.querySelector(".marketplace-footer");

    // Step 1: Add fade-out class to all elements that need to be hidden
    if (gamesGrid) gamesGrid.classList.add("fade-out");
    if (loadMoreContainer) loadMoreContainer.classList.add("fade-out");
    if (currentSection) currentSection.classList.add("fade-out");
    if (dropdownMenu) {
        window.dropdownMenuDisplayState = dropdownMenu.style.display;
        dropdownMenu.classList.add("fade-out");
    }
    if (chooseYearBtn) {
        window.chooseYearBtnDisplayState = chooseYearBtn.style.display;
        chooseYearBtn.classList.add("fade-out");
    }
    if (hamburgerMenu) hamburgerMenu.classList.add("fade-out");
    if (sideNav) sideNav.classList.add("hidden");
    if (footer) footer.classList.add("fade-out");

    // Step 2: After elements have faded out, prepare and show account settings
    setTimeout(async () => {
        // Hide elements completely
        if (gamesGrid) gamesGrid.style.display = "none";
        if (loadMoreContainer) loadMoreContainer.style.display = "none";
        if (currentSection) currentSection.style.display = "none";
        if (dropdownMenu) dropdownMenu.style.display = "none";
        if (chooseYearBtn) chooseYearBtn.style.display = "none";

        // Adjust the main content margin for full-width display
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
            window.originalMainContentMargin = mainContent.style.marginLeft;
            mainContent.style.marginLeft = "0";
        }

        try {
            // Check if user is authenticated
            const authUser = await getUserData();
            if (!authUser) {
                hideAccountSettings();
                window.location.href = "/frontend/pages/login.html";
                return;
            }

            currentUser = authUser;

            // Fetch user data from database
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", currentUser.id)
                .single();

            if (error) throw error;
            userData = data;

            // Generate account settings HTML
            settingsContainer.innerHTML = generateAccountSettingsHTML(userData);

            // Make the container visible but without the visible class yet
            settingsContainer.style.display = "block";

            // Add event listeners
            addEventListeners(settingsContainer);

            // Step 3: Fade in the settings view
            setTimeout(() => {
                settingsContainer.classList.add("visible");
            }, 50);
        } catch (error) {
            console.error("Error loading account settings:", error);
            showToast("Failed to load account information", "error");
            hideAccountSettings();
        }
    }, 300); // Match CSS transition duration

    setTimeout(() => {
        if (footer) {
            footer.style.display = "block";
            footer.classList.remove("fade-out");
        }
    }, 600);
}

/**
 * Hides account settings and shows the marketplace grid with smooth transitions
 */
export function hideAccountSettings() {
    // Get elements for animation
    const settingsContainer = document.getElementById(
        "account-settings-container"
    );
    const sideNav = document.querySelector(".side-nav");
    const gamesGrid = document.querySelector(".games-grid");
    const loadMoreContainer = document.querySelector(".load-more-container");
    const currentSection = document.getElementById("current-section");
    const dropdownMenu = document.querySelector(".dropdown-menu");
    const chooseYearBtn = document.querySelector(".choose-year-btn-container");
    const hamburgerMenu = document.querySelector(".hamburger-menu");

    // Step 1: Fade out the settings view
    if (settingsContainer) settingsContainer.classList.remove("visible");

    // Step 2: After settings have faded out, prepare to fade in grid elements
    setTimeout(() => {
        if (settingsContainer) settingsContainer.style.display = "none";

        // Restore original main content margin
        const mainContent = document.querySelector(".main-content");
        if (mainContent && window.originalMainContentMargin !== undefined) {
            mainContent.style.marginLeft = window.originalMainContentMargin;
        } else if (mainContent) {
            // Default margin for desktop if original wasn't stored
            if (window.innerWidth > 768) {
                mainContent.style.marginLeft = "245px";
            } else {
                mainContent.style.marginLeft = "0";
            }
        }

        // Make grid elements visible again but still faded
        if (gamesGrid) {
            gamesGrid.style.display = "grid";
            gamesGrid.classList.add("fade-out");
        }
        if (loadMoreContainer) {
            loadMoreContainer.style.display = "flex";
            loadMoreContainer.classList.add("fade-out");
        }
        if (currentSection) {
            currentSection.style.display = "block";
            currentSection.classList.add("fade-out");
        }

        // Restore dropdown and year button visibility
        if (dropdownMenu && window.dropdownMenuDisplayState !== undefined) {
            dropdownMenu.style.display = window.dropdownMenuDisplayState;
            dropdownMenu.classList.add("fade-out");
        }

        if (chooseYearBtn && window.chooseYearBtnDisplayState !== undefined) {
            chooseYearBtn.style.display = window.chooseYearBtnDisplayState;
            chooseYearBtn.classList.add("fade-out");
        }

        if (hamburgerMenu) hamburgerMenu.classList.add("fade-out");

        // Step 3: After a short delay, fade in all elements
        setTimeout(() => {
            if (sideNav) sideNav.classList.remove("hidden");
            if (gamesGrid) gamesGrid.classList.remove("fade-out");
            if (loadMoreContainer)
                loadMoreContainer.classList.remove("fade-out");
            if (currentSection) currentSection.classList.remove("fade-out");
            if (dropdownMenu) dropdownMenu.classList.remove("fade-out");
            if (chooseYearBtn) chooseYearBtn.classList.remove("fade-out");
            if (hamburgerMenu) hamburgerMenu.classList.remove("fade-out");

            // Restore previous scroll position
            if (window.marketplaceScrollPosition) {
                window.scrollTo({
                    top: window.marketplaceScrollPosition,
                    behavior: "smooth",
                });
            }
        }, 50);
    }, 300);
}

/**
 * Generate HTML for account settings
 */
function generateAccountSettingsHTML(userData) {
    const initials = getInitials(userData.first_name, userData.last_name);
    const profileColor = generateColorFromName(
        userData.first_name + userData.last_name
    );
    const formattedBalance = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(userData.balance || 0);

    return `
        <div class="account-details-header">
            <button class="back-to-marketplace">    
                <i class="fa fa-arrow-left"></i> Back to Marketplace
            </button>
            <h1>Account Settings</h1>
        </div>

        <div class="account-details-content">
            <div class="account-container">
                <!-- Left sidebar with profile summary -->

                <div class="profile-sidebar">
                    <div class="profile-picture-container">
                        <div id="profile-picture" class="profile-picture" style="background-color: ${profileColor};">
                            ${initials}
                        </div>
                        <button id="upload-photo-btn" class="btn-secondary">
                            <i class="fa fa-camera"></i> Change Photo
                        </button>
                    </div>

                    <div class="profile-summary">
                        <h2 id="profile-name">${userData.first_name || ""} ${userData.last_name || ""}</h2>
                        <p id="profile-email">${userData.email || ""}</p>

                        <div class="balance-container">
                            <h3>Account Balance</h3>
                            <div class="balance-amount" id="user-balance">${formattedBalance}</div>
                            <button id="add-funds-btn" class="btn-primary">Add Funds</button>
                        </div>
                    </div>
                </div>

                <!-- Right side with tabs and forms -->
                <div class="settings-content">
                    <div class="tabs">
                        <button class="tab-button active" data-tab="personal-info">Personal Information</button>
                        <button class="tab-button" data-tab="security">Security</button>
                        <button class="tab-button" data-tab="preferences">Preferences</button>
                    </div>

                    <!-- Personal Information Tab -->
                    <div class="tab-content active" id="personal-info">
                        <h3>Personal Information</h3>
                        <form id="personal-info-form">
                            <div class="form-group">
                                <label for="first-name">First Name</label>
                                <input type="text" id="first-name" name="first_name" value="${userData.first_name || ""}" required>
                            </div>

                            <div class="form-group">
                                <label for="last-name">Last Name</label>
                                <input type="text" id="last-name" name="last_name" value="${userData.last_name || ""}" required>
                            </div>

                            <div class="form-group">
                                <label for="email">Email Address</label>
                                <input type="email" id="email" name="email" value="${userData.email || ""}" required disabled>
                                <small>To change your email address, please contact support.</small>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>

                    <!-- Security Tab -->
                    <div class="tab-content" id="security">
                        <h3>Security Settings</h3>
                        <form id="password-form">
                            <div class="form-group">
                                <label for="current-password">Current Password</label>
                                <input type="password" id="current-password" name="current_password" required>
                            </div>

                            <div class="form-group">
                                <label for="new-password">New Password</label>
                                <input type="password" id="new-password" name="new_password" required>
                            </div>

                            <div class="form-group">
                                <label for="confirm-password">Confirm New Password</label>
                                <input type="password" id="confirm-password" name="confirm_password" required>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn-primary">Update Password</button>
                            </div>
                        </form>
                    </div>

                    <!-- Preferences Tab -->
                    <div class="tab-content" id="preferences">
                        <h3>Preferences</h3>
                        <form id="preferences-form">
                            <div class="form-group">
                                <label for="dark-mode">Dark Mode</label>
                                <label class="switch">
                                    <input type="checkbox" id="dark-mode" name="dark_mode" ${userData.dark_mode ? "checked" : ""}>
                                    <span class="slider round"></span>
                                </label>
                            </div>

                            <div class="form-group">
                                <label for="email-notifications">Email Notifications</label>
                                <label class="switch">
                                    <input type="checkbox" id="email-notifications" name="email_notifications" checked>
                                    <span class="slider round"></span>
                                </label>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn-primary">Save Preferences</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Set up event listeners for the account settings
 */
function addEventListeners(container) {
    // Back button
    container
        .querySelector(".back-to-marketplace")
        .addEventListener("click", hideAccountSettings);

    // Tab navigation
    const tabButtons = container.querySelectorAll(".tab-button");
    const tabContents = container.querySelectorAll(".tab-content");

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
            container.querySelector(`#${tabId}`).classList.add("active");
        });
    });

    // Personal info form submission
    // Personal info form submission
    const personalInfoForm = container.querySelector("#personal-info-form");
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

            // Update the UI with new data
            userData = { ...userData, ...updatedData };
            const profileName = container.querySelector("#profile-name");
            profileName.textContent =
                `${userData.first_name || ""} ${userData.last_name || ""}`.trim();

            // Update profile picture with new initials if needed
            const initials = getInitials(
                userData.first_name,
                userData.last_name
            );
            const profilePicture = container.querySelector("#profile-picture");
            profilePicture.textContent = initials;

            // Generate and apply new color based on the updated name
            const newColor = generateColorFromName(
                `${userData.first_name} ${userData.last_name}`
            );
            profilePicture.style.backgroundColor = newColor;

            showToast("Personal information updated successfully", "success");
        } catch (error) {
            console.error("Error updating personal information:", error);
            showToast("Failed to update personal information", "error");
        }
    });

    // Password form submission
    const passwordForm = container.querySelector("#password-form");
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
    const preferencesForm = container.querySelector("#preferences-form");
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

            // Update user data
            userData = { ...userData, ...updatedPreferences };

            // Apply dark mode if needed
            applyDarkMode(updatedPreferences.dark_mode);

            showToast("Preferences updated successfully", "success");
        } catch (error) {
            console.error("Error updating preferences:", error);
            showToast("Failed to update preferences", "error");
        }
    });

    // Add funds button - Show toast instead of modal
    const addFundsBtn = container.querySelector("#add-funds-btn");
    addFundsBtn.addEventListener("click", () => {
        showToast("This is here for demonstrative purposes", "info");
    });

    // Photo button click handler
    const uploadPhotoBtn = container.querySelector("#upload-photo-btn");
    if (uploadPhotoBtn) {
        uploadPhotoBtn.addEventListener("click", () => {
            showToast("This feature is not implemented in this demo", "info");
        });
    }
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
