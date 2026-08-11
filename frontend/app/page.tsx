import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import WorkflowPipeline from "@/components/landing/WorkflowPipeline";
import AIEngineSection from "@/components/landing/AIEngineSection";
import ClinicalAnalyticsSecurity from "@/components/landing/ClinicalAnalyticsSecurity";
import Pricing from "@/components/landing/Pricing";
import AboutContact from "@/components/landing/AboutContact";
import Footer from "@/components/landing/Footer";
import SupportChat from "@/components/landing/SupportChat";

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <WorkflowPipeline />
      <AIEngineSection />
      <ClinicalAnalyticsSecurity />
      <Pricing />
      <AboutContact />
      <Footer />
      <SupportChat />
    </main>
  );
}
