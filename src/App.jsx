import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/footer";
import PdfViewer from "./pages/PdfViewer";
import FlipkartCropper from './pages/FlipkartCropper';
import MeshooCropper from "./pages/MeshooCropper";
import JioMartCropper from "./pages/JioMartCropper";
import ContactUs from "./pages/ContactUs";
import AdminPanel from "./pages/AdminPanel";
import HistorySidebar from "./components/HistorySidebar";
import PdfCropper from "./pages/crop";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import "./App.css";

function HomePage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // E-commerce platforms data - Added PDF Cropper
  const platforms = [
    {
      id: "pdf-cropper",
      name: "PDF Cropper",
      logo: "P",
      color: "purple",
      description: "Advanced tool for cropping PDF documents with precision. Perfect for editing documents, removing margins, or extracting specific content.",
      features: [
        "Precise area selection",
        "Multi-page support",
        "Real-time preview",
        "Coordinate tracking",
        "Batch processing",
        "High-quality output"
      ],
      route: "/crop"
    },
    {
      id: "flipkart",
      name: "Flipkart",
      logo: "F",
      color: "blue",
      description: "Specialized tool for cropping and optimizing Flipkart product labels and images. Perfect for sellers who need to process bulk orders efficiently.",
      features: [
        "Automated label cropping",
        "SKU-based sorting",
        "Courier-wise organization",
        "Invoice management",
        "Batch processing",
        "PDF to image conversion"
      ],
      route: "/FlipkartCropper"
    },
    {
      id: "meesho",
      name: "Meesho",
      logo: "M",
      color: "orange",
      description: "Optimized tool for Meesho product image requirements and label formatting. Designed for resellers and small businesses.",
      features: [
        "Background removal",
        "Size standardization",
        "Quality optimization",
        "Bulk processing",
        "Format conversion",
        "Quick preview"
      ],
      route: "/MeshooCropper"
    },
    {
      id: "jiomart",
      name: "JioMart",
      logo: "J",
      color: "red",
      description: "Comprehensive tool for JioMart product image preparation and label cropping. Ideal for grocery and retail products.",
      features: [
        "Multi-format support",
        "Auto-rotation correction",
        "Quality enhancement",
        "Metadata preservation",
        "Quick export",
        "Barcode recognition"
      ],
      route: "/JioMartCropper"
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case "blue":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "orange":
        return "bg-orange-500 hover:bg-orange-600 text-white";
      case "red":
        return "bg-red-500 hover:bg-red-600 text-white";
      case "purple":
        return "bg-purple-500 hover:bg-purple-600 text-white";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white";
    }
  };

  const getBorderColor = (color) => {
    switch (color) {
      case "blue":
        return "border-blue-200";
      case "orange":
        return "border-orange-200";
      case "red":
        return "border-red-200";
      case "purple":
        return "border-purple-200";
      default:
        return "border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      <Helmet>
        {/* Primary Meta Tags */}
        <title>AI-Powered Cropper Tool | Free Image Crop & Resize for E-commerce</title>
        <meta 
          name="description" 
          content="Use our free AI-powered cropper tool to crop, resize, and optimize product images for Flipkart, Meesho, Amazon, and any e-commerce platform. Fast, simple, and SEO-friendly." 
        />
        <meta 
          name="keywords" 
          content="AI cropper, free crop tool, image cropper online, product image resizer, e-commerce crop tool, Flipkart image crop, Meesho image crop, Amazon image crop, SEO friendly cropper" 
        />
        <meta name="author" content="Your Brand Name" />

        {/* Open Graph (Facebook, LinkedIn, etc.) */}
        <meta property="og:title" content="AI-Powered Cropper Tool | Free Image Crop & Resize" />
        <meta 
          property="og:description" 
          content="Crop, resize, and optimize product images for Flipkart, Meesho, Amazon, and more with our free AI cropper tool. Boost your e-commerce sales with perfect images." 
        />
        <meta property="og:url" content="https://yourdomain.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://yourdomain.com/preview.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI-Powered Cropper Tool | Free Image Crop & Resize" />
        <meta 
          name="twitter:description" 
          content="Optimize your e-commerce product images with our AI-powered cropper tool. Works with Flipkart, Meesho, Amazon & more." 
        />
        <meta name="twitter:image" content="https://yourdomain.com/preview.png" />

        {/* Mobile/SEO Optimizations */}
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://yourdomain.com/" />
      </Helmet>

      {/* Hero Section */}
      <div className="flex-grow max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className={`transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Your PDF & E-commerce Toolkit
          </h1>
          <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto">
            Powerful tools for PDF viewing, cropping and e-commerce image processing. 
            Streamline your workflow with our intuitive solutions.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-20">
            <button
              onClick={() => navigate("/PdfViewer")}
              className="px-8 py-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 极4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414极V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Go to Universal File Converter
            </button>
          </div>
        </div>
        
        {/* Tools Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center my-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Our Tools Collection
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-12">
            Professional tools designed for PDF manipulation and e-commerce platforms. 
            Optimize your documents and product images with our specialized features.
          </p>

          {/* Platform Cards Grid - Updated to 4 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 ${getBorderColor(platform.color)}`}
              >
                <div className="p-6">
                  {/* Platform Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${getColorClasses(platform.color)} rounded-lg flex items-center justify-center text-lg font-bold`}>
                        {platform.logo}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{platform.name}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 text-sm">{platform.description}</p>

                  {/* Features List */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2">Key Features:</h4>
                    <ul className="space-y-1">
                      {platform.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => navigate(platform.route)}
                    className={`w-full ${getColorClasses(platform.color)} py-3 px-4 rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center gap-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Use {platform.name} Tool
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Comparison Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Use Our Tools?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Save Time</h3>
                <p className="text-gray-600 text-sm">Process hundreds of images and documents in minutes instead of hours</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 0110.618 3.04A12.02 12.02 0 0121 12c0 5.591-3.824 10.29-9 11.622-5.176-1.332-9-6.03-9-11.622 0-1.042.133-2.052.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Platform Optimized</h3>
                <p className="text-gray-600 text-sm">Each tool is specifically designed for different platform requirements</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4a2 2 0 11-4 0 2 2 0 014 0zM4 6a2 2 0 100 4h16a2 2 0 100-4H4z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Bulk Processing</h3>
                <p className="text-gray-600 text-sm">Handle large volumes of images and documents efficiently</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Features Grid - Moved below Tools Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-12">Our Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-indigo-100 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/s极vg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">PDF Viewer</h3>
              <p className="text-gray-600">
                View and interact with PDF documents seamlessly in your browser with zooming, searching, and navigation.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-purple-100 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4v5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">PDF Cropper</h3>
              <p className="text-gray-600">
                Precise PDF cropping tool with coordinate tracking, multi-page support, and real-time preview.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-green-100 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4v5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">E-commerce Cropper</h3>
              <p className="text-gray-600">
                Precise image cropping tools optimized for all major e-commerce platforms with specialized editors.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-blue-100 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Fast & Efficient</h3>
              <p className="text-gray-600">
                Optimized tools that help you complete your tasks faster with intuitive interfaces and smart workflows.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Choose the tool that matches your needs and start optimizing your documents and product images today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/PdfViewer")}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors duration-300"
            >
              Try PDF Viewer
            </button>
            <button
              onClick={() => navigate("/ContactUs")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300"
            >
              Contact Support
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Footer at the bottom of the home page */}
      <Footer />
    </div>
  );
}

// Wrapper component for pages that need the footer
const PageWithFooter = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex-grow">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/PdfViewer" 
          element={
            <PageWithFooter>
              <PdfViewer />
            </PageWithFooter>
          } 
        />
        
        <Route 
          path="/FlipkartCropper" 
          element={
            <PageWithFooter>
              <FlipkartCropper />
            </PageWithFooter>
          } 
        />
        <Route 
          path="/MeshooCropper" 
          element={
            <PageWithFooter>
              <MeshooCropper />
            </PageWithFooter>
          } 
        />
        <Route 
          path="/JioMartCropper" 
          element={
            <PageWithFooter>
              <JioMartCropper />
            </PageWithFooter>
          } 
        />
        <Route 
          path="/ContactUs" 
          element={
            <PageWithFooter>
              <ContactUs />
            </PageWithFooter>
          }
        />
        <Route 
          path="/AdminPanel" 
          element={
            <PageWithFooter>
              <AdminPanel />
            </PageWithFooter>
          }
        />
        <Route 
          path="/crop" 
          element={
            <PageWithFooter>
              <PdfCropper />
            </PageWithFooter>
          }
        />  
        
      </Routes>
      
      {/* History Sidebar - Accessible from all pages on hover */}
      <HistorySidebar />
    </>
  );
}