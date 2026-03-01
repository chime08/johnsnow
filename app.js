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
        console.log('Requesting speech for:', text);
        
        const response = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Speech API failed');
        }
        
        const audioBlob = await response.blob();
        console.log('Audio blob received, size:', audioBlob.size);
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        console.log('Playing audio...');
        await audio.play();
        
        audio.onended = () => {
            console.log('Audio playback finished');
            URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = (e) => {
            console.error('Audio playback error:', e);
        };
    } catch (error) {
        console.error('Speech error:', error);
        showStatus('Speech error: ' + error.message);
    }
}

// Event listeners
captionBtn.addEventListener('click', generateCaption);

// Initialize on load
initCamera();
