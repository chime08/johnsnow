const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const captionBtn = document.getElementById('captionBtn');
const status = document.getElementById('status');
const micBtn = document.getElementById('micBtn');
const micSelect = document.getElementById('micSelect');
const historyBtn = document.getElementById('historyBtn');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const closeHistory = document.getElementById('closeHistory');
const helpBtn = document.getElementById('helpBtn');
const helpPanel = document.getElementById('helpPanel');
const closeHelp = document.getElementById('closeHelp');
const srAnnounce = document.getElementById('srAnnounce');

let stream = null;
let recognition = null;
let selectedMicId = null;
let recognitionActive = false; // Toggle mode - spacebar toggles listening on/off
let networkErrorCount = 0; // Track consecutive network errors
let isListening = false; // Track if we're actively listening
let scanHistory = []; // Store scan history
let audioContext = null; // For beep sounds
let lastFocusedElement = null; // For focus management

// ==================== ACCESSIBILITY FUNCTIONS ====================

// Initialize Web Audio API for beeps
function initAudioFeedback() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio feedback initialized');
    } catch (e) {
        console.error('Web Audio API not supported:', e);
    }
}

// Play beep sound for audio feedback
function playBeep(frequency = 440, duration = 100, volume = 0.3) {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        console.error('Error playing beep:', e);
    }
}

// Audio feedback presets
const audioFeedback = {
    listeningOn: () => playBeep(880, 150, 0.2),      // High beep - listening activated
    listeningOff: () => playBeep(440, 150, 0.2),     // Mid beep - listening deactivated
    scanStart: () => playBeep(660, 100, 0.2),        // Scan initiated
    success: () => {                                  // Success - two ascending beeps
        playBeep(523, 100, 0.2);
        setTimeout(() => playBeep(659, 100, 0.2), 100);
    },
    error: () => {                                    // Error - descending beep
        playBeep(440, 200, 0.2);
        setTimeout(() => playBeep(330, 200, 0.2), 150);
    }
};

// Announce to screen readers (separate from visual status)
function announceToScreenReader(message, priority = 'polite') {
    if (!srAnnounce) return;
    
    // Clear previous announcement
    srAnnounce.textContent = '';
    
    // Force reflow to ensure screen reader picks up the change
    void srAnnounce.offsetHeight;
    
    // Set new announcement
    srAnnounce.textContent = message;
    srAnnounce.setAttribute('aria-live', priority);
    
    console.log('Screen reader announcement:', message);
}

// Focus management - save current focus
function saveFocus() {
    lastFocusedElement = document.activeElement;
}

// Focus management - restore previous focus
function restoreFocus() {
    if (lastFocusedElement && lastFocusedElement !== document.body) {
        setTimeout(() => {
            lastFocusedElement.focus();
        }, 100);
    }
}

// Focus management - trap focus within element
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', function(e) {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                e.preventDefault();
            }
        }
    });
    
    // Focus first element
    if (firstFocusable) {
        firstFocusable.focus();
    }
}

// ==================== END ACCESSIBILITY FUNCTIONS ====================

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

// Load scan history from localStorage
function loadScanHistory() {
    try {
        const saved = localStorage.getItem('scanHistory');
        if (saved) {
            scanHistory = JSON.parse(saved);
            console.log('Loaded', scanHistory.length, 'items from history');
        }
    } catch (e) {
        console.error('Error loading scan history:', e);
        scanHistory = [];
    }
}

// Save scan history to localStorage
function saveScanHistory() {
    try {
        // Limit history to 50 items
        if (scanHistory.length > 50) {
            scanHistory = scanHistory.slice(0, 50);
        }
        localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
        console.log('Saved scan history');
    } catch (e) {
        console.error('Error saving scan history:', e);
    }
}

// Add scan to history
function addToHistory(imageData, caption) {
    const historyItem = {
        timestamp: new Date().toISOString(),
        image: imageData,
        caption: caption
    };
    
    scanHistory.unshift(historyItem); // Add to beginning
    saveScanHistory();
    console.log('Added to history, total items:', scanHistory.length);
}

// Display scan history
function displayHistory() {
    historyList.innerHTML = '';
    
    if (scanHistory.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No scan history yet. Say "scan" or press the Scan button to start.</div>';
        return;
    }
    
    scanHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleString();
        
        historyItem.setAttribute('role', 'listitem');
        historyItem.innerHTML = `
            <img src="${item.image}" alt="" class="history-image" role="presentation">
            <div class="history-details">
                <div class="history-time">${timeStr}</div>
                <div class="history-caption">${item.caption}</div>
            </div>
            <button class="history-delete" 
                    onclick="deleteHistoryItem(${index})" 
                    aria-label="Delete scan from ${timeStr}: ${item.caption.substring(0, 50)}">🗑️</button>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// Delete history item
function deleteHistoryItem(index) {
    const deletedCaption = scanHistory[index].caption.substring(0, 50);
    scanHistory.splice(index, 1);
    saveScanHistory();
    displayHistory();
    
    // Announce deletion
    announceToScreenReader(`Scan deleted: ${deletedCaption}`);
    audioFeedback.listeningOff();
}

// Toggle history panel
function toggleHistory() {
    const isVisible = historyPanel.style.display === 'flex';
    
    if (!isVisible) {
        // Opening history
        saveFocus();
        displayHistory();
        historyPanel.style.display = 'flex';
        historyPanel.setAttribute('aria-hidden', 'false');
        historyBtn.setAttribute('aria-expanded', 'true');
        document.body.classList.add('history-open');
        
        // Trap focus in panel
        trapFocus(historyPanel);
        
        // Announce to screen reader
        announceToScreenReader(`Scan history opened. ${scanHistory.length} items in history.`);
        
        // Audio feedback
        audioFeedback.success();
    } else {
        // Closing history
        // Restore focus FIRST (before setting aria-hidden to avoid focus conflicts)
        restoreFocus();
        
        // Then hide the panel from assistive technology and visually
        historyPanel.setAttribute('aria-hidden', 'true');
        historyPanel.style.display = 'none';
        historyBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('history-open');
        
        // Announce to screen reader
        announceToScreenReader('Scan history closed.');
    }
}

// Toggle help panel
function toggleHelp() {
    const isVisible = helpPanel.style.display === 'flex';
    
    if (!isVisible) {
        // Opening help
        saveFocus();
        helpPanel.style.display = 'flex';
        helpPanel.setAttribute('aria-hidden', 'false');
        helpBtn.setAttribute('aria-expanded', 'true');
        document.body.classList.add('help-open');
        
        // Trap focus in panel
        trapFocus(helpPanel);
        
        // Announce to screen reader
        announceToScreenReader('Help panel opened. Use arrow keys or tab to navigate instructions.');
        
        // Audio feedback
        audioFeedback.success();
    } else {
        // Closing help
        // Restore focus FIRST (before setting aria-hidden to avoid focus conflicts)
        restoreFocus();
        
        // Then hide the panel from assistive technology and visually
        helpPanel.setAttribute('aria-hidden', 'true');
        helpPanel.style.display = 'none';
        helpBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('help-open');
        
        // Announce to screen reader
        announceToScreenReader('Help panel closed.');
    }
}

// Initialize voice recognition
async function initVoiceRecognition() {
    console.log('Initializing voice recognition (toggle mode)...');
    
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
        
        recognition.continuous = true; // Continuous listening when active
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
            console.log('Voice recognition started successfully');
            recognitionActive = true;
            isListening = true;
            networkErrorCount = 0;
            micBtn.style.backgroundColor = 'rgba(0, 255, 0, 0.9)'; // Green when active
            micBtn.setAttribute('aria-pressed', 'true');
            showStatus('Listening... say "scan"', true);
            
            // Audio feedback
            audioFeedback.listeningOn();
            
            // Screen reader announcement
            announceToScreenReader('Voice recognition activated. Listening for scan command. Press spacebar to stop listening.');
        };
        
        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const result = event.results[last];
            const command = result[0].transcript.toLowerCase().trim();
            
            console.log('Voice heard:', command, 'Final:', result.isFinal, 'Confidence:', result[0].confidence);
            
            if (result.isFinal && command.includes('scan')) {
                console.log('Scan command detected!');
                showStatus('Scan command detected!');
                
                // Audio feedback
                audioFeedback.scanStart();
                
                // Screen reader announcement
                announceToScreenReader('Scan command detected. Capturing and analyzing image.');
                
                // Pause voice recognition while processing
                isListening = false;
                recognitionActive = false;
                try {
                    recognition.stop();
                    console.log('Voice recognition paused for scanning');
                    micBtn.style.backgroundColor = 'rgba(128, 128, 128, 0.9)'; // Gray when paused
                } catch (e) {
                    console.error('Error stopping recognition:', e);
                }
                
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
                recognitionActive = false;
                return;
            }
            if (event.error === 'network') {
                networkErrorCount++;
                console.error('Network error count:', networkErrorCount);
                console.error('This error usually means:');
                console.error('1. No internet connection');
                console.error('2. Firewall/antivirus blocking Google Speech API');
                console.error('3. Using a browser that doesn\'t support Speech Recognition');
                console.error('Current browser:', navigator.userAgent);
                recognitionActive = false; // Stop auto-restart
                micBtn.style.backgroundColor = 'rgba(255, 0, 0, 0.9)'; // Red for error
                showStatus('Voice recognition requires internet connection. Click mic button to retry.');
                return;
            }
            showStatus('Voice recognition error: ' + event.error);
        };
        
        recognition.onend = () => {
            console.log('Recognition ended');
            
            // If we should still be listening, restart
            if (isListening && networkErrorCount === 0) {
                console.log('Restarting recognition...');
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('Recognition restart failed:', e);
                    }
                }, 100);
            } else {
                console.log('Recognition stopped');
                recognitionActive = false;
                isListening = false;
                micBtn.style.backgroundColor = 'rgba(0, 123, 255, 0.9)'; // Back to blue
                micBtn.setAttribute('aria-pressed', 'false');
                hideStatus();
                
                // Audio feedback
                audioFeedback.listeningOff();
                
                // Screen reader announcement
                announceToScreenReader('Voice recognition deactivated.');
            }
        };
        
        // Don't auto-start - wait for spacebar
        console.log('Voice recognition ready - press SPACEBAR to start listening');
        showStatus('Press SPACEBAR to start listening');
        announceToScreenReader('Voice recognition ready. Press spacebar to activate listening, or click the Scan button to capture an image.');
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
function showStatus(message, keepVisible = false) {
    status.textContent = message;
    status.classList.add('visible');
    
    // Clear any existing timeout
    if (window.statusTimeout) {
        clearTimeout(window.statusTimeout);
        window.statusTimeout = null;
    }
    
    // Only auto-hide if keepVisible is false
    if (!keepVisible) {
        window.statusTimeout = setTimeout(() => {
            status.classList.remove('visible');
        }, 5000); // Increased from 3s to 5s for accessibility
    }
}

// Hide status message manually
function hideStatus() {
    if (window.statusTimeout) {
        clearTimeout(window.statusTimeout);
        window.statusTimeout = null;
    }
    status.classList.remove('visible');
}

// Generate caption
async function generateCaption() {
    captionBtn.disabled = true;
    showStatus('Capturing image...');
    
    // Save whether voice recognition was active before scanning
    const wasListeningBeforeScan = isListening;
    
    // Pause voice recognition during scan
    if (isListening && recognition) {
        try {
            recognition.stop();
            isListening = false;
        } catch (e) {
            console.log('Could not stop recognition during scan:', e);
        }
    }
    
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
            // Show caption and keep it visible while speaking
            showStatus(data.caption, true);
            
            // Screen reader announcement
            announceToScreenReader(`Caption generated: ${data.caption}`, 'polite');
            
            // Audio feedback
            audioFeedback.success();
            
            // Add to history
            addToHistory(imageData, data.caption);
            
            await speakCaption(data.caption);
            // Hide caption after audio finishes
            hideStatus();
        } else {
            showStatus('No caption generated');
            announceToScreenReader('No caption could be generated.', 'assertive');
            audioFeedback.error();
        }
    } catch (error) {
        showStatus('Error: ' + error.message);
        announceToScreenReader('Error generating caption: ' + error.message, 'assertive');
        audioFeedback.error();
        console.error('Caption error:', error);
    } finally {
        captionBtn.disabled = false;
        
        // Only resume voice recognition if it was active before the scan
        if (wasListeningBeforeScan && recognition) {
            isListening = true;
            recognitionActive = true;
            try {
                recognition.start();
                console.log('Voice recognition resumed after scanning');
            } catch (e) {
                // Recognition might already be running, that's okay
                console.log('Could not restart recognition:', e);
            }
        }
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
        
        // Return a promise that resolves when audio finishes
        return new Promise((resolve, reject) => {
            audio.onended = () => {
                console.log('Audio playback finished');
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            
            audio.onerror = (e) => {
                console.error('Audio playback error:', e);
                URL.revokeObjectURL(audioUrl);
                reject(e);
            };
        });
        
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
    // If recognition is inactive due to error, try to restart it
    if (!recognitionActive && recognition) {
        console.log('Attempting to restart voice recognition...');
        recognitionActive = true;
        networkErrorCount = 0;
        try {
            recognition.start();
            showStatus('Restarting voice recognition...');
            micBtn.style.backgroundColor = 'rgba(0, 123, 255, 0.9)'; // Blue
        } catch (e) {
            console.error('Failed to restart recognition:', e);
            showStatus('Failed to restart voice recognition');
            recognitionActive = false;
        }
        return;
    }
    
    // Otherwise, toggle microphone selector
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

// Spacebar toggle controls (press once to activate, press again to deactivate)
window.addEventListener('keydown', (event) => {
    // Only respond to spacebar if not typing in an input or on a button
    if (event.code === 'Space' && 
        event.target.tagName !== 'INPUT' && 
        event.target.tagName !== 'TEXTAREA' &&
        event.target.tagName !== 'BUTTON') {
        event.preventDefault();
        
        if (!recognition) return;
        
        // Toggle listening state
        if (!isListening) {
            // Start listening
            isListening = true;
            console.log('Spacebar pressed - starting voice recognition');
            
            try {
                recognition.start();
                micBtn.style.backgroundColor = 'rgba(0, 255, 0, 0.9)'; // Green
                showStatus('Listening... say "scan" (press SPACEBAR to stop)', true);
            } catch (e) {
                console.log('Could not start recognition:', e);
                isListening = false;
            }
        } else {
            // Stop listening
            isListening = false;
            console.log('Spacebar pressed - stopping voice recognition');
            
            try {
                recognition.stop();
                micBtn.style.backgroundColor = 'rgba(0, 123, 255, 0.9)'; // Blue
                hideStatus();
            } catch (e) {
                console.log('Could not stop recognition:', e);
            }
        }
    }
});

// Additional keyboard navigation for accessibility
window.addEventListener('keydown', (event) => {
    // Escape key - close any open panel
    if (event.key === 'Escape') {
        let panelClosed = false;
        
        if (historyPanel && historyPanel.style.display === 'flex') {
            toggleHistory();
            panelClosed = true;
        }
        
        if (helpPanel && helpPanel.style.display === 'flex') {
            toggleHelp();
            panelClosed = true;
        }
        
        if (panelClosed) {
            event.preventDefault();
        }
    }
    
    // H key or ? key - open/close help panel (accessibility shortcut)
    if ((event.key === 'h' || event.key === 'H' || event.key === '?') && 
        !event.ctrlKey && !event.altKey && 
        event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
        toggleHelp();
        event.preventDefault();
    }
    
    // L key - open/close history/log panel (accessibility shortcut)
    if ((event.key === 'l' || event.key === 'L') && 
        !event.ctrlKey && !event.altKey && 
        event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
        toggleHistory();
        event.preventDefault();
    }
    
    // Enter or Space on mic button
    if ((event.key === 'Enter' || event.key === ' ') && 
        document.activeElement === micBtn) {
        event.preventDefault();
        // Trigger spacebar handler logic
        if (!recognition) return;
        
        if (!isListening) {
            isListening = true;
            try {
                recognition.start();
            } catch (e) {
                console.log('Could not start recognition:', e);
                isListening = false;
            }
        } else {
            isListening = false;
            try {
                recognition.stop();
            } catch (e) {
                console.log('Could not stop recognition:', e);
            }
        }
    }
});

// Make deleteHistoryItem available globally
window.deleteHistoryItem = deleteHistoryItem;

// Event listeners and initialization
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    console.log('captionBtn:', captionBtn);
    console.log('micBtn:', micBtn);
    console.log('micSelect:', micSelect);
    console.log('historyBtn:', historyBtn);
    console.log('helpBtn:', helpBtn);
    
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
        if (historyBtn) {
        historyBtn.addEventListener('click', toggleHistory);
    } else {
        console.error('historyBtn not found');
    }
    
    if (closeHistory) {
        closeHistory.addEventListener('click', () => {
            toggleHistory();
        });
    }
    
    if (helpBtn) {
        helpBtn.addEventListener('click', toggleHelp);
    } else {
        console.error('helpBtn not found');
    }
    
    if (closeHelp) {
        closeHelp.addEventListener('click', () => {
            toggleHelp();
        });
    }
    
    // Initialize audio feedback system
    initAudioFeedback();
    
    loadScanHistory();
    initCamera();
    initVoiceRecognition();
    loadAudioDevices();
    
    // Open help panel by default on first load
    setTimeout(() => {
        toggleHelp();
    }, 500);
    
    // Initial accessibility announcement
    setTimeout(() => {
        announceToScreenReader('pictureThis by team itsJohnSight loaded. Help panel is open with instructions. Press spacebar to activate voice recognition, or click the Scan button to capture an image. Press H or question mark for help. Press L to view scan history.');
    }, 1000);
});
