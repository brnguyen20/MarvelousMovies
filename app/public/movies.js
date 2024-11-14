document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const movieGrid = document.getElementById("movieGrid");
  const baseImageUrl = "https://image.tmdb.org/t/p/w500";

  const fetchMovies = async (query = "") => {
    const url = query ? `/search?query=${query}` : "/popular";
    try {
      const response = await fetch(url);
      const data = await response.json();
      displayMovies(data);
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  const displayMovies = (movies) => {
    while (movieGrid.firstChild) {
      movieGrid.removeChild(movieGrid.firstChild);
    }

    movies.forEach((movie) => {
      if (movie.poster_path) {
        const img = document.createElement("img");
        img.src = `${baseImageUrl}${movie.poster_path}`;
        img.className = "moviePoster";
        movieGrid.appendChild(img);
        img.addEventListener("click", () => {
          window.location.href = `/movieInfo.html?movieId=${movie.id}`;
        });
      }
    });

    searchButton.addEventListener('click', () => {
      const query = searchInput.value.trim();
      fetchMovies(query);
    });
  };

  searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim();
    fetchMovies(query);
  });

  fetchMovies();
});
