import LenisProvider from '../components/landing/LenisProvider';

// Import all your sections
import Navbar from '../components/landing/sections/Navbar';
import Hero from '../components/landing/sections/Hero';
import FeaturedIn from '../components/landing/sections/FeaturedIn';
import WhatPowersDraftmate from '../components/landing/sections/WhatPowersDraftmate';
import BuiltForSection from '../components/landing/sections/BuiltForSection';
import ComparisonSection from '../components/landing/sections/ComparisonSection';
// import DraftmateInAction from '../components/landing/sections/DraftmateInAction';
import FromFactsToFiling from '../components/landing/sections/FromFactsToFiling';
import InteractiveExplainer from '../components/landing/sections/InteractiveExplainer';
// import LawyerProfile from '../components/landing/sections/LawyerProfile';
import VideoTestimonials from '../components/landing/sections/VideoTestimonials';
// import TrustedPartners from '../components/landing/sections/TrustedPartners';
import FAQSection from '../components/landing/sections/FAQSection';
import UpgradeSection from '../components/landing/sections/UpgradeSection';
import Footer from '../components/landing/sections/Footer';

const Landing = () => {
  return (
    <LenisProvider>
      {/* Use flex-col to stack everything neatly, and set your baseline background */}
      <main className="flex flex-col bg-[#F8FAFF]">
        <Navbar />
        <Hero />
        <BuiltForSection />
        <FeaturedIn />
        <InteractiveExplainer />
        <ComparisonSection />
        <FromFactsToFiling />
        <WhatPowersDraftmate />
        {/* <DraftmateInAction /> */}
        {/* <LawyerProfile /> */}
        <VideoTestimonials />
        {/* <TrustedPartners /> */}
        <UpgradeSection />
        <FAQSection />
        <Footer />
      </main>
    </LenisProvider>
  );
};

export default Landing;