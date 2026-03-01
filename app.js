const video      = document.getElementById('camera');
const canvas     = document.getElementById('canvas');
const captionBtn = document.getElementById('captionBtn');
const status     = document.getElementById('status');

let selectedOption = 'none';
let introRecognition = null;  // speech recognition for intro
let scanRecognition  = null;  // speech recognition for scanning

// ── SPEAK HELPER (Web Speech API) ──
function speak(text, onDone) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  if (onDone) utterance.onend = onDone;
  window.speechSynthesis.speak(utterance);
}

// ── STEP 1: Speak welcome message on page load ──
window.addEventListener('load', () => {
  speak(
    'Welcome to the AI Object Scanner. ' +
    'Please say your preferred display option. ' +
    'Say: High Contrast, Larger Text, Both, or Skip.',
    () => listenForOption()  // start listening AFTER speaking finishes
  );
});

// ── STEP 2: Listen for user's option choice ──
function listenForOption() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    speak('Speech recognition is not supported in your browser. Please use Chrome.');
    return;
  }

  introRecognition = new SpeechRecognition();
  introRecognition.lang = 'en-US';
  introRecognition.continuous = false;
  introRecognition.interimResults = false;

  introRecognition.onresult = (event) => {
    const answer = event.results[0][0].transcript.trim().toLowerCase();
    console.log('User said:', answer);
    handleOptionAnswer(answer);
  };

  introRecognition.onerror = (e) => {
    console.error('Intro recognition error:', e.error);
    // If mic fails, retry listening
    speak('Sorry, I did not catch that. Please say High Contrast, Larger Text, Both, or Skip.', 
      () => listenForOption()
    );
  };

  introRecognition.start();
}

// ── STEP 3: Match answer to an option ──
function handleOptionAnswer(answer) {
  if (answer.includes('high contrast') || answer.includes('contrast')) {
    selectedOption = 'contrast';
    speak('High Contrast selected.', () => applyAndStart());

  } else if (answer.includes('larger text') || answer.includes('large text') || answer.includes('bigger text') || answer.includes('text')) {
    selectedOption = 'text';
    speak('Larger Text selected.', () => applyAndStart());

  } else if (answer.includes('both')) {
    selectedOption = 'both';
    speak('Both High Contrast and Larger Text selected.', () => applyAndStart());

  } else if (answer.includes('skip') || answer.includes('none') || answer.includes('no')) {
    selectedOption = 'none';
    speak('No display changes. Starting now.', () => applyAndStart());

  } else {
    // Didn't understand — ask again
    speak(
      'Sorry, I did not understand. Please say High Contrast, Larger Text, Both, or Skip.',
      () => listenForOption()
    );
  }
}

// ── STEP 4: Apply settings and launch app ──
function applyAndStart() {
  // Apply accessibility settings
  if (selectedOption === 'contrast' || selectedOption === 'both') {
    document.body.classList.add('high-contrast');
    // Highlight selected button visually too
    document.getElementById('btnContrast')?.classList.add('selected');
  }
  if (selectedOption === 'text' || selectedOption === 'both') {
    document.documentElement.style.fontSize = '22px';
    document.getElementById('btnText')?.classList.add('selected');
  }
  if (selectedOption === 'both') {
    document.getElementById('btnBoth')?.classList.add('selected');
  }
  if (selectedOption === 'none') {
    document.getElementById('btnNone')?.classList.add('selected');
  }

  // Switch screens
  document.getElementById('introScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');

  // Start camera
  initCamera();

  // Tell user they're ready, then start scan listener
  speak(
    'You are all set. Say scan anytime you are ready to scan an object.',
    () => initScanVoice()
  );
}

// ── CAMERA ──
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    video.srcObject = stream;
  } catch (error) {
    speak('Error accessing camera. Please allow camera permissions.');
    showStatus('Camera error: ' + error.message);
  }
}

// ── CAPTURE PHOTO ──
function capturePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
}

// ── STATUS MESSAGE ──
function showStatus(message) {
  status.textContent = message;
  status.classList.add('visible');
}

// ── GENERATE CAPTION ──
async function generateCaption() {
  captionBtn.disabled = true;
  showStatus('Capturing image...');
  speak('Scanning object, please wait.');

  const imageData = capturePhoto();

  try {
    showStatus('Generating caption...');

    const response = await fetch('/api/caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });

    const data = await response.json();

    if (data.caption) {
      showStatus(data.caption);
      speak(data.caption);
    } else {
      speak('No caption was generated. Please try again.');
      showStatus('No caption generated');
    }
  } catch (error) {
    speak('An error occurred. Please try again.');
    showStatus('Error: ' + error.message);
  } finally {
    captionBtn.disabled = false;
  }
}

// ── VOICE COMMAND FOR SCANNING ──
function initScanVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  scanRecognition = new SpeechRecognition();
  scanRecognition.continuous = true;
  scanRecognition.lang = 'en-US';
  scanRecognition.interimResults = false;

  scanRecognition.onresult = (event) => {
    const word = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    console.log('Heard:', word);
    if (word.includes('scan')) {
      captionBtn.click();
    }
  };

  scanRecognition.onerror = (e) => console.error('Scan recognition error:', e.error);

  // Auto-restart so it keeps listening
  scanRecognition.onend = () => scanRecognition.start();

  scanRecognition.start();
}

// ── MANUAL BUTTON ──
captionBtn.addEventListener('click', generateCaption);

// ── INTRO BUTTON FALLBACK (for sighted users) ──
function toggleOption(option) {
  selectedOption = option;
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById(
    option === 'contrast' ? 'btnContrast' :
    option === 'text'     ? 'btnText'     :
    option === 'both'     ? 'btnBoth'     : 'btnNone'
  ).classList.add('selected');
}

function startApp() {
  applyAndStart();
}