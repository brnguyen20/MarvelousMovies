document.getElementById('submitButton').addEventListener('click', () => {
    const movieID = document.getElementById('movieID').value;
    
    fetch(`/images?movieID=${movieID}`)
      .then(response => response.json())
      .then(data => {
        let imagesDiv = document.getElementById('movieImages');
        
        imagesDiv.textContent = JSON.stringify(data);
      })
      .catch((error) => {
        console.error(error);
    });
  });