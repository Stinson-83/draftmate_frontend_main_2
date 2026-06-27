import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { advocateProfile } from '../services/advocateApi';
import { ChevronRight, ChevronLeft, CheckCircle2, Upload, Plus, Trash2 } from 'lucide-react';

const PRACTICE_AREA_OPTIONS = [
  'Criminal Law', 'Corporate Law', 'Family Law', 'Cyber Law', 'Tax Law',
  'Property Law', 'Immigration Law', 'Consumer Rights Law', 'Civil Law',
  'Startup & Business Law', 'Constitutional Law', 'Intellectual Property',
  'Labour Law', 'Environmental Law', 'Arbitration & Mediation',
  'Real Estate', 'Banking & Finance', 'Matrimonial Law',
];

const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada',
  'Gujarati', 'Bengali', 'Punjabi', 'Malayalam', 'Urdu', 'Odia',
];

const COURT_OPTIONS = [
  'Supreme Court of India', 'High Court', 'District Court',
  'Sessions Court', 'Family Court', 'Consumer Court', 'Lok Adalat',
  'Debt Recovery Tribunal', 'NCLT', 'NGT',
];

const TOTAL_STEPS = 6;

export default function AdvocateOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    bar_council_number: '',
    years_experience: '',
    consultation_fee: '',
    location: '',
    court_affiliation: '',
    office_address: '',
    practice_areas: [],
    bio: '',
    languages: [],
    education: [{ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '' }],
    experience: [{ company: '', role: '', start_date: '', end_date: '', is_current: false, description: '' }],
    certifications: [{ title: '', type: '', date_achieved: '' }],
  });

  // Load existing profile data
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await advocateProfile.getMe();
        const p = res.data || {};
        setFormData({
          bar_council_number: p.bar_council_number || '',
          years_experience: p.years_experience || '',
          consultation_fee: p.consultation_fee || '',
          location: p.location || '',
          court_affiliation: p.court_affiliation || '',
          office_address: p.office_address || '',
          practice_areas: Array.isArray(p.practice_areas) ? p.practice_areas : [],
          bio: p.bio || '',
          languages: Array.isArray(p.languages) ? p.languages : [],
          education: Array.isArray(p.education) && p.education.length ? p.education : [{ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '' }],
          experience: Array.isArray(p.experience) && p.experience.length ? p.experience : [{ company: '', role: '', start_date: '', end_date: '', is_current: false, description: '' }],
          certifications: Array.isArray(p.certifications) && p.certifications.length ? p.certifications : [{ title: '', type: '', date_achieved: '' }],
        });
        if (p.profile_image_url) setProfileImagePreview(p.profile_image_url);
      } catch (err) {
        // Ignore
      }
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value],
      };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB.');
      return;
    }
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleListChange = (listName, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addListItem = (listName, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [listName]: [...prev[listName], defaultItem]
    }));
  };

  const removeListItem = (listName, index) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index)
    }));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading('Saving your profile...');
    try {
      if (profileImageFile) {
        try {
          await advocateProfile.uploadImage(profileImageFile);
        } catch (imgErr) {
          toast.warning('Profile image upload failed');
        }
      }

      await advocateProfile.completeOnboarding({
        bar_council_number: formData.bar_council_number || undefined,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : undefined,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : undefined,
        location: formData.location || undefined,
        court_affiliation: formData.court_affiliation || undefined,
        bio: formData.bio || undefined,
        languages: formData.languages.length ? formData.languages : undefined,
        practice_areas: formData.practice_areas.length ? formData.practice_areas : undefined,
        office_address: formData.office_address || undefined,
        education: formData.education.filter(e => e.institution && e.degree).length ? formData.education.filter(e => e.institution && e.degree) : undefined,
        experience: formData.experience.filter(e => e.company && e.role).length ? formData.experience.filter(e => e.company && e.role) : undefined,
        certifications: formData.certifications.filter(c => c.title).length ? formData.certifications.filter(c => c.title) : undefined,
      });

      toast.dismiss(toastId);
      toast.success('Profile is live on the marketplace!');
      navigate('/dashboard/advocate-profile');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.bar_council_number && formData.years_experience && formData.consultation_fee && formData.location && formData.court_affiliation;
    }
    if (step === 2) return formData.practice_areas.length > 0;
    if (step === 3) return formData.bio.trim().length > 20;
    return true;
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-slate-900">Professional Details</h3>
      <div>
        <Label htmlFor="bar_council_number">Bar Council Number *</Label>
        <Input id="bar_council_number" name="bar_council_number"
          value={formData.bar_council_number} onChange={handleChange}
          placeholder="e.g. D/1234/2010" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="years_experience">Years of Experience *</Label>
          <Input id="years_experience" name="years_experience" type="number" min="0"
            value={formData.years_experience} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="consultation_fee">Consultation Fee (₹) *</Label>
          <Input id="consultation_fee" name="consultation_fee" type="number" min="0"
            value={formData.consultation_fee} onChange={handleChange} required />
        </div>
      </div>
      <div>
        <Label htmlFor="location">Primary Location *</Label>
        <Input id="location" name="location"
          value={formData.location} onChange={handleChange}
          placeholder="e.g. New Delhi, Delhi" required />
      </div>
      <div>
        <Label htmlFor="court_affiliation">Primary Court Affiliation *</Label>
        <select id="court_affiliation" name="court_affiliation"
          className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.court_affiliation} onChange={handleChange} required>
          <option value="">Select court...</option>
          {COURT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="office_address">Office Address</Label>
        <Textarea id="office_address" name="office_address"
          value={formData.office_address} onChange={handleChange}
          placeholder="Enter your office address"
          className="min-h-[80px]" />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900">Practice Areas</h3>
      <p className="text-sm text-slate-500">Select all that apply. Choose at least one.</p>
      <div className="grid grid-cols-2 gap-2">
        {PRACTICE_AREA_OPTIONS.map(pa => (
          <label key={pa}
            className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium
              ${formData.practice_areas.includes(pa)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'}`}>
            <input type="checkbox" className="hidden"
              checked={formData.practice_areas.includes(pa)}
              onChange={() => toggleMultiSelect('practice_areas', pa)} />
            <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center
              ${formData.practice_areas.includes(pa) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
              {formData.practice_areas.includes(pa) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            {pa}
          </label>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-slate-900">About You</h3>
      <div>
        <Label htmlFor="bio">Professional Bio *</Label>
        <Textarea id="bio" name="bio"
          value={formData.bio} onChange={handleChange}
          placeholder="Write a 2-3 sentence overview of your expertise, experience, and specialization..."
          className="min-h-[120px] resize-none" required />
        <p className="text-xs text-slate-400 mt-1">{formData.bio.length} / 500 chars</p>
      </div>
      <div>
        <Label>Languages Spoken</Label>
        <p className="text-xs text-slate-400 mb-2">Select all that apply.</p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map(lang => (
            <button key={lang} type="button"
              onClick={() => toggleMultiSelect('languages', lang)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                ${formData.languages.includes(lang)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Education</h3>
        <Button type="button" size="sm" onClick={() => addListItem('education', { institution: '', degree: '', field_of_study: '', start_year: '', end_year: '' })}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
      {formData.education.map((edu, index) => (
        <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Education {index + 1}</Label>
            {formData.education.length > 1 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('education', index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Institution</Label>
              <Input value={edu.institution} onChange={(e) => handleListChange('education', index, 'institution', e.target.value)} />
            </div>
            <div>
              <Label>Degree</Label>
              <Input value={edu.degree} onChange={(e) => handleListChange('education', index, 'degree', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Field of Study</Label>
            <Input value={edu.field_of_study} onChange={(e) => handleListChange('education', index, 'field_of_study', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Year</Label>
              <Input type="number" value={edu.start_year} onChange={(e) => handleListChange('education', index, 'start_year', e.target.value)} />
            </div>
            <div>
              <Label>End Year</Label>
              <Input type="number" value={edu.end_year} onChange={(e) => handleListChange('education', index, 'end_year', e.target.value)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Experience</h3>
          <Button type="button" size="sm" onClick={() => addListItem('experience', { company: '', role: '', start_date: '', end_date: '', is_current: false, description: '' })}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
        {formData.experience.map((exp, index) => (
          <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Experience {index + 1}</Label>
              {formData.experience.length > 1 && (
                <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('experience', index)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company/Firm</Label>
                <Input value={exp.company} onChange={(e) => handleListChange('experience', index, 'company', e.target.value)} />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={exp.role} onChange={(e) => handleListChange('experience', index, 'role', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={exp.start_date} onChange={(e) => handleListChange('experience', index, 'start_date', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>End Date</Label>
                {exp.is_current ? (
                  <Input disabled placeholder="Present" />
                ) : (
                  <Input type="date" value={exp.end_date} onChange={(e) => handleListChange('experience', index, 'end_date', e.target.value)} />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id={`exp-current-${index}`} checked={exp.is_current}
                onChange={(e) => handleListChange('experience', index, 'is_current', e.target.checked)} />
              <Label htmlFor={`exp-current-${index}`} className="text-sm">I currently work here</Label>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={exp.description} onChange={(e) => handleListChange('experience', index, 'description', e.target.value)}
                placeholder="Describe your role and responsibilities"
                className="min-h-[80px]" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Certifications</h3>
          <Button type="button" size="sm" onClick={() => addListItem('certifications', { title: '', type: '', date_achieved: '' })}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
        {formData.certifications.map((cert, index) => (
          <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Certification {index + 1}</Label>
              {formData.certifications.length > 1 && (
                <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('certifications', index)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
            <div>
              <Label>Title</Label>
              <Input value={cert.title} onChange={(e) => handleListChange('certifications', index, 'title', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Input value={cert.type} onChange={(e) => handleListChange('certifications', index, 'type', e.target.value)} />
              </div>
              <div>
                <Label>Date Achieved</Label>
                <Input type="date" value={cert.date_achieved} onChange={(e) => handleListChange('certifications', index, 'date_achieved', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-slate-900">Profile Photo</h3>
      <p className="text-sm text-slate-500">
        Profiles with a photo get significantly more consultation requests.
      </p>
      <div className="flex flex-col items-center gap-6">
        {profileImagePreview ? (
          <img src={profileImagePreview} alt="Preview"
            className="w-32 h-32 rounded-full object-cover ring-4 ring-blue-200 shadow-lg" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
            <Upload className="w-8 h-8 text-slate-400" />
          </div>
        )}
        <label className="cursor-pointer">
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={handleImageChange} />
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm">
            <Upload className="w-4 h-4" />
            {profileImagePreview ? 'Change Photo' : 'Upload Photo'}
          </div>
        </label>
        <p className="text-xs text-slate-400">PNG, JPEG or WEBP · Max 10 MB</p>
      </div>
    </div>
  );

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];
  const stepLabels = ['Professional', 'Practice', 'About', 'Education', 'Experience', 'Photo'];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-slate-900">Complete Your Profile</h2>
            <span className="text-sm font-semibold text-slate-500">Step {step} of {TOTAL_STEPS}</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {stepLabels.map((label, i) => (
              <span key={i} className={`text-[11px] font-medium ${i + 1 === step ? 'text-blue-600' : 'text-slate-400'}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {steps[step - 1]()}

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <Button variant="ghost" onClick={() => step > 1 && setStep(s => s - 1)}
              disabled={step === 1} className="text-slate-500">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            {step < TOTAL_STEPS ? (
              <Button onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isSubmitting}
                className="bg-slate-900 hover:bg-blue-600 text-white px-6">
                {isSubmitting ? 'Publishing...' : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Publish Profile</>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="text-center mt-4">
          <button onClick={() => navigate('/dashboard/advocate-profile')}
            className="text-sm text-slate-400 hover:text-slate-600 underline">
            Skip for now — complete from dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
