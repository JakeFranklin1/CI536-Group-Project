// import { showToast } from "../utils/toast.js";
import { escapeHTML } from "../utils/sanitise.js";
import { initializeReviewSystem, renderReviewsHTML } from "./reviews.js";

/**
 * Shows detailed view for a game with smooth transitions
 * @param {Object} game - Game data object
 * @param {string} coverUrl - URL for the game cover image
 * @param {string} platforms - HTML for platform icons
 * @param {string} price - Formatted price string
 */
export function showGameDetails(game, coverUrl, platforms, price) {
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

    let detailsContainer = document.getElementById("game-details-container");
    if (!detailsContainer) {
        detailsContainer = document.createElement("div");
        detailsContainer.id = "game-details-container";
        document.querySelector(".main-content").appendChild(detailsContainer);
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

    // Step 2: After elements have faded out, create and prepare the details view
    setTimeout(() => {
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

                    ${renderReviewsHTML(game)}
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

        // Initialize the review system
        initializeReviewSystem(game, detailsContainer);

        // Step 3: Fade in the details view after a short delay
        setTimeout(() => {
            detailsContainer.classList.add("visible");
        }, 50);
    }, 300); // Match the CSS transition duration

    setTimeout(() => {
        if (footer) {
            footer.style.display = "block";
            footer.classList.remove("fade-out");
        }
    }, 600); // Match the CSS transition duration
}

/**
 * Hides game details and shows the games grid with smooth transitions
 */
export function hideGameDetails() {
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
