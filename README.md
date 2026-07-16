# VoiceBridge

This repository contains a static VoiceBridge demo in the project root.

## Run the static demo

1. Open `index.html` with VS Code Live Server, or use any static file server.
2. Choose an input language and output language.
3. Press **Start recording** and speak.
4. When transcription finishes, press **Play translation**.

## Notes

- The demo uses the browser's SpeechRecognition and SpeechSynthesis APIs.
- Translation is performed through LibreTranslate (`https://libretranslate.com`).
- If speech playback fails, open the browser console and look for speech synthesis errors.