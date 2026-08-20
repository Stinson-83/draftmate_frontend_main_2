const fs = require('fs');
const file = 'src/pages/AdvocateDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    const handleImageChange = (e) => {
                    await advocateProfile.updateDetails({
                        experience: updatedProfile.experience,
                        education: updatedProfile.education,
                        certifications: updatedProfile.certifications
                    });
                } catch (backendErr) {
                    console.info('Backend sync info:', backendErr);
                }
            }

            toast.success('Lawyer Profile saved successfully.');
        } catch (err) {
            toast.error(err.message || 'Failed to save profile');`;

const replacement = `    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB.'); return; }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleListChange = (listName, index, field, value) => {
        setProfile(prev => ({
            ...prev,
            [listName]: prev[listName].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const addListItem = (listName, defaultItem) => {
        setProfile(prev => ({
            ...prev,
            [listName]: [...prev[listName], defaultItem]
        }));
    };

    const removeListItem = (listName, index) => {
        setProfile(prev => ({
            ...prev,
            [listName]: prev[listName].filter((_, i) => i !== index)
        }));
    };

    const handleAddExperience = () => {
        addListItem('experience', {
            company: '', role: '', location: '', start_date: '', end_date: '', is_current: false, description: ''
        });
        setEditingExperience(profile?.experience?.length || 0);
    };

    const handleAddEducation = () => {
        addListItem('education', {
            institution: '', degree: '', field_of_study: '', start_year: '', end_year: '', description: ''
        });
        setEditingEducation(profile?.education?.length || 0);
    };

    const handleAddCertification = () => {
        addListItem('certifications', {
            title: '', type: '', issuing_organization: '', date_achieved: '', expiry_date: '', credential_id: '', credential_url: ''
        });
        setEditingCertification(profile?.certifications?.length || 0);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updatedProfile = {
                ...profile,
                practice_areas: practiceAreas,
            };

            // 1. Save to local storage for immediate persistence
            localStorage.setItem('lawyer_profile', JSON.stringify(updatedProfile));
            setProfile(updatedProfile);

            // 2. Try background API update if backend advocate service is available
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
            }

            toast.success('Lawyer Profile saved successfully.');
            setEditingExperience(null);
            setEditingEducation(null);
            setEditingCertification(null);
        } catch (err) {
            toast.error(err.message || 'Failed to save profile');`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log('Replaced successfully');
} else {
    console.log('Target not found');
}
