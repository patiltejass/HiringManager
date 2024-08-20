document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const formLink = document.getElementById('formLink');
    const detailsLink = document.getElementById('detailsLink');
    const registerLink = document.getElementById('registerLink');
    const updatePositionsLink = document.getElementById('updatePositionsLink');
    const positionsLink = document.getElementById('positionsLink');
    const masterCandidate = document.getElementById('mastercandidate');

    if (loginLink) loginLink.style.display = token ? 'none' : 'inline-block';
    if (registerLink) registerLink.style.display = token ? 'none' : 'inline-block';
    if (logoutLink) logoutLink.style.display = token ? 'inline-block' : 'none';
    if (formLink) formLink.style.display = token ? 'inline-block' : 'none';
    if (detailsLink) detailsLink.style.display = token ? 'inline-block' : 'none';
    if (updatePositionsLink) updatePositionsLink.style.display = token ? 'inline-block' : 'none';
    if (positionsLink) positionsLink.style.display = token ? 'inline-block' : 'none';
    // if (masterCandidate) masterCandidate.style.display = token ? 'inline-block' : 'none';

    if (logoutLink && token) {
        logoutLink.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'index.html';
        });
    }
});
