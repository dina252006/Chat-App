const socket = io();

const joinSection = document.getElementById('join-section');
const joinForm = document.getElementById('join-form');
const chatSection = document.getElementById('chat-section');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const messageContainer = document.getElementById('message-container');
const emojiPicker = document.getElementById('emoji-picker');
let username, room;

joinForm.style.display = 'block';

joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    username = document.getElementById('username').value;
    room = document.getElementById('room').value;
    socket.emit('join', { username, room });
    joinSection.style.display = 'none';
    chatSection.style.display = 'block';
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;

    if (message) {
        socket.emit('chat message', { room, username, message });
        messageInput.value = '';
    }
});

socket.on("old messages", (messages) => {
    messages.forEach((msg) => {
        displayMessage(msg);
    });
});

socket.on('chat message', (msg) => {
    displayMessage(msg);
});

function displayMessage(msg) {
    const item = document.createElement('li');
    item.classList.add('message');

    item.textContent = `${msg.username}: ${msg.message}`;

    if (username === msg.username) {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', () => {
            console.log(`Attempting to delete message with ID: ${msg.rowid}`);
            socket.emit('delete message', { messageId: msg.rowid, username });
            item.remove();
        });
        item.appendChild(deleteButton);
    }

    messageContainer.appendChild(item);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

document.addEventListener('click', (e) => {
    if (!emojiPicker.contains(e.target) && !e.target.classList.contains('emojis')) {
        emojiPicker.style.display = 'none';
    }
});

function addEmoji(emoji) {
    const input = messageInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, start) + emoji + input.value.substring(end);
    input.focus();
    input.setSelectionRange(start + emoji.length, start + emoji.length);
}

document.querySelector('.emojis').addEventListener('click', () => {
    emojiPicker.style.display = emojiPicker.style.display === 'block' ? 'none' : 'block';
});
