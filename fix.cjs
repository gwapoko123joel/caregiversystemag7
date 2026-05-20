const fs = require('fs');
const path = './src/pages/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\\`/g, '`');
content = content.replace(/\\\${/g, '${');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed file');
