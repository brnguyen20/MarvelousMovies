let commentsData = [];

// might add more properties like userID, up-vote, down-vote, time posted, etc. in the future
class Comment {
    constructor(type, text, user = "Unknown") {
        this.user = user;
        this.type = type; // 'top-level' or 'reply'
        this.text = text;
        this.replies = [];
    }
}

// #region Event Listeners
document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const movieID = params.get('movieId');

    fetch(`/load?movieID=${movieID}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            data.comments.forEach(comment => loadCommentFromData(comment));
            renderAllComments();
        }); 
});

document.getElementById('commentButton').addEventListener('click', () => {
    const commentText = document.getElementById('commentText').value;
    if (commentText) {
        postUserComment("top-level", commentText);
        document.getElementById('commentText').value = '';
    }
});
// #endregion

// creates comment objects from data received from database
function loadCommentFromData(data, parent = null) {
    const comment = new Comment(parent ? "reply" : "top-level", data.text, data.user);
    
    // reply
    if (parent) 
        parent.replies.push(comment);
    // top-level comment
    else 
        commentsData.push(comment);

    if (data.replies && data.replies.length > 0) 
        data.replies.forEach(replyData => loadCommentFromData(replyData, comment));
}

async function getUserProfile() {
    try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        return data.username || 'Unknown';
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return 'Unknown';
    }
}

//Creates, renders, and saves comments that users post
async function postUserComment(commentType, commentText, parent = null) {
    const user = await getUserProfile();
    const comment = new Comment(commentType, commentText, user);
    console.log(parent)
    // reply
    if (parent) {
        parent.replies.push(comment);
        renderComment(comment, parent.div);
    } 
    // top-level comment
    else {
        commentsData.push(comment); 
        renderComment(comment, document.getElementById('comments'));
    }

    saveComments();
}
function renderComment(comment, parentDiv) {
    // Create the main comment div
    const commentDiv = document.createElement('div');
    commentDiv.classList.add(comment.type === "top-level" ? 'comment' : 'reply');
    comment.div = commentDiv;
    
    // Add styles for the comment
    commentDiv.style.backgroundColor = '#333';  // Dark background
    commentDiv.style.color = '#fff';  // Light text color
    commentDiv.style.padding = '10px';  // Padding for the comment box
    commentDiv.style.borderRadius = '5px';  // Rounded corners
    commentDiv.style.marginBottom = '10px';  // Space between comments
    commentDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';  // Subtle shadow

    // Create and style the comment content (user and text)
    const commentContent = document.createElement('p');
    commentContent.innerHTML = `<strong>${comment.user}:</strong> ${comment.text}`;
    commentContent.style.fontSize = '1rem';  // Set font size
    commentContent.style.lineHeight = '1.4';  // Set line height for readability

    // Create the reply button
    const replyButton = document.createElement('button');
    replyButton.textContent = 'Reply';
    replyButton.style.backgroundColor = '#007BFF';  // Blue background for button
    replyButton.style.color = '#fff';  // White text color
    replyButton.style.padding = '6px 12px';  // Padding for button
    replyButton.style.border = 'none';  // No border
    replyButton.style.borderRadius = '5px';  // Rounded button corners
    replyButton.style.cursor = 'pointer';  // Cursor pointer for interactivity
    replyButton.style.transition = 'background-color 0.3s';  // Smooth hover effect
    replyButton.addEventListener('click', () => {
        if (!commentDiv.querySelector('.replyFormOpen')) { // Prevent spam replies
            createReplyForm(commentDiv, comment);  // Create reply form if not already open
        }
    });

    // Apply hover effect to the reply button
    replyButton.addEventListener('mouseover', () => {
        replyButton.style.backgroundColor = '#0056b3';  // Darker blue on hover
    });
    replyButton.addEventListener('mouseout', () => {
        replyButton.style.backgroundColor = '#007BFF';  // Original blue
    });

    // Append the content and button to the comment div
    commentDiv.appendChild(commentContent);
    commentDiv.appendChild(replyButton);

    // Append the comment div to the parent container (top-level or reply container)
    parentDiv.appendChild(commentDiv);

    // Recursively render replies if they exist
    comment.replies.forEach(reply => renderComment(reply, commentDiv));
}



function renderAllComments() {
    let commentsContainer = document.getElementById('comments');
    commentsContainer.innerHTML = ''; // Can I use innerHTML?

    commentsData.forEach(comment => renderComment(comment, commentsContainer));
    console.log(commentsData)
}

// Create Reply input box
function createReplyForm(parentDiv, parentComment) {
    const replyForm = document.createElement('div');
    replyForm.classList.add('replyFormOpen');

    // Style the replyForm to have a white background
    replyForm.style.backgroundColor = '#fff';  // White background
    replyForm.style.color = '#000';  // Black text for readability
    replyForm.style.padding = '20px';  // Padding to make it more spacious
    replyForm.style.borderRadius = '10px';  // Rounded corners for the form
    replyForm.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';  // Light shadow for depth
    replyForm.style.width = '100%';  // Take the full width of the parent div

    // Create the textarea (white background with black text)
    const textInput = document.createElement('textarea');
    textInput.style.backgroundColor = '#fff';  // White background
    textInput.style.color = '#000';  // Black text
    textInput.style.border = '1px solid #444';  // Dark border to match the theme
    textInput.style.padding = '10px';  // Padding for better usability
    textInput.style.width = '100%';  // Full width of the parent container
    textInput.style.borderRadius = '5px';  // Rounded corners
    textInput.style.fontSize = '1rem';  // Font size for better readability

    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => replyForm.remove());

    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Comment';
    submitButton.addEventListener('click', () => {
        const commentText = textInput.value;
        if (commentText) {
            postUserComment("reply", commentText, parentComment);
            replyForm.remove();
        }
    });

    // Append elements to the reply form
    replyForm.appendChild(textInput);
    replyForm.appendChild(cancelButton);
    replyForm.appendChild(submitButton);
    parentDiv.appendChild(replyForm);
}



function saveComments() {
    const params = new URLSearchParams(window.location.search);
    const movieID = params.get('movieId');

    fetch('/save-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            movie_id: movieID,
            comment_thread: { comments: commentsData }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        console.log('Comments successfully saved:', data);
    })
    .catch(error => {
        console.error('Error saving comments:', error);
    });
}


