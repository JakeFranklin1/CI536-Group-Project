import { createFilterParams } from "../services/FilterService.js";
import { loadGames } from "../services/GameService.js";
import { addItemToCart } from "./cart-handler.js";
import { initializeCommunityGames } from "./community-games.js";

let currentFilter = { timeframe: "Popular in 2025" };
let currentPage = 1;

/**
 * @function handleFilterSelection
 * @description Updates the marketplace content based on the selected filter
 * @param {string} filterType - The type of filter (platform, category, timeframe)
 * @param {string} filterValue - The specific value of the filter
 */
export function handleFilterSelection(filterType, filterValue) {
    // Reset pagination variables when changing filters
    currentPage = 1;

    // Update the page header to show the current filter
    const currentSectionHeader = document.getElementById("current-section");
    if (currentSectionHeader) {
        currentSectionHeader.textContent = filterValue;
    }

    // Special case for Community Games
    if (filterType === "timeframe" && filterValue === "Community Games") {
        // Call the community games initializer
        initializeCommunityGames();
        return;
    }

    // Create filter parameters using the service
    const filterParams = createFilterParams(filterType, filterValue);

    // Store current filter for pagination
    currentFilter = filterParams;

    // Reset sort dropdown to "Most Popular" when filters change
    resetSortDropdown();

    // Show/hide the sort dropdown based on filter type
    toggleSortDropdownVisibility(filterValue);

    // Use full-screen loader for filter changes
    loadGames(filterParams, 12, true, addItemToCart);
}

export function resetSortDropdown() {
    // Reset text display
    const filterChoice = document.getElementById("filter-choice");
    if (filterChoice) {
        filterChoice.textContent = "Most Popular";
    }

    // Reset checkmarks in dropdown
    const dropdownButtons = document.querySelectorAll(
        ".dropdown-content button"
    );
    dropdownButtons.forEach((button) => {
        const checkmark = button.querySelector("i.fa-check");
        if (button.dataset.sort === "popular") {
            checkmark?.classList.remove("hidden");
        } else {
            checkmark?.classList.add("hidden");
        }
    });
}

/**
 * Shows or hides the sort dropdown based on filter type
 * @param {string} filterValue - The current filter value
 */
export function toggleSortDropdownVisibility(filterValue) {
    const dropdownMenu = document.querySelector(".dropdown-menu");
    const chooseYearBtn = document.querySelector(".choose-year-btn-container");

    if (!dropdownMenu || !chooseYearBtn) return;

    // For "Select a year" or when year is already selected (starts with "Games from"),
    // hide dropdown and show choose year button
    if (
        filterValue === "Select a year" ||
        filterValue.startsWith("Games from")
    ) {
        dropdownMenu.style.display = "none";
        chooseYearBtn.style.display = "flex";
        return;
    }

    // For other filters that don't need a dropdown
    if (filterValue === "All Time" || filterValue === "Popular in 2025") {
        dropdownMenu.style.display = "none";
        chooseYearBtn.style.display = "none";
    } else {
        dropdownMenu.style.display = "flex";
        chooseYearBtn.style.display = "none";
    }
}

export function getCurrentFilter() {
    return currentFilter;
}

export function setCurrentFilter(filter) {
    currentFilter = filter;
}

export function getCurrentPage() {
    return currentPage;
}

export function setCurrentPage(page) {
    currentPage = page;
}
