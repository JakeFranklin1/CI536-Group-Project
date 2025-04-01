import { showToast } from "../utils/toast.js";
import { escapeHTML } from "../utils/sanitise.js";
import supabase from "../supabase-client.js";

/**
 * Initializes the review system for a specific game
 * @param {Object} game - Game data object
 * @param {HTMLElement} container - Container element for reviews
 */
export async function initializeReviewSystem(game, container) {
    if (!container) return;

    console.log("Initializing reviews for game ID:", game.id);
    const gameId = game.id;

    // Set up star rating functionality
    const starRating = container.querySelector(".star-rating");
    if (starRating) {
        setupStarRating(starRating, game, gameId);
    }

    // Load existing reviews from the database
    await loadGameReviews(gameId, container);
}

/**
 * Sets up star rating functionality
 * @param {HTMLElement} starRating - Star rating container
 * @param {Object} game - Game object
 * @param {string} gameUuid - Game UUID for database operations
 */
function setupStarRating(starRating, game, gameUuid) {
    const stars = starRating.querySelectorAll("i");
    let selectedRating = 0;

    stars.forEach((star) => {
        star.addEventListener("mouseover", function () {
            const rating = parseInt(this.dataset.rating);
            highlightStars(stars, rating);
        });

        star.addEventListener("mouseout", function () {
            highlightStars(stars, selectedRating);
        });

        star.addEventListener("click", function () {
            selectedRating = parseInt(this.dataset.rating);
            highlightStars(stars, selectedRating);
        });
    });

    // Submit review button handler
    const submitReviewBtn = starRating
        .closest(".write-review")
        .querySelector(".submit-review-btn");
    const reviewTextarea = starRating
        .closest(".write-review")
        .querySelector(".review-text");

    if (submitReviewBtn && reviewTextarea) {
        submitReviewBtn.addEventListener("click", async () => {
            if (selectedRating === 0) {
                showToast("Please select a rating", "error");
                return;
            }

            if (!reviewTextarea.value.trim()) {
                showToast("Please write a review", "error");
                return;
            }

            try {
                // Get current user session
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    showToast("You must be logged in to submit a review", "error");
                    return;
                }

                // Submit the review to the database using the UUID
                await addUserReview(
                    gameUuid, // Use the UUID format
                    session.user.id,
                    selectedRating,
                    reviewTextarea.value
                );

                // Reset form
                reviewTextarea.value = "";
                selectedRating = 0;
                highlightStars(stars, 0);

                // Reload reviews to show the new review
                await loadGameReviews(gameUuid, starRating.closest(".game-reviews"));

                showToast("Review submitted successfully!", "success");
            } catch (error) {
                console.error("Error submitting review:", error);
                showToast("Failed to submit review. Please try again.", "error");
            }
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
            star.classList.remove("fa-star-o");
            star.classList.add("fa-star");
        } else {
            star.classList.remove("fa-star");
            star.classList.add("fa-star-o");
        }
    });
}

/**
 * Adds a user review to the database
 * @param {string|number} gameId - ID of the game from IGDB
 * @param {string} userId - ID of the user
 * @param {number} rating - User rating (1-5)
 * @param {string} reviewText - Review content
 * @returns {Promise} - Promise that resolves when the review is added
 */
export async function addUserReview(gameId, userId, rating, reviewText) {
    try {
        console.log("Adding review with gameId:", gameId);

        const { data, error } = await supabase
            .from('game_reviews')
            .insert([
                {
                    game_id: gameId,
                    user_id: userId,
                    rating: rating,
                    review_text: reviewText
                }
            ]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error adding review to database:", error);
        throw error;
    }
}

/**
 * Loads game reviews from the database
 * @param {string} gameId - ID of the game (in UUID format)
 * @param {HTMLElement} container - Container element to update with reviews
 */
export async function loadGameReviews(gameId, container) {
    try {
        console.log("Loading reviews for gameId:", gameId);

        // Explicitly define the join relationship
        const { data: reviews, error } = await supabase
            .from('game_reviews')
            .select(`
                *,
                users!user_id (id, first_name, last_name, email)
            `)
            .eq('game_id', gameId)
            .order('date_of_review', { ascending: false });

        if (error) throw error;

        console.log("Reviews loaded:", reviews?.length || 0);

        // Calculate average rating
        let averageRating = 0;
        if (reviews && reviews.length > 0) {
            const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
            averageRating = (sum / reviews.length).toFixed(1);
        }

        // Update review summary
        updateReviewSummary(container, averageRating, reviews?.length || 0);

        // Update reviews list
        const reviewsList = container.querySelector(".reviews-list");
        if (reviewsList && reviews) {
            // Clear existing reviews except the write review form
            reviewsList.innerHTML = '';

            if (reviews.length === 0) {
                reviewsList.innerHTML = '<div class="no-reviews" style="color: white">No reviews yet. Be the first to review!</div>';
                return;
            }

            // Add each review to the list
            reviews.forEach(review => {
                const reviewElement = createReviewElement(review);
                reviewsList.appendChild(reviewElement);
            });
        }

    } catch (error) {
        console.error("Error loading reviews:", error);
        showToast("Failed to load reviews", "error");

        // Show error in the reviews list
        const reviewsList = container.querySelector(".reviews-list");
        if (reviewsList) {
            reviewsList.innerHTML = '<div class="error-message">Unable to load reviews. Please try again later.</div>';
        }
    }
}

/**
 * Creates a review element from review data
 * @param {Object} review - Review data from database
 * @returns {HTMLElement} - Review element
 */
function createReviewElement(review) {
    const reviewItem = document.createElement("div");
    reviewItem.className = "review-item";

    const formattedDate = new Date(review.date_of_review).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    // Generate star HTML
    const starsHtml = generateStarHTML(review.rating);

    // Get display name (use first_name and last_name, fallback to email)
    let displayName = "Anonymous";
    if (review.users) {
        if (review.users.first_name || review.users.last_name) {
            displayName = `${review.users.first_name || ""} ${review.users.last_name || ""}`.trim();
        } else if (review.users.email) {
            const email = review.users.email;
            const atIndex = email.indexOf('@');
            if (atIndex > 0) {
                displayName = email.substring(0, atIndex);
            }
        }
    }

    reviewItem.innerHTML = `
        <div class="review-header">
            <div class="reviewer-name">${escapeHTML(displayName)}</div>
            <div class="review-date">${formattedDate}</div>
            <div class="reviewer-rating">
                ${starsHtml}
            </div>
        </div>
        <div class="review-content">
            ${escapeHTML(review.review_text)}
        </div>
    `;

    return reviewItem;
}

/**
 * Updates the review summary section
 * @param {HTMLElement} container - The game reviews container
 * @param {number} averageRating - Average rating
 * @param {number} reviewCount - Number of reviews
 */
function updateReviewSummary(container, averageRating, reviewCount) {
    const summaryElement = container.querySelector(".reviews-summary");
    if (!summaryElement) return;

    const ratingElement = summaryElement.querySelector(".average-rating");
    const countElement = summaryElement.querySelector(".rating-count");
    const starsElement = summaryElement.querySelector(".rating-stars");

    if (ratingElement) ratingElement.textContent = averageRating || "0.0";
    if (countElement) countElement.textContent = `Based on ${reviewCount || 0} reviews`;
    if (starsElement && averageRating) {
        starsElement.innerHTML = generateStarHTML(parseFloat(averageRating));
    }
}

/**
 * Generates HTML for star ratings
 * @param {number} rating - Rating value
 * @returns {string} - HTML for stars
 */
function generateStarHTML(rating) {
    let starsHtml = "";
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Add full stars
    for (let i = 1; i <= fullStars; i++) {
        starsHtml += `<i class="fa fa-star"></i>`;
    }

    // Add half star if applicable
    if (hasHalfStar) {
        starsHtml += `<i class="fa fa-star-half-o"></i>`;
    }

    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 1; i <= emptyStars; i++) {
        starsHtml += `<i class="fa fa-star-o"></i>`;
    }

    return starsHtml;
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
                <div class="average-rating">0.0</div>
                <div class="rating-stars">
                    <i class="fa fa-star-o"></i>
                    <i class="fa fa-star-o"></i>
                    <i class="fa fa-star-o"></i>
                    <i class="fa fa-star-o"></i>
                    <i class="fa fa-star-o"></i>
                </div>
                <div class="rating-count">Based on 0 reviews</div>
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
                <!-- Reviews will be loaded here -->
                <div class="loading-reviews">Loading reviews...</div>
            </div>
        </div>
    `;
}
