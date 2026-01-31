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
import "./App.css";

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="text-center">
      <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading tools...</p>
    </div>
  </div>
);

// Floating Action Button
const FloatingActionButton = ({ onToggleHistory }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    { label: "PDF Converter", path: "/PdfViewer", icon: "📄" },
    { label: "PDF Cropper", path: "/crop", icon: "✂️" },
    { label: "Support", path: "/ContactUs", icon: "💬" },
    { label: "History", action: onToggleHistory, icon: "📚" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <div className="absolute bottom-14 right-0 mb-2 bg-white border border-gray-300 rounded shadow-lg w-48">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                if (action.path) navigate(action.path);
                if (action.action) action.action();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
            >
              <span className="text-gray-700">{action.icon}</span>
              <span className="text-gray-800 text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

// Tool Card Component
const ToolCard = ({ tool }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-white border border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
      onClick={() => navigate(tool.route)}
    >
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">{tool.icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {tool.features.map((feature, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(tool.route);
          }}
          className="w-full py-2.5 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
        >
          Open Tool
        </button>
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ feature }) => (
  <div className="bg-white border border-gray-300 rounded-lg p-6">
    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
      <span className="text-xl">{feature.icon}</span>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
    <p className="text-gray-600">{feature.description}</p>
  </div>
);

// Home Page Component
function HomePage({ isHistoryOpen, onToggleHistory }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const tools = [
    {
      name: "PDF Converter",
      description: "Convert PDF files to various formats with high quality output",
      route: "/PdfViewer",
      icon: "📄",
      features: ["Multiple formats", "Batch process", "High quality"]
    },
    {
      name: "PDF Cropper",
      description: "Precision cropping tool for PDF documents and pages",
      route: "/crop",
      icon: "✂️",
      features: ["Precision tools", "Multi-page", "Easy export"]
    },
    {
      name: "Flipkart Tool",
      description: "Optimized tools for Flipkart product image preparation",
      route: "/FlipkartCropper",
      icon: "🛒",
      features: ["Flipkart optimized", "Auto-format", "Quick export"]
    },
    {
      name: "Meesho Tool",
      description: "Tools designed for Meesho product specifications",
      route: "/MeshooCropper",
      icon: "📦",
      features: ["Meesho compliant", "Quality check", "Fast process"]
    },
    {
      name: "JioMart Tool",
      description: "Complete solution for JioMart product preparation",
      route: "/JioMartCropper",
      icon: "🏪",
      features: ["JioMart ready", "Smart tools", "Easy upload"]
    }
  ];

  const features = [
    {
      icon: "⚡",
      title: "Fast Processing",
      description: "Process files quickly with our optimized tools"
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      description: "Your files are processed securely and deleted after processing"
    },
    {
      icon: "🎯",
      title: "Platform Optimized",
      description: "Tools specifically designed for each e-commerce platform"
    }
  ];

  const faqs = [
    {
      question: "Is there a file size limit?",
      answer: "We support files up to 500MB. For larger files, please contact support."
    },
    {
      question: "How secure is my data?",
      answer: "All files are processed securely and automatically deleted after 24 hours."
    },
    {
      question: "Do I need to create an account?",
      answer: "No account is required for basic usage. Accounts are available for saving history."
    },
    {
      question: "Which file formats are supported?",
      answer: "PDF, JPG, PNG, DOC, DOCX, TXT, and most common formats."
    }
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white">
      <Helmet>
        <title>PDF Tools - Professional Document Processing for E-commerce</title>
        <meta name="description" content="Professional PDF and document processing tools optimized for e-commerce platforms. Convert, crop, and optimize your product files." />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gray-50 border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Professional PDF Tools
              <span className="block text-blue-600 mt-2">for E-commerce</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Convert, crop, and optimize your product files with our specialized tools designed for e-commerce platforms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => navigate('/PdfViewer')}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
              >
                Start Using Tools
              </button>
              <button
                onClick={() => document.getElementById('tools').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3 bg-white text-gray-700 font-medium rounded border border-gray-400 hover:border-gray-500 transition-colors"
              >
                View All Tools
              </button>
            </div>
            
            <div className="mb-8">
              <p className="text-gray-500 mb-4">Supported platforms:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {["Flipkart", "Meesho", "JioMart", "Amazon", "Myntra"].map((platform) => (
                  <div key={platform} className="px-4 py-2 bg-white border border-gray-400 rounded text-gray-700">
                    {platform}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div id="tools" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Our Tools</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Specialized tools designed for e-commerce professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <ToolCard key={index} tool={tool} />
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50 border-t border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built with professional requirements in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-white border-t border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple three-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload Files",
                description: "Upload your PDFs or documents to the tool"
              },
              {
                step: "2",
                title: "Process",
                description: "Use the tool to convert, crop, or optimize"
              },
              {
                step: "3",
                title: "Download",
                description: "Download your processed files ready for use"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-gray-50 border-t border-gray-300">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">FAQ</h2>
            <p className="text-gray-600">Common questions about our tools</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-gray-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Start Using Our Tools</h2>
          <p className="text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of sellers using our professional tools for their e-commerce needs
          </p>
          <button
            onClick={() => navigate('/PdfViewer')}
            className="px-8 py-3 bg-white text-blue-600 font-medium rounded hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </button>
          <p className="text-blue-200 text-sm mt-6">No account required • Free to use</p>
        </div>
      </div>

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
        <title>PDF Tools - Professional Document Processing</title>
        <meta name="description" content="Professional PDF and document processing tools for e-commerce sellers and businesses." />
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
