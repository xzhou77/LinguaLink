// LinguaLink script.js — show target voices + logout to login page
const USER_CREDENTIALS = { username: 'user', password: 'test' };

let currentUser = null;
let conversationActive = false;
let currentSpeaker = 'user1';
let recognitionActive = false;

const languageSettings = {
  user1: 'en-US',
  user2: 'zh-CN'
};

const voiceSettings = {
  user1: null,
  user2: null
};

let voices = [];

// Page Elements
const loginPage = document.getElementById("login-try");
const mainPage = document.getElementById("xm-chat");
const settingsPage = document.getElementById("settings-page");
const loginButton = document.getElementById("login_button");
const accountButton = document.getElementById("xm_login_menu");
const settingsButton = document.getElementById("xm_voice_menu");
const backToChatButton = document.getElementById("back-to-chat");

const startBtn = document.getElementById("start-btn");
const clearBtn = document.getElementById("clear-btn");
const messagesContainer = document.getElementById("messages-container");
const statusText = document.getElementById("status-text");

const user1NameField = document.getElementById("user1-name");
const user2NameField = document.getElementById("user2-name");
const user1Lang = document.getElementById("user1-lang");
const user2Lang = document.getElementById("user2-lang");
const user1Voice = document.getElementById("user1-voice");
const user2Voice = document.getElementById("user2-voice");
const user1Mute = document.getElementById("user1-mute");
const user2Mute = document.getElementById("user2-mute");

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;
recognition.interimResults = false;

const synth = window.speechSynthesis;
let utter = new SpeechSynthesisUtterance();

window.addEventListener("DOMContentLoaded", () => {
  mainPage.style.display = "none";
  settingsPage.style.display = "none";
  loginPage.style.display = "flex";
  setupListeners();
  loadVoices();
});

function setupListeners() {
  loginButton.addEventListener("click", handleLogin);
  accountButton.addEventListener("click", () => togglePages("login"));
  settingsButton.addEventListener("click", () => togglePages("settings"));
  backToChatButton.addEventListener("click", () => togglePages("chat"));

  startBtn.addEventListener("click", toggleMic);
  clearBtn.addEventListener("click", clearMessages);

  user1Lang.addEventListener("change", () => {
    languageSettings.user1 = user1Lang.value;
    populateVoiceOptions("user2"); // update voices for target
  });
  user2Lang.addEventListener("change", () => {
    languageSettings.user2 = user2Lang.value;
    populateVoiceOptions("user1"); // update voices for target
  });

  user1Voice.addEventListener("change", () => {
    voiceSettings.user2 = voices.find(v => v.name === user1Voice.value);
  });
  user2Voice.addEventListener("change", () => {
    voiceSettings.user1 = voices.find(v => v.name === user2Voice.value);
  });

  recognition.onresult = handleResult;
  recognition.onerror = err => {
    console.error(`Speech Recognition Error: ${err.error}`);
    appendTranslation(`[Speech error: ${err.error}]`);
    stopMic();
  };
  recognition.onend = () => {
    if (recognitionActive) stopMic();
  };
  synth.onvoiceschanged = loadVoices;
}

function togglePages(page) {
  loginPage.style.display = page === "login" ? "flex" : "none";
  mainPage.style.display = page === "chat" ? "block" : "none";
  settingsPage.style.display = page === "settings" ? "block" : "none";
}

function handleLogin() {
  const username = document.getElementById("username-field").value;
  const password = document.getElementById("password-field").value;
  if (username === USER_CREDENTIALS.username && password === USER_CREDENTIALS.password) {
    currentUser = username;
    togglePages("chat");
  } else {
    alert("Invalid username or password.");
  }
}

function toggleMic() {
  recognitionActive ? stopMic() : startMic();
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
      const voice = voiceSettings[targetUser];
      if (voice) utter.voice = voice;
      synth.speak(utter);
    }
  }).finally(() => {
    currentSpeaker = targetUser;
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

function loadVoices() {
  voices = synth.getVoices();
  populateVoiceOptions('user1');
  populateVoiceOptions('user2');
}

function populateVoiceOptions(userKey) {
  const targetLang = userKey === 'user1' ? languageSettings.user2 : languageSettings.user1;
  const select = userKey === 'user1' ? user1Voice : user2Voice;
  select.innerHTML = "";

  voices.filter(v => v.lang === targetLang).forEach(voice => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = voice.name;
    select.appendChild(option);
  });

  if (select.options.length > 0) {
    select.selectedIndex = 0;
    const voice = voices.find(v => v.name === select.value);
    if (userKey === 'user1') voiceSettings.user2 = voice;
    if (userKey === 'user2') voiceSettings.user1 = voice;
  }
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
}
