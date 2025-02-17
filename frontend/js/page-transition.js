/**
 * @file page-transition.js
 * @description This file handles page transitions by adding fade-in and fade-out effects to the body element.
 */

document.addEventListener("DOMContentLoaded", () => {
    /**
     * @listens DOMContentLoaded
     * @description Adds the 'fade-in' class to the body element when the DOM is fully loaded.
     *              This triggers the initial fade-in animation.
     */
    document.body.classList.add("fade-in");

    /**
     * @constant {NodeList} links
     * @description A list of all anchor elements (`<a>`) in the document.
     */
    const links = document.querySelectorAll("a");

    /**
     * @function
     * @description Adds a click event listener to each link to handle page transitions.
     * @param {HTMLAnchorElement} link - The anchor element to attach the event listener to.
     */
    links.forEach((link) => {
        link.addEventListener("click", function (event) {
            /**
             * @param {Event} event - The click event object.
             */
            event.preventDefault(); // Prevent immediate navigation
            const targetURL = this.getAttribute("href");

            /**
             * @description Removes the 'fade-in' class and adds the 'fade-out' class to the body element.
             *              This triggers the fade-out animation.
             */
            document.body.classList.remove("fade-in");
            document.body.classList.add("fade-out");

            /**
             * @function setTimeout
             * @description Waits for the fade-out animation to complete before navigating to the target URL.
             * @param {function} - A function that navigates to the target URL.
             * @param {number} 300 - The duration of the fade-out animation in milliseconds (matches the CSS transition duration).
             */
            setTimeout(() => {
                window.location.href = targetURL;
            }, 300); // Match the CSS transition duration
        });
    });

    /**
     * @listens pageshow
     * @description Handles browser back/forward buttons to ensure proper fade-in animation when navigating back from the browser cache.
     * @param {PageTransitionEvent} event - The pageshow event object.
     */
    window.addEventListener("pageshow", function (event) {
        // If navigating back from browser cache
        if (event.persisted) {
            /**
             * @description Removes the 'fade-out' class and adds the 'fade-in' class to the body element.
             *              This triggers the fade-in animation when navigating back from the browser cache.
             */
            document.body.classList.remove("fade-out");
            document.body.classList.add("fade-in");
        }
    });
});
