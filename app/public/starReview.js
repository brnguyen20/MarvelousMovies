let ratingsData = [];
let selectedRating = 0;
let currentRating = null; // Track the user's current rating as a Rating object

class Rating {
    constructor(rating, description, user = "Unknown") {
        this.rating = rating;
        this.description = description;
        this.user = user;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const movieID = params.get('movieId');

    if (!movieID) {
        alert("Movie ID not found!");
        return;
    }

    fetchAndRenderRatings(); // Load ratings on page load

    const starContainer = document.getElementById('star-container');
    if (starContainer) {
        starContainer.addEventListener('mouseover', (event) => {
            const target = event.target;
            if (target.classList.contains('star')) {
                const index = Array.from(starContainer.children).indexOf(target);
                resetStars();
                highlightStars(index);
            }
        });

        starContainer.addEventListener('mouseout', () => {
            resetStars();
            if (selectedRating > 0) {
                highlightStars(selectedRating - 1);
            }
        });

        starContainer.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('star')) {
                const index = Array.from(starContainer.children).indexOf(target);
                selectedRating = index + 1;
                resetStars();
                highlightStars(index);
            }
        });
    }
});

document.getElementById('ratingPostButton').addEventListener('click', async () => {
    const ratingText = document.getElementById('ratingDescription').value;
    if (selectedRating) {
        if (currentRating) {
            await updateUserRating(selectedRating, ratingText);
        } else {
            await postUserRating(selectedRating, ratingText);
        }
        document.getElementById('ratingDescription').value = '';
    } else {
        alert("Please select a rating before posting or updating.");
    }
});

async function postUserRating(ratingValue, ratingText) {
    const user = await getUsername();
    const userId = await getUserID();
    const movieID = new URLSearchParams(window.location.search).get('movieId');

    const ratingData = {
        user_id: userId,
        movie_id: parseInt(movieID),
        star_rating: ratingValue,
        content: ratingText,
    };

    try {
        const response = await fetch('/api/rating', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ratingData),
        });

        const data = await response.json();
        if (data.error) {
            alert(data.error);
            return;
        }

        console.log(data.message);
        fetchAndRenderRatings(); // Refresh all ratings
    } catch (error) {
        console.error('Error posting rating:', error);
    }
}

async function updateUserRating(ratingValue, ratingText) {
    const userId = await getUserID();
    const movieID = new URLSearchParams(window.location.search).get('movieId');

    const ratingData = {
        user_id: userId,
        movie_id: parseInt(movieID),
        star_rating: ratingValue,
        content: ratingText,
    };

    try {
        const response = await fetch('/api/rating', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ratingData),
        });

        const data = await response.json();
        if (data.error) {
            alert(data.error);
            return;
        }

        console.log(data.message);
        fetchAndRenderRatings(); // Refresh all ratings
    } catch (error) {
        console.error('Error updating rating:', error);
    }
}

async function fetchAndRenderRatings() {
    const movieID = new URLSearchParams(window.location.search).get('movieId');
    const userId = await getUserID(); // Get current user's ID

    try {
        const response = await fetch(`/api/ratings?movie_id=${movieID}`);
        if (!response.ok) {
            throw new Error('Failed to fetch ratings');
        }

        const ratings = await response.json();
        ratingsData = []; // Clear local data
        userReview = null; // Reset user review

        ratings.forEach(data => {
            const rating = new Rating(data.star_rating, data.content, data.username);
            ratingsData.push(rating);

            // Check if the current rating belongs to the logged-in user
            if (data.user_id === userId) {
                userReview = rating; // Store the user's review
                selectedRating = data.star_rating; // Preload star rating
                preloadUserReview(data.content, data.star_rating);

                // Change button text to "Update Rating"
                const button = document.getElementById('ratingPostButton');
                if (button) {
                    button.textContent = 'Update Rating';
                }
            }
        });

        // If no user review exists, reset button to "Post Rating"
        if (!userReview) {
            const button = document.getElementById('ratingPostButton');
            if (button) {
                button.textContent = 'Post Rating';
            }
        }

        renderAllRatings(); // Update the UI
    } catch (error) {
        console.error('Error fetching ratings:', error);
    }
}

function preloadUserReview(description, starRating) {
    console.log('Preloading review:', { description, starRating });
    document.getElementById('ratingDescription').value = description; 
    resetStars();
    highlightStars(starRating - 1); 
}

function renderRating(rating) {
    const ratingDiv = document.createElement('div');
    ratingDiv.classList.add('rating');

    ratingDiv.style.backgroundColor = '#2a2a2a';
    ratingDiv.style.color = '#e0e0e0';
    ratingDiv.style.border = '1px solid #444';
    ratingDiv.style.borderRadius = '10px';
    ratingDiv.style.padding = '20px';
    ratingDiv.style.marginBottom = '10px';
    ratingDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';

    const ratingContent = document.createElement('p');
    ratingContent.innerHTML = `<strong>${rating.user}:</strong>`;
    ratingContent.style.color = '#fff';

    const starContainer = document.createElement('div');
    starContainer.classList.add('star-visualization');

    for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.classList.add('star');

        if (i < rating.rating) {
            star.innerHTML = '&#9733;';
            star.style.color = '#FFD700';
        } else {
            star.innerHTML = '&#9734;';
            star.style.color = '#555';
        }

        starContainer.appendChild(star);
    }

    const descriptionContent = document.createElement('p');
    descriptionContent.innerHTML = rating.description || 'No description provided';
    descriptionContent.style.color = '#ccc';

    ratingDiv.appendChild(ratingContent);
    ratingDiv.appendChild(starContainer);
    ratingDiv.appendChild(descriptionContent);

    const ratingsContainer = document.getElementById('ratingsContainer');
    if (ratingsContainer) {
        ratingsContainer.appendChild(ratingDiv);
    } else {
        console.error('Ratings container not found!');
    }
}

function renderAllRatings() {
    const ratingsContainer = document.getElementById('ratingsContainer');
    ratingsContainer.innerHTML = '';

    ratingsData.forEach(rating => renderRating(rating));
}

function highlightStars(index) {
    const stars = document.querySelectorAll("#star-container .star");
    for (let i = 0; i <= index; i++) {
        stars[i].classList.add("hovered");
    }
}

function resetStars() {
    const stars = document.querySelectorAll("#star-container .star");
    stars.forEach(star => star.classList.remove("hovered", "selected"));
}

async function getUsername() {
    try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        return data.username;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

async function getUserID() {
    try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        return data.user_id;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}
