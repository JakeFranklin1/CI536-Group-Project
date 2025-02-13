document.addEventListener('DOMContentLoaded', () => {
  // Add fade-in class to body on initial load
  document.body.classList.add('fade-in');

  // Get all links in the document
  const links = document.querySelectorAll('a');

  // Add click handler to each link
  links.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault(); // Prevent immediate navigation
      const targetURL = this.getAttribute('href');

      // Remove fade-in and add fade-out class
      document.body.classList.remove('fade-in');
      document.body.classList.add('fade-out');

      // Wait for fade out animation to complete before navigating
      setTimeout(() => {
        window.location.href = targetURL;
      }, 300); // Match the CSS transition duration
    });
  });

  // Handle browser back/forward buttons
  window.addEventListener('pageshow', function(event) {
    // If navigating back from browser cache
    if (event.persisted) {
      document.body.classList.remove('fade-out');
      document.body.classList.add('fade-in');
    }
  });
});
