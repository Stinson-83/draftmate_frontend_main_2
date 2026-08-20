const fs = require('fs');
const file = 'src/pages/AdvocateDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace updateVisibility with updateMe
// We need to pass the updateable payload to updateMe so it doesn't wipe out other fields if it's a strict PUT.
content = content.replace(/await advocateProfile\.updateVisibility\(\{ is_public: newStatus \}\);/g, `const { id, user_id, slug, created_at, updated_at, is_verified, profile_completion_score, practice_areas: _pa, experience, education, certifications, ...updateable } = profile;
                                            await advocateProfile.updateMe({ ...updateable, is_public: newStatus });`);

content = content.replace(/await advocateProfile\.updateVisibility\(\{ is_public: true \}\);/g, `const { id, user_id, slug, created_at, updated_at, is_verified, profile_completion_score, practice_areas: _pa, experience, education, certifications, ...updateable } = profile;
                                                            await advocateProfile.updateMe({ ...updateable, is_public: true });`);

fs.writeFileSync(file, content);
console.log('Fixed visibility endpoint to updateMe');
