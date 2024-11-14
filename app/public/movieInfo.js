const submitButton = document.getElementById("submitButton");

submitButton.addEventListener("click", () => {
  const movieName = document.getElementById("movieName").value;

  if (!movieName) {
    alert("Please enter a movie name");
    return;
  }

  fetch(`/search?query=${movieName}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      const movieID = data.id;
      const movieTitle = document.getElementById("movieTitle");
      movieTitle.textContent = data.title || "Title not found";

      fetch(`/genre?movieID=${movieID}`)
        .then(response => response.json())
        .then(data => {
          const genreElement = document.getElementById("movieGenre");
          genreElement.textContent = data.genres ? data.genres.join(", ") : "Genre not found";
        })
        .catch(error => console.error("Error fetching genre:", error));

      fetch(`/details?movieID=${movieID}`)
        .then(response => response.json())
        .then(data => {
          const detailsElement = document.getElementById("movieDetails");
          detailsElement.textContent = JSON.stringify(data);
        })
        .catch(error => console.error("Error fetching details:", error));

      fetch(`/cast?movieID=${movieID}`)
        .then(response => response.json())
        .then(data => {
          const castDiv = document.getElementById("movieCast");

          while (castDiv.firstChild) {
            castDiv.removeChild(castDiv.firstChild);
          }

          const castEntries = Object.entries(data.cast);

          castEntries.forEach(([actor, character]) => {
            const castEntry = document.createElement("div");
            castEntry.textContent = `${actor} as ${character}`;
            castDiv.appendChild(castEntry);
          });
        })
        .catch(error => console.error("Error fetching cast:", error));

      fetch(`/images?movieID=${movieID}`)
        .then(response => response.json())
        .then(data => {
          const imagesDiv = document.getElementById("movieImages");

          while (imagesDiv.firstChild) {
            imagesDiv.removeChild(imagesDiv.firstChild);
          }

          const baseUrl = "https://image.tmdb.org/t/p/w500";
          let topImage = null;

          if (data.backdrops && data.backdrops.length > 0) {
            topImage = data.backdrops[0];
          
            for (let i = 1; i < data.backdrops.length; i++) {
              if (data.backdrops[i].vote_count > topImage.vote_count) {
                topImage = data.backdrops[i];
              }
            }
          }

          if (topImage) {
            const img = document.createElement("img");
            img.src = `${baseUrl}${topImage.file_path}`;
            img.alt = "Top Voted Movie Image";
            img.style.margin = "10px";
            imagesDiv.appendChild(img);
          } else {
            const noImageText = document.createElement("p");
            noImageText.textContent = "No images available";
            imagesDiv.appendChild(noImageText);
          }
        })
        .catch(error => console.error("Error fetching images:", error));
    })
    .catch(error => console.error("Error fetching movie ID:", error));
});
