/* eslint-disable no-unused-vars */
/**
 * @module marketplace
 * @description This module handles the logic for the marketplace page, including authentication checks,
 *              user data fetching, and displaying user information.
 */

import { updateCartCount, updateCartTotal } from "./components/SideCart.js";
import { signOut, checkAuth } from "./services/auth-service.js";
import { escapeHTML } from "./utils/sanitise.js";
import supabase from "./supabase-client.js";
import { showToast } from "./utils/toast.js";
import { createFilterParams } from "./services/FilterService.js";

import {
    createGameCard,
    getPlatformIcons,
    displayGames,
    loadGames,
    initializeSearchBar,
    generateRandomPrice,
} from "./services/GameService.js";

/**
 * Global axios from CDN
 * @type {import('axios').AxiosStatic}
 */
const axios = window.axios;

const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://gamestore-backend-9v90.onrender.com";

let currentPage = 1;
let isLoading = false;
let currentFilter = { timeframe: "Popular in 2025" };

/**
 * @function handleSignOut
 * @description Signs out the user and redirects them to the index page.
 *              This function is made globally available so it can be called from the HTML.
 * @async
 * @returns {Promise<void>}
 */
window.handleSignOut = async () => {
    await signOut();
};

/**
 * @function initializeMarketplace
 * @description Initializes the marketplace page by checking authentication status and fetching user data.
 *              If the user is authenticated, their information is displayed.
 *              If not, the authentication modal is shown.
 * @async
 * @returns {Promise<void>}
 */
async function initializeMarketplace() {
    try {
        /**
         * @constant {boolean} isAuthenticated
         * @description Checks if the user is authenticated. If not, the function returns early,
         *              preventing further execution.
         */
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;

        /**
         * @constant {object} userResponse
         * @description Fetches the user data from Supabase.
         */
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (user) {
            // Extract only needed user data
            const filteredUserData = {
                email: user.email,
                id: user.id,
                confirmed_at: user.confirmed_at,
            };

            console.log("User Data:", filteredUserData);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

/**
 * @function handleBrandClick
 * @description Handles the click event on the brand container. Navigates to marketplace.html if not already there,
 *              otherwise displays a toast message.
 */
function handleBrandClick() {
    if (window.location.pathname.endsWith("marketplace.html")) {
        showToast("You are already on the marketplace page.");
    } else {
        window.location.href = "marketplace.html";
    }
}

/**
 * @function setSelectedNavItem
 * @description Sets the selected state for navigation items based on current page
 */
function setSelectedNavItem() {
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
 * Helper function to determine filter type from section
 */
function getFilterTypeFromSection(section) {
    const sectionTitle = section.querySelector("h3").textContent.toLowerCase();

    if (sectionTitle.includes("platforms")) return "platform";
    if (sectionTitle.includes("categories")) return "category";
    if (sectionTitle.includes("top games")) return "timeframe";
    if (sectionTitle.includes("community")) return "community";

    return "general";
}

function initializeMobileMenu() {
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
 * @function handleFilterSelection
 * @description Updates the marketplace content based on the selected filter
 * @param {string} filterType - The type of filter (platform, category, timeframe)
 * @param {string} filterValue - The specific value of the filter
 */
function handleFilterSelection(filterType, filterValue) {
    // Reset pagination variables when changing filters
    currentPage = 1;

    // Update the page header to show the current filter
    const currentSectionHeader = document.getElementById("current-section");
    if (currentSectionHeader) {
        currentSectionHeader.textContent = filterValue;
    }

    // Create filter parameters using the service
    const filterParams = createFilterParams(filterType, filterValue);

    // Store current filter for pagination
    currentFilter = filterParams;

    // Reset sort dropdown to "Most Popular" when filters change
    resetSortDropdown();

    // Show/hide the sort dropdown based on filter type
    toggleSortDropdownVisibility(filterValue);

    // Load games with the specified filters using the GameDisplayService
    // Use full-screen loader for filter changes
    loadGames(filterParams, 12, true, addItemToCart);
}

function resetSortDropdown() {
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
/**
 * Shows or hides the sort dropdown based on filter type
 * @param {string} filterValue - The current filter value
 */
function toggleSortDropdownVisibility(filterValue) {
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

/**
 * Adds an item to the shopping cart with animation
 * @param {HTMLElement} gameCard - The game card element to add to cart
 */
function addItemToCart(gameCard) {
    // Create flying animation element
    const addToCartBtn = gameCard.querySelector(".add-to-cart");
    const cartIcon = document.querySelector(".cart-btn");

    if (!addToCartBtn || !cartIcon) {
        console.error("Required elements for cart animation not found");
        return;
    }

    // Get the coordinates
    const start = addToCartBtn.getBoundingClientRect();
    const end = cartIcon.getBoundingClientRect();

    // Create the animation element
    const circle = document.createElement("div");
    circle.className = "add-to-cart-animation";

    // Set initial position
    circle.style.left = `${start.left + start.width / 2}px`;
    circle.style.top = `${start.top + start.height / 2}px`;

    // Calculate the animation path
    const keyframes = [
        {
            left: `${start.left + start.width / 2}px`,
            top: `${start.top + start.height / 2}px`,
            transform: "scale(1)",
            opacity: 1,
        },
        {
            left: `${end.left + end.width / 2}px`,
            top: `${end.top + end.height / 2}px`,
            transform: "scale(0.1)",
            opacity: 0,
        },
    ];

    document.body.appendChild(circle);

    // Animate the circle
    const animation = circle.animate(keyframes, {
        duration: 1000,
        easing: "cubic-bezier(0.47, 0, 0.745, 0.715)",
    });

    // Add the item to cart after animation
    animation.onfinish = () => {
        circle.remove();

        const gameTitle = gameCard.querySelector(".game-title").textContent;
        const gamePrice = gameCard.querySelector(".price").textContent;
        const gameImage = gameCard.querySelector(".game-image").src;

        // Check if the item already exists in cart
        const existingItem = findExistingCartItem(gameTitle);

        if (existingItem) {
            // Increment quantity of existing item
            const quantityValue = existingItem.querySelector(".quantity-value");
            quantityValue.textContent = parseInt(quantityValue.textContent) + 1;
            updateCartTotal();

            // Show toast notification
            showToast(`Increased quantity of ${gameTitle}`, "info");
            return;
        }

        const cartItemHTML = `
            <div class="cart-item" data-game-title="${escapeHTML(gameTitle)}">
                <div class="cart-item-details">
                    <div class="cart-item-title">${escapeHTML(gameTitle)}</div>
                    <div class="cart-item-info">
                        <img src="${escapeHTML(gameImage)}" alt="${escapeHTML(gameTitle)}" class="cart-item-image">
                        <div>
                            <div class="cart-item-platform">Platform</div>
                            <div class="cart-item-price">${escapeHTML(gamePrice)}</div>
                            <div class="cart-item-quantity">
                                <label>Qty:</label>
                                <div class="quantity-controls">
                                    <button class="quantity-decrement">-</button>
                                    <span class="quantity-value">1</span>
                                    <button class="quantity-increment">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="cart-remove" title="Remove item">
                    <i class="fa fa-times"></i>
                </button>
            </div>
        `;

        const cartItemsContainer = document.querySelector(".cart-items");
        const emptyCart = cartItemsContainer?.querySelector(".empty-cart");
        if (emptyCart) {
            emptyCart.remove();
            document.querySelector(".cart-summary").style.display = "block";
        }

        cartItemsContainer?.insertAdjacentHTML("beforeend", cartItemHTML);
        updateCartTotal();
        updateCartCount();

        // Show toast notification
        showToast(`${gameTitle} added to cart`, "success");
    };
}

/**
 * Finds an existing cart item by game title
 * @param {string} gameTitle - The title of the game to find
 * @returns {HTMLElement|null} - The cart item element or null if not found
 */
function findExistingCartItem(gameTitle) {
    const cartItems = document.querySelectorAll(".cart-item");
    for (const item of cartItems) {
        const title = item.querySelector(".cart-item-title").textContent;
        if (title === gameTitle) {
            return item;
        }
    }
    return null;
}

function initializeYearPicker() {
    // Don't look for the specific year button here anymore
    // We'll handle all button events in setupFilterButtonHandlers

    const yearPickerModal = document.getElementById("year-picker-modal");
    if (!yearPickerModal) {
        console.error("Could not find year picker modal");
        return;
    }

    const closeModalBtn = yearPickerModal.querySelector(".close-modal");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            yearPickerModal.classList.add("hidden");
        });
    }

    // Generate all year buttons for each decade
    generateYearButtons();

    // Handle decade tab clicks
    const decadeTabs = document.querySelectorAll(".decade-tab");
    decadeTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            // Update active tab
            decadeTabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");

            // Show corresponding decade grid
            const decade = tab.dataset.decade;
            document.querySelectorAll(".years-grid").forEach((grid) => {
                grid.classList.remove("active");
            });
            document.getElementById(`decade-${decade}`).classList.add("active");
        });
    });

    // Handle year button clicks - Re-query for buttons after generation
    const yearBtns = document.querySelectorAll(".year-btn");
    yearBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const year = btn.dataset.year;
            selectGameYear(year);
            yearPickerModal.classList.add("hidden");
        });
    });

    // Handle custom year input
    const applyCustomYearBtn = document.getElementById("apply-custom-year");
    applyCustomYearBtn.addEventListener("click", () => {
        const customYearInput = document.getElementById("custom-year");
        const year = customYearInput.value;

        if (year && year >= 1970 && year <= 2025) {
            selectGameYear(year);
            yearPickerModal.classList.add("hidden");
        } else {
            showToast(
                "Please enter a valid year between 1970 and 2025",
                "error"
            );
        }
    });

    // Close when clicking outside
    yearPickerModal.addEventListener("click", (e) => {
        if (e.target === yearPickerModal) {
            yearPickerModal.classList.add("hidden");
        }
    });
}

function generateYearButtons() {
    // Add error handling for each decade
    try {
        // Generate 2010s
        const decade2010 = document.getElementById("decade-2010");
        if (decade2010) {
            for (let year = 2019; year >= 2010; year--) {
                decade2010.innerHTML += `<button class="year-btn" data-year="${year}">${year}</button>`;
            }
        } else {
            console.warn("Missing decade-2010 element");
        }

        // Generate 2000s
        const decade2000 = document.getElementById("decade-2000");
        if (decade2000) {
            for (let year = 2009; year >= 2000; year--) {
                decade2000.innerHTML += `<button class="year-btn" data-year="${year}">${year}</button>`;
            }
        } else {
            console.warn("Missing decade-2000 element");
        }

        // Generate 1990s
        const decade1990 = document.getElementById("decade-1990");
        if (decade1990) {
            for (let year = 1999; year >= 1990; year--) {
                decade1990.innerHTML += `<button class="year-btn" data-year="${year}">${year}</button>`;
            }
        } else {
            console.warn("Missing decade-1990 element");
        }

        // Generate 1980s
        const decade1980 = document.getElementById("decade-1980");
        if (decade1980) {
            for (let year = 1989; year >= 1980; year--) {
                decade1980.innerHTML += `<button class="year-btn" data-year="${year}">${year}</button>`;
            }
        } else {
            console.warn("Missing decade-1980 element");
        }
    } catch (error) {
        console.error("Error generating year buttons:", error);
    }
}

function selectGameYear(year) {
    // Update the page header
    const currentSectionHeader = document.getElementById("current-section");
    if (currentSectionHeader) {
        currentSectionHeader.textContent = `Games from ${year}`;
    }

    // Create filter params
    const filterParams = { year: year };

    // Keep the choose year button visible (modify this line)
    // Don't call toggleSortDropdownVisibility here since we want to keep the button visible
    const dropdownMenu = document.querySelector(".dropdown-menu");
    const chooseYearBtn = document.querySelector(".choose-year-btn-container");

    if (dropdownMenu) {
        dropdownMenu.style.display = "none";
    }
    if (chooseYearBtn) {
        chooseYearBtn.style.display = "flex";
    }

    // No need to call resetSortDropdown() since the dropdown is hidden

    // Load the games for that year
    loadGames(filterParams, 12, true, addItemToCart);

    // Update selected state in sidebar
    const allListItems = document.querySelectorAll(".filter-section li");
    allListItems.forEach((item) => item.classList.remove("selected"));
    document
        .querySelector("button:has(.fa-calendar)")
        ?.closest("li")
        ?.classList.add("selected");

    // Close the modal
    const yearPickerModal = document.getElementById("year-picker-modal");
    if (yearPickerModal) {
        yearPickerModal.classList.add("hidden");
    }
}

function setupFilterButtonHandlers() {
    const filterButtons = document.querySelectorAll(".filter-section button");

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
 * Loads more games when the "Load More" button is clicked
 * @function loadMoreGames
 */
async function loadMoreGames() {
    // Don't load more if we're already loading
    if (isLoading) return;

    // Update button to show loading state
    const loadMoreBtn = document.querySelector(".load-more-btn");
    if (loadMoreBtn) {
        document.getElementById("loading").classList.remove("hidden");
    }

    isLoading = true;
    currentPage++;

    try {
        // Get the current filter from the header to maintain context
        const currentSectionHeader = document.getElementById("current-section");
        if (currentSectionHeader) {
            const headerText = currentSectionHeader.textContent;

            // Update the current filter based on the section header
            if (headerText.startsWith("Games from")) {
                const year = headerText.replace("Games from ", "");
                currentFilter = { year };
            } else if (
                [
                    "PC",
                    "PlayStation",
                    "Xbox",
                    "Nintendo",
                    "Android",
                    "Apple",
                ].includes(headerText)
            ) {
                currentFilter = { platforms: headerText };
            } else if (
                ["Action", "Adventure", "RPG", "Strategy", "Sport"].includes(
                    headerText
                )
            ) {
                currentFilter = { genres: headerText };
            } else if (
                ["Popular in 2025", "All Time", "Recently Added"].includes(
                    headerText
                )
            ) {
                currentFilter = { timeframe: headerText };
            }
        }

        // Calculate offset for pagination (skip already loaded items)
        const offset = (currentPage - 1) * 12;

        // Fetch additional games
        const games = await fetchFilteredGamesWithOffset(
            currentFilter,
            12,
            offset
        );

        // Display the new games
        appendGames(games);
    } catch (error) {
        console.error("Error loading more games:", error);
        // Show error message
        const container = document.querySelector(".load-more-container");
        if (container) {
            container.innerHTML =
                '<div class="load-error">Failed to load more games. <button class="retry-btn">Try Again</button></div>';
            document
                .querySelector(".retry-btn")
                ?.addEventListener("click", () => {
                    container.innerHTML = "";
                    setupLoadMoreButton();
                    loadMoreGames();
                });
        }
    } finally {
        isLoading = false;
        document.getElementById("loading")?.classList.add("hidden");
        // Reset button state
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML =
                '<i class="fa fa-refresh"></i> Load More Games';
        }
    }
}

/**
 * Fetches games with an offset for pagination
 * @param {Object} filterParams - Filter parameters
 * @param {number} limit - Number of games to fetch
 * @param {number} offset - Number of games to skip
 * @returns {Promise<Array>} Array of games
 */
async function fetchFilteredGamesWithOffset(
    filterParams = {},
    limit = 12,
    offset = 0
) {
    try {
        // Build the API URL with appropriate query parameters
        let apiUrl = `${API_URL}/api/games?limit=${limit}&offset=${offset}`;

        // Add platform filter
        if (filterParams.platforms) {
            apiUrl += `&platforms=${encodeURIComponent(filterParams.platforms)}`;
        }

        // Add genre/category filter
        if (filterParams.genres) {
            apiUrl += `&genres=${encodeURIComponent(filterParams.genres)}`;
        }

        // Add sorting options
        if (filterParams.sort) {
            apiUrl += `&sort=${encodeURIComponent(filterParams.sort)}`;
        }

        // Add timeframe filters
        if (filterParams.timeframe) {
            apiUrl += `&timeframe=${encodeURIComponent(filterParams.timeframe)}`;
        }

        // Add year filter
        if (filterParams.year) {
            apiUrl += `&year=${encodeURIComponent(filterParams.year)}`;
        }

        console.log(`LoadMore: Fetching additional games from: ${apiUrl}`);

        // Make the API call
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error("Error fetching more games:", error);
        throw error;
    }
}

/**
 * Appends additional games to the existing games grid
 * @param {Array} games - Array of game objects from API
 */
function appendGames(games) {
    const gamesGrid = document.querySelector(".games-grid");
    if (!gamesGrid) return;

    // Handle case with no more games
    if (!games || games.length === 0) {
        const loadMoreContainer = document.querySelector(
            ".load-more-container"
        );
        if (loadMoreContainer) {
            loadMoreContainer.innerHTML =
                '<div class="no-more-games">No more games to display</div>';
        }
        return;
    }

    // Generate cards for each additional game
    games.forEach((game) => {
        // Get cover URL with special cases for certain games
        let coverUrl;
        if (
            game.name?.toLowerCase().includes("grand theft auto v") ||
            game.name?.toLowerCase().includes("gta v") ||
            game.name?.toLowerCase().includes("gta 5")
        ) {
            coverUrl = "../assets/images/gta5.webp";
        } else {
            // Use default IGDB cover for other games
            coverUrl = game.cover?.url
                ? game.cover.url
                      .replace("t_thumb", "t_720p")
                      .replace("t_cover_big", "t_720p")
                      .replace("t_cover_big_2x", "t_720p")
                      .replace("http:", "https:")
                : "../assets/images/placeholder-game.webp";
        }

        // Get platform icons and price (reusing existing functionality)
        const platforms = getPlatformIcons(game.platforms);
        const price = generateRandomPrice();

        // Create and append the game card (reusing existing functionality)
        const gameCard = createGameCard(
            game,
            coverUrl,
            platforms,
            price,
            addItemToCart
        );
        gamesGrid.appendChild(gameCard);
    });
}

function setupLoadMoreButton() {
    const gamesGrid = document.querySelector(".games-grid");
    if (!gamesGrid) return;

    // Remove any existing load more container
    const existingContainer = document.querySelector(".load-more-container");
    if (existingContainer) existingContainer.remove();

    const container = document.createElement("div");
    container.className = "load-more-container";

    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.className = "load-more-btn";
    loadMoreBtn.innerHTML = '<i class="fa fa-refresh"></i> Load More Games';
    loadMoreBtn.addEventListener("click", loadMoreGames);

    container.appendChild(loadMoreBtn);

    // Insert after games grid
    gamesGrid.parentNode.insertBefore(container, gamesGrid.nextSibling);
}

/**
 * Shows detailed view for a game with smooth transitions
 * @param {Object} game - Game data object
 * @param {string} coverUrl - URL for the game cover image
 * @param {string} platforms - HTML for platform icons
 * @param {string} price - Formatted price string
 */
function showGameDetails(game, coverUrl, platforms, price) {
    // Store current scroll position
    window.gameGridScrollPosition = window.scrollY;

    // Force scroll to top with multiple approaches for cross-browser compatibility
    window.scrollTo(0, 0);
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera

    // Ensure scroll happens even if DOM updates are delaying it
    setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }, 10);

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

    // Step 2: After elements have faded out, create and prepare the details view
    setTimeout(() => {
        // Hide elements completely
        if (gamesGrid) gamesGrid.style.display = "none";
        if (loadMoreContainer) loadMoreContainer.style.display = "none";
        if (currentSection) currentSection.style.display = "none";
        if (dropdownMenu) dropdownMenu.style.display = "none";
        if (chooseYearBtn) chooseYearBtn.style.display = "none";

        // Create game details container if it doesn't exist
        let detailsContainer = document.getElementById(
            "game-details-container"
        );
        if (!detailsContainer) {
            detailsContainer = document.createElement("div");
            detailsContainer.id = "game-details-container";
            document
                .querySelector(".main-content")
                .appendChild(detailsContainer);
        }

        // Adjust the main content margin for full-width display
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
            window.originalMainContentMargin = mainContent.style.marginLeft;
            mainContent.style.marginLeft = "0";
        }

        // Get screenshots or use placeholder
        const screenshots = game.screenshots || [];
        const screenshotHtml =
            screenshots.length > 0
                ? screenshots
                      .map(
                          (s) =>
                              `<div class="screenshot"><img src="${escapeHTML(s.url.replace("t_thumb", "t_1080p").replace("http:", "https:"))}" alt="Screenshot"></div>`
                      )
                      .join("")
                : `<div class="screenshot"><img src="${escapeHTML(coverUrl)}" alt="Cover"></div>`;

        // Get formatted release date
        let releaseDate = "Unknown release date";
        if (game.first_release_date) {
            const date = new Date(game.first_release_date * 1000);
            releaseDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        }

        // Construct HTML for game details
        detailsContainer.innerHTML = `
        <div class="game-details-container">
            <div class="game-details-header">
                <button class="back-to-games">
                    <i class="fa fa-arrow-left"></i> Back to Games
                </button>
                <h1>${escapeHTML(game.name || "Game Details")}</h1>
            </div>

            <div class="game-details-content">
                <div class="game-screenshots-container">
                    <div class="screenshots-nav prev">
                        <i class="fa fa-chevron-left"></i>
                    </div>
                    <div class="screenshots-wrapper">
                        ${screenshotHtml}
                    </div>
                    <div class="screenshots-nav next">
                        <i class="fa fa-chevron-right"></i>
                    </div>
                </div>

                <div class="game-info-container">
                    <div class="game-info-header">
                        <div class="game-platforms">${platforms}</div>
                        <div class="game-meta">
                            <div class="game-rating">
                                ${game.age_rating_string ? `<span class="age-rating">${escapeHTML(game.age_rating_string)}</span>` : ""}
                                ${game.total_rating ? `<span class="score-rating">${Math.round(game.total_rating)}%</span>` : ""}
                            </div>
                            <div class="game-release-date">${escapeHTML(releaseDate)}</div>
                        </div>
                    </div>

                    <div class="game-description">
                        <p>${escapeHTML(game.summary || "No description available.")}</p>
                    </div>

                    <div class="game-purchase">
                        <div class="game-price">£${escapeHTML(price)}</div>
                        <button class="add-to-cart-btn">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        // Make the details container visible but without the visible class yet
        detailsContainer.style.display = "block";

        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;

        // Add a more aggressive scroll approach for mobile
        if (window.innerWidth <= 768) {
            document
                .querySelector(".main-content")
                .scrollIntoView({ block: "start", inline: "nearest" });

            // Double-ensure scroll with repeated attempts for stubborn mobile browsers
            const forceScrollInterval = setInterval(() => {
                window.scrollTo(0, 0);
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
            }, 100);

            // Stop the interval after a second
            setTimeout(() => clearInterval(forceScrollInterval), 1000);
        }

        // Add event listeners for the back button
        document
            .querySelector(".back-to-games")
            .addEventListener("click", hideGameDetails);

        // Add event listener for the Add to Cart button in the details view
        const addToCartBtn = detailsContainer.querySelector(".add-to-cart-btn");
        if (addToCartBtn) {
            addToCartBtn.addEventListener("click", () => {
                // Create a temporary game card object to leverage existing add to cart functionality
                const tempCard = {
                    querySelector: (selector) => {
                        if (selector === ".game-title")
                            return { textContent: game.name };
                        if (selector === ".price")
                            return { textContent: price };
                        if (selector === ".game-image")
                            return { src: coverUrl };
                        return null;
                    },
                };

                if (typeof window.addItemToCart === "function") {
                    window.addItemToCart(tempCard);
                }
            });
        }

        // Setup screenshot navigation
        setupScreenshotNavigation();

        // Step 3: Fade in the details view after a short delay
        setTimeout(() => {
            detailsContainer.classList.add("visible");
        }, 50);
    }, 300); // Match the CSS transition duration

    setTimeout(() => {
        footer.style.display = "block";
        footer.classList.remove("fade-out");
    }, 600); // Match the CSS transition duration
}

/**
 * Hides game details and shows the games grid with smooth transitions
 */
function hideGameDetails() {
    // Get elements for animation
    const detailsContainer = document.getElementById("game-details-container");
    const sideNav = document.querySelector(".side-nav");
    const gamesGrid = document.querySelector(".games-grid");
    const loadMoreContainer = document.querySelector(".load-more-container");
    const currentSection = document.getElementById("current-section");
    const dropdownMenu = document.querySelector(".dropdown-menu");
    const chooseYearBtn = document.querySelector(".choose-year-btn-container");
    const hamburgerMenu = document.querySelector(".hamburger-menu");

    // Step 1: Fade out the details view
    if (detailsContainer) detailsContainer.classList.remove("visible");

    // Step 2: After details have faded out, prepare to fade in grid elements
    setTimeout(() => {
        if (detailsContainer) detailsContainer.style.display = "none";

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

            // Restore previous scroll position with smooth behavior
            if (window.gameGridScrollPosition) {
                window.scrollTo({
                    top: window.gameGridScrollPosition,
                    behavior: "smooth",
                });
            }
        }, 50);
    }, 300); // Match the CSS transition duration
}

/**
 * Sets up navigation for screenshots in the game details view
 */
function setupScreenshotNavigation() {
    const container = document.querySelector(".screenshots-wrapper");
    const prevBtn = document.querySelector(".screenshots-nav.prev");
    const nextBtn = document.querySelector(".screenshots-nav.next");

    if (!container || !prevBtn || !nextBtn) return;

    const screenshots = container.querySelectorAll(".screenshot");
    if (screenshots.length <= 1) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
        return;
    }

    let currentIndex = 0;

    // Handle visibility of nav buttons
    const updateNavButtons = () => {
        prevBtn.style.opacity = currentIndex === 0 ? "0.5" : "1";
        nextBtn.style.opacity =
            currentIndex === screenshots.length - 1 ? "0.5" : "1";
    };

    // Navigate to specific screenshot
    const goToScreenshot = (index) => {
        if (index < 0 || index >= screenshots.length) return;
        currentIndex = index;
        container.scrollTo({
            left: screenshots[index].offsetLeft,
            behavior: "smooth",
        });
        updateNavButtons();
    };

    // Handle click events
    prevBtn.addEventListener("click", () => goToScreenshot(currentIndex - 1));
    nextBtn.addEventListener("click", () => goToScreenshot(currentIndex + 1));

    // Handle scroll events
    container.addEventListener("scroll", () => {
        const scrollPosition = container.scrollLeft;
        // Find closest screenshot to determine current index
        let closestIndex = 0;
        let minDistance = Infinity;

        screenshots.forEach((screenshot, index) => {
            const distance = Math.abs(screenshot.offsetLeft - scrollPosition);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        currentIndex = closestIndex;
        updateNavButtons();
    });

    // Initialize
    updateNavButtons();
}

// Make the showGameDetails function available globally
window.showGameDetails = showGameDetails;

/**
 * @listens DOMContentLoaded
 * @description Initializes the marketplace when the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", async () => {
    initializeMarketplace();

    // Check if choose-year-btn-container exists, if not create it
    let chooseYearBtnContainer = document.querySelector(
        ".choose-year-btn-container"
    );
    if (!chooseYearBtnContainer) {
        // Get the element to insert after (the dropdown menu)
        const dropdownMenu = document.querySelector(".dropdown-menu");
        if (dropdownMenu) {
            // Create the container and button
            chooseYearBtnContainer = document.createElement("div");
            chooseYearBtnContainer.className = "choose-year-btn-container";
            chooseYearBtnContainer.style.display = "none"; // Hidden by default

            chooseYearBtnContainer.innerHTML = `
                <button id="choose-year-btn" class="choose-year-btn">
                    <i class="fa fa-calendar"></i>
                    Choose a Year
                </button>
            `;

            // Insert after dropdown menu
            dropdownMenu.parentNode.insertBefore(
                chooseYearBtnContainer,
                dropdownMenu.nextSibling
            );
        }
    }

    // Load initial games using the GameDisplayService
    loadGames({ timeframe: "Popular in 2025" }, 24, false, addItemToCart);

    // Setup the choose year button click handler (now working with possibly newly created button)
    const chooseYearBtn = document.getElementById("choose-year-btn");
    if (chooseYearBtn) {
        chooseYearBtn.addEventListener("click", () => {
            const yearPickerModal =
                document.getElementById("year-picker-modal");
            if (yearPickerModal) {
                yearPickerModal.classList.remove("hidden");
            }
        });
    }

    // Initialize components in the correct order to avoid event handler conflicts
    initializeYearPicker();
    setupFilterButtonHandlers();
    setupLoadMoreButton();
    initializeMobileMenu();
    setSelectedNavItem();
    updateCartCount();
    initializeSearchBar();

    const brandContainer = document.querySelector(".brand-container");
    if (brandContainer) {
        brandContainer.addEventListener("click", handleBrandClick);
    }
    window.addItemToCart = addItemToCart;
});
