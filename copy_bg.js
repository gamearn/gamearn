const fs = require('fs');
const path = require('path');

const brainDir = 'C:/Users/olubu/.gemini/antigravity-ide/brain/d9fbf1e4-0eb2-4a8b-b9c2-f43ff54668e0';
const authDir = 'c:/Users/olubu/OneDrive/Desktop/game/gamearn/assets/auth';

const authSource = path.join(brainDir, 'auth_bg_clean_1789600076274.jpg');

if (fs.existsSync(authSource)) {
  fs.copyFileSync(authSource, path.join(authDir, 'forgot_bg.png'));
  console.log('Successfully updated forgot_bg.png (cleaned of all words and forms)');
}
