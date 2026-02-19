import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import fullLogo from '../assets/FULL_LOGO.svg';

const policySections = [
    {
        title: '1. Personal Information',
        intro: 'In general, you may visit Draftmate\u2019s website without revealing personal information except where login credentials are required. However, we may collect personal information in situations such as:',
        points: [
            'Creating an account',
            'Subscribing to our services',
            'Purchasing a subscription',
            'Contacting customer support',
            'Applying for a job',
            'Participating in surveys or promotions',
        ],
        extra: 'Personal Information may include:',
        extraPoints: [
            'Name',
            'Email address',
            'Phone number',
            'Country/location',
            'Billing information',
            'Payment details (processed via secure third-party gateways)',
            'Professional or educational background (for job applications)',
        ],
        footer: 'If you provide personal information about another individual (such as a colleague), we assume you have their consent.',
    },
    {
        title: '2. Scope of Services Covered',
        intro: 'This Privacy Policy applies to all Draftmate services including:',
        points: [
            'Draftmate Web Application',
            'Draftmate Word/Document Extensions',
            'Draftmate Mobile Applications (Android & iOS)',
            'Draftmate API integrations',
            'Any updates, upgrades, replacements, or technical support',
        ],
    },
    {
        title: '3. Use of Personal Information',
        intro: 'We collect and use your information primarily to:',
        points: [
            'Provide and improve our Services',
            'Process transactions and subscriptions',
            'Respond to customer support requests',
            'Enhance user experience',
            'Conduct internal analytics and research',
            'Send product updates or marketing communications (with opt-out option)',
        ],
        footer: 'We will inform you how your information is used before collecting it where required by law. You may opt out of marketing communications at any time.',
    },
    {
        title: '4. Fulfilling Transactions',
        intro: 'When you purchase a subscription or request services:',
        points: [
            'We use your data to complete transactions',
            'Payment processing is handled securely by third-party payment providers',
            'We may share limited necessary information with payment processors, financial institutions, government authorities (where legally required), and service partners involved in service delivery',
        ],
        footer: 'We may also contact you for feedback or satisfaction surveys.',
    },
    {
        title: '5. Data Entered in Draftmate Applications',
        intro: 'Draftmate respects the confidentiality of your data. We do not sell, disclose, or share documents, drafts, or content entered into Draftmate applications with third parties for commercial exploitation. We implement:',
        points: [
            'Encryption protocols',
            'Secure server infrastructure',
            'Access control restrictions',
            'Confidentiality obligations for employees and contractors',
        ],
        footer: 'Access to user data is limited strictly to personnel who require it to operate the service.',
    },
    {
        title: '6. Discussion Forums & Public Areas',
        intro: 'If Draftmate provides community forums, chat rooms, or discussion boards:',
        points: [
            'Information shared publicly may be visible to other users',
            'Draftmate is not responsible for how others use publicly shared content',
        ],
        footer: 'User opinions do not reflect Draftmate\u2019s official views.',
    },
    {
        title: '7. Information Collected Automatically',
        intro: 'When you use Draftmate, we may automatically collect:',
        points: [
            'IP address',
            'Browser type',
            'Device type',
            'Operating system',
            'Usage statistics',
            'Time spent on pages',
        ],
        footer: 'This information is generally non-identifiable and used for improving performance and user experience.',
    },
    {
        title: '8. Cookies & Tracking Technologies',
        intro: 'Draftmate uses cookies, tracking pixels, web beacons, and analytics tools (such as Google Analytics). These technologies help us:',
        points: [
            'Optimize site functionality',
            'Analyze traffic',
            'Improve services',
        ],
        footer: 'You may disable cookies in your browser settings; however, some features may not function properly.',
    },
    {
        title: '9. Marketing & Partner Sharing',
        intro: 'With your consent, Draftmate may use your name and email for:',
        points: [
            'Product updates',
            'Promotional campaigns',
            'Partner collaborations',
        ],
        footer: 'We may share limited information with trusted partners for marketing purposes. Where possible, data will be anonymized. You may opt out at any time.',
    },
    {
        title: '10. Online Advertising',
        intro: 'Third-party advertising networks may collect anonymized data to show relevant ads.',
        points: [
            'We do not sell your personal data.',
        ],
    },
    {
        title: '11. Personalized URLs & Custom Experiences',
        intro: 'In some cases, Draftmate may personalize website content based on:',
        points: [
            'Your previous usage',
            'Interaction history',
            'Subscription type',
        ],
        footer: 'If you visit a personalized link, you consent to such customization.',
    },
    {
        title: '12. Information Security',
        intro: 'We implement reasonable technical and organizational safeguards including:',
        points: [
            'Encryption of sensitive data',
            'Secure payment gateways',
            'Restricted data access',
            'Regular security reviews',
        ],
        footer: 'However, no online system can be guaranteed 100% secure.',
    },
    {
        title: '13. Legal Disclosures',
        intro: 'We may disclose personal information if required:',
        points: [
            'By court order',
            'By government authority',
            'To comply with legal obligations',
            'To protect our legal rights',
        ],
    },
    {
        title: '14. Links to Third-Party Websites',
        intro: 'Draftmate may contain links to external websites.',
        points: [
            'We are not responsible for the privacy practices or content of third-party sites.',
        ],
    },
    {
        title: '15. Service Quality Monitoring',
        intro: 'Calls or communications with Draftmate support may be monitored or recorded for quality assurance and training.',
        points: [],
    },
    {
        title: '16. Cancellation & Refund Policy',
        intro: 'Our cancellation and refund terms:',
        points: [
            'Subscriptions may be cancelled anytime.',
            'Refund requests must be made within 7 days of initial purchase.',
            'Refunds are processed within 10 business days (subject to usage deductions).',
            'Excessive usage during the refund window may result in pro-rata deductions.',
            'Add-on credits are non-refundable.',
            'Draftmate reserves the right to suspend accounts for policy violations.',
        ],
    },
    {
        title: '17. Disclaimer of Warranties',
        intro: 'Draftmate provides its services on an \u201cas-is\u201d basis.',
        points: [
            'We do not guarantee uninterrupted or error-free service.',
            'Draftmate does not provide legal advice. Users are advised to consult qualified legal professionals for legal matters.',
        ],
    },
    {
        title: '18. Limitation of Liability',
        intro: 'To the maximum extent permitted by law, Draftmate, its directors, employees, affiliates, and shareholders shall not be liable for indirect, incidental, or consequential damages arising from use of the Services.',
        points: [],
    },
    {
        title: '19. Children\u2019s Privacy',
        intro: 'Draftmate is not intended for individuals under 18 years of age.',
        points: [
            'We do not knowingly collect personal data from minors.',
        ],
    },
    {
        title: '20. Changes to This Policy',
        intro: 'We may update this Privacy Policy periodically.',
        points: [
            'Continued use of Draftmate after updates constitutes acceptance of the revised policy.',
        ],
    },
    {
        title: '21. Contact Information',
        intro: 'For questions regarding this Privacy Policy:',
        points: [
            'Email: draftmate25@gmail.com',
            'Website: www.draftmate.in',
        ],
    },
];

const PrivacyPolicy = () => {
    useEffect(() => {
        document.title = 'Privacy Policy - DraftMate';
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-slate-50 text-slate-900 font-sans overflow-x-hidden min-h-screen">
            {/* Navigation */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-3 lg:px-20">
                <Link to="/" className="flex items-center gap-4">
                    <div className="h-12 flex items-center justify-center hover:opacity-80 transition-opacity">
                        <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                    </div>
                </Link>
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-slate-600 hover:text-primary transition-colors font-medium">&larr; Back to Home</Link>
                    <Link to="/login" className="hidden sm:flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                        Get Started
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-16 lg:py-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
                <div className="absolute top-20 left-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 uppercase tracking-wide mb-8">
                        <span className="material-symbols-outlined text-base">shield</span>
                        Your Privacy Matters
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-6">
                        Privacy Policy <span className="text-primary">& Terms of Use</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        We are committed to protecting your privacy and ensuring transparency in how we collect, use, and safeguard your information.
                    </p>
                    <p className="text-sm text-slate-400 mt-4">Last Updated: February 19, 2026</p>
                </div>
            </section>

            {/* Intro */}
            <section className="px-4 pb-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 md:p-8">
                        <p className="text-slate-700 leading-relaxed">
                            This Privacy Policy governs your use of Draftmate&apos;s website, applications, extensions, APIs, and related services (collectively, the &quot;Services&quot;). Draftmate Pvt. Ltd. (&quot;Draftmate&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy and ensuring transparency in how we collect, use, and safeguard your information. By accessing or using Draftmate&apos;s Services, you agree to the practices described in this Privacy Policy.
                        </p>
                    </div>
                </div>
            </section>

            {/* Policy Sections */}
            <section className="py-8 lg:py-12 px-4">
                <div className="max-w-3xl mx-auto flex flex-col gap-6">
                    {policySections.map((section, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 md:p-8 transition-shadow hover:shadow-lg">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-sm">
                                    {index + 1}
                                </span>
                                {section.title.replace(/^\d+\.\s*/, '')}
                            </h2>
                            {section.intro && (
                                <p className="text-slate-600 leading-relaxed mb-4">{section.intro}</p>
                            )}
                            {section.points && section.points.length > 0 && (
                                <ul className="space-y-2 mb-4">
                                    {section.points.map((point, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-600">
                                            <span className="material-symbols-outlined text-primary text-lg mt-0.5 flex-shrink-0">chevron_right</span>
                                            <span className="leading-relaxed">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {section.extra && (
                                <>
                                    <p className="text-slate-600 leading-relaxed mb-3 mt-2 font-medium">{section.extra}</p>
                                    {section.extraPoints && (
                                        <ul className="space-y-2 mb-4">
                                            {section.extraPoints.map((point, i) => (
                                                <li key={i} className="flex items-start gap-3 text-slate-600">
                                                    <span className="material-symbols-outlined text-primary text-lg mt-0.5 flex-shrink-0">chevron_right</span>
                                                    <span className="leading-relaxed">{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                            {section.footer && (
                                <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    {section.footer}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="h-8 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1 shadow-sm">
                            <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                        </div>
                    </Link>
                    <div className="flex gap-6">
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
                        <Link to="/features" className="text-slate-400 hover:text-white transition-colors">Features</Link>
                        <Link to="/login" className="text-slate-400 hover:text-white transition-colors">Login</Link>
                    </div>
                    <p className="text-slate-500 text-sm">&copy; 2026 DraftMate. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicy;
