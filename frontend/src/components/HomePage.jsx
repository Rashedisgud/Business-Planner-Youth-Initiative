import NavBar from './NavBar.jsx';
import Hero from './Hero.jsx';
import HowItWorks from './HowItWorks.jsx';
import Features from './Features.jsx';
import ReviewsSection from './ReviewsSection.jsx';
import FounderSection from './FounderSection.jsx';
import Footer from './Footer.jsx';

export default function HomePage({ onStart, auth, onResumeSession, onAdminClick }) {
  return (
    <div className="home-page">
      <NavBar onStart={onStart} auth={auth} onResumeSession={onResumeSession} />
      <Hero onStart={onStart} />
      <HowItWorks />
      <Features />
      <ReviewsSection />
      <FounderSection />
      <Footer onAdminClick={onAdminClick} />
    </div>
  );
}
