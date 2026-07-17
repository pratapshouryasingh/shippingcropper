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
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="relative">
      <div className="w-12 h-12 border-2 border-gray-200 rounded-full"></div>
      <div className="absolute top-0 left-0 w-12 h-12 border-2 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
    </div>
  </div>
);

// ==================== FLOATING ACTION BUTTON ====================
const FloatingActionButton = ({ onToggleHistory }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    { label: "PDF Converter", path: "/PdfViewer", icon: "fas fa-file-pdf" },
    { label: "PDF Cropper", path: "/crop", icon: "fas fa-crop-alt" },
    { label: "Contact Support", path: "/ContactUs", icon: "fas fa-headset" },
    { label: "Admin Panel", path: "/admin", icon: "fas fa-lock" },
    { label: "History", action: onToggleHistory, icon: "fas fa-history" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className={`absolute bottom-14 right-0 mb-2 transition-all duration-200 transform origin-bottom-right ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
      }`}>
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-48">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                if (action.path) navigate(action.path);
                if (action.action) action.action();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <i className={`${action.icon} w-5 text-gray-500 text-sm`}></i>
              <span className="text-sm text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all duration-200 flex items-center justify-center"
      >
        <i className={`fas fa-plus transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}></i>
      </button>
    </div>
  );
};

// ==================== TOOL CARD ====================
const ToolCard = ({ tool, index }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => navigate(tool.route)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
              <i className={tool.icon}></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{tool.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{tool.description}</p>
            </div>
          </div>
          <i className="fas fa-arrow-right text-gray-300 group-hover:text-indigo-500 transition-colors text-sm"></i>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {tool.features.slice(0, 2).map((feature, idx) => (
            <span key={idx} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              {feature}
            </span>
          ))}
          {tool.features.length > 2 && (
            <span className="text-xs text-gray-400">+{tool.features.length - 2}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ==================== VALUE PROPOSITION BANNER ====================
const ValueProposition = () => {
  return (
    <div className="bg-indigo-50 border-b border-indigo-100">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <span className="flex items-center gap-2 text-indigo-800">
            <i className="fas fa-check-circle text-indigo-600 text-xs"></i>
            Crop PDFs for Flipkart
          </span>
          <span className="text-indigo-300">•</span>
          <span className="flex items-center gap-2 text-indigo-800">
            <i className="fas fa-check-circle text-indigo-600 text-xs"></i>
            Optimize for Meesho
          </span>
          <span className="text-indigo-300">•</span>
          <span className="flex items-center gap-2 text-indigo-800">
            <i className="fas fa-check-circle text-indigo-600 text-xs"></i>
            JioMart ready labels
          </span>
          <span className="text-indigo-300">•</span>
          <span className="flex items-center gap-2 text-indigo-800">
            <i className="fas fa-check-circle text-indigo-600 text-xs"></i>
            Bulk PDF processing
          </span>
        </div>
      </div>
    </div>
  );
};

// ==================== HERO SECTION ====================
const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative bg-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40"></div>
      
      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-8 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="mb-6">
            <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold tracking-wide">
              📄 PDF Processing for E-commerce Sellers
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
            Crop, Convert & Optimize
            <span className="text-indigo-600 block mt-2">PDFs for Online Marketplaces</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Stop wasting time manually resizing product labels. Get Flipkart, Meesho & JioMart ready PDFs in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/PdfViewer')}
              className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition shadow-lg text-lg"
            >
              Start Converting Now
              <i className="fas fa-arrow-right ml-2 text-sm"></i>
            </button>
            <button
              onClick={() => document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition text-lg"
            >
              See All Tools
              <i className="fas fa-grid-2 ml-2 text-sm"></i>
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-400 mb-4">TRUSTED BY SELLERS ON</p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-70">
              <span className="font-semibold text-gray-600">Flipkart</span>
              <span className="font-semibold text-gray-600">Meesho</span>
              <span className="font-semibold text-gray-600">JioMart</span>
              <span className="font-semibold text-gray-600">Amazon</span>
              <span className="font-semibold text-gray-600">Myntra</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ==================== WHAT WE DO SECTION ====================
const WhatWeDoSection = () => {
  const services = [
    {
      title: "📄 PDF to Image Converter",
      description: "Convert PDF pages to high-quality JPG/PNG for product listings",
      platforms: "Flipkart, Meesho, Amazon",
      route: "/PdfViewer"
    },
    {
      title: "✂️ PDF Cropper",
      description: "Crop margins, remove whitespace, and resize PDF documents",
      platforms: "All marketplaces",
      route: "/crop"
    },
    {
      title: "🛒 Flipkart Label Cropper",
      description: "Auto-crop shipping labels to Flipkart's exact specifications",
      platforms: "Flipkart only",
      route: "/FlipkartCropper"
    },
    {
      title: "📦 Meesho Label Cropper",
      description: "One-click cropping for Meesho return labels and invoices",
      platforms: "Meesho only",
      route: "/MeshooCropper"
    },
    {
      title: "🏪 JioMart Label Cropper",
      description: "Optimized cropping for JioMart product and shipping labels",
      platforms: "JioMart only",
      route: "/JioMartCropper"
    }
  ];

  const navigate = useNavigate();

  return (
    <div className="py-16 bg-gray-50/30">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold mb-4">
            WHAT WE DO
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to prepare PDFs for e-commerce
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            No design skills needed. Just upload, crop/convert, and download.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(service.route)}
              className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="text-3xl mb-3">{service.title.split(' ')[0]}</div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">{service.title}</h3>
              <p className="text-gray-500 text-sm mb-3">{service.description}</p>
              <div className="flex items-center gap-2 text-xs text-indigo-600">
                <i className="fas fa-tag"></i>
                <span>{service.platforms}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== PROBLEM VS SOLUTION ====================
const ProblemSolution = () => {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="bg-red-50/30 rounded-2xl p-8 border border-red-100"
          >
            <div className="text-red-500 text-4xl mb-4">😫</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">The Old Way</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-2"><i className="fas fa-times text-red-400 text-xs"></i> Manually crop each PDF in Photoshop</li>
              <li className="flex items-center gap-2"><i className="fas fa-times text-red-400 text-xs"></i> Wrong dimensions = listing rejected</li>
              <li className="flex items-center gap-2"><i className="fas fa-times text-red-400 text-xs"></i> Hours wasted on批量 editing</li>
              <li className="flex items-center gap-2"><i className="fas fa-times text-red-400 text-xs"></i> No platform-specific presets</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="bg-green-50/30 rounded-2xl p-8 border border-green-100"
          >
            <div className="text-green-500 text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">With DocuForge</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-2"><i className="fas fa-check text-green-500 text-xs"></i> Auto-crop in seconds, not hours</li>
              <li className="flex items-center gap-2"><i className="fas fa-check text-green-500 text-xs"></i> Platform-specific dimensions built-in</li>
              <li className="flex items-center gap-2"><i className="fas fa-check text-green-500 text-xs"></i> Batch process 100+ files at once</li>
              <li className="flex items-center gap-2"><i className="fas fa-check text-green-500 text-xs"></i> Flipkart • Meesho • JioMart ready</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ==================== QUICK START GUIDE ====================
const QuickStartGuide = () => {
  const steps = [
    { num: "1", action: "Upload your PDF", icon: "fas fa-cloud-upload-alt", color: "indigo" },
    { num: "2", action: "Choose your platform", icon: "fas fa-store", color: "indigo" },
    { num: "3", action: "Crop & Convert", icon: "fas fa-crop-alt", color: "indigo" },
    { num: "4", action: "Download & List", icon: "fas fa-download", color: "indigo" }
  ];

  return (
    <div className="py-16 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Get started in 60 seconds</h2>
        <p className="text-gray-300 mb-12 max-w-2xl mx-auto">
          No signup required. Just upload and go.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-lg">
                {step.num}
              </div>
              <i className={`${step.icon} text-indigo-400 text-2xl block mb-2`}></i>
              <p className="text-sm font-medium">{step.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== TOOLS GRID SECTION ====================
const ToolsGridSection = () => {
  const tools = [
    { name: "PDF Converter", description: "Convert PDF to images", route: "/PdfViewer", icon: "fas fa-file-alt", features: ["PDF to JPG", "Batch mode", "High quality"] },
    { name: "PDF Cropper", description: "Crop any PDF", route: "/crop", icon: "fas fa-crop", features: ["Multi-page", "Margin adjust", "Live preview"] },
    { name: "Flipkart Cropper", description: "For Flipkart labels", route: "/FlipkartCropper", icon: "fas fa-shopping-cart", features: ["Auto dimensions", "Label ready"] },
    { name: "Meesho Cropper", description: "For Meesho labels", route: "/MeshooCropper", icon: "fas fa-box", features: ["Size preset", "Quick export"] },
    { name: "JioMart Cropper", description: "For JioMart labels", route: "/JioMartCropper", icon: "fas fa-store", features: ["Smart crop", "Platform check"] }
  ];

  return (
    <div id="tools-section" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold mb-4">
            ALL TOOLS
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Pick the tool you need</h2>
          <p className="text-gray-500 mt-2">Each tool is optimized for specific marketplace requirements</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool, idx) => (
            <ToolCard key={tool.name} tool={tool} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== FAQ SECTION ====================
const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onClick}
        className="w-full py-5 flex justify-between items-center text-left hover:bg-gray-50/50 transition px-4 rounded-lg"
      >
        <span className="font-medium text-gray-800">{question}</span>
        <i className={`fas fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ease-out ${isOpen ? 'max-h-40 pb-5' : 'max-h-0'}`}>
        <p className="text-gray-500 text-sm px-4">{answer}</p>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    { q: "What exactly does this tool do?", a: "We help e-commerce sellers crop, convert, and optimize PDF documents (like shipping labels, invoices, product sheets) to meet marketplace requirements for Flipkart, Meesho, JioMart, and others." },
    { q: "Do I need design skills?", a: "Not at all. Just upload your PDF, use our one-click platform presets, and download. No Photoshop or editing experience needed." },
    { q: "Is it really free?", a: "Yes! Basic PDF cropping and conversion is completely free. Advanced batch processing and history require a free account." },
    { q: "Which file formats are supported?", a: "PDF, JPG, PNG, and DOCX. Output formats include PDF, JPG, and PNG depending on the tool." }
  ];
  return (
    <div className="py-16 bg-gray-50/30">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Quick answers</h2>
          <p className="text-gray-500 mt-1">Everything you need to know</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 shadow-sm">
          {faqs.map((faq, idx) => (
            <FAQItem
              key={idx}
              question={faq.q}
              answer={faq.a}
              isOpen={openIndex === idx}
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== FINAL CTA ====================
const FinalCTA = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-indigo-600 py-16">
      <div className="max-w-4xl mx-auto px-5 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">Ready to process your first PDF?</h2>
        <p className="text-indigo-100 mb-8 text-lg">Join thousands of sellers saving hours every week.</p>
        <button onClick={() => navigate('/PdfViewer')} className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 transition shadow-lg text-lg">
          Try It Now — Free
          <i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  );
};

// ==================== HOME PAGE ====================
function HomePage({ isHistoryOpen, onToggleHistory }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>DocuForge | Crop & Convert PDFs for Flipkart, Meesho, JioMart</title>
        <meta name="description" content="E-commerce PDF tools: Crop shipping labels, convert product sheets, optimize for Flipkart, Meesho, JioMart. Used by 10,000+ sellers." />
      </Helmet>
      <ValueProposition />
      <HeroSection />
      <WhatWeDoSection />
      <ProblemSolution />
      <QuickStartGuide />
      <ToolsGridSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
      <FloatingActionButton onToggleHistory={onToggleHistory} />
    </div>
  );
}

// ==================== APP LAYOUT ====================
const AppLayout = ({ children, isHistoryOpen, onToggleHistory }) => {
  return (
    <div className="relative min-h-screen bg-white">
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => onToggleHistory(false)} />
      
      {/* Permanent History Handle (visible when sidebar is closed) */}
      {!isHistoryOpen && (
        <button
          onClick={() => onToggleHistory(true)}
          className="
            fixed left-0 top-1/2 -translate-y-1/2
            z-[60]
            bg-indigo-600
            hover:bg-indigo-700
            text-white
            rounded-r-xl
            shadow-xl
            px-2 py-4
            transition-all duration-300
            flex items-center justify-center
            [writing-mode:vertical-rl]
            rotate-180
            tracking-wider
            font-medium
            text-sm
          "
        >
          <i className="fas fa-history mb-2"></i>
          History
        </button>
      )}

      <div className={`transition-all duration-200 ${isHistoryOpen ? 'md:ml-[380px]' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================
export default function App() {
  // ✅ Keep desktop open, mobile closed
  const [isHistoryOpen, setIsHistoryOpen] = useState(() => window.innerWidth >= 768);
  const location = useLocation();

  const toggleHistory = () => setIsHistoryOpen(prev => !prev);

  return (
    <>
      <Helmet>
        <title>Shipping lable crop – PDF Tools for Flipkart, Meesho & JioMart Sellers</title>
        <meta name="theme-color" content="#4f46e5" />
      </Helmet>
      <Navbar onToggleHistory={toggleHistory} />
      <AppLayout isHistoryOpen={isHistoryOpen} onToggleHistory={setIsHistoryOpen}>
        <Routes location={location}>
          <Route path="/" element={<HomePage isHistoryOpen={isHistoryOpen} onToggleHistory={toggleHistory} />} />
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
