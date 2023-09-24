const { execSync } = require('child_process');
// const fs = require('fs-extra');

// Step 1: Check out the 'dev' branch
try {
  execSync('git checkout dev');
  console.log('Switched to the dev branch');
} catch (error) {
  console.error('Error switching to the dev branch:', error.stderr.toString());
  process.exit(1);
}

// Step 2: Build the project
try {
  execSync('vue-cli-service build --dest dist-dev');
  console.log('Built the project for dev branch');
} catch (error) {
  console.error('Error building the project:', error.stderr.toString());
  process.exit(1);
}