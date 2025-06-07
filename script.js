// LinguaLink logic.js with manual mic control per user turn
const USER_CREDENTIALS = { username: 'user', password: 'test' };

let currentUser = null;
let conversationActive = false;
let currentSpeaker = 'user1';
let recognitionActive = false;

const languageSettings = {
  user1: 'en-US',
  user2: 'zh-CN'
};

const loginPage = document.getElementById("login-try");
const mainPage = document.getElementById("xm-chat");
const loginButton = document.getElementById("login_button");
const accountButton = document.getElementById("xm_login_menu");
const startBtn = document.getElementById("start-btn");
const clearBtn = document.getElementById("clear-btn");
const messagesContainer = document.getElementById("messages-container");
const statusText = document.getElementById("status-text");

const user1NameField = document.getElementById("user1-name");
const user2NameField = document.getElementById("user2-name");
const user1Lang = document.getElementById("user1-lang");
const user1Mute = document.getElementById("user1-mute");
const user2Lang = document.getElementById("user2-lang");
const user2Mute = document.getElementById("user2-mute");

const user1Card = document.getElementById("user1-card");
const user2Card = document.getElementById("user2-card");
const user1Status = document.getElementById("user1-status");
const user2Status = document.getElementById("user2-status");

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;
recognition.interimResults = false;

const synth = window.speechSynthesis;
let utter = new SpeechSynthesisUtterance();

window.addEventListener("DOMContentLoaded", () => {
  mainPage.style.display = "none";
  loginPage.style.display = "flex";
  setupListeners();
});

function setupListeners() {
  loginButton.addEventListener("click", handleLogin);
  accountButton.addEventListener("click", () => togglePages("login"));
  startBtn.addEventListener("click", toggleMic);
  clearBtn.addEventListener("click", clearMessages);

  [user1Lang, user2Lang].forEach(el => {
    el.addEventListener("change", () => {
      languageSettings.user1 = user1Lang.value;
      languageSettings.user2 = user2Lang.value;
    });
  });

  recognition.onresult = handleResult;
  recognition.onerror = err => {
    console.error(`Speech Recognition Error: ${err.error}`);
    appendTranslation(`[Speech error: ${err.error}]`);
    stopMic();
  };

  recognition.onend = () => {
    if (recognitionActive) {
      stopMic();
    }
  };
}

function togglePages(page) {
  loginPage.style.display = page === "login" ? "flex" : "none";
  mainPage.style.display = page === "main" ? "block" : "none";
}

function handleLogin() {
  const username = document.getElementById("username-field").value;
  const password = document.getElementById("password-field").value;

  if (username === USER_CREDENTIALS.username && password === USER_CREDENTIALS.password) {
    currentUser = username;
    togglePages("main");
  } else {
    alert("Invalid username or password.");
  }
}

function toggleMic() {
  if (recognitionActive) {
    stopMic();
  } else {
    startMic();
  }
}

function startMic() {
  conversationActive = true;
  recognition.lang = languageSettings[currentSpeaker];
  recognitionActive = true;
  recognition.start();
  updateUI();
}

function stopMic() {
  recognitionActive = false;
  recognition.stop();
  updateUI();
}

function handleResult(e) {
  const text = e.results[0][0].transcript.trim();
  if (!text) return;

  const speakerName = currentSpeaker === 'user1' ? user1NameField.value || 'User 1' : user2NameField.value || 'User 2';
  appendMessage(speakerName, text);

  const targetUser = currentSpeaker === 'user1' ? 'user2' : 'user1';
  const targetLang = languageSettings[targetUser];

  translate(text, targetLang).then(translated => {
    appendTranslation(translated);
    const mute = targetUser === 'user1' ? user1Mute.checked : user2Mute.checked;
    if (!mute) {
      utter.text = translated;
      utter.lang = targetLang;
      synth.speak(utter);
    }
  }).finally(() => {
    currentSpeaker = currentSpeaker === 'user1' ? 'user2' : 'user1';
    updateUI();
  });
}

async function translate(text, targetLang) {
  const response = await fetch('http://localhost:8000/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang })
  });
  const data = await response.json();
  return data.translatedText;
}

function appendMessage(name, text) {
  const msg = document.createElement("div");
  msg.className = "mb-2";
  msg.innerHTML = `<strong>${name}:</strong> ${text}`;
  messagesContainer.appendChild(msg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendTranslation(text) {
  const msg = document.createElement("div");
  msg.className = "mb-2 text-muted";
  msg.innerHTML = `<em>${text}</em>`;
  messagesContainer.appendChild(msg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function clearMessages() {
  messagesContainer.innerHTML = "";
}

function updateUI() {
  const isUser1 = currentSpeaker === 'user1';
  const name = isUser1 ? user1NameField.value || 'User 1' : user2NameField.value || 'User 2';
  statusText.textContent = recognitionActive ? `${name} is speaking... (Click to stop)` : `${name}'s turn (Click to start)`;

  startBtn.className = recognitionActive ? "btn btn-danger btn-lg rounded-circle" : "btn btn-primary btn-lg rounded-circle";
  startBtn.innerHTML = recognitionActive ? '<i class="fas fa-microphone-slash"></i>' : '<i class="fas fa-microphone"></i>';

  user1Card.style.backgroundColor = isUser1 ? '#d1e7dd' : '#ffffff';
  user2Card.style.backgroundColor = !isUser1 ? '#cfe2ff' : '#ffffff';
  user1Status.textContent = isUser1 ? (recognitionActive ? 'Speaking' : 'Ready') : 'Waiting';
  user2Status.textContent = !isUser1 ? (recognitionActive ? 'Speaking' : 'Ready') : 'Waiting';
}

