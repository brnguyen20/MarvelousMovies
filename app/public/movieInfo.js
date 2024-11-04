let btn = document.getElementById('submitButton');

btn.addEventListener('click', () => {
  const movieID = document.getElementById('movieID').value;

  if (!movieID) {
    alert("Please enter a movie ID");
    return;
  }

  fetch(`/title?movieID=${movieID}`)
    .then(response => response.json())
    .then(data => {
      let titleElement = document.getElementById('movieTitle');
      titleElement.textContent = data.title || "Title not found";
    })
    .catch(error => console.error("Error fetching title:", error));

  fetch(`/genre?movieID=${movieID}`)
    .then(response => response.json())
    .then(data => {
      let genreElement = document.getElementById('movieGenre');
      genreElement.textContent = data.genres ? data.genres.join(', ') : "Genre not found";
    })
    .catch(error => console.error("Error fetching genre:", error));

  fetch(`/details?movieID=${movieID}`)
    .then(response => response.json())
    .then(data => {
      let detailsElement = document.getElementById('movieDetails');
      detailsElement.textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => console.error("Error fetching details:", error));

  fetch(`/cast?movieID=${movieID}`)
    .then(response => response.json())
    .then(data => {
      const castDiv = document.getElementById('movieCast');
      while (castDiv.firstChild) {
        castDiv.removeChild(castDiv.firstChild);
      }
      for (const [actor, character] of Object.entries(data.cast)) {
        const castEntry = document.createElement('div');
        castEntry.textContent = `${actor} as ${character}`;
        castDiv.appendChild(castEntry);
      }
    })
    .catch(error => console.error("Error fetching cast:", error));

  fetch(`/images?movieID=${movieID}`)
    .then(response => response.json())
    .then(data => {
      const imagesDiv = document.getElementById('movieImages');
      while (imagesDiv.firstChild) {
        imagesDiv.removeChild(imagesDiv.firstChild);
      }
      const baseUrl = 'https://image.tmdb.org/t/p/w500';

      const topImage = data.backdrops?.reduce((prev, curr) => (curr.vote_count > prev.vote_count ? curr : prev), data.backdrops[0]);
      
      if (topImage) {
        const img = document.createElement('img');
        img.src = `${baseUrl}${topImage.file_path}`;
        img.alt = "Top Voted Movie Image";
        img.style.margin = "10px";
        imagesDiv.appendChild(img);
      } else {
        imagesDiv.textContent = "No images available";
      }
    })
    .catch(error => console.error("Error fetching images:", error));
});