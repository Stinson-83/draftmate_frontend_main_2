import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { videoLinksService } from '../../services/library/videoLinksService';
import { supportedPlatforms } from '../../data/mockVideoLinks';

const VideoLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const data = await videoLinksService.getLinks();
      setLinks(data);
    } catch {
      toast.error('Failed to load video links');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this video link?')) {
      try {
        await videoLinksService.deleteLink(id);
        toast.success('Video link deleted');
        loadLinks();
      } catch {
        toast.error('Failed to delete video link');
      }
    }
  };

  const handleJoin = (meetingLink) => {
    if (meetingLink) {
      window.open(meetingLink, '_blank');
    } else {
      toast.error('No meeting link available');
    }
  };

  const filterLinks = (type) => {
    const today = new Date().toISOString().split('T')[0];
    switch (type) {
      case 'today':
        return links.filter(l => l.hearingDate === today);
      case 'upcoming':
        return links.filter(l => l.hearingDate > today);
      case 'past':
        return links.filter(l => l.hearingDate < today);
      default:
        return links;
    }
  };

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      today: links.filter(l => l.hearingDate === today).length,
      upcoming: links.filter(l => l.hearingDate > today).length,
      completed: links.filter(l => l.hearingDate < today).length,
    };
  };

  const stats = getStats();
  const todayLinks = filterLinks('today');
  const upcomingLinks = filterLinks('upcoming');
  const pastLinks = filterLinks('past');

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'Zoom': return 'videocam';
      case 'WebEx': return 'video_call';
      case 'Google Meet': return 'group';
      case 'Microsoft Teams': return 'forum';
      default: return 'link';
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'Zoom': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'WebEx': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'Google Meet': return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'Microsoft Teams': return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Link to="/dashboard/library" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#2563EB] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Video Links</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage virtual court hearing links and one-click join
            </p>
          </div>
          <button
            onClick={() => {
              setEditingLink(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">add</span>
            Add Link
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Today's Hearings</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.today}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.upcoming}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Today's Virtual Hearings */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Today's Virtual Hearings</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
              </div>
            ) : todayLinks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {todayLinks.map(link => (
                  <VideoLinkCard
                    key={link.id}
                    link={link}
                    onDelete={handleDelete}
                    onEdit={(l) => {
                      setEditingLink(l);
                      setIsModalOpen(true);
                    }}
                    onJoin={handleJoin}
                    platformIcon={getPlatformIcon}
                    platformColor={getPlatformColor}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No virtual hearings today" sub="Enjoy your free time!" icon="event_available" />
            )}
          </section>

          {/* Upcoming Virtual Hearings */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Upcoming Virtual Hearings</h2>
            {upcomingLinks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcomingLinks.map(link => (
                  <VideoLinkCard
                    key={link.id}
                    link={link}
                    onDelete={handleDelete}
                    onEdit={(l) => {
                      setEditingLink(l);
                      setIsModalOpen(true);
                    }}
                    onJoin={handleJoin}
                    platformIcon={getPlatformIcon}
                    platformColor={getPlatformColor}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No upcoming virtual hearings" sub="Add a new video link to get started" icon="schedule" />
            )}
          </section>

          {/* Past Hearings */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Past Hearings</h2>
            {pastLinks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pastLinks.map(link => (
                  <VideoLinkCard
                    key={link.id}
                    link={link}
                    onDelete={handleDelete}
                    onEdit={(l) => {
                      setEditingLink(l);
                      setIsModalOpen(true);
                    }}
                    onJoin={handleJoin}
                    platformIcon={getPlatformIcon}
                    platformColor={getPlatformColor}
                    isPast
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No past virtual hearings" sub="Your first hearing will appear here" icon="history" />
            )}
          </section>
        </div>
      </div>

      {/* Add/Edit Link Modal */}
      {isModalOpen && (
        <VideoLinkModal
          link={editingLink}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLink(null);
          }}
          onSave={() => {
            loadLinks();
            setIsModalOpen(false);
            setEditingLink(null);
          }}
        />
      )}
    </div>
  );
};

const VideoLinkCard = ({ link, onDelete, onEdit, onJoin, platformIcon, platformColor, isPast }) => {
  return (
    <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-colors">
      <div className="flex justify-between items-start gap-2 mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${platformColor(link.platform)}`}>
          <span className="material-symbols-outlined text-sm">{platformIcon(link.platform)}</span>
          {link.platform}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(link)}
            className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            onClick={() => onDelete(link.id)}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 line-clamp-2">
        {link.caseTitle}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{link.caseNumber}</p>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Court:</span>
          <span className="ml-1 text-slate-900 dark:text-white">{link.court}</span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Time:</span>
          <span className="ml-1 text-slate-900 dark:text-white">{link.startTime}</span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Date:</span>
          <span className="ml-1 text-slate-900 dark:text-white">
            {new Date(link.hearingDate).toLocaleDateString()}
          </span>
        </div>
        {link.meetingId && (
          <div>
            <span className="text-slate-500 dark:text-slate-400">ID:</span>
            <span className="ml-1 text-slate-900 dark:text-white">{link.meetingId}</span>
          </div>
        )}
      </div>

      {link.notes && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{link.notes}</p>
      )}

      <button
        onClick={() => onJoin(link.meetingLink)}
        disabled={isPast}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
          isPast
            ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
            : 'bg-primary text-white hover:bg-primary/90'
        }`}
      >
        <span className="material-symbols-outlined">open_in_new</span>
        {isPast ? 'Expired' : 'Join Meeting'}
      </button>
    </div>
  );
};

const EmptyState = ({ message, sub, icon }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
      <span className="material-symbols-outlined text-slate-400 text-3xl">{icon}</span>
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{message}</h3>
    <p className="text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
  </div>
);

const VideoLinkModal = ({ link, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    link || {
      caseNumber: '',
      caseTitle: '',
      court: '',
      platform: 'Zoom',
      meetingLink: '',
      meetingId: '',
      passcode: '',
      hearingDate: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      notes: '',
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (link) {
        await videoLinksService.updateLink(link.id, formData);
        toast.success('Video link updated');
      } else {
        await videoLinksService.createLink(formData);
        toast.success('Video link added');
      }
      onSave();
    } catch {
      toast.error('Failed to save video link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {link ? 'Edit Video Link' : 'Add Video Link'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Case Number
              </label>
              <input
                type="text"
                value={formData.caseNumber}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Court
              </label>
              <input
                type="text"
                value={formData.court}
                onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Case Title
            </label>
            <input
              type="text"
              value={formData.caseTitle}
              onChange={(e) => setFormData({ ...formData, caseTitle: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              >
                {supportedPlatforms.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Meeting Link
              </label>
              <input
                type="url"
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Meeting ID
              </label>
              <input
                type="text"
                value={formData.meetingId}
                onChange={(e) => setFormData({ ...formData, meetingId: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Passcode
              </label>
              <input
                type="text"
                value={formData.passcode}
                onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hearing Date
              </label>
              <input
                type="date"
                value={formData.hearingDate}
                onChange={(e) => setFormData({ ...formData, hearingDate: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            ></textarea>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
            >
              {link ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoLinks;
