const fs = require('fs');
const { execSync } = require('child_process');

// Read dependencies from the "current-deps.txt" file
const dependencies = fs.readFileSync('current-deps.txt', 'utf-8').split('\n').filter(Boolean);

// Install each dependency using npm
dependencies.forEach((dep) => {
  try {
    console.log(`Installing ${dep}...`);
    execSync(`npm install --save ${dep}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to install ${dep}: ${error.message}`);
  }
});
