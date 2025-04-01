import { showToast } from "../utils/toast.js";
import { escapeHTML } from "../utils/sanitise.js";

/**
 * Initializes the review system for a specific game
 * @param {Object} game - Game data object
 * @param {HTMLElement} container - Container element for reviews
 */
export function initializeReviewSystem(game, container) {
    if (!container) return;

    // Set up star rating functionality
    const starRating = container.querySelector('.star-rating');
    if (starRating) {
        setupStarRating(starRating, game);
    }
}

/**
 * Sets up star rating functionality
 * @param {HTMLElement} starRating - Star rating container
 * @param {Object} game - Game object
 */
function setupStarRating(starRating, game) {
    const stars = starRating.querySelectorAll('i');
    let selectedRating = 0;

    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(stars, rating);
        });

        star.addEventListener('mouseout', function() {
            highlightStars(stars, selectedRating);
        });

        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            highlightStars(stars, selectedRating);
        });
    });

    // Submit review button handler
    const submitReviewBtn = starRating.closest('.write-review').querySelector('.submit-review-btn');
    const reviewTextarea = starRating.closest('.write-review').querySelector('.review-text');

    if (submitReviewBtn && reviewTextarea) {
        submitReviewBtn.addEventListener('click', () => {
            if (selectedRating === 0) {
                showToast('Please select a rating', 'error');
                return;
            }

            if (!reviewTextarea.value.trim()) {
                showToast('Please write a review', 'error');
                return;
            }

            // Mock adding the review (would connect to database in real implementation)
            addUserReview(game.name, selectedRating, reviewTextarea.value);

            // Reset form
            reviewTextarea.value = '';
            selectedRating = 0;
            highlightStars(stars, 0);

            showToast('Review submitted successfully!', 'success');
        });
    }
}

/**
 * Helper function to highlight stars based on rating
 * @param {NodeList} stars - Collection of star elements
 * @param {number} rating - Rating value (1-5)
 */
function highlightStars(stars, rating) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('fa-star-o');
            star.classList.add('fa-star');
        } else {
            star.classList.remove('fa-star');
            star.classList.add('fa-star-o');
        }
    });
}

/**
 * Mock function to add a user review (would be replaced with API call later)
 * @param {string} gameName - Name of the game
 * @param {number} rating - User rating (1-5)
 * @param {string} reviewText - Review content
 */
export function addUserReview(gameName, rating, reviewText) {
    console.log('Review submitted:', {
        game: gameName,
        rating: rating,
        review: reviewText,
        date: new Date().toISOString()
    });

    // Mock adding the review to the UI
    const reviewsList = document.querySelector('.reviews-list');
    if (reviewsList) {
        const newReview = document.createElement('div');
        newReview.className = 'review-item';

        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // Generate star HTML
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<i class="fa fa-${i <= rating ? 'star' : 'star-o'}"></i>`;
        }

        newReview.innerHTML = `
            <div class="review-header">
                <div class="reviewer-name">You</div>
                <div class="review-date">${formattedDate}</div>
                <div class="reviewer-rating">
                    ${starsHtml}
                </div>
            </div>
            <div class="review-content">
                ${escapeHTML(reviewText)}
            </div>
        `;

        // Add to the beginning of the list
        reviewsList.insertBefore(newReview, reviewsList.firstChild);
    }
}

/**
 * Renders HTML for game reviews section
 * @param {Object} game - Game data
 * @returns {string} - HTML for reviews section
 */
export function renderReviewsHTML(game) {
    return `
        <div class="game-reviews">
            <h3>Player Reviews</h3>
            <div class="reviews-summary">
                <div class="average-rating">4.2</div>
                <div class="rating-stars">
                    <i class="fa fa-star"></i>
                    <i class="fa fa-star"></i>
                    <i class="fa fa-star"></i>
                    <i class="fa fa-star"></i>
                    <i class="fa fa-star-half-o"></i>
                </div>
                <div class="rating-count">Based on 24 reviews</div>
            </div>

            <div class="write-review">
                <h4>Write a Review</h4>
                <div class="rating-input">
                    <span>Your Rating:</span>
                    <div class="star-rating">
                        <i class="fa fa-star-o" data-rating="1"></i>
                        <i class="fa fa-star-o" data-rating="2"></i>
                        <i class="fa fa-star-o" data-rating="3"></i>
                        <i class="fa fa-star-o" data-rating="4"></i>
                        <i class="fa fa-star-o" data-rating="5"></i>
                    </div>
                </div>
                <textarea placeholder="Share your thoughts about this game..." class="review-text"></textarea>
                <button class="submit-review-btn">Submit Review</button>
            </div>

            <div class="reviews-list">
                <div class="review-item">
                    <div class="review-header">
                        <div class="reviewer-name">Sarah J.</div>
                        <div class="review-date">March 5, 2025</div>
                        <div class="reviewer-rating">
                            <i class="fa fa-star"></i>
                            <i class="fa fa-star"></i>
                            <i class="fa fa-star"></i>
                            <i class="fa fa-star"></i>
                            <i class="fa fa-star"></i>
                        </div>
                    </div>
                    <div class="review-content">
                        Absolutely incredible gameplay and story. One of the best games I've played this year!
                    </div>
                </div>

                <div class="review-item">
                    <div class="review-header">
                        <div class="reviewer-name">Alex M.</div>
                        <div class="review-date">February 22, 2025</div>
                        <div class="reviewer-rating">
                            <i class="fa fa-star"></i>
                            <i class="fa fa-star"></i>
                            <i class="fa fa-star"></i>
                            <i class="fa fa-star-o"></i>
                            <i class="fa fa-star-o"></i>
                        </div>
                    </div>
                    <div class="review-content">
                        Great graphics but the controls feel clunky at times. Story is decent but not groundbreaking.
                    </div>
                </div>
            </div>
        </div>
    `;
}
