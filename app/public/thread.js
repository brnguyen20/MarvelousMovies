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
    const commentDiv = document.createElement('div');
    commentDiv.classList.add(comment.type === "top-level" ? 'comment' : 'reply');
    comment.div = commentDiv;

    const commentContent = document.createElement('p');
    commentContent.innerHTML = `<strong>${comment.user}:</strong> ${comment.text}`;

    const replyButton = document.createElement('button');
    replyButton.textContent = 'Reply';
    replyButton.addEventListener('click', () => {
        if (!commentDiv.querySelector('.replyFormOpen')) // so user can't spam reply
            createReplyForm(commentDiv, comment);
    });

    commentDiv.appendChild(commentContent);
    commentDiv.appendChild(replyButton);
    parentDiv.appendChild(commentDiv);

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

    // create input textbox
    const textInput = document.createElement('textarea');

    // create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => replyForm.remove());

    // create submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Comment';
    submitButton.addEventListener('click', () => {
        const commentText = textInput.value;
        if (commentText) {
            postUserComment("reply", commentText, parentComment);
            replyForm.remove();
        }
    });

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


