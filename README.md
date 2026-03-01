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
2. Click "Provide Live Caption" button or say "Scan"
3. Wait for caption to be generated and spoken aloud

## Troubleshooting

### Voice Recognition Network Error (Green Circle Flashing)

If you see a "network" error and the microphone button keeps flashing:

1. **Check Internet Connection**: Voice recognition requires an active internet connection as it uses cloud-based speech recognition services
2. **Retry**: Click the microphone button (🎤) in the bottom left to retry once you have internet connection
3. **Button Colors**:
   - 🟢 Green: Voice recognition is active and listening
   - 🟠 Orange: Speech is being detected
   - 🔴 Red: Error occurred (network issue or microphone problem)
   - 🔵 Blue: Starting/restarting

### Other Common Issues

- **Microphone not working**: Check browser permissions and system microphone settings
- **Camera not showing**: Ensure camera permissions are granted in browser settings
- **No audio playback**: Check that your speakers/headphones are working and volume is up
