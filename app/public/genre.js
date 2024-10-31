
document.getElementById('submitButton').addEventListener('click', () => {
    const movieID = document.getElementById('movieID').value;
    
    fetch(`/genre?movieID=${movieID}`)
      .then(response => response.json())
      .then(data => {
        const detailsDiv = document.getElementById('movieGenre');
        
        detailsDiv.textContent = JSON.stringify(data);
      })
      .catch((error) => {
        console.error(error);
    });
  });