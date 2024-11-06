const detailsDiv = document.getElementById('movieCast');

document.getElementById('submitButton').addEventListener('click', () => {
    const movieID = document.getElementById('movieID').value;

    fetch(`/cast?movieID=${movieID}`)
      .then(response => response.json())
      .then(data => {
        for (let [person, character] of Object.entries(data.cast)) {
            newDiv = document.createElement('div')
            newDiv.textContent = `${person} playing ${character}`
            detailsDiv.append(newDiv)
          }
      })
      .catch((error) => {
        console.error(error);
    });
  });