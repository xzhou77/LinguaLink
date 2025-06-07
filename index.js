// main page
const loginButton = document.getElementById("xm_login_menu");
const voiceButton = document.getElementById("xm_voice_menu");
const chatButton = document.getElementById("xm_mute_menu");
const langButton = document.getElementById("xm_lang_menu");

// login page
const loginButton1 = document.getElementById("login_button");

// voice page
const backButton = document.getElementById("xm_chat_menu");

// user and password
var uname =   'user';
var passwd = 'test';

//Current settings
var repeated = 0;
var cs_settings = {lang : "zh-CN", mute: "no", start: "off"};

const startBtn = document.querySelector("#start-btn");

const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.lang = cs_settings.lang;
recognition.interimResults = false;
recognition.maxAlternatives = 1;

const synth = window.speechSynthesis;

/* async function callollama(promptText) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3',  // Or another model you have pulled
      prompt: promptText,
      stream: false      // Set to true if you want streaming responses
    })
  });

  const data = await response.json();
  console.log('Ollama Response:', data.response);
  return data.response;

};
*/

async function translate(text, targetL) {
  const response = await fetch('http://localhost:8000/translate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ 'text': text, 'targetLang': targetL })
  });
  const data = await response.json();
  return data.translatedText;
}

function getDefaultVoiceForLanguage(lang) {
  const voices = speechSynthesis.getVoices();
  // Try to find a default voice for the language
  let voice = voices.find(v => v.lang.startsWith(lang) && v.default);
  // Fallback: first available voice for the language
  if (!voice) voice = voices.find(v => v.lang.startsWith(lang));
  return voice;
}


let utter = new SpeechSynthesisUtterance("Hi, how are you?");
let current_volume = 0.8;

let turn = 0; // 0 = User1 (Chinese), 1 = User2 (English)

utter.onend = () => {
  // Turn button background to black after speaking
  startBtn.style.backgroundColor = "black";
  cs_settings.start = "off";
};

recognition.onresult = async (e) => {
    const transcript = e.results[e.results.length - 1][0].transcript.trim();
    const messageArea = document.querySelector("#messages");
    const messageUser = document.createElement("div");
    const messageBot = document.createElement("div");

    messageBot.style.textAlign = "right";
    messageBot.style.backgroundColor = "#ddd";
    messageUser.classList.add("container");
    messageBot.classList.add("container");

    recognition.stop();

    if (turn % 2 === 0) {
        // User1 speaks Chinese
        messageUser.innerText = "User1 (Chinese): " + transcript + " ------ English: ";
        // const translated = await callollama('translate "' + transcript + '" to English, and reply the answer only');
        const translated = await translate(transcript, 'en');
        messageUser.innerText += translated;
        utter.voice = getDefaultVoiceForLanguage('en');
        utter.text = translated;
    } else {
        // User2 speaks English
        messageUser.innerText = "User2 (English): " + transcript + " ------ Chinese: ";
        // const translated = await callollama('translate "' + transcript + '" to Chinese and return the Chinese characters only');
        const translated = await translate(transcript, 'zh-CN');
        messageUser.innerText += translated;
        utter.voice = getDefaultVoiceForLanguage('zh');
        utter.text = translated;
    }

    messageArea.appendChild(messageUser);

    if (cs_settings.mute === "no") {
        synth.speak(utter);
    } else {
        utter.volume = 0;
        synth.speak(utter);
        utter.volume = current_volume;
    }

    turn++; // switch turn

    /* Always scroll to the latest */
    messageArea.scrollTop = messageArea.scrollHeight;
};
/*
utter.onend = () => {
    if (document.getElementById("xm-chat").style.display != "none") {
            recognition.start();
    }    
};
*/
/* Bot reponses to the user interactively */
/* recognition.onresult = async (e) => {
    const transcript = e.results[e.results.length - 1][0].transcript.trim();
    const messageArea = document.querySelector("#messages");
    const message1 = document.createElement("div");
    const message2 = document.createElement("div");
    message2.style.textAlign ="right";
    message2.style.backgroundColor ="#ddd";

    recognition.stop();
    message1.innerText="You:  "+ transcript ;
    message1.innerText = message1.innerText + " ------ English : ";
    const translate_result = await callollama('translate "' +  transcript  + '" to English, and reply the answer only');
    message1.innerText = message1.innerText + translate_result;
    message1.classList.add("container");
    messageArea.appendChild(message1);
    utter.text = translate_result;
    synth.speak(utter);
    
    recognition.start();
    const transcript2 = e.results[e.results.length - 1][0].transcript.trim();
    recognition.stop();
    const translate2 =  await callollama('translate "' +  transcript2  + '" to Chinese, and reply the answer only');
    utter.text = translate2;
    message2.innerText = transcript2 + " ------ Chinese: ";
    message2.innerText = message2.innerText + translate2;
    message2.innerText = message2.innerText + " :ROBO";
    message2.classList.add("container");
    messageArea.appendChild(message2);
    
    if (cs_settings.mute === "no") {
        synth.speak(utter);
    } else {
        utter.volume = 0;
        synth.speak(utter);
        utter.volume = current_volume;
    }

    // Always scroll to the latest
    messageArea.scrollTop = messageArea.scrollHeight;
};
*/
/*====================================================================================
============================= Select Voice =========================================*/

let voices = [];
window.speechSynthesis.onvoiceschanged = () => {
  voices = window.speechSynthesis.getVoices();
  utter.voice = voices[0];
  let voiceSelect = document.querySelector("#v_voices");
  voices.forEach((voice, i) => (voiceSelect.options[i] = new Option(voice.name, i)));
};

document.querySelector("#v_rate").addEventListener("input", () => {
  const rate = document.querySelector("#v_rate").value;
  utter.rate = rate;
  document.querySelector("#rate-label").innerHTML = rate;
});

document.querySelector("#v_volume").addEventListener("input", () => {
  const volume = document.querySelector("#v_volume").value;
  utter.volume = volume;
  document.querySelector("#volume-label").innerHTML = volume;
});

document.querySelector("#v_pitch").addEventListener("input", () => {
  const pitch = document.querySelector("#v_pitch").value;
  utter.pitch = pitch;
  document.querySelector("#pitch-label").innerHTML = pitch;
});

document.querySelector("#v_voices").addEventListener("change", () => {
  utter.voice = voices[document.querySelector("#v_voices").value];
});

document.querySelector("#v_start").addEventListener("click", () => {
  utter.text = document.querySelector("#trytext").value;
  window.speechSynthesis.speak(utter);
});

document.querySelector("#v_pause").addEventListener("click", () => {
  window.speechSynthesis.pause();
});

document.querySelector("#v_resume").addEventListener("click", () => {
  window.speechSynthesis.resume();
});

document.querySelector("#v_cancel").addEventListener("click", () => {
  window.speechSynthesis.cancel();
});

/*==================== Login page ==================================*/

loginButton1.addEventListener("click", (e) => {
    e.preventDefault();
    const username = document.getElementById("username-field").value;
    const password = document.getElementById("password-field").value;
  
    alert("The assistant will response only if the credential is valid.");

    uname = username;
    passwd = password;
  
    document.getElementById("login-try").style.display = "none";
    document.getElementById("xm-chat").style.display = "inline";
  
  })

/*==================== switch between pages ==========================*/

voiceButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (cs_settings.start === "on") {
        cs_settings.start = "off";
       // startBtn.innerHTML = "Start ";
        startBtn.innerHTML = '<img src= "assets/stop-circle.svg" />';
        startBtn.style.backgroundColor = "black";
        recognition.stop();
    }
    document.getElementById("xm-voice").style.display = "inline";
    document.getElementById("xm-chat").style.display = "none";
    document.getElementById("login-try").style.display = "none";
    
})

loginButton.addEventListener("click", (e) => {
    e.preventDefault();

    document.getElementById("xm-voice").style.display = "none";
    document.getElementById("xm-chat").style.display = "none";
    document.getElementById("login-try").style.display = "inline";
})

backButton.addEventListener("click", (e) => {
    e.preventDefault();

    document.getElementById("xm-voice").style.display = "none";
    document.getElementById("xm-chat").style.display = "inline";
    document.getElementById("login-try").style.display = "none";
})

// Start/Stop button in main page
startBtn.addEventListener("click", () => {
    if (cs_settings.start === "off") {
        cs_settings.start = "on";
      //  startBtn.innerHTML = "Stop ";
        startBtn.innerHTML ='<img src= "assets/stop-circle.svg" />'
        startBtn.style.backgroundColor = "red";
        recognition.start();
      } else {
        cs_settings.start = "off";
     //   startBtn.innerHTML = "Start ";
        startBtn.style.backgroundColor = "black";
        recognition.stop();
      }
});

// Mute button in main page
chatButton.addEventListener("click", (e) => {
    e.preventDefault();

    if (cs_settings.mute === "no") {
      cs_settings.mute = "yes";
      chatButton.innerHTML = "Muted";
    } else {
      cs_settings.mute = "no";
      chatButton.innerHTML = "Mute";
    }
})

// Language button in the main page
langButton.addEventListener("click", (e) => {
    e.preventDefault();

    if (cs_settings.lang === "en-US") {
      cs_settings.lang = "zh-CN";
      langButton.innerHTML = "Eng  ";
    } else {
      cs_settings.lang = "en-US";
      langButton.innerHTML = "Chn  ";
    }
    recognition.lang = cs_settings.lang;
    synth.lang = cs_settings.lang;
})