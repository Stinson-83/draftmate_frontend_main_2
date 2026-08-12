const fs = require('fs');
const file = 'src/pages/AdvocateDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace updateDetails with updateVisibility
content = content.replace(/await advocateProfile\.updateDetails\(\{ is_public: newStatus \}\);/g, 'await advocateProfile.updateVisibility({ is_public: newStatus });');
content = content.replace(/await advocateProfile\.updateDetails\(\{ is_public: true \}\);/g, 'await advocateProfile.updateVisibility({ is_public: true });');

fs.writeFileSync(file, content);
console.log('Fixed visibility endpoint');
