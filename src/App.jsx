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

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600 mx-auto mb-6"></div>
      <p className="text-gray-700 font-medium text-lg">Loading Professional Tools...</p>
      <p className="text-gray-500 text-sm mt-2">Preparing your workspace</p>
    </div>
  </div>
);

// Floating action button for quick access
const FloatingActionButton = ({ onToggleHistory }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    { 
      label: "PDF Converter", 
      path: "/PdfViewer", 
      color: "bg-blue-600 hover:bg-blue-700", 
      icon: "📄",
      description: "Convert documents"
    },
    { 
      label: "PDF Cropper", 
      path: "/crop", 
      color: "bg-purple-600 hover:bg-purple-700", 
      icon: "✂️",
      description: "Crop PDF pages"
    },
    { 
      label: "Support", 
      path: "/ContactUs", 
      color: "bg-green-600 hover:bg-green-700", 
      icon: "💬",
      description: "Get help"
    },
    { 
      label: "History", 
      action: onToggleHistory, 
      color: "bg-gray-700 hover:bg-gray-800", 
      icon: "📚",
      description: "View recent files"
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* Quick Actions Panel */}
      <div className={`absolute bottom-20 right-0 mb-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-64">
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  if (action.path) {
                    navigate(action.path);
                  } else if (action.action) {
                    action.action();
                  }
                  setIsOpen(false);
                }}
                className="w-full p-3 text-left rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3 group"
              >
                <div className={`w-10 h-10 ${action.color.replace('hover:', '')} rounded-lg flex items-center justify-center text-white`}>
                  <span className="text-lg">{action.icon}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 group-hover:text-blue-600">{action.label}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-xl flex items-center justify-center text-white hover:shadow-2xl transition-all duration-300 group relative"
      >
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        
        {/* Tooltip */}
        <div className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Quick Actions
          <div className="absolute -bottom-1 right-5 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      </button>
    </div>
  );
};

// Professional Tool Card Component
const ToolCard = ({ tool, index }) => {
  const navigate = useNavigate();

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-100',
      icon: 'bg-green-600',
      text: 'text-green-700',
      hover: 'hover:border-green-300'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      icon: 'bg-purple-600',
      text: 'text-purple-700',
      hover: 'hover:border-purple-300'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-100',
      icon: 'bg-yellow-600',
      text: 'text-yellow-700',
      hover: 'hover:border-yellow-300'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      icon: 'bg-orange-600',
      text: 'text-orange-700',
      hover: 'hover:border-orange-300'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      icon: 'bg-red-600',
      text: 'text-red-700',
      hover: 'hover:border-red-300'
    }
  };

  const colors = colorClasses[tool.color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`bg-white rounded-xl border-2 ${colors.border} ${colors.hover} shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden`}
      onClick={() => navigate(tool.route)}
    >
      <div className="p-6">
        {/* Header with icon and title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 ${colors.icon} rounded-lg flex items-center justify-center`}>
            <span className="text-xl text-white">{tool.icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{tool.name}</h3>
            <p className="text-gray-600 text-sm">{tool.description}</p>
          </div>
        </div>

        {/* Feature tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tool.features.slice(0, 3).map((feature, idx) => (
            <span key={idx} className={`px-3 py-1 ${colors.bg} ${colors.text} text-xs font-medium rounded-full`}>
              {feature}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Fast processing</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Secure</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(tool.route);
          }}
          className={`w-full py-3 ${colors.icon} text-white rounded-lg font-medium hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2`}
        >
          <span>Use Tool</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

// Feature Card Component
const FeatureCard = ({ feature }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg mb-4">
      <span className="text-2xl">{feature.icon}</span>
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-3">{feature.title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
  </div>
);

// Platform Badge Component
const PlatformBadge = ({ platform }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
    <span className="text-lg">{platform.icon}</span>
    <span className="font-medium text-gray-700">{platform.name}</span>
  </div>
);

// Professional Hero Section with clear value proposition
const ProfessionalHero = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-8">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-700 font-medium">Trusted by 50,000+ Professionals</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Professional PDF & E-commerce
            <span className="block text-blue-600">Toolkit for Sellers</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Advanced document processing tools optimized for e-commerce platforms. Convert, crop, and analyze your product files with enterprise-grade precision.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => navigate('/PdfViewer')}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => document.getElementById('tools-section').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              View All Tools
            </button>
          </div>

          {/* Platform Support */}
          <div className="mb-12">
            <p className="text-gray-500 font-medium mb-4">Optimized for leading platforms:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { name: "Flipkart", icon: "🛒" },
                { name: "Meesho", icon: "📦" },
                { name: "JioMart", icon: "🏪" },
                { name: "Amazon", icon: "📦" },
                { name: "Myntra", icon: "👕" }
              ].map((platform) => (
                <PlatformBadge key={platform.name} platform={platform} />
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "1M+", label: "Files Processed" },
              { value: "99.9%", label: "Accuracy Rate" },
              { value: "50K+", label: "Active Users" },
              { value: "24/7", label: "Support Available" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// How It Works Section
const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Upload Files",
      description: "Upload PDFs, images, or documents in any format. Batch upload supported.",
      icon: "📤"
    },
    {
      number: "02",
      title: "Process & Optimize",
      description: "Use specialized tools to convert, crop, and enhance your files.",
      icon: "⚡"
    },
    {
      number: "03",
      title: "Analyze & Export",
      description: "View analytics and export optimized files ready for e-commerce platforms.",
      icon: "📊"
    }
  ];

  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple Three-Step Process
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From upload to export - complete your workflow in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connecting line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-3/4 w-full h-0.5 bg-gray-200"></div>
              )}

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-300">{step.number}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Pricing Section
const PricingSection = () => (
  <div className="bg-gray-50 py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Transparent Pricing
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose the plan that fits your business needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Free Plan */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Starter</h3>
            <div className="text-4xl font-bold text-gray-900 mb-1">₹0<span className="text-lg text-gray-600">/month</span></div>
            <p className="text-gray-500 text-sm">For individuals & small sellers</p>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>100 files/month</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Basic conversion tools</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Standard support</span>
            </li>
          </ul>
          <button className="w-full py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200">
            Get Started Free
          </button>
        </div>

        {/* Pro Plan - Highlighted */}
        <div className="bg-white rounded-xl border-2 border-blue-500 p-8 shadow-lg relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
          </div>
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Professional</h3>
            <div className="text-4xl font-bold text-gray-900 mb-1">₹999<span className="text-lg text-gray-600">/month</span></div>
            <p className="text-gray-500 text-sm">For growing businesses</p>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Unlimited files</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>All premium tools</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Priority support</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Advanced analytics</span>
            </li>
          </ul>
          <button className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg">
            Start 14-Day Trial
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Enterprise</h3>
            <div className="text-4xl font-bold text-gray-900 mb-1">Custom</div>
            <p className="text-gray-500 text-sm">For large organizations</p>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Custom volume</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Dedicated support</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>API access</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Custom integrations</span>
            </li>
          </ul>
          <button className="w-full py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors duration-200">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Testimonials Section
const Testimonials = () => (
  <div className="bg-white py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Trusted by E-commerce Professionals
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          See what our users have to say about their experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            name: "Rajesh Kumar",
            role: "Flipkart Seller",
            content: "The PDF cropper saved me hours of manual work. My product images are now perfectly optimized.",
            avatar: "RK"
          },
          {
            name: "Priya Sharma",
            role: "Meesho Seller",
            content: "Batch processing feature is a game-changer. I can process hundreds of files in minutes.",
            avatar: "PS"
          },
          {
            name: "Amit Patel",
            role: "JioMart Supplier",
            content: "The analytics helped me understand my sales patterns better. Great tool for serious sellers.",
            avatar: "AP"
          }
        ].map((testimonial, index) => (
          <div key={index} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="font-semibold text-blue-700">{testimonial.avatar}</span>
              </div>
              <div>
                <div className="font-semibold text-gray-800">{testimonial.name}</div>
                <div className="text-sm text-gray-600">{testimonial.role}</div>
              </div>
            </div>
            <p className="text-gray-600 italic">"{testimonial.content}"</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Main Home Page Component
function HomePage({ isHistoryOpen, onToggleHistory }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const tools = [
    { 
      name: "PDF Converter", 
      description: "Convert PDFs to multiple formats with batch processing and quality preservation", 
      route: "/PdfViewer",
      color: "green",
      icon: "🔄",
      features: ["Multiple formats", "Batch processing", "Quality control"]
    },
    { 
      name: "PDF Cropper", 
      description: "Advanced cropping tool with precision controls and multi-page support", 
      route: "/crop",
      color: "purple",
      icon: "✂️",
      features: ["Precision cropping", "Multi-page", "Batch support"]
    },
    { 
      name: "Flipkart Cropper", 
      description: "Optimized for Flipkart product labels with auto-formatting and analytics", 
      route: "/FlipkartCropper",
      color: "yellow",
      icon: "🛒",
      features: ["Flipkart optimized", "Auto-formatting", "Analytics"]
    },
    { 
      name: "Meesho Cropper", 
      description: "Tailored for Meesho product specifications with quality checks", 
      route: "/MeshooCropper",
      color: "orange",
      icon: "📦",
      features: ["Meesho compliant", "Quality checks", "Preview"]
    },
    { 
      name: "JioMart Cropper", 
      description: "Complete solution for JioMart product preparation and optimization", 
      route: "/JioMartCropper",
      color: "red",
      icon: "🏪",
      features: ["JioMart ready", "Smart optimize", "Fast processing"]
    }
  ];

  const features = [
    {
      icon: "⚡",
      title: "High Performance",
      description: "Process large files quickly with our optimized algorithms and cloud infrastructure"
    },
    {
      icon: "🔒",
      title: "Bank-Level Security",
      description: "Your files are encrypted and processed securely. We never store sensitive data."
    },
    {
      icon: "🔄",
      title: "Easy Integration",
      description: "Works seamlessly with all major e-commerce platforms and existing workflows"
    }
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Professional PDF Toolkit - Converter, Cropper & Analytics for E-commerce</title>
        <meta name="description" content="Enterprise-grade PDF tools for e-commerce sellers. Convert, crop, and analyze product files with precision. Optimized for Flipkart, Meesho, JioMart." />
        <meta name="keywords" content="PDF converter, PDF cropper, e-commerce tools, document processing, business tools" />
        <meta property="og:title" content="Professional PDF Toolkit for E-commerce Sellers" />
        <meta property="og:description" content="Convert, crop, and analyze your product files with enterprise-grade tools." />
        <link rel="canonical" href="https://yourdomain.com/" />
      </Helmet>

      <ProfessionalHero />
      
      {/* Tools Section */}
      <section id="tools-section" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Tool Suite
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Specialized tools designed for professional e-commerce sellers and businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <ToolCard key={tool.name} tool={tool} index={index} />
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with professionals in mind - reliability, security, and performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      <PricingSection />
      <Testimonials />

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Streamline Your Workflow?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of professional sellers who trust our platform for their document processing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/PdfViewer')}
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200 shadow-lg"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate('/ContactUs')}
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
              Schedule Demo
            </button>
          </div>
          <p className="text-blue-200 text-sm mt-8">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
      <FloatingActionButton onToggleHistory={onToggleHistory} />
    </div>
  );
}

// Layout component
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
        <title>PDF Toolkit Pro - Professional Document Processing Tools</title>
        <meta name="description" content="Enterprise-grade PDF and document processing tools for e-commerce professionals. Convert, crop, analyze." />
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
