const fs = require('fs');
const file = 'src/pages/AdvocateDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const calcIdx = lines.findIndex(l => l.includes('import { calculateProfileCompletion } from '));
if (calcIdx !== -1) {
    const newTop = `/**
 * AdvocateDashboard — Full fixes applied:
 * - Logout button with token clearing
 * - Token expiry handled — redirects to login with message
 * - Profile image upload UI
 * - Missing fields: bio, years_experience, languages, court_affiliation, practice_areas, office_address
 * - Experience, Education, Certifications sections
 * - Analytics tab with real DB data
 * - Profile completion score from server
 */

import React, { useState, useEffect } from 'react';
import {
    Save, User, Calendar, MessageCircle, ShieldCheck, Clock,
    XCircle, CheckCircle2, LogOut, BarChart2, Eye, Share2,
    TrendingUp, Upload, Trash2, AlertCircle, Plus, ExternalLink, Copy, Gavel, Users, Link,
    BadgeCheck, Award, GraduationCap, BriefcaseBusiness, Languages as LanguagesIcon, Sparkles, CalendarDays, Globe, Scale, Check, Edit2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';`;
    const newLines = newTop.split('\n').concat(lines.slice(calcIdx));
    fs.writeFileSync(file, newLines.join('\n'));
    console.log('Fixed imports');
}
