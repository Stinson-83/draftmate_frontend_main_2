const fs = require('fs');
const file = 'src/pages/AdvocateDashboard.jsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// Clean up the garbage we injected
content = content.replace(/sence>\n                                <\/div>\n                            <\/motion\.div>\n                        <\/div>\n\n/, '                        </div>\n\n');

fs.writeFileSync(file, content);
console.log('Fixed garbage');
