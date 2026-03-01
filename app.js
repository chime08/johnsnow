const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const captionBtn = document.getElementById('captionBtn');
const status = document.getElementById('status');
const micBtn = document.getElementById('micBtn');
const micSelect = document.getElementById('micSelect');

let stream = null;
let recognition = null;
let selectedMicId = null;

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

// Initialize voice recognition
async function initVoiceRecognition() {
    console.log('Initializing voice recognition...');
    
    // Request microphone permission first
    try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted');
        
        // Test if microphone is receiving audio
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(micStream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);
        
        console.log('Microphone is active. Audio data:', dataArray.slice(0, 10));
        
        // Stop the test stream
        micStream.getTracks().forEach(track => track.stop());
        audioContext.close();
    } catch (error) {
        console.error('Microphone permission denied:', error);
        showStatus('Microphone access required for voice commands');
        return;
    }
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true; // Changed to true to get interim results
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
            console.log('Voice recognition started successfully');
            micBtn.style.backgroundColor = 'rgba(0, 255, 0, 0.9)'; // Green when active
        };
        
        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const result = event.results[last];
            const command = result[0].transcript.toLowerCase().trim();
            
            console.log('Voice heard:', command, 'Final:', result.isFinal, 'Confidence:', result[0].confidence);
            
            if (result.isFinal && command.includes('scan')) {
                console.log('Scan command detected!');
                showStatus('Scan command detected!');
                generateCaption();
            }
        };
        
        recognition.onspeechstart = () => {
            console.log('Speech detected');
            micBtn.style.backgroundColor = 'rgba(255, 165, 0, 0.9)'; // Orange when hearing speech
        };
        
        recognition.onspeechend = () => {
            console.log('Speech ended');
            micBtn.style.backgroundColor = 'rgba(0, 255, 0, 0.9)'; // Back to green
        };
        
        recognition.onaudiostart = () => {
            console.log('Audio capturing started');
        };
        
        recognition.onaudioend = () => {
            console.log('Audio capturing ended');
        };
        
        recognition.onsoundstart = () => {
            console.log('Sound detected');
        };
        
        recognition.onsoundend = () => {
            console.log('Sound ended');
        };
        
        recognition.onnomatch = () => {
            console.log('No speech match found');
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                console.log('No speech detected - this is normal when silent');
                return;
            }
            if (event.error === 'audio-capture') {
                showStatus('Microphone error - check your microphone settings');
                return;
            }
            showStatus('Voice recognition error: ' + event.error);
        };
        
        recognition.onend = () => {
            console.log('Recognition ended, restarting...');
            micBtn.style.backgroundColor = 'rgba(0, 123, 255, 0.9)'; // Back to blue
            // Automatically restart recognition after a short delay
            setTimeout(() => {
                try {
                    recognition.start();
                    console.log('Recognition restarted successfully');
                } catch (e) {
                    console.log('Recognition restart failed:', e);
                }
            }, 100);
        };
        
        try {
            recognition.start();
            console.log('Recognition start called');
            showStatus('Voice recognition active - say "scan" to capture');
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            showStatus('Voice recognition not available');
        }
    } else {
        console.log('Speech recognition not supported');
        showStatus('Voice commands not supported in this browser');
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

// Load available audio input devices
async function loadAudioDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        micSelect.innerHTML = '<option value="">Default Microphone</option>';
        
        audioInputs.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Microphone ${micSelect.options.length}`;
            micSelect.appendChild(option);
        });
        
        console.log('Found', audioInputs.length, 'audio input devices');
    } catch (error) {
        console.error('Error loading audio devices:', error);
    }
}

// Toggle microphone selector visibility
function toggleMicSelector() {
    if (micSelect.style.display === 'none') {
        micSelect.style.display = 'block';
    } else {
        micSelect.style.display = 'none';
    }
}

// Handle microphone selection change
async function handleMicChange() {
    selectedMicId = micSelect.value;
    console.log('Selected microphone:', selectedMicId || 'default');
    
    // Restart voice recognition with new microphone
    if (recognition) {
        // Temporarily disable auto-restart
        recognition.onend = null;
        recognition.stop();
        
        // Wait for recognition to fully stop
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reinitialize with new microphone
        await initVoiceRecognition();
    }
    
    micSelect.style.display = 'none';
    showStatus('Microphone changed');
}

// Event listeners and initialization
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    console.log('captionBtn:', captionBtn);
    console.log('micBtn:', micBtn);
    console.log('micSelect:', micSelect);
    
    if (captionBtn) {
        captionBtn.addEventListener('click', generateCaption);
    } else {
        console.error('captionBtn not found!');
    }
    
    if (micBtn) {
        micBtn.addEventListener('click', toggleMicSelector);
    } else {
        console.error('micBtn not found!');
    }
    
    if (micSelect) {
        micSelect.addEventListener('change', handleMicChange);
    } else {
        console.error('micSelect not found!');
    }
    
    initCamera();
    initVoiceRecognition();
    loadAudioDevices();
});
