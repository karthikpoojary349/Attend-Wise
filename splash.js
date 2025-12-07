// This script runs only on the splash screen (index.html)

window.addEventListener('DOMContentLoaded', () => {

    // setTimeout executes a function after a specified number of milliseconds
    setTimeout(() => {
        
        // This line changes the browser's URL to 'main.html'
        window.location.href = 'main.html';

    }, 4000); // 4000 milliseconds = 4 seconds

});
