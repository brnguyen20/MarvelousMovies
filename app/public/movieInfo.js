document.addEventListener("DOMContentLoaded", () => {
  console.log("movieinfo log");
  const params = new URLSearchParams(window.location.search);
  const movieID = params.get('movieId'); 

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
      const titleElement = document.getElementById("movieTitle");
      titleElement.textContent = data.original_title;

      const movieInfoDiv = document.createElement('div');

      const taglinePara = document.createElement("p");
      taglinePara.textContent = `${data.tagline}`;
      taglinePara.style.fontWeight = "bold";  // Make text bold
      taglinePara.style.fontSize = "2rem";  // Increase font size (adjust as needed)
      movieInfoDiv.appendChild(taglinePara);

      const overviewPara = document.createElement('p');
      overviewPara.textContent = `Overview: ${data.overview}`;
      movieInfoDiv.appendChild(overviewPara);

      const genresPara = document.createElement('p');
      genresPara.textContent = `Genres: ${data.genres.map(genre => genre.name).join(', ')}`;
      movieInfoDiv.appendChild(genresPara);

      const releaseDatePara = document.createElement('p');
      releaseDatePara.textContent = `Release Date: ${data.release_date}`;
      movieInfoDiv.appendChild(releaseDatePara);

      const runtimePara = document.createElement('p');
      runtimePara.textContent = `Runtime: ${data.runtime} minutes`;
      movieInfoDiv.appendChild(runtimePara);

      const budgetPara = document.createElement('p');
      budgetPara.textContent = `Budget: $${data.budget.toLocaleString()}`;
      movieInfoDiv.appendChild(budgetPara);

      const revenuePara = document.createElement('p');
      revenuePara.textContent = `Revenue: $${data.revenue.toLocaleString()}`;
      movieInfoDiv.appendChild(revenuePara);

      const productionCompaniesPara = document.createElement('p');
      productionCompaniesPara.textContent = `Production Companies: ${data.production_companies.map(company => company.name).join(', ')}`;
      movieInfoDiv.appendChild(productionCompaniesPara);

      const statusPara = document.createElement('p');
      statusPara.textContent = `Status: ${data.status}`;
      movieInfoDiv.appendChild(statusPara);

      const imdbRatingPara = document.createElement('p');
      imdbRatingPara.textContent = `IMDb Rating: ${data.vote_average} / 10 (from ${data.vote_count} votes)`;
      movieInfoDiv.appendChild(imdbRatingPara);

      const homepagePara = document.createElement('p');
      const homepageLink = document.createElement('a');
      homepageLink.href = data.homepage;
      homepageLink.textContent = "Visit Website";
      homepageLink.target = "_blank";
      homepagePara.appendChild(homepageLink);
      movieInfoDiv.appendChild(homepagePara);

      // Append the created movie info to the details element
      detailsElement.appendChild(movieInfoDiv);
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
  
        // Find the top-voted image
        for (let i = 1; i < data.backdrops.length; i++) {
          if (data.backdrops[i].vote_count > topImage.vote_count) {
            topImage = data.backdrops[i];
          }
        }
      }
  
      if (topImage) {
        // Create and append the image to the movieImages div
        const img = document.createElement("img");
        img.src = `${baseUrl}${topImage.file_path}`;
        img.alt = "Top Voted Movie Image";
        img.style.margin = "10px";
        imagesDiv.appendChild(img);
      } else {
        // Add a text message if no images are available
        const noImageText = document.createElement("p");
        noImageText.textContent = "No images available";
        imagesDiv.appendChild(noImageText);
      }
    })
    .catch(error => console.error("Error fetching images:", error));

  // Handle adding the movie to recommendations
  const addToRecommendationsButton = document.getElementById("addToRecommendations");
  addToRecommendationsButton.addEventListener("click", () => {
    fetch("/add-to-recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ movieID: movieID }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert("Movie added to your recommendations list!");
      } else {
        alert("Error adding movie to recommendations list.");
      }
    })
    .catch(error => {
      console.error("Error adding movie to recommendations:", error);
      alert("An error occurred.");
    });
  });

  // Handle removing the movie from recommendations
const removeFromRecommendationsButton = document.getElementById("removeFromRecommendations");
removeFromRecommendationsButton.addEventListener("click", () => {
    fetch("/remove-from-recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ movieID: movieID }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert("Movie removed from your recommendations list!");
      } else {
        alert("Error removing movie from recommendations list.");
      }
    })
    .catch(error => {
      console.error("Error removing movie from recommendations:", error);
      alert("An error occurred.");
    });
  });

});
