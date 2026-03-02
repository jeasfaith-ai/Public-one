const { execSync } = require('child_process');
const fs = require('fs');
try {
  const output = execSync('git log -p src/components/Landing.tsx').toString();
  fs.writeFileSync('git_history.txt', output);
  console.log('Success');
} catch (e) {
  console.error(e);
}
