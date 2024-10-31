document.getElementById('submitButton').addEventListener('click', () => {
  const movieID = document.getElementById('movieID').value;
  
  fetch(`/images?movieID=${movieID}`)
    .then(response => response.json())
    .then(data => {
      let imagesDiv = document.getElementById('movieImages');
      imagesDiv.innerHTML = ''; // Clear previous images

      // The base URL for images from TMDB
      const baseUrl = 'https://image.tmdb.org/t/p/w500';

      // Find the backdrop with the highest vote count
      const topImage = data.backdrops.reduce((prev, current) => {
        return (current.vote_count > prev.vote_count) ? current : prev;
      });

      // Create and append the top image
      let img = document.createElement('img');
      img.src = `${baseUrl}${topImage.file_path}`;
      img.alt = "Top Voted Movie Image";
      img.style.margin = "10px"; // optional styling
      imagesDiv.appendChild(img);
    })
    .catch((error) => {
      console.error(error);
    });
});
