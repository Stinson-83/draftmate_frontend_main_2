export const calculateProfileCompletion = (profile) => {
    if (!profile) return { percentage: 0, missingFields: [] };

    let score = 0;
    let missingFields = [];

    const checkField = (name, value, weight, isArray = false, isObject = false) => {
        let isFilled = false;
        if (isArray) {
            isFilled = Array.isArray(value) && value.length > 0;
        } else if (isObject) {
            isFilled = value && Object.values(value).some(v => v && String(v).trim() !== '');
        } else {
            isFilled = value !== undefined && value !== null && String(value).trim() !== '';
        }

        if (isFilled) {
            score += weight;
        } else {
            missingFields.push(name);
        }
    };

    checkField('Name / Title', profile.title || profile.name || profile.firstName, 5);
    checkField('Bar Council Number', profile.bar_council_number, 10);
    checkField('Professional Bio', profile.bio, 10);
    checkField('Location', profile.location, 5);
    checkField('Profile Image', profile.profile_image_url || profile.image, 10);
    checkField('Consultation Fee', profile.consultation_fee, 5);
    checkField('Languages', profile.languages, 5, true);
    checkField('Court Affiliation', profile.court_affiliation, 5);
    checkField('Office Address', profile.office_address, 5);
    checkField('Phone', profile.phone, 5);
    checkField('Social Links', profile.social_links, 5, false, true);
    checkField('Availability Settings', profile.availability_settings, 5);
    checkField('Practice Areas', profile.practice_areas, 10, true);
    checkField('Professional Experience', profile.experience, 5, true);
    checkField('Education', profile.education, 5, true);
    checkField('Certifications', profile.certifications, 5, true);

    const percentage = Math.min(score, 100);
    return { percentage, missingFields };
};
