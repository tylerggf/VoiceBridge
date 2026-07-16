const languages = [
  { code: 'en-US', label: 'English' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'ar-SA', label: 'Arabic' }
];

const inputSelect = document.getElementById('input-language');
const outputSelect = document.getElementById('output-language');
const recordButton = document.getElementById('record-button');
const resetButton = document.getElementById('reset-button');
const playButton = document.getElementById('play-button');
const statusChip = document.getElementById('record-status');
const translateStatus = document.getElementById('translate-status');
const transcriptField = document.getElementById('transcript');
const translationField = document.getElementById('translation');
const voiceSelect = document.getElementById('voice-selection');

let recognition = null;
let isRecording = false;
let accumulatedTranscript = '';
let availableVoices = [];

function updateStatus(message) {
  statusChip.textContent = message;
}

function updateTranslateStatus(message) {
  translateStatus.textContent = message;
}

function initLanguageDropdowns() {
  languages.forEach((language) => {
    const inputOption = document.createElement('option');
    inputOption.value = language.code;
    inputOption.textContent = language.label;
    inputSelect.appendChild(inputOption);

    const outputOption = document.createElement('option');
    outputOption.value = language.code;
    outputOption.textContent = language.label;
    outputSelect.appendChild(outputOption);
  });

  inputSelect.value = 'en-US';
  outputSelect.value = 'es-ES';
}

function getSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return null;
  }
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = inputSelect.value;
  return recognition;
}

function getLocaleCode(locale) {
  return locale.split('-')[0].toLowerCase();
}

function getVoiceId(voice) {
  return voice.voiceURI || `${voice.name}::${voice.lang}`;
}

function findVoiceById(id) {
  return availableVoices.find((voice) => getVoiceId(voice) === id || voice.name === id) || null;
}

function getBestVoice(locale) {
  const normalized = locale.toLowerCase();
  const primaryCode = normalized.split('-')[0];
  const exactMatch = availableVoices.find((voice) => voice.lang.toLowerCase() === normalized);
  if (exactMatch) {
    return exactMatch;
  }
  const primaryMatch = availableVoices.find((voice) => voice.lang.toLowerCase().startsWith(primaryCode));
  if (primaryMatch) {
    return primaryMatch;
  }
  return availableVoices.find((voice) => voice.default) || availableVoices[0] || null;
}

function populateVoices() {
  availableVoices = window.speechSynthesis.getVoices().sort((a, b) => a.name.localeCompare(b.name));
  const currentValue = voiceSelect.value;
  voiceSelect.innerHTML = '<option value="auto">Auto select best voice</option>';

  availableVoices.forEach((voice) => {
    const option = document.createElement('option');
    option.value = getVoiceId(voice);
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });

  if (availableVoices.length === 0) {
    voiceSelect.innerHTML = '<option value="auto">No voices available yet</option>';
    voiceSelect.disabled = true;
  } else {
    voiceSelect.disabled = false;
  }

  if (currentValue && currentValue !== 'auto') {
    const selectedOption = Array.from(voiceSelect.options).find((item) => item.value === currentValue);
    if (selectedOption) {
      selectedOption.selected = true;
    }
  }

  setPreferredVoice(outputSelect.value);
}

function setPreferredVoice(locale) {
  if (voiceSelect.value !== 'auto') {
    return;
  }
  const bestVoice = getBestVoice(locale);
  if (!bestVoice) {
    return;
  }
  const option = Array.from(voiceSelect.options).find((item) => item.value === getVoiceId(bestVoice));
  if (option) {
    option.selected = true;
  }
}

function getSelectedVoice() {
  if (voiceSelect.value === 'auto') {
    return getBestVoice(outputSelect.value);
  }
  return findVoiceById(voiceSelect.value) || getBestVoice(outputSelect.value);
}

async function translateText(text) {
  if (!text.trim()) {
    translationField.value = '';
    return;
  }

  const source = getLocaleCode(inputSelect.value);
  const target = getLocaleCode(outputSelect.value);

  translationField.value = '';
  updateTranslateStatus('Translating...');

  if (source === target) {
    translationField.value = text;
    updateTranslateStatus('Ready');
    return;
  }

  const endpoints = [
    'https://libretranslate.com/translate',
    'https://libretranslate.de/translate'
  ];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          q: text,
          source,
          target,
          format: 'text'
        })
      });

      const payload = await response.text();
      if (!response.ok) {
        lastError = new Error(`Translation endpoint ${endpoint} failed: ${response.status} ${response.statusText} - ${payload}`);
        console.warn(lastError);
        continue;
      }

      const data = JSON.parse(payload);
      if (data.translatedText) {
        translationField.value = data.translatedText;
        updateTranslateStatus('Ready');
        return;
      }

      lastError = new Error(`Translation endpoint ${endpoint} returned invalid payload: ${payload}`);
      console.warn(lastError);
    } catch (error) {
      lastError = error;
      console.warn('Translation endpoint error:', endpoint, error);
    }
  }

  console.error('Translation error:', lastError);
  translationField.value = text;
  updateTranslateStatus('Translation failed');
}

function speakText(text, language) {
  if (!window.speechSynthesis) {
    alert('Speech synthesis not supported in this browser.');
    return;
  }

  if (!text.trim()) {
    updateTranslateStatus('No text to play');
    return;
  }

  if (availableVoices.length === 0) {
    populateVoices();
  }

  const voice = getSelectedVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.lang = language;

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || language;
  }

  utterance.onstart = () => updateTranslateStatus('Playing audio');
  utterance.onend = () => updateTranslateStatus('Ready');
  utterance.onerror = (event) => {
    updateTranslateStatus('Speech playback error');
    console.error('Speech error:', event.error || event);
  };

  const speak = () => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      updateTranslateStatus('Speech playback failed');
      console.error('Speak failure:', error);
    }
  };

  if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
    window.speechSynthesis.cancel();
    setTimeout(speak, 150);
  } else {
    speak();
  }
}

function resetTranslator() {
  if (isRecording && recognition) {
    recognition.stop();
  }
  accumulatedTranscript = '';
  transcriptField.value = '';
  translationField.value = '';
  updateStatus('Idle');
  updateTranslateStatus('Waiting');
}

function initialize() {
  initLanguageDropdowns();

  if ('speechSynthesis' in window) {
    populateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
    setTimeout(populateVoices, 200);
    setTimeout(populateVoices, 500);
    setTimeout(populateVoices, 1000);
  } else {
    voiceSelect.innerHTML = '<option value="auto">Speech synthesis unsupported</option>';
    voiceSelect.disabled = true;
  }

  if (recordButton) {
    recordButton.addEventListener('click', async () => {
      if (isRecording && recognition) {
        recognition.stop();
        return;
      }

      recognition = getSpeechRecognition();
      if (!recognition) {
        updateStatus('Speech recognition not supported');
        return;
      }

      recognition.lang = inputSelect.value;
      recognition.onstart = () => {
        isRecording = true;
        recordButton.textContent = 'Stop recording';
        updateStatus('Listening...');
        updateTranslateStatus('Translating...');
      };

      recognition.onresult = async (event) => {
        let interimTranscript = '';
        let sawFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) {
            accumulatedTranscript += `${result[0].transcript} `;
            sawFinal = true;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        transcriptField.value = `${accumulatedTranscript}${interimTranscript}`;
        if (sawFinal && accumulatedTranscript.trim()) {
          await translateText(accumulatedTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        updateStatus(`Error: ${event.error}`);
        isRecording = false;
        recordButton.textContent = 'Start recording';
      };

      recognition.onend = () => {
        isRecording = false;
        recordButton.textContent = 'Start recording';
        updateStatus('Idle');
        updateTranslateStatus(transcriptField.value.trim() ? 'Ready' : 'No speech detected');
      };

      recognition.start();
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', resetTranslator);
  }

  if (playButton) {
    playButton.addEventListener('click', () => {
      if (!translationField.value.trim()) {
        updateTranslateStatus('No translation to play');
        return;
      }
      speakText(translationField.value, outputSelect.value);
    });
  }

  outputSelect.addEventListener('change', async () => {
    setPreferredVoice(outputSelect.value);
    if (transcriptField.value.trim()) {
      await translateText(transcriptField.value.trim());
    }
  });

  inputSelect.addEventListener('change', async () => {
    if (transcriptField.value.trim()) {
      await translateText(transcriptField.value.trim());
    }
  });

  voiceSelect.addEventListener('change', () => {
    if (translationField.value.trim()) {
      updateTranslateStatus('Voice updated');
    }
  });

  updateStatus('Idle');
  updateTranslateStatus('Waiting');
}

initialize();
