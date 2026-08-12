import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Search, ChevronRight } from 'lucide-react';
import ScrollReveal from '../components/landing/ScrollReveal';
import { Link, useNavigate } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blogData';
import Navbar from '../components/landing/sections/Navbar';
import Footer from '../components/landing/sections/Footer';

// Extracting categories based on your docx files
const CATEGORIES = ['All', 'Law Students', 'Litigation', 'Corporate Law', 'Legal Tech', 'Guides'];

// Featured Post Data (Using your specific Moot Court example)
const FEATURED_POST = {
    id: 'featured-1',
    // title: "AI for Moot Court Preparation: Research, Memorial Drafting & Oral Arguments Made Smarter",
    // excerpt: "Moot court competitions are among the most valuable experiences in legal education. They bridge the gap between classroom learning and real-world advocacy. Discover how AI is transforming this time-consuming preparation process.",
    // category: "Law Students",
    // date: "Jun 28, 2026",
    // readTime: "8 min read",
    // // You can replace this with your actual image path
    // image: "/moot-court-thumbnail.png",
    // slug: "/blog/ai-for-moot-court",

    slug: "ai-for-moot-court-preparation",
    title: "AI for Moot Court Preparation: Research, Memorial Drafting & Oral Arguments Made Smarter",
    excerpt: "Moot court competitions are among the most valuable experiences in legal education. Discover how AI is helping law students research faster, draft stronger memorials, and prepare more effectively for oral arguments.",
    category: "Law Students",
    date: "Jul 4, 2026",
    readTime: "8 min read",
    image: "/blogs/ai-moot-court.png",
    content: `Moot court competitions are among the most valuable experiences in legal education. They bridge the gap between classroom learning and real-world advocacy by teaching students how to research complex legal issues, draft persuasive memorials, and argue before simulated courts.\n\nHowever, every law student who has participated in a moot knows one thing:\n\nPreparing for a moot court competition is incredibly time-consuming.\n\nTeams spend weeks researching case law, understanding statutes, drafting memorials, preparing oral submissions, and revising arguments before competition day.\n\nArtificial Intelligence (AI) is transforming this preparation process.\n\nRather than replacing legal reasoning, AI acts as a powerful academic assistant that helps students research faster, organize legal authorities, improve drafting, and prepare more effectively.\n\nIn this article, we’ll explore how AI is changing moot court preparation and how DraftMate helps law students build stronger memorials, conduct better legal research, and perform confidently during competitions.\n\nWhy Moot Court Preparation Is Challenging\n\nA single moot competition requires students to:\n• Understand the moot proposition\n• Identify legal issues\n• Research statutes\n• Find relevant judgments\n• Study international and Indian precedents\n• Draft memorials\n• Prepare written submissions\n• Develop oral arguments\n• Anticipate judges’ questions\n\nCompleting all these tasks within a limited time can be overwhelming.\n\nCommon Challenges Faced by Moot Court Teams\n\n1. Extensive Legal Research\n\nFinding the right authorities often takes several days.\n\nStudents search through:\n• Supreme Court judgments\n• High Court decisions\n• Constitutional provisions\n• Statutory laws\n• International conventions\n• Academic articles\n\nMuch of this time is spent searching rather than analyzing.\n\n2. Memorial Drafting\n\nPreparing a professional memorial requires:\n• Statement of Facts\n• Issues Raised\n• Summary of Arguments\n• Detailed Arguments\n• Prayer\n• Proper citations\n• Formatting consistency\n\nDrafting each section from scratch demands significant effort.\n\n3. Understanding Complex Judgments\n\nMany landmark judgments span hundreds of pages.\n\nStudents must identify:\n• Ratio decidendi\n• Important observations\n• Legal principles\n• Relevant paragraphs\n• Minority and majority opinions\n\nThis process alone can consume several days.\n\n4. Preparing Oral Arguments\n\nEven after completing the memorial, students must prepare for oral rounds.\n\nThis requires:\n• Organizing arguments\n• Identifying weaknesses\n• Predicting judicial questions\n• Preparing rebuttals\n• Refining presentation\n\nStrong preparation determines success.\n\nHow AI Is Transforming Moot Court Preparation\n\nArtificial Intelligence is helping students prepare more efficiently while allowing them to focus on legal reasoning instead of repetitive tasks.\n\n1. Faster Legal Research\n\nInstead of manually searching multiple legal databases, AI allows students to ask research questions using natural language.\n\nFor example:\n• “Landmark judgments on freedom of speech.”\n• “Cases relating to constitutional morality.”\n• “Important precedents on arbitration.”\n\nAI helps organize research quickly, allowing students to spend more time developing arguments.\n\n2. Smarter Memorial Drafting\n\nAI assists students by generating structured first drafts for:\n• Statements of Facts\n• Issues Raised\n• Argument headings\n• Legal analysis\n• Memorial formatting\n• Prayer clauses\n\nStudents remain responsible for legal reasoning while AI reduces repetitive drafting work.\n\n3. Understanding Judgments Faster\n\nInstead of reading every page before understanding a case, AI can help students:\n• Summarize judgments\n• Highlight important observations\n• Explain legal principles\n• Extract key facts\n• Identify relevant paragraphs\n\nThis makes legal research significantly more efficient.\n\n4. Chat with Legal Documents\n\nStudents can upload:\n• Moot propositions\n• Judgments\n• Research papers\n• Statutes\n• Previous memorials\n\nThey can then ask questions such as:\n• What are the main legal issues?\n• Summarize this judgment.\n• Which precedents are cited?\n• Explain this legal principle.\n• Find the important observations.\n\nAI transforms lengthy legal documents into interactive learning resources.\n\n5. Better Oral Argument Preparation\n\nAI helps students prepare by:\n• Organizing legal arguments\n• Explaining opposing viewpoints\n• Identifying weak arguments\n• Suggesting additional research areas\n• Improving legal writing clarity\n\nStudents still develop their own advocacy skills while benefiting from faster preparation.\n\nHow DraftMate Helps Moot Court Teams\n\nDraftMate is an AI-powered legal workspace designed specifically for the Indian legal ecosystem. Along with supporting advocates and law firms, it includes features that help law students research, draft, and prepare for competitions more efficiently.\n\nHere’s how DraftMate supports moot court preparation:\n\nAI Legal Research\nConduct legal research using natural language and quickly identify relevant statutes, judgments, and legal authorities for moot problems.\n\nAI Legal Drafting\nGenerate professionally structured legal arguments and draft memorial sections more efficiently while maintaining proper legal formatting.\n\nChat with Legal Documents\nUpload moot propositions, judgments, memorials, or legal articles and interact with them using AI to summarize content, answer questions, and extract important legal principles.\n\nVerified Case Law\nDraftMate emphasizes verified legal citations and authentic legal databases, helping students build memorials supported by reliable legal authorities.\n\nStudent Mode\nDraftMate is developing a dedicated Student Mode designed for guided legal learning, practice drafting, moot court preparation, and legal education.\n\nBenefits for Law Students\n\nUsing AI responsibly can help moot court participants:\n• Conduct legal research faster\n• Draft memorials more efficiently\n• Understand complex judgments quickly\n• Improve legal writing\n• Prepare stronger oral arguments\n• Save valuable preparation time\n• Focus more on legal analysis than repetitive tasks\n\nAI Enhances Learning—It Doesn’t Replace It\n\nWinning a moot court competition requires:\n• Legal reasoning\n• Persuasive advocacy\n• Analytical thinking\n• Confidence\n• Teamwork\n\nArtificial Intelligence cannot replace these skills.\n\nInstead, AI provides students with better tools so they can spend more time developing the qualities that truly matter in legal practice.\n\nFinal Thoughts\n\nMoot court competitions prepare students for real legal practice, but the preparation process can be demanding and time-intensive.\n\nArtificial Intelligence is helping students conduct faster legal research, draft stronger memorials, understand judgments more efficiently, and prepare confidently for oral arguments.\n\nFor aspiring advocates, DraftMate provides an AI-powered legal workspace built specifically for the Indian legal ecosystem. By combining AI legal drafting, verified legal research, document intelligence, and a dedicated Student Mode, DraftMate enables law students to prepare smarter, learn faster, and perform better in moot court competitions.\n\nThe future of moot court preparation isn’t about replacing hard work—it’s about making every hour of preparation more productive.`

};

// Recent Posts extracted from your folder screenshot
const RECENT_POSTS = [
    {
        id: 1,
        title: "Complete Digital Workspace for Lawyers",
        excerpt: "Learn how to organize your entire legal practice from drafting to document management in one unified AI-powered workspace.",
        category: "Legal Tech",
        date: "Jun 28, 2026",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: 2,
        title: "Best Legal Research Software in India 2026",
        excerpt: "A comprehensive comparison of the top legal research platforms for Indian advocates, evaluating accuracy, database size, and AI capabilities.",
        category: "Guides",
        date: "Jun 26, 2026",
        readTime: "12 min read",
        image: "https://images.unsplash.com/photo-1505664177922-92838e5d0a51?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: 3,
        title: "Zero Hallucination AI - Why Verified Legal Citations Matter",
        excerpt: "In the legal profession, a hallucinated case law can ruin a career. Understand how DraftMate ensures 100% verified citations from Indian courts.",
        category: "Legal Tech",
        date: "Jun 24, 2026",
        readTime: "7 min read",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: 4,
        title: "AI for Civil Litigation",
        excerpt: "How civil litigators are saving 5+ hours a week on drafting plaints, written statements, and analyzing case files using AI.",
        category: "Litigation",
        date: "Jun 22, 2026",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: 5,
        title: "How to Draft a Legal Notice in Minutes Using AI",
        excerpt: "A step-by-step guide to generating perfectly formatted, context-aware legal notices for Section 138, breach of contract, and more.",
        category: "Guides",
        date: "Jun 20, 2026",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: 6,
        title: "AI for Corporate Lawyers",
        excerpt: "Streamline due diligence, contract review, and compliance checking with specialized AI tools built for corporate legal departments.",
        category: "Corporate Law",
        date: "Jun 18, 2026",
        readTime: "9 min read",
        image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800",
    }
];

export default function Blogs() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter posts based on category and search
    const filteredPosts = BLOG_POSTS.filter(post => {
        const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFF] font-sans selection:bg-blue-100">

            {/* ── TOP NAVBAR ── */}
            <div className="w-full relative z-[60]">
                <Navbar />
            </div>

            <main className="flex-1 pt-24 pb-20">
                <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-12">

                    {/* ── HEADER SECTION ── */}
                    <ScrollReveal>
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold mb-6 uppercase tracking-widest">
                                DraftMate Resources
                            </span>
                            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-[#0F1C2E] leading-tight mb-6 tracking-tight">
                                Master Legal Tech <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                                    Insights & Updates
                                </span>
                            </h1>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                Stay ahead with expert insights, practical guides, and the latest AI innovations designed specifically for Indian legal professionals.
                            </p>
                        </div>
                    </ScrollReveal>

                    {/* ── FILTER & SEARCH BAR ── */}
                    <ScrollReveal delay={100}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-2 md:p-3 rounded-2xl shadow-[0_4px_24px_rgba(15,28,46,0.03)] border border-slate-100">
                            {/* Categories Scrollable Row */}
                            <div className="flex overflow-x-auto hide-scrollbar w-full md:w-auto gap-2 px-2 pb-2 md:pb-0">
                                {CATEGORIES.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setActiveCategory(category)}
                                        className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[13.5px] font-bold transition-all duration-300 ${activeCategory === category
                                            ? 'bg-[#0F1C2E] text-white shadow-md'
                                            : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>

                            {/* Search Bar */}
                            <div className="relative w-full md:w-72 shrink-0 px-2 md:px-0">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* ── FEATURED POST (Only show if 'All' category and no search) ── */}
                    <AnimatePresence mode="wait">
                        {activeCategory === 'All' && !searchQuery && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                transition={{ duration: 0.5 }}
                                className="mb-16"
                            >
                                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200/80 shadow-[0_12px_40px_rgba(15,28,46,0.04)] hover:shadow-[0_20px_60px_rgba(37,99,235,0.08)] transition-all duration-500 group flex flex-col lg:flex-row gap-8 lg:gap-12 cursor-pointer relative overflow-hidden">

                                    {/* Featured Image */}
                                    <div className="w-full lg:w-[55%] aspect-video lg:aspect-auto lg:h-[400px] rounded-[24px] overflow-hidden relative shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent z-10" />
                                        <img
                                            src={FEATURED_POST.image}
                                            alt={FEATURED_POST.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />
                                        <div className="absolute top-4 left-4 z-20">
                                            <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-lg text-[12px] font-extrabold text-blue-700 tracking-wide uppercase shadow-sm">
                                                ★ Featured Guide
                                            </span>
                                        </div>
                                    </div>

                                    {/* Featured Content */}
                                    <div className="flex flex-col justify-center py-4 lg:py-8 pr-4 lg:w-[45%]">
                                        <div className="flex items-center gap-4 text-[13px] font-bold text-slate-400 mb-5">
                                            <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-md">{FEATURED_POST.category}</span>
                                            <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {FEATURED_POST.date}</div>
                                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {FEATURED_POST.readTime}</div>
                                        </div>

                                        <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black text-[#0F1C2E] leading-[1.2] mb-5 group-hover:text-blue-600 transition-colors">
                                            {FEATURED_POST.title}
                                        </h2>

                                        <p className="text-slate-500 font-medium text-base lg:text-lg leading-relaxed mb-8 line-clamp-3">
                                            {FEATURED_POST.excerpt}
                                        </p>

                                        <Link to={`/blog/${FEATURED_POST.slug}`} className="mt-auto flex items-center gap-2 text-sm font-bold text-[#0F1C2E] group-hover:text-blue-600 transition-colors">
                                            Read Full Article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── GRID OF RECENT POSTS ── */}
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-[#0F1C2E]">Latest Articles</h3>
                            <span className="text-sm font-bold text-slate-400">{filteredPosts.length} posts</span>
                        </div>

                        {filteredPosts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                {filteredPosts.map((post, index) => (
                                    <ScrollReveal key={post.id} delay={index * 50}>
                                        <Link to={`/blog/${post.slug}`} className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,28,46,0.03)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.08)] hover:-translate-y-2 hover:border-blue-200 transition-all duration-400 flex flex-col h-full group cursor-pointer overflow-hidden p-3 block">
                                            {/* <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,28,46,0.03)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.08)] hover:-translate-y-2 hover:border-blue-200 transition-all duration-400 flex flex-col h-full group cursor-pointer overflow-hidden p-3"> */}

                                            {/* Thumbnail */}
                                            <div className="w-full aspect-[16/10] rounded-[16px] overflow-hidden mb-5 relative">
                                                <img
                                                    src={post.image}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                                />
                                                <div className="absolute top-3 left-3">
                                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[11px] font-extrabold text-[#0F1C2E] uppercase tracking-wider shadow-sm">
                                                        {post.category}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex flex-col flex-1 px-3 pb-3">
                                                <h4 className="text-xl font-black text-[#0F1C2E] leading-snug mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                    {post.title}
                                                </h4>
                                                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2 flex-1">
                                                    {post.excerpt}
                                                </p>

                                                <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between text-[12px] font-bold text-slate-400">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* </div> */}
                                        </Link>
                                    </ScrollReveal>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-[32px] border border-slate-200 border-dashed">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-[#0F1C2E] mb-2">No articles found</h3>
                                <p className="text-slate-500">We couldn't find any posts matching your search criteria.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                                    className="mt-6 px-6 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── NEWSLETTER CTA ── */}
                    <ScrollReveal>
                        <div className="mt-24 relative overflow-hidden rounded-[32px] bg-[#0F1C2E] px-8 py-14 lg:px-16 lg:py-16 text-center border border-slate-800">
                            {/* Background Glows */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-2xl bg-blue-600/20 blur-[100px] pointer-events-none rounded-full" />

                            <div className="relative z-10 max-w-2xl mx-auto">
                                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Never Miss a Legal Tech Update</h2>
                                <p className="text-slate-300 font-medium text-lg mb-8">
                                    Join 5,000+ legal professionals who get our best insights, AI prompts, and drafting guides delivered to their inbox weekly.
                                </p>
                                <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                                    <input
                                        type="email"
                                        placeholder="Enter your work email..."
                                        className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition-all"
                                        required
                                    />
                                    <button type="submit" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-1">
                                        Subscribe
                                    </button>
                                </form>
                            </div>
                        </div>
                    </ScrollReveal>

                </div>
            </main>

            {/* ── FOOTER ── */}
            <div className="w-full relative z-20 mt-auto">
                <Footer />
            </div>

        </div>
    );
}