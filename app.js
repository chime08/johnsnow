const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const captionBtn = document.getElementById('captionBtn');
const status = document.getElementById('status');

let stream = null;

// Initialize camera
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        video.srcObject = stream;
        showStatus('Camera ready');
    } catch (error) {
        showStatus('Error accessing camera: ' + error.message);
        console.error('Camera error:', error);
    }
}

// Capture photo from video stream
function capturePhoto() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
}

// Show status message
function showStatus(message) {
    status.textContent = message;
    status.classList.add('visible');
    setTimeout(() => {
        status.classList.remove('visible');
    }, 3000);
}

// Generate caption
async function generateCaption() {
    captionBtn.disabled = true;
    showStatus('Capturing image...');
    
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
            await speakCaption(data.caption);
        } else {
            showStatus('No caption generated');
        }
    } catch (error) {
        showStatus('Error: ' + error.message);
        console.error('Caption error:', error);
    } finally {
        captionBtn.disabled = false;
    }
}

// Speak caption using ElevenLabs
async function speakCaption(text) {
    try {
        const response = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.play();
        
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };
    } catch (error) {
        console.error('Speech error:', error);
    }
}


//// ── VOICE COMMAND (Speech Detection) ──
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;      // keep listening forever
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const word = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
  console.log('Heard:', word);

  if (word.includes('scan')) {
    captionBtn.click();             // triggers the scan
  }
};

recognition.onerror = (e) => console.error('Speech error:', e.error);

// Start listening
recognition.start();
speakCaption('Say scan to take a photo');  // tell user it's ready


// Event listeners
captionBtn.addEventListener('click', generateCaption);

// Initialize on load
initCamera();
