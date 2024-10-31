document.getElementById('submitButton').addEventListener('click', () => {
    const movieID = document.getElementById('movieID').value;
    
    fetch(`/details?movieID=${movieID}`)
      .then(response => response.json())
      .then(data => {
        const detailsDiv = document.getElementById('movieDetails');
        
        detailsDiv.textContent = JSON.stringify(data);
      })
      .catch((error) => {
        console.error(error);
    });
  });
  