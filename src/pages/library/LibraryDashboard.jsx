import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const libraryCards = [
  {
    title: 'Bare Acts',
    icon: 'menu_book',
    path: '/dashboard/library/bare-acts',
    description: 'Browse comprehensive Indian Bare Acts with AI explanations.',
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    hoverBorder: 'hover:border-blue-500/50 dark:hover:border-blue-400/50',
    hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    lineBg: 'bg-blue-600 dark:bg-blue-500',
    shadowHover: 'hover:shadow-blue-500/10',
  },
  {
    title: 'Bookmarks',
    icon: 'bookmark',
    path: '/dashboard/library/bookmarks',
    description: 'Access your saved legal provisions and customized folders.',
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    hoverBorder: 'hover:border-purple-500/50 dark:hover:border-purple-400/50',
    hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    lineBg: 'bg-purple-600 dark:bg-purple-500',
    shadowHover: 'hover:shadow-purple-500/10',
  },
  {
    title: 'Notes',
    icon: 'edit_note',
    path: '/dashboard/library/notes',
    description: 'Review your personalized annotations and case summaries.',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    hoverBorder: 'hover:border-emerald-500/50 dark:hover:border-emerald-400/50',
    hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    lineBg: 'bg-emerald-600 dark:bg-emerald-500',
    shadowHover: 'hover:shadow-emerald-500/10',
  },
  {
    title: 'Forms',
    icon: 'description',
    path: '/dashboard/library/forms',
    description: 'Generate reusable legal forms and templates instantly.',
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    hoverBorder: 'hover:border-orange-500/50 dark:hover:border-orange-400/50',
    hoverText: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
    lineBg: 'bg-orange-600 dark:bg-orange-500',
    shadowHover: 'hover:shadow-orange-500/10',
  },
  {
    title: 'Legal Dictionary',
    icon: 'import_contacts',
    path: '/dashboard/library/dictionary',
    description: 'Quick reference for legal terminology and Latin maxims.',
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
    hoverBorder: 'hover:border-rose-500/50 dark:hover:border-rose-400/50',
    hoverText: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
    lineBg: 'bg-rose-600 dark:bg-rose-500',
    shadowHover: 'hover:shadow-rose-500/10',
  },
  {
    title: 'Saved Judgments',
    icon: 'bookmark',
    path: '/dashboard/library/judgments-saved',
    description: 'Access your bookmarked judgments and custom collections.',
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-500/50 dark:hover:border-amber-400/50',
    hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    lineBg: 'bg-amber-600 dark:bg-amber-500',
    shadowHover: 'hover:shadow-amber-500/10',
  },
  {
    title: 'Lawyer Diary',
    icon: 'calendar_month',
    path: '/dashboard/library/diary',
    description: 'Manage your hearings, case schedule, and daily practice.',
    color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
    hoverBorder: 'hover:border-cyan-500/50 dark:hover:border-cyan-400/50',
    hoverText: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
    lineBg: 'bg-cyan-600 dark:bg-cyan-500',
    shadowHover: 'hover:shadow-cyan-500/10',
  },
  {
    title: 'Court Calendar',
    icon: 'event',
    path: '/dashboard/library/calendar',
    description: 'Visualize your hearings, deadlines, and legal events with Month/Week/Day views.',
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
    hoverBorder: 'hover:border-violet-500/50 dark:hover:border-violet-400/50',
    hoverText: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
    lineBg: 'bg-violet-600 dark:bg-violet-500',
    shadowHover: 'hover:shadow-violet-500/10',
  },
  {
    title: 'Hearing Tracker',
    icon: 'gavel',
    path: '/dashboard/library/hearings',
    description: 'Manage your hearings with timeline view and complete litigation tracking.',
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
    hoverBorder: 'hover:border-rose-500/50 dark:hover:border-rose-400/50',
    hoverText: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
    lineBg: 'bg-rose-600 dark:bg-rose-500',
    shadowHover: 'hover:shadow-rose-500/10',
  },
  {
    title: 'Video Links',
    icon: 'videocam',
    path: '/dashboard/library/video-links',
    description: 'Manage virtual court hearing links and one-click join.',
    color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
    hoverBorder: 'hover:border-teal-500/50 dark:hover:border-teal-400/50',
    hoverText: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
    lineBg: 'bg-teal-600 dark:bg-teal-500',
    shadowHover: 'hover:shadow-teal-500/10',
  },
  {
    title: 'Clients',
    icon: 'group',
    path: '/dashboard/library/clients',
    description: 'Manage your client relationships and CRM.',
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    hoverBorder: 'hover:border-indigo-500/50 dark:hover:border-indigo-400/50',
    hoverText: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    lineBg: 'bg-indigo-600 dark:bg-indigo-500',
    shadowHover: 'hover:shadow-indigo-500/10',
  },
  {
    title: 'Cases',
    icon: 'gavel',
    path: '/dashboard/library/cases',
    description: 'Central case management for all your matters.',
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
    hoverBorder: 'hover:border-rose-500/50 dark:hover:border-rose-400/50',
    hoverText: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
    lineBg: 'bg-rose-600 dark:bg-rose-500',
    shadowHover: 'hover:shadow-rose-500/10',
  },
  {
    title: 'Case Tracking',
    icon: 'track_changes',
    path: '/dashboard/library/case-tracking',
    description: 'Track cases with e-Courts integration readiness.',
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-500/50 dark:hover:border-amber-400/50',
    hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    lineBg: 'bg-amber-600 dark:bg-amber-500',
    shadowHover: 'hover:shadow-amber-500/10',
  },
  {
    title: 'Integration Settings',
    icon: 'settings',
    path: '/dashboard/library/integrations/ecourts',
    description: 'Manage your e-Courts and third-party integrations.',
    color: 'bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    hoverBorder: 'hover:border-slate-500/50 dark:hover:border-slate-400/50',
    hoverText: 'group-hover:text-slate-600 dark:group-hover:text-slate-400',
    lineBg: 'bg-slate-600 dark:bg-slate-500',
    shadowHover: 'hover:shadow-slate-500/10',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 22 }
  }
};

const LibraryDashboard = () => {
  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Library</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Your complete legal knowledge and practice management ecosystem.</p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
        >
          {libraryCards.map((card, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-full"
            >
              <Link
                to={card.path}
                className={`relative flex flex-col h-full p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-800 ${card.hoverBorder} hover:shadow-xl ${card.shadowHover} transition-all duration-300 group overflow-hidden`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${card.color}`}>
                  <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
                </div>
                <h3 className={`text-lg font-bold text-slate-900 dark:text-white ${card.hoverText} transition-colors`}>
                  {card.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex-1">
                  {card.description}
                </p>
                <div className={`mt-4 flex items-center text-sm font-semibold text-slate-400 ${card.hoverText} transition-colors`}>
                  Open <span className="material-symbols-outlined text-[18px] ml-1 transition-transform duration-300 group-hover:translate-x-1.5">arrow_forward</span>
                </div>

                {/* Bottom Matching Color Accent Line on Hover */}
                <span className={`absolute bottom-0 left-0 right-0 h-[3.5px] ${card.lineBg} scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out`} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LibraryDashboard;
