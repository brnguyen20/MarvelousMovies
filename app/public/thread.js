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
        this.replies = [];
    }
}

//Post top-level comment
document.getElementById('commentButton').addEventListener('click', function() {
    let commentText = document.getElementById('commentText').value;
    if (commentText) {
        postComment("top-level", commentText); 
        document.getElementById('commentText').value = '';
    }
});

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
    console.log(JSON.stringify(commentsData, null, 2)); // REPLACE WITH CALL TO DATABASE TO WRITE TO TABLE
}

function renderAllComments() {
    let commentsContainer = document.getElementById('comments');
    commentsContainer.innerHTML = ''; // Can I use innerHTML?

    commentsData.forEach(comment => renderComment(comment, commentsContainer));
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
