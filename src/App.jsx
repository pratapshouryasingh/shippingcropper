import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/footer";
import PdfViewer from "./pages/PdfViewer";
import FlipkartCropper from './pages/FlipkartCropper';
import MeshooCropper from "./pages/MeshooCropper";
import JioMartCropper from "./pages/JioMartCropper";
import ContactUs from "./pages/ContactUs";
import PdfCropper from "./pages/crop";
import HistorySidebar from "./components/HistorySidebar";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import "./App.css";

// Loading spinner
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      <div className="mt-4 text-gray-600 font-medium">Loading...</div>
    </div>
  </div>
);

// Modern FAB
const FloatingActionButton = ({ onToggleHistory }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    { label: "PDF Converter", path: "/PdfViewer", icon: "📄", color: "text-blue-600" },
    { label: "PDF Cropper", path: "/crop", icon: "✂️", color: "text-purple-600" },
    { label: "Contact Support", path: "/ContactUs", icon: "💬", color: "text-green-600" },
    { label: "History", action: onToggleHistory, icon: "📚", color: "text-gray-600" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Quick Actions Menu */}
      <div className={`absolute bottom-16 right-0 mb-3 transition-all duration-200 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                if (action.path) navigate(action.path);
                if (action.action) action.action();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 group"
            >
              <span className={`text-lg ${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</span>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-gray-800 transition-all duration-200 flex items-center justify-center group"
      >
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </button>
    </div>
  );
};

// Modern Tool Card
const ModernToolCard = ({ tool }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const gradients = {
    green: "from-emerald-500 to-green-500",
    purple: "from-purple-500 to-pink-500",
    yellow: "from-amber-500 to-orange-500",
    orange: "from-orange-500 to-red-500",
    red: "from-red-500 to-pink-500",
    blue: "from-blue-500 to-cyan-500"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(tool.route)}
    >
      {/* Gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradients[tool.color]}`}></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[tool.color]} flex items-center justify-center text-white text-xl`}>
              {tool.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-gray-800">{tool.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
            </div>
          </div>
          <motion.div
            animate={{ x: hovered ? 4 : 0 }}
            className="text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </div>

        <div className="space-y-3">
          {tool.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(tool.route);
          }}
          className={`mt-6 w-full py-3 bg-gradient-to-r ${gradients[tool.color]} text-white rounded-lg font-medium hover:opacity-90 transition-opacity duration-200`}
        >
          Use Tool
        </button>
      </div>
    </motion.div>
  );
};

// Modern Hero Section
const ModernHero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Trusted by thousands of sellers
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
            Modern Tools for
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              Modern Sellers
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Professional PDF processing tools designed for e-commerce. Convert, crop, and optimize your product files with precision and speed.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/PdfViewer')}
              className="px-8 py-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
            <button
              onClick={() => document.getElementById('tools').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors duration-200"
            >
              Explore Tools
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: "100K+", label: "Files Processed" },
              { value: "99.9%", label: "Uptime" },
              { value: "50+", label: "Countries" },
              { value: "24/7", label: "Support" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Features Showcase
const FeaturesShowcase = () => {
  const features = [
    {
      icon: "🚀",
      title: "Lightning Fast",
      description: "Process files in seconds with our optimized infrastructure",
      color: "text-blue-600"
    },
    {
      icon: "🛡️",
      title: "Secure & Private",
      description: "Your files are processed securely and never stored",
      color: "text-green-600"
    },
    {
      icon: "🎯",
      title: "Platform Optimized",
      description: "Tools specifically designed for each e-commerce platform",
      color: "text-purple-600"
    },
    {
      icon: "🔄",
      title: "Batch Processing",
      description: "Handle multiple files simultaneously to save time",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Our Tools?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Built with performance, security, and ease of use in mind
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group p-6 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300"
            >
              <div className={`text-3xl mb-4 ${feature.color}`}>{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Platform Integration
const PlatformIntegration = () => {
  const platforms = [
    { name: "Flipkart", icon: "🛒", color: "from-yellow-400 to-yellow-500" },
    { name: "Meesho", icon: "📦", color: "from-pink-500 to-rose-500" },
    { name: "JioMart", icon: "🏪", color: "from-blue-500 to-blue-600" },
    { name: "Amazon", icon: "📦", color: "from-orange-400 to-orange-500" },
    { name: "Myntra", icon: "👕", color: "from-red-500 to-pink-500" }
  ];

  return (
    <div className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Optimized for Your Platform
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tools specifically designed for each e-commerce platform's requirements
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {platforms.map((platform, idx) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className="group bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-2xl text-white mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {platform.icon}
              </div>
              <div className="font-semibold text-gray-900">{platform.name}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// How It Works
const Workflow = () => {
  const steps = [
    {
      number: "1",
      title: "Upload",
      description: "Drag and drop your files or select from your device",
      icon: "📤"
    },
    {
      number: "2",
      title: "Process",
      description: "Use our specialized tools to convert and optimize",
      icon: "⚡"
    },
    {
      number: "3",
      title: "Download",
      description: "Get your processed files ready for upload",
      icon: "📥"
    }
  ];

  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple Workflow
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three simple steps from upload to download
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/4 left-0 right-0 h-0.5 bg-gray-200"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
                      {step.icon}
                    </div>
                    <div className="text-3xl font-bold text-gray-300">{step.number}</div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Tools Grid
const ToolsGrid = () => {
  const tools = [
    {
      name: "PDF Converter",
      description: "Convert PDFs to multiple formats with batch processing",
      route: "/PdfViewer",
      color: "green",
      icon: "🔄",
      features: ["Multiple formats", "Batch processing", "Quality preservation"]
    },
    {
      name: "PDF Cropper",
      description: "Precision cropping tool for PDF documents",
      route: "/crop",
      color: "purple",
      icon: "✂️",
      features: ["Precision controls", "Multi-page", "Batch support"]
    },
    {
      name: "Flipkart Cropper",
      description: "Optimized for Flipkart product labels",
      route: "/FlipkartCropper",
      color: "yellow",
      icon: "🛒",
      features: ["Auto-formatting", "Platform optimized", "Quick export"]
    },
    {
      name: "Meesho Cropper",
      description: "Tailored for Meesho product specifications",
      route: "/MeshooCropper",
      color: "orange",
      icon: "📦",
      features: ["Quality checks", "Instant preview", "Compliant output"]
    },
    {
      name: "JioMart Cropper",
      description: "Complete solution for JioMart preparation",
      route: "/JioMartCropper",
      color: "red",
      icon: "🏪",
      features: ["Smart optimization", "Fast processing", "Platform ready"]
    }
  ];

  return (
    <div id="tools" className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Complete Tool Suite
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Specialized tools for every e-commerce need
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, idx) => (
            <ModernToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  );
};

// FAQ Section
const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Is there a file size limit?",
      answer: "We support files up to 500MB for most tools. For larger files, contact our support team."
    },
    {
      question: "How secure are my files?",
      answer: "All files are processed securely and automatically deleted after 24 hours. We never store your personal data."
    },
    {
      question: "Do I need to create an account?",
      answer: "No account is required for basic usage. Create an account to save your processing history."
    },
    {
      question: "Which formats are supported?",
      answer: "We support PDF, JPG, PNG, DOC, DOCX, TXT, and more. Check each tool for specific format support."
    }
  ];

  return (
    <div className="bg-white py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about our tools
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <svg 
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${openIndex === idx ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`px-6 overflow-hidden transition-all duration-200 ${openIndex === idx ? 'pb-4' : 'max-h-0'}`}>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Final CTA
const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to get started?
        </h2>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Join thousands of sellers who trust our tools for their e-commerce success.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/PdfViewer')}
            className="px-8 py-4 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg"
          >
            Start Processing Files
          </button>
          <button
            onClick={() => navigate('/ContactUs')}
            className="px-8 py-4 bg-transparent border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors duration-200"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Home Page
function HomePage({ isHistoryOpen, onToggleHistory }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Modern PDF Tools for E-commerce | Professional Processing Suite</title>
        <meta name="description" content="Modern, fast, and secure PDF processing tools optimized for e-commerce platforms. Convert, crop, and optimize your product files." />
      </Helmet>

      <ModernHero />
      <ToolsGrid />
      <FeaturesShowcase />
      <PlatformIntegration />
      <Workflow />
      <FAQ />
      <FinalCTA />
      
      <Footer />
      <FloatingActionButton onToggleHistory={onToggleHistory} />
    </div>
  );
}

// Layout Component
const AppLayout = ({ children, isHistoryOpen, onToggleHistory }) => {
  return (
    <div className="min-h-screen bg-white">
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => onToggleHistory(false)} />
      <div className={isHistoryOpen ? 'ml-80' : ''}>
        {children}
      </div>
    </div>
  );
};

export default function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const location = useLocation();

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  return (
    <>
      <Helmet>
        <title>Modern PDF Toolkit | Professional E-commerce Tools</title>
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
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
        </Routes>
      </AppLayout>
    </>
  );
}
