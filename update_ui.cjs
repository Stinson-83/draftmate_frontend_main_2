const fs = require('fs');
const file = 'src/pages/AdvocateDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const getChunk = (startMarker, endMarker) => {
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker, startIndex);
    if (startIndex !== -1 && endIndex !== -1) {
        return { startIndex, endIndex };
    }
    return null;
};

const experienceBlock = `                        {/* Experience */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8"
                        >
                            <div className="flex flex-wrap items-center justify-between mb-6 border-b border-slate-100 pb-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><BriefcaseBusiness className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Experience</h3>
                                        <p className="text-sm text-slate-500">Your professional timeline.</p>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl" onClick={handleAddExperience}>
                                    <Plus className="w-4 h-4 mr-1.5" /> Add Experience
                                </Button>
                            </div>
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:ml-6 md:before:translate-x-0 before:h-full before:w-0.5 before:bg-blue-100">
                                {experience.length === 0 && <p className="text-slate-500 text-sm ml-8 md:ml-12">No experience added yet.</p>}
                                <AnimatePresence>
                                    {experience.map((exp, index) => (
                                        <motion.div 
                                            key={index} 
                                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                                            className="relative flex items-start group"
                                        >
                                            {/* Timeline marker */}
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-blue-500 absolute left-0 md:left-2 shadow-sm shrink-0 md:group-hover:scale-110 transition-transform mt-2 z-10" />
                                            
                                            {/* Card */}
                                            <div className="w-[calc(100%-2.5rem)] md:w-[calc(100%-4rem)] p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all ml-10 md:ml-16">
                                                {editingExperience === index ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="col-span-1 md:col-span-2 flex justify-between items-center mb-2">
                                                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Editing Experience</span>
                                                            <div className="flex gap-2">
                                                                <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('experience', index)} className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button type="button" size="sm" variant="outline" onClick={() => setEditingExperience(null)} className="h-8 px-3 text-slate-600">
                                                                    Done
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Job Title / Position</Label>
                                                            <Input value={exp.role} onChange={(e) => handleListChange('experience', index, 'role', e.target.value)} placeholder="e.g. Senior Advocate" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Organization</Label>
                                                            <Input value={exp.company} onChange={(e) => handleListChange('experience', index, 'company', e.target.value)} placeholder="e.g. Supreme Court of India" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Location</Label>
                                                            <Input value={exp.location} onChange={(e) => handleListChange('experience', index, 'location', e.target.value)} placeholder="e.g. New Delhi" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Start Date</Label>
                                                                <Input type="date" value={exp.start_date} onChange={(e) => handleListChange('experience', index, 'start_date', e.target.value)} className="bg-slate-50/50 rounded-lg text-sm" />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">End Date</Label>
                                                                {exp.is_current ? (
                                                                    <Input disabled value="Present" className="bg-slate-100 text-slate-400 rounded-lg text-sm" />
                                                                ) : (
                                                                    <Input type="date" value={exp.end_date} onChange={(e) => handleListChange('experience', index, 'end_date', e.target.value)} className="bg-slate-50/50 rounded-lg text-sm" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-1">
                                                            <input type="checkbox" id={\`is-current-exp-\${index}\`} checked={exp.is_current}
                                                                onChange={(e) => handleListChange('experience', index, 'is_current', e.target.checked)}
                                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                            <Label htmlFor={\`is-current-exp-\${index}\`} className="text-xs font-semibold text-slate-600 cursor-pointer">I currently work here</Label>
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2 mt-2">
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Description</Label>
                                                            <Textarea value={exp.description} onChange={(e) => handleListChange('experience', index, 'description', e.target.value)}
                                                                placeholder="Describe your responsibilities and achievements..."
                                                                className="resize-none bg-slate-50/50 h-24 rounded-lg text-sm" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="text-base font-bold text-slate-800">{exp.role || 'Position Title'}</h4>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingExperience(index)} className="h-7 px-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-medium text-slate-700 mb-2">
                                                            {exp.company || 'Organization Name'} 
                                                            {exp.location && <span className="text-slate-400 font-normal"> • {exp.location}</span>}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium bg-slate-100/80 w-fit px-2.5 py-1 rounded-md mb-4">
                                                            {exp.start_date || 'Start'} — {exp.is_current ? 'Present' : (exp.end_date || 'End')}
                                                        </div>
                                                        {exp.description && (
                                                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                                                {exp.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>
`;

const educationBlock = `                        {/* Education */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8"
                        >
                            <div className="flex flex-wrap items-center justify-between mb-6 border-b border-slate-100 pb-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><GraduationCap className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Education</h3>
                                        <p className="text-sm text-slate-500">Your academic background.</p>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl" onClick={handleAddEducation}>
                                    <Plus className="w-4 h-4 mr-1.5" /> Add Education
                                </Button>
                            </div>
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:ml-6 md:before:translate-x-0 before:h-full before:w-0.5 before:bg-blue-100">
                                {education.length === 0 && <p className="text-slate-500 text-sm ml-8 md:ml-12">No education added yet.</p>}
                                <AnimatePresence>
                                    {education.map((edu, index) => (
                                        <motion.div 
                                            key={index} 
                                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                                            className="relative flex items-start group"
                                        >
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-slate-400 absolute left-0 md:left-2 shadow-sm shrink-0 md:group-hover:scale-110 transition-transform mt-2 z-10" />
                                            <div className="w-[calc(100%-2.5rem)] md:w-[calc(100%-4rem)] p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all ml-10 md:ml-16">
                                                {editingEducation === index ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="col-span-1 md:col-span-2 flex justify-between items-center mb-2">
                                                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Editing Education</span>
                                                            <div className="flex gap-2">
                                                                <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('education', index)} className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button type="button" size="sm" variant="outline" onClick={() => setEditingEducation(null)} className="h-8 px-3 text-slate-600">
                                                                    Done
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2">
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Institution</Label>
                                                            <Input value={edu.institution} onChange={(e) => handleListChange('education', index, 'institution', e.target.value)} placeholder="e.g. National Law School" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Degree</Label>
                                                            <Input value={edu.degree} onChange={(e) => handleListChange('education', index, 'degree', e.target.value)} placeholder="e.g. LL.B." className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Field / Specialization</Label>
                                                            <Input value={edu.field_of_study} onChange={(e) => handleListChange('education', index, 'field_of_study', e.target.value)} placeholder="e.g. Corporate Law" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Start Year/Date</Label>
                                                            <Input value={edu.start_year} onChange={(e) => handleListChange('education', index, 'start_year', e.target.value)} placeholder="YYYY" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">End Year/Date</Label>
                                                            <Input value={edu.end_year} onChange={(e) => handleListChange('education', index, 'end_year', e.target.value)} placeholder="YYYY" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2 mt-2">
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Description</Label>
                                                            <Textarea value={edu.description} onChange={(e) => handleListChange('education', index, 'description', e.target.value)}
                                                                placeholder="Extracurriculars, societies, achievements..."
                                                                className="resize-none bg-slate-50/50 h-20 rounded-lg text-sm" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="text-base font-bold text-slate-800">{edu.degree || 'Degree'} {edu.field_of_study ? \`in \${edu.field_of_study}\` : ''}</h4>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingEducation(index)} className="h-7 px-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-medium text-slate-700 mb-2">
                                                            {edu.institution || 'Institution Name'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium bg-slate-100/80 w-fit px-2.5 py-1 rounded-md mb-4">
                                                            {edu.start_year || 'Start'} — {edu.end_year || 'End'}
                                                        </div>
                                                        {edu.description && (
                                                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                                                {edu.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>
`;

const certificationsBlock = `                        {/* Certifications */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8 mb-10"
                        >
                            <div className="flex flex-wrap items-center justify-between mb-6 border-b border-slate-100 pb-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Award className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Certifications</h3>
                                        <p className="text-sm text-slate-500">Your professional credentials.</p>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl" onClick={handleAddCertification}>
                                    <Plus className="w-4 h-4 mr-1.5" /> Add Certification
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {certifications.length === 0 && <p className="text-slate-500 text-sm col-span-full">No certifications added yet.</p>}
                                <AnimatePresence>
                                    {certifications.map((cert, index) => (
                                        <motion.div 
                                            key={index} 
                                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}
                                            className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                                        >
                                            {editingCertification === index ? (
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Editing Certification</span>
                                                        <div className="flex gap-2">
                                                            <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('certifications', index)} className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button type="button" size="sm" variant="outline" onClick={() => setEditingCertification(null)} className="h-8 px-3 text-slate-600">
                                                                Done
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Certification Name</Label>
                                                        <Input value={cert.title} onChange={(e) => handleListChange('certifications', index, 'title', e.target.value)} placeholder="e.g. Certified Mediator" className="bg-slate-50/50 rounded-lg text-sm" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Issuing Organization</Label>
                                                        <Input value={cert.issuing_organization} onChange={(e) => handleListChange('certifications', index, 'issuing_organization', e.target.value)} placeholder="e.g. Indian Institute of Arbitration" className="bg-slate-50/50 rounded-lg text-sm" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Issue Date</Label>
                                                            <Input type="date" value={cert.date_achieved} onChange={(e) => handleListChange('certifications', index, 'date_achieved', e.target.value)} className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Expiry Date</Label>
                                                            <Input type="date" value={cert.expiry_date} onChange={(e) => handleListChange('certifications', index, 'expiry_date', e.target.value)} className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Credential ID</Label>
                                                        <Input value={cert.credential_id} onChange={(e) => handleListChange('certifications', index, 'credential_id', e.target.value)} placeholder="e.g. 1234ABCD" className="bg-slate-50/50 rounded-lg text-sm" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Credential URL</Label>
                                                        <Input value={cert.credential_url} onChange={(e) => handleListChange('certifications', index, 'credential_url', e.target.value)} placeholder="https://..." className="bg-slate-50/50 rounded-lg text-sm" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col h-full justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                                                <BadgeCheck className="w-4 h-4 text-sky-500" />
                                                                <span className="font-bold uppercase tracking-wider text-[10px]">Credential</span>
                                                            </div>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingCertification(index)} className="h-7 px-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-base font-bold text-slate-800 mb-1">{cert.title || 'Certification Name'}</h4>
                                                        <p className="text-sm font-medium text-slate-600 mb-3">{cert.issuing_organization || 'Issuing Organization'}</p>
                                                        <div className="text-xs text-slate-500 mb-4 flex flex-col gap-1">
                                                            {cert.date_achieved && <span>Issued {cert.date_achieved}</span>}
                                                            {cert.expiry_date && <span>Expires {cert.expiry_date}</span>}
                                                        </div>
                                                    </div>
                                                    {(cert.credential_id || cert.credential_url) && (
                                                        <div className="pt-4 border-t border-slate-100">
                                                            {cert.credential_id && (
                                                                <p className="text-xs text-slate-500 mb-1 font-mono">ID: {cert.credential_id}</p>
                                                            )}
                                                            {cert.credential_url && (
                                                                <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 w-fit">
                                                                    Show Credential <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>
`;

let expChunk = getChunk('{/* Experience */}', '{/* Education */}');
let eduChunk = getChunk('{/* Education */}', '{/* Certifications */}');
let certChunk = getChunk('{/* Certifications */}', '{/* Sticky Save Action */}');

if (expChunk && eduChunk && certChunk) {
    let newContent = content.substring(0, expChunk.startIndex) 
        + experienceBlock + '\n' 
        + educationBlock + '\n' 
        + certificationsBlock + '\n'
        + content.substring(certChunk.endIndex);
    
    // Check if Edit2 and ExternalLink need to be imported
    if (!newContent.includes('Edit2')) {
        newContent = newContent.replace('import { ', 'import { Edit2, ExternalLink, ');
    }
    
    fs.writeFileSync(file, newContent);
    console.log('UI updated successfully');
} else {
    console.log('Could not find markers', {expChunk, eduChunk, certChunk});
}
