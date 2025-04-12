/**
 * Displays a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, info, warning)
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
        toast.remove();
    });

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Add icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fa fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fa fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fa fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fa fa-info-circle"></i>';
            break;
    }

    // Set toast content
    toast.innerHTML = `
        <div class="toast-content">
            ${icon}
            <span class="toast-message">${message}</span>
        </div>
    `;

    // Add to document
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300); // match transition duration
    }, duration);
}
