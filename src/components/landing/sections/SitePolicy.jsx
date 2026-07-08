import React, { useEffect } from 'react';
import Navbar from './Navbar'; // Apne Navbar ka path check kar lena
import Footer from './Footer'; // Apne Footer ka path check kar lena

export default function SitePolicy() {
  // Page load hote hi top par scroll karne ke liye
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFF] font-sans selection:bg-blue-100">
      
      {/* ── TOP NAVBAR ── */}
      <div className="w-full relative z-[60]">
        <Navbar />
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 pt-28 pb-24">
        <div className="max-w-[800px] mx-auto px-5 md:px-10">
          
          <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_4px_24px_rgba(15,28,46,0.03)] border border-slate-200/60">
            
            <header className="mb-10 border-b border-slate-100 pb-8">
              <h1 className="text-3xl md:text-4xl font-black text-[#0F1C2E] mb-3 tracking-tight">Cookie Policy</h1>
              {/* <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Last Updated: 28th June, 2026</p> */}
            </header>

            <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-[#0F1C2E] prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed prose-li:text-slate-600 prose-li:font-medium">
              
              <p>
                At DraftMate, we are committed to providing a secure and seamless experience while respecting your privacy. This Cookie Policy explains how cookies and similar technologies may be used when you access or use our website, platform, or services.
              </p>

              <h2>What Are Cookies?</h2>
              <p>
                Cookies are small text files that are stored on your device when you visit a website. They help websites function properly, improve user experience, remember preferences, and enhance the performance and security of online services.
              </p>

              <h2>How We Use Cookies</h2>
              <p>DraftMate may use cookies and similar technologies for purposes including:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                <li>Enabling the website and platform to function properly.</li>
                <li>Maintaining the security and integrity of our services.</li>
                <li>Remembering your preferences and settings.</li>
                <li>Improving the performance and reliability of the platform.</li>
                <li>Understanding how users interact with our services to help improve functionality and user experience.</li>
              </ul>
              <p>We do not use cookies to sell your personal information or for intrusive advertising practices.</p>

              <h2>Types of Cookies We May Use</h2>
              
              <h3 className="text-xl mt-6 text-blue-700">Essential Cookies</h3>
              <p>
                These cookies are necessary for the operation of our website and services. They enable core functionality such as authentication, security, network management, and access to requested features.
              </p>

              <h3 className="text-xl mt-6 text-blue-700">Functional Cookies</h3>
              <p>
                These cookies help remember your preferences, such as language or login settings, to provide a more personalized experience.
              </p>

              <h3 className="text-xl mt-6 text-blue-700">Performance Cookies</h3>
              <p>
                From time to time, we may use cookies that help us understand how our website or platform is being used so that we can improve performance, usability, and user experience. Such information is generally collected in an aggregated or anonymized manner where applicable.
              </p>

              <h2>Managing Cookies</h2>
              <p>
                Most web browsers allow you to manage, disable, or delete cookies through browser settings. Please note that disabling certain cookies may affect the availability or functionality of some features of the website or platform.
              </p>

              <h2>Third-Party Services</h2>
              <p>
                Some features of DraftMate may rely on trusted third-party service providers. These providers may place or access cookies in accordance with their own privacy and cookie policies. We encourage users to review the policies of such third-party services where applicable.
              </p>

              <h2>Changes to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our services, technology, legal requirements, or business practices. Any updates will be posted on this page with the revised “Last Updated” date.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have any questions regarding this Cookie Policy or our use of cookies, please contact us at:
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 inline-block">
                <p className="m-0 text-slate-700"><strong>DraftMate</strong><br/>Email: <a href="mailto:draftmateinfo@gmail.com" className="text-blue-600 hover:underline">draftmateinfo@gmail.com</a></p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <div className="w-full relative z-20 mt-auto">
        <Footer />
      </div>

    </div>
  );
}