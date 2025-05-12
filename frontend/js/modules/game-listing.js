import { showToast } from "../utils/toast.js";
import { escapeHTML } from "../utils/sanitise.js";
import supabase from "../supabase-client.js";

/**
 * Initializes the game listing form with dynamic functionality
 */
document.addEventListener("DOMContentLoaded", async function () {
    // Check authentication first
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "login.html"; // Redirect to login if not authenticated
        return;
    }

    // Initialize buckets
    await initializeStorageBuckets();

    // Form and step navigation elements
    const form = document.getElementById("game-listing-form");
    const steps = document.querySelectorAll(".form-step");
    const progressSteps = document.querySelectorAll(".progress-step");
    const nextBtns = document.querySelectorAll(".btn-next");
    const prevBtns = document.querySelectorAll(".btn-prev");

    // Current step tracking
    let currentStep = 1;

    // For storing uploaded files
    let coverImageFile = null;
    let screenshotFiles = [];
    let selectedPlatforms = [];

    // Initialize the form
    initFormNavigation();
    initImageUploads();
    initPlatformSelection();
    initFormSubmission();

    /**
     * Creates the necessary storage buckets if they don't exist
     */
    async function initializeStorageBuckets() {
        try {
            // Just check if we can access the bucket
            const { data, error } = await supabase.storage
                .from("game-assets")
                .list();

            if (error) {
                console.error("Error accessing storage bucket:", error);
                showToast(
                    "Unable to access storage. Please contact an administrator.",
                    "error"
                );
            }
        } catch (error) {
            console.error("Error checking storage buckets:", error);
            showToast(
                "There was an issue with storage configuration.",
                "error"
            );
        }
    }

    /**
     * Sets up form step navigation
     */
    function initFormNavigation() {
        nextBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                if (validateStep(currentStep)) {
                    if (currentStep === 3) {
                        populateReviewStep();
                    }
                    goToStep(currentStep + 1);
                }
            });
        });

        prevBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                goToStep(currentStep - 1);
            });
        });
    }

    function initPlatformSelection() {
        const platformContainer = document.getElementById("platform-selection");
        if (!platformContainer) return;

        platformContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("platform-btn")) {
                const button = e.target;
                const platform = button.dataset.platform;
                button.classList.toggle("selected");

                if (button.classList.contains("selected")) {
                    if (!selectedPlatforms.includes(platform)) {
                        selectedPlatforms.push(platform);
                    }
                } else {
                    selectedPlatforms = selectedPlatforms.filter(
                        (p) => p !== platform
                    );
                }

                const platformError = document.getElementById("platform-error");
                if (selectedPlatforms.length > 0) {
                    platformError.textContent = "";
                    platformError.style.display = "none";
                }
            }
        });
    }

    /**
     * Navigates to a specific step
     * @param {number} stepNumber - The step to navigate to
     */
    function goToStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > steps.length) {
            return;
        }

        // Update active step classes
        steps.forEach((step) => step.classList.remove("active"));
        progressSteps.forEach((step) => {
            step.classList.remove("active");

            const stepNum = parseInt(step.dataset.step);
            if (stepNum < stepNumber) {
                step.classList.add("completed");
            } else if (stepNum === stepNumber) {
                step.classList.add("active");
            } else {
                step.classList.remove("completed");
            }
        });

        // Show the target step
        document
            .querySelector(`.form-step[data-step="${stepNumber}"]`)
            .classList.add("active");
        currentStep = stepNumber;

        // Scroll to top of form
        document
            .querySelector(".form-container")
            .scrollIntoView({ behavior: "smooth" });
    }

    /**
     * Initializes image upload functionality
     */
    function initImageUploads() {
        // Cover image upload
        const coverInput = document.getElementById("cover-image");
        const coverUploadBox = document.querySelector(
            "#cover-upload-container .image-upload-box"
        );
        const coverPreview = document.getElementById("cover-preview");

        // Screenshot uploads
        const screenshotInput = document.getElementById("screenshots");
        const screenshotUploadBox = document.querySelector(
            "#screenshots-upload-container .image-upload-box"
        );
        const screenshotPreview = document.getElementById(
            "screenshots-preview"
        );

        // Cover image click handler
        coverUploadBox.addEventListener("click", () => {
            coverInput.click();
        });

        // Cover image change handler
        coverInput.addEventListener("change", (e) => {
            handleCoverImageUpload(e.target.files[0]);
        });

        // Screenshot click handler
        screenshotUploadBox.addEventListener("click", () => {
            screenshotInput.click();
        });

        // Screenshot change handler
        screenshotInput.addEventListener("change", (e) => {
            handleScreenshotUpload(e.target.files);
        });

        // Drag and drop for cover image
        setupDragDrop(coverUploadBox, (files) => {
            if (files.length > 0) {
                handleCoverImageUpload(files[0]);
            }
        });

        // Drag and drop for screenshots
        setupDragDrop(screenshotUploadBox, (files) => {
            handleScreenshotUpload(files);
        });
    }

    /**
     * Sets up drag and drop functionality for an element
     * @param {HTMLElement} element - The element to enable drag and drop on
     * @param {Function} callback - Function to call with the dropped files
     */
        function setupDragDrop(element, callback) {
        ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
            element.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ["dragenter", "dragover"].forEach((eventName) => {
            element.addEventListener(eventName, () => {
                element.classList.add("dragover");
            });
        });

        ["dragleave", "drop"].forEach((eventName) => {
            element.addEventListener(eventName, () => {
                element.classList.remove("dragover");
            });
        });

        element.addEventListener("drop", (e) => {
            const files = e.dataTransfer.files;
            callback(files);

            // Programmatically update the file input field for screenshots
            if (element.id === "screenshots-upload-container") {
                const screenshotInput = document.getElementById("screenshots");
                const dataTransfer = new DataTransfer();
                Array.from(files).forEach((file) => dataTransfer.items.add(file));
                screenshotInput.files = dataTransfer.files;
            }
        });
    }

    /**
     * Handles cover image upload and preview
     * @param {File} file - The uploaded cover image file
     */
        function handleCoverImageUpload(file) {
        if (!file) return;

        // Validate file
        if (!validateImageFile(file, "cover")) {
            return;
        }

        // Store file for later upload
        coverImageFile = file;

        // Programmatically update the file input field
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        document.getElementById("cover-image").files = dataTransfer.files;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewHtml = `
                <div class="cover-preview">
                    <img src="${e.target.result}" alt="Cover preview">
                    <button type="button" class="remove-image" data-type="cover">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
            `;
            document.getElementById("cover-preview").innerHTML = previewHtml;

            // Add remove handler
            document
                .querySelector('.remove-image[data-type="cover"]')
                .addEventListener("click", () => {
                    document.getElementById("cover-preview").innerHTML = "";
                    document.getElementById("cover-image").value = "";
                    coverImageFile = null;
                });
        };
        reader.readAsDataURL(file);
    }

    /**
     * Handles screenshot upload and preview
     * @param {FileList} fileList - The uploaded screenshot files
     */
    function handleScreenshotUpload(fileList) {
        if (!fileList || fileList.length === 0) return;

        // Convert FileList to Array for easier processing
        const files = Array.from(fileList);

        // Limit number of screenshots
        if (screenshotFiles.length + files.length > 5) {
            showToast("You can upload a maximum of 5 screenshots", "error");
            return;
        }

        // Process each file
        files.forEach((file) => {
            if (validateImageFile(file, "screenshot")) {
                // Store file for later upload
                screenshotFiles.push(file);

                // Create preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    const screenshotId = `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const previewHtml = `
                        <div class="screenshot-preview" id="${screenshotId}">
                            <img src="${e.target.result}" alt="Screenshot preview">
                            <button type="button" class="remove-image" data-screenshot-id="${screenshotId}">
                                <i class="fa fa-times"></i>
                            </button>
                        </div>
                    `;
                    document
                        .getElementById("screenshots-preview")
                        .insertAdjacentHTML("beforeend", previewHtml);

                    // Add remove handler
                    document
                        .querySelector(
                            `.remove-image[data-screenshot-id="${screenshotId}"]`
                        )
                        .addEventListener("click", (e) => {
                            const screenshotElement =
                                document.getElementById(screenshotId);
                            const index = Array.from(
                                screenshotElement.parentNode.children
                            ).indexOf(screenshotElement);

                            // Remove from DOM and array
                            screenshotElement.remove();
                            screenshotFiles.splice(index, 1);
                        });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    /**
     * Validates an uploaded image file
     * @param {File} file - The file to validate
     * @param {string} type - The type of image ('cover' or 'screenshot')
     * @returns {boolean} Whether the file is valid
     */
    function validateImageFile(file, type) {
        // Check file type
        if (!file.type.match("image.*")) {
            showToast(
                "Please upload image files only (JPEG, PNG, etc.)",
                "error"
            );
            return false;
        }

        // Check file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showToast("Image file too large. Maximum size is 5MB.", "error");
            return false;
        }

        return true;
    }

    /**
     * Validates the current form step
     * @param {number} step - The step number to validate
     * @returns {boolean} Whether the step is valid
     */
    function validateStep(step) {
        let isValid = true;

        document
            .querySelectorAll(`.form-step[data-step="${step}"] .error-message`)
            .forEach((el) => {
                el.textContent = "";
                el.style.display = "block";
            });

        if (step === 1) {
            const title = document.getElementById("game-title").value.trim();
            const description = document
                .getElementById("game-description")
                .value.trim();

            if (!title) {
                const errorEl = document.querySelector(
                    "#game-title + .error-message"
                );
                errorEl.textContent = "Game title is required";
                errorEl.style.display = "block";
                isValid = false;
            }

            if (!description) {
                const errorEl = document.querySelector(
                    "#game-description + .error-message"
                );
                errorEl.textContent = "Game description is required";
                errorEl.style.display = "block";
                isValid = false;
            }

            if (selectedPlatforms.length === 0) {
                const errorEl = document.getElementById("platform-error");
                errorEl.textContent = "At least one platform must be selected";
                errorEl.style.display = "block";
                isValid = false;
            }
        }

        // Step 2: Media
        else if (step === 2) {
            if (!coverImageFile) {
                const errorEl = document.querySelector(
                    "#cover-upload-container + .error-message"
                );
                errorEl.textContent = "Cover image is required";
                errorEl.style.display = "block";
                isValid = false;
            }
        }

        // Step 3: Pricing
        else if (step === 3) {
            const price = document.getElementById("game-price").value;

            if (!price || parseFloat(price) <= 0) {
                const errorEl = document.querySelector(
                    "#game-price + .error-message"
                );
                errorEl.textContent = "Please enter a valid price";
                errorEl.style.display = "block";
                isValid = false;
            }
        }

        return isValid;
    }

    /**
     * Populates the review step with form data
     */
    function populateReviewStep() {
        const title = document.getElementById("game-title").value;
        const description = document.getElementById("game-description").value;
        const releaseDate = document.getElementById("release-date").value;
        const price = document.getElementById("game-price").value;

        document.getElementById("preview-title").textContent = title;
        document.getElementById("preview-description").textContent =
            description;
        document.getElementById("preview-platforms").textContent =
            selectedPlatforms.join(", ") || "Not specified";
        document.getElementById("preview-release-date").textContent =
            releaseDate
                ? new Date(releaseDate).toLocaleDateString()
                : "Not specified";
        document.getElementById("preview-price").textContent =
            `£${parseFloat(price).toFixed(2)}`;

        // Show cover image preview
        if (coverImageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById("preview-cover").innerHTML = `
                    <img src="${e.target.result}" alt="Cover preview">
                `;
            };
            reader.readAsDataURL(coverImageFile);
        }

        // Show screenshot previews
        if (screenshotFiles.length > 0) {
            const previewScreenshots = document.getElementById(
                "preview-screenshots"
            );
            previewScreenshots.innerHTML = "";

            screenshotFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewScreenshots.insertAdjacentHTML(
                        "beforeend",
                        `
                        <img src="${e.target.result}" alt="Screenshot ${index + 1}">
                    `
                    );
                };
                reader.readAsDataURL(file);
            });
        }
    }

    /**
     * Initializes form submission
     */
    function initFormSubmission() {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!validateStep(4)) {
                return;
            }

            const submitBtn = document.querySelector(".btn-submit");
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML =
                '<i class="fa fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;

            document.getElementById("loading").classList.remove("hidden");

            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session) {
                    showToast("You must be logged in to list a game", "error");
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                    document.getElementById("loading").classList.add("hidden");
                    return;
                }

                const title = document.getElementById("game-title").value;
                const description =
                    document.getElementById("game-description").value;
                const releaseDate =
                    document.getElementById("release-date").value || null;
                const price = parseFloat(
                    document.getElementById("game-price").value
                );
                const platformsToSubmit = [...selectedPlatforms];

                const coverImagePath = await uploadFile(
                    coverImageFile,
                    "covers"
                );

                const { data: gameListing, error: gameError } = await supabase
                    .from("game_listings")
                    .insert([
                        {
                            user_id: session.user.id,
                            title: title,
                            description: description,
                            release_date: releaseDate,
                            cover_image: coverImagePath,
                            price: price,
                            platforms: platformsToSubmit,
                        },
                    ])
                    .select()
                    .single();

                if (gameError) throw gameError;

                if (screenshotFiles.length > 0) {
                    const screenshotUploads = await Promise.all(
                        screenshotFiles.map(async (file) => {
                            const screenshotPath = await uploadFile(
                                file,
                                "screenshots"
                            );

                            return {
                                game_listing_id: gameListing.id,
                                screenshot_url: screenshotPath,
                            };
                        })
                    );

                    const { error: screenshotsError } = await supabase
                        .from("game_screenshots")
                        .insert(screenshotUploads);

                    if (screenshotsError) throw screenshotsError;
                }

                showSuccessMessage();
            } catch (error) {
                console.error("Error submitting game listing:", error);
                showToast(
                    `Failed to submit your game listing: ${error.message || "Please try again."}`,
                    "error"
                );
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                document.getElementById("loading").classList.add("hidden");
            }
        });
    }

    /**
     * Uploads a file to Supabase storage
     * @param {File} file - The file to upload
     * @param {string} folder - The storage folder name
     * @returns {Promise<string>} The file path
     */
    async function uploadFile(file, folder) {
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            // Skip bucket creation attempts - we created it manually
            // Just upload directly to the bucket
            const { data, error } = await supabase.storage
                .from("game-assets")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: true, // Set to true to overwrite files with same name
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("game-assets")
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error) {
            console.error(`Error uploading ${folder} file:`, error);
            showToast(
                `Failed to upload: ${error.message || "Unknown error"}`,
                "error"
            );
            throw error;
        }
    }
    /**
     * Displays a success message after form submission
     */
    function showSuccessMessage() {
        // Replace form with success message
        const formContainer = document.getElementById("listing-form-container");
        const successMessage = document.createElement("div");
        successMessage.className = "success-message";
        successMessage.innerHTML = `
            <i class="fa fa-check-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
            <h2>Game Listed Successfully!</h2>
            <p>Your game has been added to the marketplace.</p>
            <div style="margin-top: 24px;">
                <a href="marketplace.html" class="btn-next" style="display: inline-flex; text-decoration: none;">
                    Go to Marketplace <i class="fa fa-arrow-right"></i>
                </a>
                <button id="list-another" class="btn-prev" style="margin-left: 16px;">
                    <i class="fa fa-plus"></i> List Another Game
                </button>
            </div>
        `;

        formContainer.innerHTML = "";
        formContainer.appendChild(successMessage);

        // Add event listener for "List Another" button
        document
            .getElementById("list-another")
            .addEventListener("click", () => {
                location.reload();
            });

        // Show toast notification
        showToast("Game successfully listed!", "success");
    }

    /**
     * Resets the form
     */
    function resetForm() {
        form.reset();
        coverImageFile = null;
        screenshotFiles = [];
        selectedPlatforms = [];

        document.querySelectorAll(".platform-btn.selected").forEach((btn) => {
            btn.classList.remove("selected");
        });
        const platformError = document.getElementById("platform-error");
        if (platformError) {
            platformError.textContent = "";
            platformError.style.display = "none";
        }

        const coverPreview = document.getElementById("cover-preview");
        if (coverPreview) coverPreview.innerHTML = "";

        const screenshotsPreview = document.getElementById(
            "screenshots-preview"
        );
        if (screenshotsPreview) screenshotsPreview.innerHTML = "";

        goToStep(1);
    }
});
