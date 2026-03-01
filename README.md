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
2. Click "Provide Live Caption" button
3. Wait for caption to be generated and spoken aloud
