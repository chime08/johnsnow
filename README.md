# Live Caption Assistant

Accessible live captioning system for people with visual impairments.

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

5. Open browser to `http://localhost:3000`

## Platform Support

- Windows: Works natively
- Raspberry Pi 5: Ensure Node.js is installed via `sudo apt install nodejs npm`

## Usage

1. Allow camera access when prompted
2. **Press SPACEBAR** to activate listening (or click the "Scan" button)
3. **Say "Scan"** to caption what the camera sees
4. Caption will be displayed and spoken aloud
5. **Press SPACEBAR again** to stop listening
6. View previous scans by clicking the 📋 history button (top right)

### Voice Control (Toggle Mode)

- **Press SPACEBAR once**: Activates microphone (button turns green, starts listening)
- **Say "Scan"**: Triggers image capture and captioning
- **Press SPACEBAR again**: Deactivates microphone (button turns blue, stops listening)
- This toggle design is more accessible and easier to use

### Scan History

- All scans are automatically saved with their images and captions
- Click the **📋 button** in the top-right corner to view history
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
