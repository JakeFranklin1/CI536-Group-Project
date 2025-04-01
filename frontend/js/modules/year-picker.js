import { showToast } from "../utils/toast.js";
import { loadGames } from "../services/GameService.js";

/**
 * Initializes the year picker functionality
 */
export function initializeYearPicker() {
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

/**
 * Generates year buttons for all decades
 */
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

/**
 * Selects a specific game year and updates the UI
 * @param {string} year - The year to filter games by
 */
export function selectGameYear(year) {
    // Update the page header
    const currentSectionHeader = document.getElementById("current-section");
    if (currentSectionHeader) {
        currentSectionHeader.textContent = `Games from ${year}`;
    }

    // Create filter params
    const filterParams = { year: year };

    // Keep the choose year button visible
    const dropdownMenu = document.querySelector(".dropdown-menu");
    const chooseYearBtn = document.querySelector(".choose-year-btn-container");

    if (dropdownMenu) {
        dropdownMenu.style.display = "none";
    }
    if (chooseYearBtn) {
        chooseYearBtn.style.display = "flex";
    }

    // Load the games for that year
    loadGames(filterParams, 12, true, window.addItemToCart);

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

/**
 * Sets up the choose year button functionality
 */
export function setupYearPickerButton() {
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

    // Setup the choose year button click handler
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
}
