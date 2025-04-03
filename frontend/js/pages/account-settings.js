import supabase from '../supabase-client.js';
import { showToast } from '../utils/toast.js';
import { getUserData } from '../services/auth-service.js';

// DOM elements
const profilePicture = document.getElementById('profile-picture');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const userBalance = document.getElementById('user-balance');

// Form elements
const personalInfoForm = document.getElementById('personal-info-form');
const passwordForm = document.getElementById('password-form');
const preferencesForm = document.getElementById('preferences-form');
const addFundsForm = document.getElementById('add-funds-form');

// Modal elements
const addFundsModal = document.getElementById('add-funds-modal');
const addFundsBtn = document.getElementById('add-funds-btn');
const closeModalBtn = document.querySelector('.close');

let currentUser = null;
let userData = null;

/**
 * Initialize the account settings page
 */
async function initializeAccountPage() {
    try {
        // Check if user is authenticated
        const authUser = await getUserData();

        if (!authUser) {
            // Redirect to login if not authenticated
            window.location.href = '/frontend/pages/login.html';
            return;
        }

        currentUser = authUser;

        // Fetch user data from the users table
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;

        userData = data;

        // Update UI with user data
        updateProfileUI(userData);
        populateFormData(userData);
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing account page:', error);
        showToast('Failed to load account information', 'error');
    }
}

/**
 * Update profile UI elements with user data
 */
function updateProfileUI(userData) {
    // Create and set profile picture with initials
    if (userData) {
        const initials = getInitials(userData.first_name, userData.last_name);
        profilePicture.textContent = initials;
        profilePicture.style.backgroundColor = generateColorFromName(userData.first_name + userData.last_name);

        // Set profile name and email
        profileName.textContent = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
        profileEmail.textContent = userData.email || '';

        // Format and display balance
        const formattedBalance = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(userData.balance || 0);

        userBalance.textContent = formattedBalance;
    }
}

/**
 * Populate form fields with user data
 */
function populateFormData(userData) {
    if (!userData) return;

    // Personal info form
    document.getElementById('first-name').value = userData.first_name || '';
    document.getElementById('last-name').value = userData.last_name || '';
    document.getElementById('email').value = userData.email || '';

    if (userData.dob) {
        // Format date to YYYY-MM-DD for input[type="date"]
        const date = new Date(userData.dob);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('date-of-birth').value = formattedDate;
    }

    // Preferences form
    document.getElementById('dark-mode').checked = userData.dark_mode || false;
}

/**
 * Set up event listeners for forms and buttons
 */
function setupEventListeners() {
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show selected tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Personal info form submission
    personalInfoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData(personalInfoForm);
            const updatedData = {
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                dob: formData.get('dob') || null
            };

            const { error } = await supabase
                .from('users')
                .update(updatedData)
                .eq('id', currentUser.id);

            if (error) throw error;

            // Update the UI with new data
            userData = { ...userData, ...updatedData };
            updateProfileUI(userData);

            showToast('Personal information updated successfully', 'success');
        } catch (error) {
            console.error('Error updating personal information:', error);
            showToast('Failed to update personal information', 'error');
        }
    });

    // Password form submission
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        try {
            // Update password using Supabase Auth
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            // Clear form
            passwordForm.reset();

            showToast('Password updated successfully', 'success');
        } catch (error) {
            console.error('Error updating password:', error);
            showToast('Failed to update password', 'error');
        }
    });

    // Preferences form submission
    preferencesForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData(preferencesForm);
            const updatedPreferences = {
                dark_mode: formData.get('dark_mode') === 'on'
            };

            const { error } = await supabase
                .from('users')
                .update(updatedPreferences)
                .eq('id', currentUser.id);

            if (error) throw error;

            // Update user data
            userData = { ...userData, ...updatedPreferences };

            // Apply dark mode if needed
            applyDarkMode(updatedPreferences.dark_mode);

            showToast('Preferences updated successfully', 'success');
        } catch (error) {
            console.error('Error updating preferences:', error);
            showToast('Failed to update preferences', 'error');
        }
    });

    // Add funds modal
    addFundsBtn.addEventListener('click', () => {
        addFundsModal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => {
        addFundsModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === addFundsModal) {
            addFundsModal.style.display = 'none';
        }
    });

    // Add funds form submission
    addFundsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const amountToAdd = parseFloat(document.getElementById('amount').value);

        if (isNaN(amountToAdd) || amountToAdd <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        try {
            // Calculate new balance
            const newBalance = (parseFloat(userData.balance) || 0) + amountToAdd;

            // Update user balance in the database
            const { error } = await supabase
                .from('users')
                .update({ balance: newBalance })
                .eq('id', currentUser.id);

            if (error) throw error;

            // Update local data and UI
            userData.balance = newBalance;
            updateProfileUI(userData);

            // Close modal and reset form
            addFundsModal.style.display = 'none';
            addFundsForm.reset();

            showToast(`$${amountToAdd.toFixed(2)} has been added to your account`, 'success');
        } catch (error) {
            console.error('Error adding funds:', error);
            showToast('Failed to add funds', 'error');
        }
    });
}

/**
 * Apply dark mode to the page if enabled
 */
function applyDarkMode(isDarkMode) {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

/**
 * Get initials from first and last name
 */
function getInitials(firstName, lastName) {
    let initials = '';

    if (firstName) {
        initials += firstName.charAt(0).toUpperCase();
    }

    if (lastName) {
        initials += lastName.charAt(0).toUpperCase();
    }

    return initials || '?';
}

/**
 * Generate a consistent color based on a name
 */
function generateColorFromName(name) {
    if (!name) return '#6c757d'; // Default gray

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use hue values that produce pleasant colors (avoiding yellows)
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 55%)`;
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAccountPage);
