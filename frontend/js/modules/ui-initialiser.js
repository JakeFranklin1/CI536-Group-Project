import { showToast } from "../utils/toast.js";
import { handleFilterSelection } from "./filter-handler.js";
import { initializeYearPicker, setupYearPickerButton } from "./year-picker.js";
import { setupLoadMoreButton } from "./pagination.js";
import { initializeSearchBar } from "../services/GameService.js";
import { updateCartCount } from "../components/SideCart.js";

/**
 * Initializes mobile menu functionality
 */
export function initializeMobileMenu() {
    const hamburger = document.querySelector(".hamburger-menu");
    const sideNav = document.querySelector(".side-nav");

    hamburger?.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        sideNav?.classList.toggle("active");

        // Remove box-shadow when active
        if (hamburger.classList.contains("active")) {
            hamburger.style.boxShadow = "none";
        } else {
            hamburger.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"; // Restore default shadow
        }
    });
}

/**
 * Sets up event handlers for filter buttons in the side navigation
 */
export function setupFilterButtonHandlers() {
    const filterButtons = document.querySelectorAll(
        ".filter-section button:not(.settings-btn)"
    );

    filterButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            // Close mobile menu if it's open
            const hamburger = document.querySelector(".hamburger-menu");
            const sideNav = document.querySelector(".side-nav");

            if (hamburger?.classList.contains("active")) {
                hamburger.classList.remove("active");
                sideNav?.classList.remove("active");
                hamburger.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"; // Restore default shadow
            }

            // Handle Specific Year button
            if (button.textContent.trim() === "Specific Year") {
                // Update selection state
                const allListItems =
                    document.querySelectorAll(".filter-section li");
                allListItems.forEach((item) =>
                    item.classList.remove("selected")
                );
                button.closest("li").classList.add("selected");

                // Update the page header
                const currentSectionHeader =
                    document.getElementById("current-section");
                if (currentSectionHeader) {
                    currentSectionHeader.textContent = "Select a year";
                }

                // Hide sort dropdown and show choose year button
                const dropdownMenu = document.querySelector(".dropdown-menu");
                const chooseYearBtn = document.querySelector(
                    ".choose-year-btn-container"
                );

                if (dropdownMenu) {
                    dropdownMenu.style.display = "none";
                }
                if (chooseYearBtn) {
                    chooseYearBtn.style.display = "flex";
                }

                // Clear the games grid and show a message
                const gamesGrid = document.querySelector(".games-grid");
                if (gamesGrid) {
                    gamesGrid.innerHTML = `
                        <div class="no-games-message">
                            <i class="fa fa-calendar-o"></i>
                            <p>Please choose a year to view games</p>
                        </div>
                    `;
                }

                return; // Important: Return early to prevent API call
            }

            // Handle other filter buttons
            // Update selection state
            const allListItems =
                document.querySelectorAll(".filter-section li");
            allListItems.forEach((item) => item.classList.remove("selected"));
            button.closest("li").classList.add("selected");

            // Get filter type and value
            const buttonText = button.textContent.trim();
            let filterType = "timeframe";

            // Determine filter type based on button text
            if (
                [
                    "PC",
                    "PlayStation",
                    "Xbox",
                    "Nintendo",
                    "Android",
                    "Apple",
                ].includes(buttonText)
            ) {
                filterType = "platform";
            } else if (
                ["Action", "Adventure", "RPG", "Strategy", "Sport"].includes(
                    buttonText
                )
            ) {
                filterType = "category";
            } else if (["Recently Added"].includes(buttonText)) {
                filterType = "community";
            }

            // Hide choose year button
            const chooseYearBtn = document.querySelector(
                ".choose-year-btn-container"
            );
            if (chooseYearBtn) {
                chooseYearBtn.style.display = "none";
            }

            // Handle the filter selection
            handleFilterSelection(filterType, buttonText);
        });
    });
}

/**
 * Sets the selected state for navigation items based on current page
 */
export function setSelectedNavItem() {
    const currentPath = window.location.pathname;
    const allNavItems = document.querySelectorAll(".filter-section ul li");

    // Remove selected class from all items
    allNavItems.forEach((item) => item.classList.remove("selected"));

    // Set selected based on current path
    if (currentPath.includes("about.html")) {
        document
            .querySelector('a[href="about.html"]')
            ?.parentElement.classList.add("selected");
    } else if (currentPath.includes("profile.html")) {
        document
            .querySelector('a[href="profile.html"]')
            ?.parentElement.classList.add("selected");
    }
}

/**
 * Handles clicks on the brand container
 */
export function handleBrandClick() {
    if (window.location.pathname.endsWith("marketplace.html")) {
        showToast("You are already on the marketplace page.");
    } else {
        window.location.href = "marketplace.html";
    }
}

/**
 * Helper function to determine filter type from section
 */
export function getFilterTypeFromSection(section) {
    const sectionTitle = section.querySelector("h3").textContent.toLowerCase();

    if (sectionTitle.includes("platforms")) return "platform";
    if (sectionTitle.includes("categories")) return "category";
    if (sectionTitle.includes("top games")) return "timeframe";
    if (sectionTitle.includes("community")) return "community";

    return "general";
}

/**
 * Initializes all UI components
 */
export function initializeUI() {
    // Set up brand click handler
    const brandContainer = document.querySelector(".brand-container");
    if (brandContainer) {
        brandContainer.addEventListener("click", handleBrandClick);
    }

    // Initialize UI components
    setupYearPickerButton();
    setupFilterButtonHandlers();
    setupLoadMoreButton();
    initializeMobileMenu();
    setSelectedNavItem();
    updateCartCount();
    initializeSearchBar();
}
