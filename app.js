/* ============================================================
   VoiceBridge (static / Live-Server build)
   Ported from the original Next.js app's lib/ hooks and server
   providers, with no build step - just open index.html.
   ============================================================ */

(() => {
  "use strict";

  // ---------------------------------------------------------
  // Language data (ported from shared/types.ts)
  // ---------------------------------------------------------
  const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "fr", label: "French" },
    { code: "es", label: "Spanish" },
    { code: "de", label: "German" },
    { code: "it", label: "Italian" },
    { code: "pt", label: "Portuguese" },
    { code: "ja", label: "Japanese" },
    { code: "zh", label: "Chinese" },
    { code: "ko", label: "Korean" },
    { code: "ar", label: "Arabic" },
    { code: "hi", label: "Hindi" },
    { code: "ru", label: "Russian" },
    { code: "uk", label: "Ukrainian" },
    { code: "tr", label: "Turkish" },
    { code: "nl", label: "Dutch" },
    { code: "sv", label: "Swedish" },
    { code: "pl", label: "Polish" },
    { code: "vi", label: "Vietnamese" },
    { code: "th", label: "Thai" },
    { code: "id", label: "Indonesian" },
  ];

  const SPEECH_LOCALE = {
    en: "en-US", fr: "fr-FR", es: "es-ES", de: "de-DE", it: "it-IT",
    pt: "pt-PT", ja: "ja-JP", zh: "zh-CN", ko: "ko-KR", ar: "ar-SA",
    hi: "hi-IN", ru: "ru-RU", uk: "uk-UA", tr: "tr-TR", nl: "nl-NL",
    sv: "sv-SE", pl: "pl-PL", vi: "vi-VN", th: "th-TH", id: "id-ID",
  };

  // Tiny built-in phrasebook used ONLY if LibreTranslate is unreachable
  // (offline, rate-limited, CORS-blocked) - same "never silently fail"
  // philosophy as the original server's MockTranslationProvider, just
  // ported client-side since there's no backend here to fall back through.
  const MOCK_PHRASES = {
    "hello": { es: "hola", fr: "bonjour", de: "hallo", it: "ciao", ja: "こんにちは", zh: "你好", pt: "olá" },
    "thank you": { es: "gracias", fr: "merci", de: "danke", it: "grazie", ja: "ありがとう", zh: "谢谢", pt: "obrigado" },
    "goodbye": { es: "adiós", fr: "au revoir", de: "auf wiedersehen", it: "arrivederci", ja: "さようなら", zh: "再见", pt: "adeus" },
  };

  // ---------------------------------------------------------
  // Small utilities
  // ---------------------------------------------------------
  const $ = (id) => document.getElementById(id);

  function toast(message, isError = false) {
    const el = $("toast");
    el.textContent = message;
    el.classList.toggle("error", isError);
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ---------------------------------------------------------
  // View routing
  // ---------------------------------------------------------
  const startupOverlay = $("startupSplash");

  function showView(name) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach((n) => n.classList.remove("active"));
    const view = $("view-" + name);
    if (view) view.classList.add("active");
    const nav = document.querySelector(`.nav-link[data-view="${name}"]`);
    if (nav) nav.classList.add("active");
    if (name === "history") renderHistory();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function hideStartup() {
    if (!startupOverlay) return;
    startupOverlay.classList.remove("active");
    document.body.classList.remove("startup-open");
  }

  function bindStartupActions() {
    document.querySelectorAll(".startup-action").forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        showView(view || "home");
        hideStartup();
      });
    });
  }

  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.goto));
  });

  bindStartupActions();

  // ---------------------------------------------------------
  // Theme toggle (persisted)
  // ---------------------------------------------------------
  const THEME_KEY = "voicebridge-theme";
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    $("themeToggle").textContent = theme === "dark" ? "🌙" : "☀️";
    localStorage.setItem(THEME_KEY, theme);
  }
  $("themeToggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
  applyTheme(localStorage.getItem(THEME_KEY) || "dark");

  // ---------------------------------------------------------
  // History (localStorage) - schema matches the original
  // client/lib/history.ts so this is a drop-in continuation
  // ---------------------------------------------------------
  const HISTORY_KEY = "voicebridge-history";
  const HISTORY_MAX = 500;

  function readHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  function writeHistory(entries) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-HISTORY_MAX)));
    } catch {
      // storage full/unavailable - history just won't persist this session
    }
  }
  function addHistoryEntry(entry) {
    const full = { ...entry, id: uuid() };
    const all = readHistory();
    all.push(full);
    writeHistory(all);
    return full;
  }
  function getHistory() {
    return readHistory().slice().reverse();
  }
  function searchHistory(query) {
    const q = query.trim().toLowerCase();
    if (!q) return getHistory();
    return getHistory().filter(
      (e) => e.originalText.toLowerCase().includes(q) || e.translatedText.toLowerCase().includes(q)
    );
  }
  function deleteHistoryEntry(id) {
    writeHistory(readHistory().filter((e) => e.id !== id));
  }
  function clearHistoryAll() {
    writeHistory([]);
  }
  function downloadHistoryJSON() {
    const data = JSON.stringify(getHistory(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voicebridge-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderHistory(filter = "") {
    const list = $("historyList");
    const entries = filter ? searchHistory(filter) : getHistory();
    list.innerHTML = "";

    if (entries.length === 0) {
      list.innerHTML = `<div class="history-empty">No history yet — translations you make will show up here.</div>`;
      return;
    }

    for (const e of entries) {
      const item = document.createElement("div");
      item.className = "history-item";
      const date = new Date(e.timestamp).toLocaleString();
      item.innerHTML = `
        <div class="history-text">
          <div class="history-meta">${date} · ${e.sourceLang.toUpperCase()} → ${e.targetLang.toUpperCase()}${e.speaker ? " · Speaker " + e.speaker : ""}</div>
          <div class="history-original">${escapeHtml(e.originalText)}</div>
          <div class="history-translated">${escapeHtml(e.translatedText)}</div>
        </div>
        <div class="history-actions">
          <button class="icon-btn copy-btn" title="Copy translation">📋</button>
          <button class="icon-btn delete-btn" title="Delete">🗑️</button>
        </div>
      `;
      item.querySelector(".copy-btn").addEventListener("click", () => {
        navigator.clipboard?.writeText(e.translatedText).then(() => toast("Copied to clipboard"));
      });
      item.querySelector(".delete-btn").addEventListener("click", () => {
        deleteHistoryEntry(e.id);
        renderHistory($("historySearch").value);
      });
      list.appendChild(item);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  $("historySearch").addEventListener("input", (e) => renderHistory(e.target.value));
  $("downloadHistory").addEventListener("click", downloadHistoryJSON);
  $("clearHistory").addEventListener("click", () => {
    if (confirm("Clear all translation history? This can't be undone.")) {
      clearHistoryAll();
      renderHistory();
    }
  });

  // ---------------------------------------------------------
  // Translation (LibreTranslate direct call, mock fallback)
  //
  // HONEST CAVEAT: this calls LibreTranslate straight from the
  // browser since there's no backend in this static build. The
  // original architecture called it from a Node server instead,
  // which never hits CORS at all. A public API called directly
  // from a browser can be blocked by CORS or rate limits that a
  // server-side call wouldn't see - if translations keep failing,
  // point LIBRETRANSLATE_URL (below) at a self-hosted instance
  // with CORS enabled, or expect the mock fallback to kick in.
  // ---------------------------------------------------------
  const LIBRETRANSLATE_URLS = [
    "https://libretranslate.com",
    "https://libretranslate.de",
  ];

  async function translateText(text, sourceLang, targetLang) {
    if (!text.trim()) return { translatedText: "", usedMock: false };

    // Try multiple LibreTranslate endpoints first (some public instances are more reliable)
    for (const base of LIBRETRANSLATE_URLS) {
      try {
        const response = await fetch(`${base}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: text, source: sourceLang, target: targetLang, format: "text" }),
        });
        if (!response.ok) throw new Error(`LibreTranslate responded ${response.status}`);
        const data = await response.json();
        if (data && data.translatedText) return { translatedText: data.translatedText, usedMock: false };
      } catch (err) {
        console.warn(`[VoiceBridge] ${base} unavailable:`, err);
      }
    }

    // Try a widely-used public Google endpoint as a best-effort fallback (no API key required in many cases).
    try {
      const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
      const gres = await fetch(gUrl);
      if (gres.ok) {
        const gdata = await gres.json();
        if (Array.isArray(gdata) && Array.isArray(gdata[0])) {
          const translated = gdata[0].map((p) => (p[0] || "")).join("");
          if (translated) return { translatedText: translated, usedMock: false };
        }
      }
    } catch (err) {
      console.warn("[VoiceBridge] Google fallback unavailable:", err);
    }

    // Final fallback: small phrasebook or original text (do NOT prefix with offline-demo)
    return { translatedText: mockTranslate(text, targetLang), usedMock: true };
  }

  function mockTranslate(text, targetLang) {
    const key = text.trim().toLowerCase();
    const known = MOCK_PHRASES[key];
    if (known && known[targetLang]) return known[targetLang];
    return text; // return original text as a neutral fallback (no '[offline demo]' prefix)
  }

  // ---------------------------------------------------------
  // Speech recognition wrapper (mirrors useSpeechRecognition.ts)
  // ---------------------------------------------------------
function createRecognizer({ lang, onFinal, onInterim, onEnd, onError }) {

  // Browser compatibility:
  // Chrome / Edge = SpeechRecognition
  // Safari = webkitSpeechRecognition
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    window.mozSpeechRecognition ||
    window.msSpeechRecognition;

  if (!SpeechRecognition) {

    let browser = "this browser";

    if (/Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent)) {
      browser = "Safari";
    } 
    else if (/Chrome/i.test(navigator.userAgent)) {
      browser = "Chrome";
    }
    else if (/Edg/i.test(navigator.userAgent)) {
      browser = "Edge";
    }

    onError(
      `Speech recognition is not supported in ${browser}. Try Chrome, Edge, or Safari with microphone permission enabled.`
    );

    return {
      supported: false,
      start() {},
      stop() {}
    };
  }


  let recognition = null;


  return {

    supported: true,


    start() {

      recognition = new SpeechRecognition();


      // Language support
      recognition.lang =
        SPEECH_LOCALE[lang] ||
        navigator.language ||
        "en-US";


     // Improved Chrome / Edge / Safari settings
recognition.continuous = true;
recognition.interimResults = true;
recognition.maxAlternatives = 5;


      recognition.onstart = () => {
        console.log(
          "[VoiceBridge] Speech recognition started",
          recognition.lang
        );
      };


      recognition.onresult = (event) => {

        let interim = "";


        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {

          const transcript =
            event.results[i][0].transcript;


          if (event.results[i].isFinal) {

            onFinal(
              transcript.trim()
            );

          } 
          else {

            interim += transcript;

          }

        }


        if (interim) {
          onInterim(interim);
        }

      };


      recognition.onerror = (event) => {

        console.error(
          "[VoiceBridge Speech Error]",
          event.error
        );


        switch(event.error){

          case "not-allowed":
            onError(
              "Microphone permission denied. Allow microphone access in browser settings."
            );
            break;


          case "network":
            onError(
              "Speech service connection failed. Check your internet connection."
            );
            break;


          case "no-speech":
            onError(
              "No speech detected. Try speaking closer to your microphone."
            );
            break;


          default:
            onError(
              `Speech recognition error: ${event.error}`
            );

        }

      };


      recognition.onend = () => {

        console.log(
          "[VoiceBridge] Speech recognition ended"
        );

        onEnd();

      };


      try {

        recognition.start();

      }

      catch(error){

        console.error(error);

        onError(
          "Unable to start microphone."
        );

      }

    },


    stop(){

      if(recognition){

        recognition.stop();

      }

    }

  };

}

  // ---------------------------------------------------------
  // Speech synthesis wrapper (mirrors useSpeechSynthesis.ts)
  // ---------------------------------------------------------
  const synth = {
    supported: "speechSynthesis" in window,
    voices: [],
  };

  function refreshVoices() {
    if (!synth.supported) return;
    synth.voices = window.speechSynthesis.getVoices();
    // Pick a clear English voice when available (Google/Microsoft/WaveNet-style names are preferred)
    try {
      const best = synth.voices.find((v) => v.lang.toLowerCase().startsWith("en") && /google|microsoft|samantha|amy|joanna|alloy|wave|waveNet/i.test(v.name));
      if (best && !voiceSettings.voiceURI) {
        voiceSettings.voiceURI = best.voiceURI;
      }
    } catch (e) {
      // ignore
    }
    // Refresh any visible voice select so UI shows available options
    const vs = $("voiceSelect");
    if (vs) fillVoiceSelect(vs, $("tgtLang").value);
  }
  if (synth.supported) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  function voicesForLang(lang) {
    const locale = SPEECH_LOCALE[lang] || "en-US";
    const prefix = locale.split("-")[0];
    return synth.voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  }

  function speak(text, lang, settings, onEnd) {
    if (!synth.supported || !text.trim()) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = SPEECH_LOCALE[lang] || "en-US";
    utter.rate = settings.rate;
    utter.pitch = settings.pitch;
    utter.volume = settings.volume;

    if (settings.voiceURI) {
      const match = synth.voices.find((v) => v.voiceURI === settings.voiceURI);
      if (match) utter.voice = match;
    }

    utter.onend = () => onEnd?.();
    utter.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utter);
  }

  // ---------------------------------------------------------
  // Populate language selects
  // ---------------------------------------------------------
  function fillLangSelect(select, defaultCode) {
    for (const lang of LANGUAGES) {
      const opt = document.createElement("option");
      opt.value = lang.code;
      opt.textContent = lang.label;
      if (lang.code === defaultCode) opt.selected = true;
      select.appendChild(opt);
    }
  }
  fillLangSelect($("srcLang"), "en");
  fillLangSelect($("tgtLang"), "es");
  fillLangSelect($("convoLangA"), "en");
  fillLangSelect($("convoLangB"), "es");

  function fillVoiceSelect(select, lang) {
    const previous = select.value;
    select.innerHTML = `<option value="">Default voice</option>`;
    for (const v of voicesForLang(lang)) {
      const opt = document.createElement("option");
      opt.value = v.voiceURI;
      opt.textContent = v.name;
      select.appendChild(opt);
    }
    // Prefer any previously chosen voice, otherwise apply the auto-picked voiceSettings.voiceURI
    if ([...select.options].some((o) => o.value === previous)) {
      select.value = previous;
    } else if (voiceSettings.voiceURI && [...select.options].some((o) => o.value === voiceSettings.voiceURI)) {
      select.value = voiceSettings.voiceURI;
    }
  }

  // ---------------------------------------------------------
  // Single translator wiring
  // ---------------------------------------------------------
  const voiceSettings = { voiceURI: null, rate: 1, pitch: 1, volume: 1 };
  let isListening = false;
  let lastTranslation = null; // { text, lang } for replay

  const micBtn = $("micBtn");
  const micStatus = $("micStatus");
  const originalTextEl = $("originalText");
  const translatedTextEl = $("translatedText");
  const replayBtn = $("replayBtn");

  function setOriginal(text, placeholder = false) {
    originalTextEl.textContent = text;
    originalTextEl.classList.toggle("placeholder", placeholder);
  }
  function setTranslated(text, placeholder = false) {
    translatedTextEl.textContent = text;
    translatedTextEl.classList.toggle("placeholder", placeholder);
  }

  async function runSingleTranslation(text) {
    const sourceLang = $("srcLang").value;
    const targetLang = $("tgtLang").value;

    setOriginal(text);
    setTranslated("Translating…", true);
    replayBtn.disabled = true;

    const { translatedText, usedMock } = await translateText(text, sourceLang, targetLang);
    setTranslated(translatedText);
    if (usedMock) toast("Translation service unreachable — showing best-effort result.", true);

    lastTranslation = { text: translatedText, lang: targetLang };
    replayBtn.disabled = false;

    speak(translatedText, targetLang, voiceSettings);

    addHistoryEntry({
      speaker: null,
      originalText: text,
      translatedText,
      sourceLang,
      targetLang,
      timestamp: Date.now(),
    });
  }

  micBtn.addEventListener("click", () => {
    if (isListening) return;
    startSingleRecognition();
  });

  // Created fresh each time with the currently-selected source language,
  // since a SpeechRecognition instance can't change .lang mid-flight.
  function startSingleRecognition() {
    const r = createRecognizer({
      lang: $("srcLang").value,
      onFinal: (text) => runSingleTranslation(text),
      onInterim: (interim) => { if (interim) setOriginal(interim); },
      onEnd: () => {
        isListening = false;
        micBtn.classList.remove("listening");
        micStatus.textContent = "Tap to speak";
      },
      onError: (msg) => {
        isListening = false;
        micBtn.classList.remove("listening");
        micStatus.textContent = "Tap to speak";
        toast(msg, true);
      },
    });

    if (!r.supported) {
      toast("Speech recognition isn't supported in this browser. Try Chrome or Edge.", true);
      return;
    }

    isListening = true;
    micBtn.classList.add("listening");
    micStatus.textContent = "Listening…";
    setOriginal("Your speech will appear here…", true);
    setTranslated("Translation will appear here…", true);
    r.start();
  }

  $("swapLangs").addEventListener("click", () => {
    const src = $("srcLang");
    const tgt = $("tgtLang");
    const tmp = src.value;
    src.value = tgt.value;
    tgt.value = tmp;
  });

  replayBtn.addEventListener("click", () => {
    if (lastTranslation) speak(lastTranslation.text, lastTranslation.lang, voiceSettings);
  });

  $("srcLang").addEventListener("change", () => fillVoiceSelect($("voiceSelect"), $("tgtLang").value));
  $("tgtLang").addEventListener("change", () => fillVoiceSelect($("voiceSelect"), $("tgtLang").value));

  $("voiceSelect").addEventListener("change", (e) => { voiceSettings.voiceURI = e.target.value || null; });
  $("rateSlider").addEventListener("input", (e) => { voiceSettings.rate = parseFloat(e.target.value); $("rateVal").textContent = e.target.value; });
  $("pitchSlider").addEventListener("input", (e) => { voiceSettings.pitch = parseFloat(e.target.value); $("pitchVal").textContent = e.target.value; });
  $("volumeSlider").addEventListener("input", (e) => { voiceSettings.volume = parseFloat(e.target.value); $("volumeVal").textContent = e.target.value; });

  setTimeout(() => fillVoiceSelect($("voiceSelect"), $("tgtLang").value), 300); // voices load async

  // ---------------------------------------------------------
  // Conversation mode wiring - two independent mic loops that
  // translate INTO each other's chosen language and speak back.
  // ---------------------------------------------------------
  function setupConversationSide(speaker, micId, statusId, textId, langSelectId, otherLangSelectId) {
    const btn = $(micId);
    const status = $(statusId);
    const textEl = $(textId);
    let listening = false;

    btn.addEventListener("click", () => {
      if (listening) return; // ignore double-taps while active; onend resets
      const lang = $(langSelectId).value;
      const targetLang = $(otherLangSelectId).value;

      const r = createRecognizer({
        lang,
        onFinal: async (text) => {
          textEl.textContent = text;
          status.textContent = "Translating…";
          const { translatedText, usedMock } = await translateText(text, lang, targetLang);
          if (usedMock) toast("Translation service unreachable — showing best-effort result.", true);

          appendConvoBubble(speaker, text, translatedText, lang, targetLang);
          addHistoryEntry({
            speaker,
            originalText: text,
            translatedText,
            sourceLang: lang,
            targetLang,
            timestamp: Date.now(),
          });

          status.textContent = "Speaking…";
          speak(translatedText, targetLang, voiceSettings, () => { status.textContent = "Tap to speak"; });
        },
        onInterim: (interim) => { if (interim) textEl.textContent = interim; },
        onEnd: () => {
          listening = false;
          btn.classList.remove("listening");
          if (status.textContent === "Listening…") status.textContent = "Tap to speak";
        },
        onError: (msg) => {
          listening = false;
          btn.classList.remove("listening");
          status.textContent = "Tap to speak";
          toast(msg, true);
        },
      });

      if (!r.supported) {
        toast("Speech recognition isn't supported in this browser. Try Chrome or Edge.", true);
        return;
      }

      listening = true;
      btn.classList.add("listening");
      status.textContent = "Listening…";
      textEl.textContent = "";
      r.start();
    });
  }

  function appendConvoBubble(speaker, original, translated, sourceLang, targetLang) {
    const feed = $("convoFeed");
    const bubble = document.createElement("div");
    bubble.className = `convo-bubble from-${speaker.toLowerCase()}`;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    bubble.innerHTML = `
      <div class="bubble-meta">Speaker ${speaker} · ${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()} · ${time}</div>
      <div class="bubble-translated">${escapeHtml(translated)}</div>
      <div class="bubble-original">${escapeHtml(original)}</div>
    `;
    feed.appendChild(bubble);
    feed.scrollTop = feed.scrollHeight;
  }

  setupConversationSide("A", "convoMicA", "convoStatusA", "convoTextA", "convoLangA", "convoLangB");
  setupConversationSide("B", "convoMicB", "convoStatusB", "convoTextB", "convoLangB", "convoLangA");

  // ---------------------------------------------------------
  // Hero waveform: two waveforms (coral / signal) traveling
  // toward each other and merging into a bridge-arc - the
  // signature moment from the original design spec, ported to
  // a plain canvas loop since there's no Framer Motion here.
  // ---------------------------------------------------------
  function initHeroWave() {
    const canvas = $("waveCanvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const mid = W / 2;
    let t = 0;

    function wavePoints(baseX, direction, phase, amplitude) {
      const points = [];
      const span = W * 0.42;
      for (let i = 0; i <= 40; i++) {
        const progress = i / 40;
        const x = baseX + direction * progress * span;
        const distFromMid = Math.abs(x - mid) / (W / 2);
        const damp = Math.min(1, distFromMid * 1.8);
        const y = H / 2 + Math.sin(progress * 10 + phase) * amplitude * damp;
        points.push([x, y]);
      }
      return points;
    }

    function drawWave(points, color, width) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points) ctx.lineTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function drawBridgeArc(alpha) {
      ctx.beginPath();
      ctx.moveTo(mid - 46, H / 2 + 10);
      ctx.quadraticCurveTo(mid, H / 2 - 46, mid + 46, H / 2 + 10);
      const grad = ctx.createLinearGradient(mid - 46, 0, mid + 46, 0);
      grad.addColorStop(0, `rgba(255,107,91,${alpha})`);
      grad.addColorStop(1, `rgba(79,214,196,${alpha})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      t += 0.02;

      // 6s cycle: waves drift apart, meet, merge with a bridge, then reset
      const cycle = (Math.sin(t * 0.5) + 1) / 2; // 0..1..0
      const meetAmount = cycle; // 0 = apart, 1 = fully met

      const leftBase = mid - 6 - (1 - meetAmount) * 40;
      const rightBase = mid + 6 + (1 - meetAmount) * 40;

      const left = wavePoints(leftBase, -1, t * 3, 26);
      const right = wavePoints(rightBase, 1, t * 3 + 1.4, 26);

      drawWave(left, "#FF6B5B", 3);
      drawWave(right, "#4FD6C4", 3);

      if (meetAmount > 0.7) {
        drawBridgeArc((meetAmount - 0.7) / 0.3);
      }

      requestAnimationFrame(frame);
    }
    frame();
  }
  initHeroWave();

  // ---------------------------------------------------------
  // Startup checks
  // ---------------------------------------------------------
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    toast("This browser doesn't support speech recognition — try Chrome or Edge for the full experience.", true);
  }

  renderHistory();
})();
