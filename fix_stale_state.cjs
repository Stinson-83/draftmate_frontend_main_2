const fs = require('fs');
const file = 'src/pages/AdvocateDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const searchString = `                    await advocateProfile.updateDetails({
                        experience: updatedProfile.experience,
                        education: updatedProfile.education,
                        certifications: updatedProfile.certifications
                    });
                } catch (backendErr) {`;

const replaceString = `                    await advocateProfile.updateDetails({
                        experience: updatedProfile.experience,
                        education: updatedProfile.education,
                        certifications: updatedProfile.certifications
                    });

                    // FETCH LATEST PROFILE FROM SERVER TO AVOID STALE STATE BUG
                    const profRes = await advocateProfile.getMe();
                    if (profRes && profRes.data) {
                        const p = profRes.data;
                        p.experience = Array.isArray(p.experience) ? p.experience : updatedProfile.experience;
                        p.education = Array.isArray(p.education) ? p.education : updatedProfile.education;
                        p.certifications = Array.isArray(p.certifications) ? p.certifications : updatedProfile.certifications;
                        p.languages = Array.isArray(p.languages) ? p.languages : updatedProfile.languages;
                        setProfile(p);
                        setPracticeAreas(Array.isArray(p.practice_areas) ? p.practice_areas : updatedProfile.practice_areas);
                        localStorage.setItem('lawyer_profile', JSON.stringify(p));
                    }
                } catch (backendErr) {`;

if (content.includes(searchString)) {
    content = content.replace(searchString, replaceString);
    fs.writeFileSync(file, content);
    console.log('Stale state reload injected');
} else {
    console.log('Could not find search string');
}
