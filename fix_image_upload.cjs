const fs = require('fs');
const file = 'src/pages/AdvocateDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const saveProfileCode = `            // 2. Try background API update if backend advocate service is available
            if (tokens.getAccess()) {
                try {
                    let finalImageUrl = updatedProfile.profile_image_url;
                    
                    // Upload image if a new one was selected
                    if (imageFile) {
                        try {
                            const uploadRes = await advocateProfile.uploadImage(imageFile);
                            // Assuming backend returns { url: '...' } or { data: { url: '...' } }
                            const newUrl = uploadRes.url || (uploadRes.data && uploadRes.data.url);
                            if (newUrl) {
                                finalImageUrl = newUrl;
                                updatedProfile.profile_image_url = finalImageUrl;
                                // clear imageFile state so we don't re-upload on next save
                                setImageFile(null);
                            }
                        } catch (imgErr) {
                            console.error('Image upload failed:', imgErr);
                            toast.error('Profile image failed to upload.');
                        }
                    }

                    const { id, user_id, slug, created_at, updated_at, is_verified,
                            profile_completion_score, practice_areas: _pa, experience, education, certifications, ...updateable } = updatedProfile;
                    
                    await advocateProfile.updateMe({ ...updateable, profile_image_url: finalImageUrl });
                    await advocateProfile.updatePracticeAreas(practiceAreas);
                    await advocateProfile.updateDetails({
                        experience: updatedProfile.experience,
                        education: updatedProfile.education,
                        certifications: updatedProfile.certifications
                    });
                } catch (backendErr) {
                    console.info('Backend sync info:', backendErr);
                }
            }`;

const searchString = `            // 2. Try background API update if backend advocate service is available
            if (tokens.getAccess()) {
                try {
                    const { id, user_id, slug, created_at, updated_at, is_verified,
                            profile_completion_score, practice_areas: _pa, experience, education, certifications, ...updateable } = updatedProfile;
                    await advocateProfile.updateMe(updateable);
                    await advocateProfile.updatePracticeAreas(practiceAreas);
                    await advocateProfile.updateDetails({
                        experience: updatedProfile.experience,
                        education: updatedProfile.education,
                        certifications: updatedProfile.certifications
                    });
                } catch (backendErr) {
                    console.info('Backend sync info:', backendErr);
                }
            }`;

if (content.includes(searchString)) {
    content = content.replace(searchString, saveProfileCode);
    fs.writeFileSync(file, content);
    console.log('Image upload logic injected into handleSaveProfile');
} else {
    console.log('Could not find the target string. The file might have been modified already.');
}
