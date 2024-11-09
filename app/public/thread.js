/*
NOTES
One thing to think about is multiple users writing to the same thread, how do we know when to fetch data from database and re-render the whole thread
*/

// stores the comments and replies
let commentsData = [];

// might add more properties like userID, up-vote, down-vote, time posted, etc. in the future
class Comment {
    constructor(type, text) {
        this.type = type; // top-level or reply
        this.text = text;
    //    this.user = int; // to-do
        this.replies = [];
    }
}

document.addEventListener("DOMContentLoaded", function() {
    fetch(`/load?movieID=278`) // placeholder/hardcoded movieID for now
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        
        data.comments.forEach(comment => {
            // Top-level comments
            generateComment("top-level", comment.comment);

            // process replies
            if (comment.replies && comment.replies.length > 0) {
                comment.replies.forEach(reply => {
                    // Replies for the top-level comment
                    generateComment("reply", reply.comment, commentsData[commentsData.length - 1]);
                });
            }
        });

        renderAllComments();

    });
});


//Post top-level comment
document.getElementById('commentButton').addEventListener('click', function() {
    let commentText = document.getElementById('commentText').value;
    if (commentText) {
        postComment("top-level", commentText); 
        document.getElementById('commentText').value = '';
    }
});


function generateComment(commentType, commentText, parent = null) {
    let comment = new Comment(commentType, commentText);

    // reply
    if (parent) {
        parent.replies.push(comment);
        renderComment(comment, parent.div);
    }
    // top-level comment
    else {
        commentsData.push(comment);
        renderComment(comment, document.getElementById('comments'))
    }
}

function saveComments(){
    fetch('/save-comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            movie_id: 278, //temporary hard-code
            comment_thread: commentsData
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

//Creates parent-childen relationship between comments/replies and displays them
function postComment(commentType, commentText, parent = null) {
    let comment = new Comment(commentType, commentText);

    // reply
    if (parent) {
        parent.replies.push(comment);
        renderComment(comment, parent.div);
    }
    // top-level comment
    else {
        commentsData.push(comment);
        renderComment(comment, document.getElementById('comments'))
    }

    renderAllComments();
    //saveComments() // to-do
}

function renderAllComments() {
    let commentsContainer = document.getElementById('comments');
    commentsContainer.innerHTML = ''; // Can I use innerHTML?

    commentsData.forEach(comment => renderComment(comment, commentsContainer));
    console.log(commentsData)
}

// Create posted-comment
function renderComment(comment, parentDiv) {
    // styling and properties
    let commentDiv = document.createElement('div');
    commentDiv.classList.add(comment.type === "top-level" ? 'comment' : 'reply');
    comment.div = commentDiv;

    // set comment content
    let commentContent = document.createElement('p');
    commentContent.textContent = comment.text;
    
    // Reply button
    let replyButton = document.createElement('button');
    replyButton.textContent = 'Reply';
    replyButton.addEventListener('click', () => {
        if (!commentDiv.querySelector('.replyFormOpen'))  // So the user can't spam reply
            createReplyForm(commentDiv, comment); 
    });
    
    commentDiv.appendChild(commentContent);
    commentDiv.appendChild(replyButton);
    parentDiv.appendChild(commentDiv);

    comment.replies.forEach(reply => renderComment(reply, commentDiv));
}

// Create Reply input box
function createReplyForm(parentDiv, parentComment) {
    let replyForm = document.createElement('div');
    replyForm.classList.add('replyFormOpen');

    // create input textbox
    let textInput = document.createElement('textarea');

    // create cancel button
    let cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', function() {
        replyForm.remove();  
    });
    
    // create submit button
    let submitButton = document.createElement('button');
    submitButton.textContent = 'Comment';
    submitButton.addEventListener('click', function() {
        let commentText = textInput.value;
        if (commentText) {
            postComment("reply", commentText, parentComment);
            replyForm.remove();
        }
    });

    replyForm.appendChild(textInput);
    replyForm.appendChild(cancelButton);
    replyForm.appendChild(submitButton);
    parentDiv.appendChild(replyForm);
}
