let ratingsData = []; 
let selectedRating = 0;

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


document.getElementById('ratingPostButton').addEventListener('click', () => {
    const ratingText = document.getElementById('ratingDescription').value;
    if (selectedRating) {
        postUserRating(selectedRating, ratingText);
        document.getElementById('ratingDescription').value = ''; 
    } else {
        alert("Please select a rating before posting.");
    }
});


function loadRatingFromData(data) {
    const rating = new Rating(data.rating, data.description, data.user);
    ratingsData.push(rating);
}

async function postUserRating(ratingValue, ratingText) {
    const user = await getUsername();
    const userId = await getUserID();
    const movieID = new URLSearchParams(window.location.search).get('movieId');

    const rating = new Rating(ratingValue, ratingText, user);
    ratingsData.push(rating);
    renderRating(rating);


    const ratingData = {
        user_id: userId, 
        movie_id: parseInt(movieID), 
        star_rating: ratingValue, 
        content: ratingText,
    };
    saveRating(ratingData);
}

function saveRating(ratingData) {
    fetch('/save-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData) 
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        console.log('Ratings successfully saved:', data);
    })
    .catch(error => {
        console.error('Error saving ratings:', error);
    });
}


function renderRating(rating) {
    const ratingDiv = document.createElement('div');
    ratingDiv.classList.add('rating');


    const ratingContent = document.createElement('p');
    ratingContent.innerHTML = `<strong>${rating.user}:</strong>`;  

    const starContainer = document.createElement('div');
    starContainer.classList.add('star-visualization');

    for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.classList.add('star'); 

        if (i < rating.rating) {
            star.innerHTML = '&#9733;';
            star.classList.add('filled'); 
        } else {
            star.innerHTML = '&#9734;'; 
        }

        starContainer.appendChild(star); 
    }


    const descriptionContent = document.createElement('p');
    descriptionContent.innerHTML = rating.description ? `${rating.description}` : 'No description provided';  // Corrected template literal

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
