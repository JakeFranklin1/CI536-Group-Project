document.addEventListener("DOMContentLoaded", () => {
    const dropdownBtn = document.querySelector(".dropdown-btn");
    const dropdownMenu = document.querySelector(".dropdown-menu");
    const filterChoice = document.getElementById("filter-choice");

    // Set default sort
    let currentSort = "popular";
    sortGames(currentSort);
    highlightSelected(currentSort); // Highlight the default selection

    // Toggle dropdown
    dropdownBtn.addEventListener("click", () => {
        dropdownMenu.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (!dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove("active");
        }
    });

    // Handle sort selection
    const dropdownButtons = document.querySelectorAll(
        ".dropdown-content button"
    );
    dropdownButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            const sortType = e.target.dataset.sort;
            const sortText = e.target.textContent;

            // Update filter choice text
            filterChoice.textContent = sortText;

            // Update sort and close dropdown
            currentSort = sortType;
            sortGames(currentSort);
            highlightSelected(currentSort); // Highlight the selected option
            dropdownMenu.classList.remove("active");
        });
    });

    function highlightSelected(sortType) {
        const dropdownButtons = document.querySelectorAll(
            ".dropdown-content button"
        );
        dropdownButtons.forEach((button) => {
            const checkmark = button.querySelector("i.fa-check");
            if (button.dataset.sort === sortType) {
                checkmark.classList.remove("hidden");
            } else {
                checkmark.classList.add("hidden");
            }
        });
    }
});

function sortGames(sortType) {
    console.log("Sorting by:", sortType);
}
