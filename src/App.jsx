import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/footer";
import PdfViewer from "./pages/PdfViewer";
import FlipkartCropper from "./pages/FlipkartCropper";
import MeshooCropper from "./pages/MeshooCropper";
import JioMartCropper from "./pages/JioMartCropper";
import ContactUs from "./pages/ContactUs";
import PdfCropper from "./pages/crop";
import HistorySidebar from "./components/HistorySidebar";
import AdminPanel from "./pages/AdminPanel";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import "./App.css";

// ==================== LOADING SPINNER ====================
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh] bg-white">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-3 border-zinc-200 border-t-black rounded-full animate-spin"></div>
      <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Loading tools...</p>
    </div>
  </div>
);

// ==================== ROTATING FLOWING TICKER BANNER ====================
const ValueProposition = () => {
  const tickerItems = [
    "🛍️ Flipkart Shipping Label Cropper",
    "🏪 Meesho Label & Invoice Cropper",
    "📦 JioMart Product Label Cropper",
    "🛒 Amazon Shipping Label Cropper",
    "📄 Multi-Page Batch PDF Cropping",
    "🖨️ Thermal Printer Ready (4x6 Inches)",
    "⚡ Instant High-Quality Image Export",
    "🏷️ Myntra & Snapdeal Label Cropping",
    "🔒 100% Secure & Private Processing"
  ];

  return (
    <div className="bg-black text-white border-b border-zinc-800 py-3 overflow-hidden whitespace-nowrap relative flex items-center select-none">
      <motion.div
        className="flex gap-10 items-center min-w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          ease: "linear",
          duration: 22,
          repeat: Infinity
        }}
      >
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <div key={index} className="flex items-center gap-3 text-xs font-bold tracking-wider uppercase text-zinc-200">
            <span>{item}</span>
            <span className="text-zinc-600 font-extrabold">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// ==================== HERO SECTION ====================
const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-zinc-200 py-14 md:py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="inline-block px-3.5 py-1 bg-zinc-100 text-black border border-zinc-300 rounded-full text-[11px] font-black tracking-wider uppercase mb-5">
          E-Commerce Shipping Label Cropper
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-black tracking-tight mb-5 leading-tight">
          Crop & Convert Shipping Labels in Seconds
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 mb-9 max-w-2xl mx-auto leading-relaxed font-normal">
          Supported across all major marketplaces: Flipkart, Meesho, JioMart, Amazon, Myntra, and more. Instant thermal label setup.
        </p>

        {/* Platform Grid Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <button
            onClick={() => navigate("/FlipkartCropper")}
            className="px-5 py-3 bg-black text-white font-bold rounded-lg hover:bg-zinc-800 transition shadow-sm border border-black text-sm cursor-pointer flex items-center gap-2"
          >
            <span>🛍️</span> Flipkart Cropper <i className="fas fa-arrow-right text-xs"></i>
          </button>
          <button
            onClick={() => navigate("/MeshooCropper")}
            className="px-5 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-100 transition border border-black text-sm cursor-pointer flex items-center gap-2"
          >
            <span>🏪</span> Meesho Cropper <i className="fas fa-arrow-right text-xs"></i>
          </button>
          <button
            onClick={() => navigate("/JioMartCropper")}
            className="px-5 py-3 bg-black text-white font-bold rounded-lg hover:bg-zinc-800 transition shadow-sm border border-black text-sm cursor-pointer flex items-center gap-2"
          >
            <span>📦</span> JioMart Cropper <i className="fas fa-arrow-right text-xs"></i>
          </button>
          <button
            onClick={() => navigate("/crop")}
            className="px-5 py-3 bg-zinc-100 text-zinc-800 font-bold rounded-lg hover:bg-zinc-200 transition border border-zinc-300 text-sm cursor-pointer flex items-center gap-2"
          >
            <span>✂️</span> Custom Cropper
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
          <span>Supported Marketplaces:</span>
          <span className="text-zinc-800">Flipkart</span>
          <span className="text-zinc-800">Meesho</span>
          <span className="text-zinc-800">JioMart</span>
          <span className="text-zinc-800">Amazon</span>
          <span className="text-zinc-800">Myntra</span>
          <span className="text-zinc-800">Snapdeal</span>
        </div>
      </div>
    </div>
  );
};

// ==================== WHAT WE DO SECTION ====================
const WhatWeDoSection = () => {
  const services = [
    {
      title: "Flipkart Label Cropper",
      description: "Auto-crop shipping labels to Flipkart thermal specs (4x6 inches) ready for instant printing.",
      platforms: "Flipkart Only",
      route: "/FlipkartCropper",
      icon: "fas fa-shopping-bag"
    },
    {
      title: "Meesho Label Cropper",
      description: "Batch crop return labels and invoice pages for Meesho sellers with one click.",
      platforms: "Meesho Only",
      route: "/MeshooCropper",
      icon: "fas fa-box"
    },
    {
      title: "JioMart Label Cropper",
      description: "Optimized cropping for JioMart product labels, shipping barcodes & invoice slips.",
      platforms: "JioMart Only",
      route: "/JioMartCropper",
      icon: "fas fa-store"
    },
    {
      title: "Selection & Custom Cropper",
      description: "Drag-to-crop any region of your PDF label with live preview for Amazon, Myntra & Snapdeal.",
      platforms: "All Marketplaces",
      route: "/crop",
      icon: "fas fa-crop-alt"
    },
    {
      title: "File & PDF Converter",
      description: "Convert PDF documents to crisp high-res image files (JPG/PNG) for easy printing & sharing.",
      platforms: "Universal Tool",
      route: "/PdfViewer",
      icon: "fas fa-file-pdf"
    }
  ];

  const navigate = useNavigate();

  return (
    <div className="py-14 bg-zinc-50 border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Major E-Commerce Cropper Platforms</h2>
          <p className="text-zinc-600 text-sm mt-1.5">Select your marketplace to process shipping labels instantly</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service, idx) => (
            <div
              key={idx}
              onClick={() => navigate(service.route)}
              className="bg-white rounded-lg border border-zinc-200 p-6 hover:border-black hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-black text-white rounded-md flex items-center justify-center text-lg mb-4 font-bold">
                  <i className={service.icon}></i>
                </div>
                <h3 className="font-extrabold text-black text-lg mb-1.5">{service.title}</h3>
                <p className="text-zinc-600 text-xs mb-4 leading-relaxed font-normal">{service.description}</p>
              </div>
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-black uppercase tracking-wider">{service.platforms}</span>
                <span className="text-xs font-bold text-black flex items-center gap-1">
                  Open Tool <i className="fas fa-arrow-right text-[10px]"></i>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== QUICK START GUIDE ====================
const QuickStartGuide = () => {
  const steps = [
    { num: "01", action: "Select Tool", desc: "Choose Flipkart, Meesho, JioMart, or Custom Cropper" },
    { num: "02", action: "Upload PDF", desc: "Drag & drop or select your label PDF file" },
    { num: "03", action: "Crop & Preview", desc: "Auto-crop or drag margin selection with live preview" },
    { num: "04", action: "Download", desc: "Download ready-to-print 4x6 label PDFs or ZIP images" }
  ];

  return (
    <div className="py-14 bg-white border-b border-zinc-200">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-2">How It Works</h2>
        <p className="text-zinc-600 text-sm mb-10">4 simple steps to prepare labels for thermal printing</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="p-5 bg-zinc-50 rounded-lg border border-zinc-200 text-center">
              <div className="w-9 h-9 bg-black text-white rounded-md flex items-center justify-center font-black text-sm mx-auto mb-3">
                {step.num}
              </div>
              <h4 className="font-bold text-black text-base mb-1">{step.action}</h4>
              <p className="text-zinc-500 text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== FAQ SECTION ====================
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    {
      q: "Is Shipping Label Cropper completely free?",
      a: "Yes, all cropping and conversion features are 100% free for sellers."
    },
    {
      q: "Which e-commerce platforms are supported?",
      a: "We offer dedicated croppers for Flipkart, Meesho, JioMart, plus a custom selection cropper for Amazon, Myntra, Snapdeal & Shopify."
    },
    {
      q: "Are my PDF files safe?",
      a: "Yes. PDF file processing is performed securely to output your cropped labels."
    },
    {
      q: "Where can I view my recent label jobs?",
      a: "Click the 'History' button in the top navigation bar at any time to open your processed job history."
    }
  ];

  return (
    <div className="py-14 bg-zinc-50 border-b border-zinc-200">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-9">
          <h2 className="text-2xl font-black text-black tracking-tight">Frequently Asked Questions</h2>
          <p className="text-zinc-600 text-sm mt-1">Quick answers for e-commerce sellers</p>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-200 shadow-sm">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full text-left font-bold text-black text-sm flex justify-between items-center gap-2 cursor-pointer"
              >
                <span>{faq.q}</span>
                <i className={`fas fa-chevron-down text-zinc-400 text-xs transition-transform ${openIndex === idx ? "rotate-180 text-black" : ""}`}></i>
              </button>
              {openIndex === idx && (
                <p className="text-zinc-600 text-xs mt-2.5 leading-relaxed font-normal">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== HOME PAGE ====================
function HomePage({ onToggleHistory }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="bg-white">
      <Helmet>
        <title>Shipping Label Cropper | PDF Cropper for Flipkart, Meesho, JioMart & Amazon</title>
        <meta
          name="description"
          content="Crop, resize and convert PDF shipping labels for Flipkart, Meesho, JioMart & Amazon sellers."
        />
      </Helmet>
      <HeroSection />
      <WhatWeDoSection />
      <QuickStartGuide />
      <FAQSection />
    </div>
  );
}

// ==================== APP LAYOUT ====================
const AppLayout = ({ children, isHistoryOpen, onToggleHistory }) => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between relative">
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => onToggleHistory(false)} />

      {/* Side History Handle */}
      {!isHistoryOpen && (
        <button
          onClick={() => onToggleHistory(true)}
          className="
            fixed left-0
            top-1/2 -translate-y-1/2
            z-40
            bg-black
            hover:bg-zinc-800
            text-white
            rounded-r-md
            shadow-lg
            px-2.5 py-3.5
            transition-all duration-200
            flex items-center justify-center gap-1.5
            [writing-mode:vertical-rl]
            rotate-180
            font-bold
            text-xs
            tracking-wider
            uppercase
            cursor-pointer
            border-r border-t border-b border-zinc-800
          "
          title="Open Job History"
        >
          <i className="fas fa-history text-xs"></i>
          History
        </button>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-200 ${isHistoryOpen ? "md:ml-[380px]" : ""}`}>
        <ValueProposition />
        {children}
      </div>

      {/* Footer on EVERY page */}
      <Footer />
    </div>
  );
};

// ==================== MAIN APP ====================
export default function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const location = useLocation();

  const toggleHistory = (explicitState) => {
    if (typeof explicitState === "boolean") {
      setIsHistoryOpen(explicitState);
    } else {
      setIsHistoryOpen((prev) => !prev);
    }
  };

  return (
    <>
      <Helmet>
        <title>Shipping Label Cropper – E-Commerce PDF Tools</title>
        <meta name="theme-color" content="#000000" />
      </Helmet>

      {/* Navbar */}
      <Navbar onToggleHistory={() => toggleHistory()} />

      {/* App Layout */}
      <AppLayout isHistoryOpen={isHistoryOpen} onToggleHistory={toggleHistory}>
        <Routes location={location}>
          <Route path="/" element={<HomePage onToggleHistory={() => toggleHistory(true)} />} />
          <Route path="/PdfViewer" element={<PdfViewer />} />
          <Route path="/FlipkartCropper" element={<FlipkartCropper />} />
          <Route path="/MeshooCropper" element={<MeshooCropper />} />
          <Route path="/JioMartCropper" element={<JioMartCropper />} />
          <Route path="/ContactUs" element={<ContactUs />} />
          <Route path="/crop" element={<PdfCropper />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </AppLayout>
    </>
  );
}
