const chatBody = document.querySelector('.chat-body');

const fileUploadWrapper = document.querySelector('.file-upload-wrapper');

const userData = {
    message: null, 
    file: {
        data:null,
        mime_type:null
    }
}

// API setup
const API_KEY = "AIzaSyBFiw14ME37BWigVojHqExmIzjO937687g"; // add your API key here
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// handling enter key press for sending messages
const messageInput = document.querySelector('.message-input');
messageInput.addEventListener('keydown', (e) => {
    const userMessage = e.target.value.trim();
    // keydown is an event that occurs when a key is pressed down
    if(e.key == "Enter" && userMessage && !e.shiftKey && window.innerWidth > 770) {
        handleOutgoingMessage(e);
    }
})

const initialInputHeight = messageInput.scrollHeight;

// adjust input height based on content dynamically
messageInput.addEventListener('input', () => {
    messageInput.style.height = `${initialInputHeight}px`; // reset to initial height
    messageInput.style.height = `${messageInput.scrollHeight}px`; // adjust height based on content
    document.querySelector('.chat-form').style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "35px";
})

// create message element with dynamic classes and return it.
const createMessageElement = (content, ...classes) => {
    const div = document.createElement('div');
    div.classList.add("message", ...classes);      // classList.add() can add multiple classes at once.
    div.innerHTML = content;
     return div;
}

// to store chat history in local storage
const chatHistory = [];

// generate bot response after user message is sent
const generateBotResponse = async(incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector('.message-text');
    
    // storing user message in chat history
    chatHistory.push({
        role: "user",        
        parts: [{ "text": userData.message }, ...(userData.file.data ? [{ inline_data: userData.file}] : [])]
            });

    const requestOptions = {
        method: 'POST',
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
            contents: chatHistory,
        })
    }

    try {
        // fetching response from the API
        const response = await fetch(API_URL, requestOptions)
        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);

        // extracting bot response from the API response object
        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        messageElement.innerText = apiResponseText;

        // storing bot response in chat history
        chatHistory.push({
                role: "model",
                parts: [{ "text": apiResponseText }]
            })

    } catch (error) {
        console.log(error);

        // to handle the error
        messageElement.innerText = error.message;
        messageElement.style.color = "red";
    } finally {
        // resets user data 
        userData.file = {};
        incomingMessageDiv.classList.remove("thinking");
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    }
}

// handling user sent messages to the chat list
const handleOutgoingMessage = (e) => {
    e.preventDefault();

    // storing the user message by creating global object and making it accessible throughout the script
    userData.message = messageInput.value.trim();

    // clear the input field after sending the message
    messageInput.value = "";
    fileUploadWrapper.classList.remove('file-uploaded');
    messageInput.dispatchEvent(new Event('input')); // to reset the input height


    // create and display user message
    const messageContent = `<div class="message-text">${userData.message}</div>
                            ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ''}`;

    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    // to ensure that the texted typed must be text only , not tags.
    outgoingMessageDiv.querySelector('.message-text').textContent = userData.message;

    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' }); // auto scroll to the bottom

    // to display thinking indicator as bot message after a brief delay
    setTimeout(() => {
        const messageContent = `<img class="bot-avatar" src="https://media.istockphoto.com/id/1060696342/vector/robot-icon-chat-bot-sign-for-support-service-concept-chatbot-character-flat-style.jpg?s=612x612&w=0&k=20&c=t9PsSDLowOAhfL1v683JMtWRDdF8w5CFsICqQvEvfzY=" alt="chatbot logo" height="60px" width="60px">
                                <div class="message-text">
                                    <div class="thinking-indicator">
                                        <div class="dot"></div>
                                        <div class="dot"></div>
                                        <div class="dot"></div>
                                    </div>  
                                </div>`;

        const incomingMessageDiv = createMessageElement(messageContent, "bot-welcome", "thinking");
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
        generateBotResponse(incomingMessageDiv);
    }, 500);
}

// to send the message when send button is clicked
const sendMessageButton = document.querySelector('#send-message');
sendMessageButton.addEventListener('click', (e) => handleOutgoingMessage(e))

// file upload button functionality
const fileInput = document.querySelector('#file-input');
document.querySelector('#file-upload').addEventListener('click', () => fileInput.click());

// to receive the selected file
fileInput.addEventListener('change', () => {
    const selectedFile = fileInput.files[0];
    if (!selectedFile) return;

    // converting file to `base64` string
    const reader = new FileReader();
    // FileReader is an inbuilt special class that helps to read the contents of files stored on the user's computer.
    reader.onload = (e) => {
        fileUploadWrapper.querySelector('img').src = e.target.result; // preview selected image
        fileUploadWrapper.classList.add('file-uploaded');
        const base64String = e.target.result.split(',')[1]; // Extract base64 string without metadata

        // store file data in userData object
        userData.file = {
            data: base64String,
            mime_type: selectedFile.type
        }
        fileInput.value = ""; // reset file input
    }

    // onload is an event handler property of the FileReader object. It stores a function that will run automatically 
    // when the file has been successfully read.  

    reader.readAsDataURL(selectedFile);
})

// to cancel the selected file
const fileCancelButton = document.querySelector('#file-cancel');
fileCancelButton.addEventListener('click', () => {
    userData.file = {};
    fileUploadWrapper.classList.remove('file-uploaded'); 
});  

// initialising emoji picker
const picker = new EmojiMart.Picker( {
    theme: 'light',
    skinTonePosition: 'none',
    previewPosition: 'none',
    onClickOutside: (e) => {
        if(e.target.id === "emoji-picker") {
            document.body.classList.toggle("show-emoji-picker");
        } else {
            document.body.classList.remove("show-emoji-picker");
        }
    },
    // handle emoji selection
    onEmojiSelect: (emoji) => {
        const { selectionStart: start, selectionEnd: end } = messageInput;
        messageInput.setRangeText(emoji.native, start, end, 'end');
        messageInput.focus();
    }
});

document.querySelector('.chat-form').appendChild(picker);

// to toggle the chatbot popup when clicked
const chatbotToggler = document.querySelector('#chatbot-toggler');
chatbotToggler.addEventListener('click', () => document.body.classList.toggle('show-chatbot'));

const closeChatbot = document.querySelector('#close-chatbot');
closeChatbot.addEventListener('click', () => document.body.classList.remove('show-chatbot'));