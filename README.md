# Flappy Bird PWA 🐦

A Progressive Web App (PWA) implementation of Flappy Bird designed for children ages 8-13. This game works 100% offline and can be installed as a standalone app on tablets and mobile devices.

## Features

✅ **Progressive Web App (PWA)** - No app store submission needed
✅ **100% Offline Support** - All assets cached locally after first load
✅ **Fullscreen/Kiosk Mode** - Prevents navigation away from the game
✅ **Add to Home Screen** - Installable as a native-like app

## How to Install

### On Desktop (Chrome/Edge)
1. Open the game in your browser
2. Look for the install icon in the address bar (or browser menu)
3. Click "Install" to add it to your applications
4. The game will open in its own window

### On Mobile/Tablet (iOS Safari)
1. Open the game in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Name the app and tap "Add"
5. The game icon will appear on your home screen

### On Mobile/Tablet (Android Chrome)
1. Open the game in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home screen"
4. Confirm by tapping "Add"
5. The game icon will appear on your home screen

## How to Play

- **Tap** the screen (or press **Space**) to make the bird jump
- Avoid the pipes
- Try to get the highest score!

## Running Locally

To run the game locally for development:

```bash
# Using Python (Python 3)
python3 -m http.server 8080

# Using Node.js (if you have http-server installed)
npx http-server -p 8080

# Or using PHP
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

**Note:** For PWA features to work properly, you need to serve the app over HTTPS in production, or use localhost for development.

## Technical Details

### Files Structure
- `index.html` - Main HTML structure
- `game.js` - Game logic and controls
- `styles.css` - Styling and responsive design
- `manifest.json` - PWA configuration
- `sw.js` - Service Worker for offline support
- `icon-192.png`, `icon-512.png` - App icons

### PWA Features
- **Manifest**: Configured for fullscreen display in portrait mode
- **Service Worker**: Implements cache-first strategy for offline support
- **Fullscreen API**: Uses standard and vendor-prefixed APIs for maximum compatibility
- **Responsive**: Adapts to different screen sizes

### Browser Compatibility
- Chrome/Edge (desktop & mobile) - Full support
- Safari (iOS) - Full support (with some PWA limitations)
- Firefox - Full support
- Samsung Internet - Full support

## Development

The game is built with vanilla JavaScript and HTML5 Canvas for maximum compatibility and minimal dependencies.

### Game Configuration
Edit the `CONFIG` object in `game.js` to adjust game difficulty:
- `gravity`: Bird fall speed
- `jumpStrength`: Bird jump power
- `pipeSpeed`: Pipe movement speed
- `pipeGap`: Space between pipes
- `pipeSpawnInterval`: Frames between new pipes

## License

This project is open source and available for educational purposes.