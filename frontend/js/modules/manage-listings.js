import { showToast } from "../utils/toast.js";
import { escapeHTML } from "../utils/sanitise.js";
import supabase from "../supabase-client.js";

document.addEventListener("DOMContentLoaded", async function() {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Show auth modal and return
        document.getElementById("auth-modal").classList.remove("hidden");
        return;
    }

    // Initialize page
    await loadUserListings();
    setupEventListeners();

    /**
     * Loads all game listings created by the current user
     */
    async function loadUserListings() {
        try {
            // Show loading indicator
            document.getElementById("loading").classList.remove("hidden");

            // Get current user ID
            const userId = session.user.id;

            // Fetch user's game listings from Supabase
            const { data: listings, error } = await supabase
                .from("game_listings")
                .select(`
                    *,
                    game_screenshots(id, screenshot_url)
                `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Update statistics
            document.getElementById("total-listings").textContent = listings.length;
            document.getElementById("active-listings").textContent = listings.length; // In the future, you can add status field

            // Display either listings or no-listings message
            if (listings.length === 0) {
                document.getElementById("no-listings-message").classList.remove("hidden");
                document.querySelector(".listings-container").classList.add("hidden");
            } else {
                document.getElementById("no-listings-message").classList.add("hidden");
                document.querySelector(".listings-container").classList.remove("hidden");

                // Render listings in the table
                renderListings(listings);
            }
        } catch (error) {
            console.error("Error loading listings:", error);
            showToast("Failed to load your listings. Please try again.", "error");
        } finally {
            // Hide loading indicator
            document.getElementById("loading").classList.add("hidden");
        }
    }

    /**
     * Renders the listings in the table
     * @param {Array} listings - Array of user's game listings
     */
    function renderListings(listings) {
        const tableBody = document.getElementById("listings-table-body");
        tableBody.innerHTML = "";

        listings.forEach(listing => {
            const row = document.createElement("tr");
            row.dataset.listingId = listing.id;

            // Format date
            const createdDate = new Date(listing.created_at);
            const formattedDate = createdDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });

            // Create row content
            row.innerHTML = `
                <td>
                    <img src="${escapeHTML(listing.cover_image)}" alt="${escapeHTML(listing.title)}" class="listing-cover">
                </td>
                <td class="listing-details">
                    <span class="listing-title">${escapeHTML(listing.title)}</span>
                    <p class="listing-description">${escapeHTML(listing.description || "No description provided")}</p>
                    <span class="listing-date">Listed on ${formattedDate}</span>
                </td>
                <td class="listing-price">£${parseFloat(listing.price).toFixed(2)}</td>
                <td>
                    <span class="listing-status status-active">Active</span>
                </td>
                <td class="listing-actions">
                    <button class="action-btn edit-btn" title="Edit listing">
                        <i class="fa fa-pencil"></i>
                    </button>
                    <button class="action-btn view-btn" title="View in marketplace">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete listing">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    /**
     * Sets up event listeners for the page
     */
    function setupEventListeners() {
        // Table action buttons
        const tableBody = document.getElementById("listings-table-body");
        tableBody.addEventListener("click", handleTableActions);

        // Edit modal
        const editForm = document.getElementById("edit-listing-form");
        editForm.addEventListener("submit", handleEditFormSubmit);

        // Close edit modal buttons
        const closeEditButtons = document.querySelectorAll(".close-modal, .close-edit-modal");
        closeEditButtons.forEach(button => {
            button.addEventListener("click", closeEditModal);
        });

        // Delete confirmation buttons
        const closeDeleteButtons = document.querySelectorAll(".close-delete-modal");
        closeDeleteButtons.forEach(button => {
            button.addEventListener("click", closeDeleteModal);
        });

        const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
        confirmDeleteBtn.addEventListener("click", confirmDeleteListing);

        // Image preview for edit form
        document.getElementById("edit-cover-image").addEventListener("change", previewCoverImage);
        document.getElementById("edit-screenshots").addEventListener("change", previewScreenshots);
    }

    /**
     * Handles clicks on action buttons in the listings table
     * @param {Event} e - Click event
     */
    async function handleTableActions(e) {
        const target = e.target.closest(".action-btn");
        if (!target) return;

        const row = target.closest("tr");
        const listingId = row.dataset.listingId;

        if (target.classList.contains("edit-btn") || target.querySelector(".fa-pencil")) {
            await openEditModal(listingId);
        } else if (target.classList.contains("delete-btn") || target.querySelector(".fa-trash")) {
            openDeleteModal(listingId);
        } else if (target.classList.contains("view-btn") || target.querySelector(".fa-eye")) {
            // Redirect to marketplace with a filter for this specific game
            window.location.href = `marketplace.html?timeframe=Community%20Games&listing=${listingId}`;
        }
    }

    /**
     * Opens the edit modal for a specific listing
     * @param {string} listingId - ID of the listing to edit
     */
    async function openEditModal(listingId) {
        try {
            // Show loading indicator
            document.getElementById("loading").classList.remove("hidden");

            // Fetch listing data
            const { data: listing, error } = await supabase
                .from("game_listings")
                .select(`
                    *,
                    game_screenshots(id, screenshot_url)
                `)
                .eq("id", listingId)
                .single();

            if (error) throw error;

            // Populate form fields
            document.getElementById("edit-listing-id").value = listing.id;
            document.getElementById("edit-title").value = listing.title;
            document.getElementById("edit-description").value = listing.description || "";
            document.getElementById("edit-price").value = listing.price;

            if (listing.release_date) {
                // Format date for input (YYYY-MM-DD)
                const releaseDate = new Date(listing.release_date);
                const formattedDate = releaseDate.toISOString().split("T")[0];
                document.getElementById("edit-release-date").value = formattedDate;
            } else {
                document.getElementById("edit-release-date").value = "";
            }

            // Show cover image preview
            const coverPreview = document.getElementById("edit-cover-preview");
            coverPreview.innerHTML = `
                <img src="${listing.cover_image}" alt="Cover image" class="preview-image">
            `;

            // Show screenshots preview
            const screenshotsPreview = document.getElementById("edit-screenshots-preview");
            screenshotsPreview.innerHTML = "";

            if (listing.game_screenshots && listing.game_screenshots.length > 0) {
                listing.game_screenshots.forEach(screenshot => {
                    screenshotsPreview.innerHTML += `
                        <img src="${screenshot.screenshot_url}" alt="Screenshot" class="preview-image" data-id="${screenshot.id}">
                    `;
                });
            }

            // Show the modal
            document.getElementById("edit-listing-modal").classList.remove("hidden");

        } catch (error) {
            console.error("Error loading listing for edit:", error);
            showToast("Failed to load listing details.", "error");
        } finally {
            // Hide loading indicator
            document.getElementById("loading").classList.add("hidden");
        }
    }

    /**
     * Closes the edit modal
     */
    function closeEditModal() {
        document.getElementById("edit-listing-modal").classList.add("hidden");
        document.getElementById("edit-listing-form").reset();
        document.getElementById("edit-cover-preview").innerHTML = "";
        document.getElementById("edit-screenshots-preview").innerHTML = "";
    }

    /**
     * Opens the delete confirmation modal
     * @param {string} listingId - ID of the listing to delete
     */
    function openDeleteModal(listingId) {
        // Store the listing ID for deletion
        document.getElementById("confirm-delete-btn").dataset.listingId = listingId;
        document.getElementById("delete-confirmation-modal").classList.remove("hidden");
    }

    /**
     * Closes the delete confirmation modal
     */
    function closeDeleteModal() {
        document.getElementById("delete-confirmation-modal").classList.add("hidden");
    }

    /**
     * Handles the submission of the edit form
     * @param {Event} e - Submit event
     */
    async function handleEditFormSubmit(e) {
        e.preventDefault();

        try {
            // Show loading indicator
            document.getElementById("loading").classList.remove("hidden");

            const listingId = document.getElementById("edit-listing-id").value;
            const title = document.getElementById("edit-title").value;
            const description = document.getElementById("edit-description").value;
            const price = document.getElementById("edit-price").value;
            const releaseDate = document.getElementById("edit-release-date").value;

            const coverImageFile = document.getElementById("edit-cover-image").files[0];
            const screenshotFiles = document.getElementById("edit-screenshots").files;

            // Prepare update data
            const updateData = {
                title,
                description,
                price,
                updated_at: new Date().toISOString()
            };

            if (releaseDate) {
                updateData.release_date = releaseDate;
            }

            // Upload new cover image if selected
            if (coverImageFile) {
                const coverImageUrl = await uploadFile(coverImageFile, "covers");
                updateData.cover_image = coverImageUrl;
            }

            // Update the listing in the database
            const { error: updateError } = await supabase
                .from("game_listings")
                .update(updateData)
                .eq("id", listingId);

            if (updateError) throw updateError;

            // Upload new screenshots if selected
            if (screenshotFiles.length > 0) {
                // First, delete existing screenshots
                await supabase
                    .from("game_screenshots")
                    .delete()
                    .eq("game_listing_id", listingId);

                // Upload new screenshots
                for (let i = 0; i < screenshotFiles.length; i++) {
                    const screenshotUrl = await uploadFile(screenshotFiles[i], "screenshots");

                    // Insert new screenshot
                    await supabase
                        .from("game_screenshots")
                        .insert({
                            game_listing_id: listingId,
                            screenshot_url: screenshotUrl
                        });
                }
            }

            // Close modal and refresh listings
            closeEditModal();
            await loadUserListings();

            showToast("Game listing updated successfully", "success");

        } catch (error) {
            console.error("Error updating listing:", error);
            showToast("Failed to update listing. Please try again.", "error");
        } finally {
            // Hide loading indicator
            document.getElementById("loading").classList.add("hidden");
        }
    }

    /**
     * Uploads a file to Supabase storage
     * @param {File} file - The file to upload
     * @param {string} folder - The folder name in storage
     * @returns {Promise<string>} - The URL of the uploaded file
     */
    async function uploadFile(file, folder) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            // Upload the file
            const { data, error } = await supabase.storage
                .from('game-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('game-assets')
                .getPublicUrl(filePath);

            return urlData.publicUrl;

        } catch (error) {
            console.error(`Error uploading ${folder} file:`, error);
            throw error;
        }
    }

    /**
     * Confirms and executes the deletion of a listing
     */
    async function confirmDeleteListing() {
        try {
            // Show loading indicator
            document.getElementById("loading").classList.remove("hidden");

            const listingId = document.getElementById("confirm-delete-btn").dataset.listingId;

            // First get the listing to get screenshot info
            const { data: listing, error: fetchError } = await supabase
                .from("game_listings")
                .select(`
                    *,
                    game_screenshots(id, screenshot_url)
                `)
                .eq("id", listingId)
                .single();

            if (fetchError) throw fetchError;

            // Delete all screenshots from the database (cascade will handle this)
            // Delete the listing (this will cascade delete the screenshots)
            const { error: deleteError } = await supabase
                .from("game_listings")
                .delete()
                .eq("id", listingId);

            if (deleteError) throw deleteError;

            // We would also delete files from storage here, but for simplicity
            // we'll skip that step for now since it requires more complex
            // permissions in Supabase

            // Close modal and refresh listings
            closeDeleteModal();
            await loadUserListings();

            showToast("Game listing deleted successfully", "success");

        } catch (error) {
            console.error("Error deleting listing:", error);
            showToast("Failed to delete listing. Please try again.", "error");
        } finally {
            // Hide loading indicator
            document.getElementById("loading").classList.add("hidden");
        }
    }

    /**
     * Redirects to the marketplace with a filter for the selected game
     * @param {string} listingId - ID of the listing to view
     */
    function viewInMarketplace(listingId) {
        // Redirect to marketplace with a query parameter to highlight this game
        window.location.href = `marketplace.html?listing=${listingId}`;
    }
    /**
     * Previews the selected cover image
     * @param {Event} e - Change event
     */
    function previewCoverImage(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const coverPreview = document.getElementById("edit-cover-preview");
            coverPreview.innerHTML = `
                <img src="${e.target.result}" alt="Cover preview" class="preview-image">
            `;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Previews the selected screenshots
     * @param {Event} e - Change event
     */
    function previewScreenshots(e) {
        const files = e.target.files;
        if (!files.length) return;

        const screenshotsPreview = document.getElementById("edit-screenshots-preview");
        screenshotsPreview.innerHTML = "";

        for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.onload = function(e) {
                screenshotsPreview.innerHTML += `
                    <img src="${e.target.result}" alt="Screenshot preview" class="preview-image">
                `;
            };
            reader.readAsDataURL(files[i]);
        }
    }
});
