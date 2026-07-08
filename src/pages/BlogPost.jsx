import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { BLOG_POSTS } from '../data/blogData' // Adjust path if needed
import Navbar from '../components/landing/sections/Navbar'; 
import Footer from '../components/landing/sections/Footer'; 

export default function BlogPost() {
  const { slug } = useParams(); // URL se slug nikalna (e.g., ai-for-moot-court-preparation)
  const navigate = useNavigate();

  // Find the matching post from our data file
  const post = BLOG_POSTS.find(p => p.slug === slug);

  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFF] font-sans">
        <h1 className="text-4xl font-black text-[#0F1C2E] mb-4">Article Not Found</h1>
        <p className="text-slate-500 mb-8">The blog post you are looking for does not exist.</p>
        <button onClick={() => navigate('/blogs')} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">
          Back to Blogs
        </button>
      </div>
    );
  }

  // Format content to render paragraphs properly
  const formattedContent = post.content.split('\n\n').map((paragraph, index) => (
    <p key={index} className="mb-6 text-lg text-[#334155] leading-[1.8] font-medium">
      {paragraph}
    </p>
  ));

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFF] font-sans">
      <div className="w-full relative z-[60]"><Navbar /></div>

      <main className="flex-1 pt-24 pb-20 relative z-10">
        <article className="max-w-[800px] mx-auto px-5 md:px-8">
          
          {/* Back Button */}
          <Link to="/blogs" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" /> Back to all articles
          </Link>

          {/* Article Header */}
          <header className="mb-10 text-center">
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 font-extrabold text-[12px] uppercase tracking-wider rounded-lg mb-6">
              {post.category}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-[44px] font-black text-[#0F1C2E] leading-[1.2] mb-6 tracking-tight">
              {post.title}
            </h1>
            <div className="flex items-center justify-center gap-6 text-[13.5px] font-bold text-slate-400">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {post.date}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {post.readTime}</span>
            </div>
          </header>

          {/* Featured Image */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="w-full aspect-[16/9] rounded-[24px] overflow-hidden mb-12 shadow-[0_12px_40px_rgba(15,28,46,0.06)] border border-slate-200/60"
          >
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </motion.div>

          {/* Article Content */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="prose max-w-none prose-blue"
          >
            {formattedContent}
          </motion.div>

          {/* Share & Footer Actions */}
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-[#0F1C2E]">Share this article:</span>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-[#1DA1F2] hover:text-white transition-colors"><Twitter className="w-4 h-4" /></button>
                <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-[#0A66C2] hover:text-white transition-colors"><Linkedin className="w-4 h-4" /></button>
                <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Share2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <button className="px-8 py-3.5 bg-[#0F1C2E] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-[#0F1C2E]/10">
              Start Drafting Free
            </button>
          </div>

        </article>
      </main>

      <div className="w-full relative z-20 mt-auto"><Footer /></div>
    </div>
  );
}