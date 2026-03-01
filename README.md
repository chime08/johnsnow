# pictureThis
**An accessible visual aid for people with visual impairments**  

## Setup

1. Install Node.js (v14 or higher)
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your API keys:
   ```
   GEMINI_API_KEY=your_key
   ELEVENLABS_API_KEY=your_key
   ELEVENLABS_VOICE_ID=your_voice_id
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open browser to the URL shown in the terminal (ex. `http://localhost:3000` or `http://localhost:3001`)

## Usage

1. Allow camera access when prompted
2. **Press SPACEBAR** to activate listening (or click the "Scan" button)
3. **Say "Scan"** to caption what the camera sees
4. Caption will be displayed and spoken aloud
5. **Press SPACEBAR again** to stop listening
6. View previous scans by clicking the 📋 history button (bottom right)
7. **Click the ? button** (bottom left) or **press H or ?** for help and keyboard shortcuts
8. **Press L** to view scan log 📋 of previous entries

### Keyboard Shortcuts (Accessible Navigation)

- **SPACEBAR**: Toggle voice recognition on/off
- **H** or **?**: Open/close help panel with complete instructions
- **L**: Open/close scan log (history)
- **ESC**: Close any open panel (help or history)
- **TAB**: Navigate between controls
- **ENTER**: Activate focused button
- All controls have visible focus indicators (yellow outline)

### Voice Control (Toggle Mode)

- **Press SPACEBAR once**: Activates microphone (button turns green, starts listening)
  - Audio feedback: High beep sound
  - Screen reader announces: "Voice recognition activated"
- **Say \"Scan\"**: Triggers image capture and captioning
  - Audio feedback: Mid beep sound
  - Screen reader announces: "Scan command detected"
- **Press SPACEBAR again**: Deactivates microphone (button turns blue, stops listening)
  - Audio feedback: Low beep sound
  - Screen reader announces: "Voice recognition deactivated"
- This toggle design is more accessible and easier to use

### Audio Feedback

All major actions provide audio cues:
- 🔊 **High beep**: Listening activated
- 🔉 **Mid beep**: Scan command detected
- 🔈 **Low beep**: Listening deactivated
- ✓ **Two ascending beeps**: Caption successfully generated
- ✗ **Descending beeps**: Error occurred

### Built-in Help Panel

- **Opens automatically** when you first load the site
- Click the **? button** (bottom left) or press **H** or **?** key to toggle help
- Includes:
  - Quick start guide
  - Complete keyboard shortcuts reference
  - Button color explanations with visual indicators
  - Audio feedback descriptions
  - Usage tips
- Accessible with screen readers
- Full keyboard navigation
- Press ESC to close

## Accessibility Features

This application is designed with accessibility as a core priority, following WCAG 2.1 Level AA guidelines:

### Screen Reader Support
- ✅ Full ARIA labels on all interactive elements
- ✅ Semantic HTML structure with proper roles
- ✅ Live region announcements for state changes
- ✅ Alternative text where appropriate
- ✅ Skip-to-content link for keyboard users

### Keyboard Navigation
- ✅ Complete keyboard control (no mouse required)
- ✅ Visible focus indicators on all interactive elements
- ✅ Logical tab order
- ✅ Focus management (trapped in modals, restored on close)
- ✅ Keyboard shortcuts (Spacebar, H, ?, L, ESC)
- ✅ Built-in help panel with complete keyboard reference

### Audio Feedback
- ✅ Beep sounds for mode changes (helps blind users know state)
- ✅ Text-to-speech for all captions
- ✅ Different tones for different actions
- ✅ Non-intrusive volume levels

### Visual Design
- ✅ High contrast colors
- ✅ Large, easy-to-read text
- ✅ Clear visual state indicators (color + shape)
- ✅ Consistent UI patterns
- ✅ Yellow focus outlines for visibility

### Tested With
- ✅ NVDA screen reader (Windows)
- ✅ JAWS screen reader (Windows)
- ✅ Keyboard-only navigation
- ✅ High contrast mode

### Scan History

- All scans are automatically saved with their images and captions
- Click the **📋 button** in the bottom-right corner to view history
- History is stored in your browser's local storage
- Delete individual items by clicking the 🗑️ button on each entry
- History persists across sessions (up to 50 items)

## Troubleshooting

### Voice Recognition Network Error

If you see a "network" error and the microphone button turns red:

1. **Check Internet Connection**: Voice recognition requires an active internet connection as it uses cloud-based speech recognition services
2. **Retry**: Press SPACEBAR to activate listening again once you have internet connection
3. **Button Colors**:
   - 🟢 Green: Microphone active (listening)
   - 🟠 Orange: Speech detected
   - 🔴 Red: Error occurred (network issue or microphone problem)
   - 🔵 Blue: Ready (press spacebar to start)
   - ⚪ Gray: Paused during scan/caption

### Voice Recognition Tips

- Press SPACEBAR once to start listening (button turns green)
- Speak clearly and say "scan" or "scanning"
- The word "scan" can be anywhere in your phrase (e.g., "please scan this")
- Press SPACEBAR again to stop listening when done
- If nothing happens, check browser console for errors

### Other Common Issues

- **Microphone not working**: Check browser permissions and system microphone settings
- **Camera not showing**: Ensure camera permissions are granted in browser settings
- **No audio playback**: Check that your speakers/headphones are working and volume is up

*Made by Team itsJohnSight for [Stevens QuackHacks 2026](https://stevens-quackhacks-2026.devpost.com/) #WeAreJohnSnow*
