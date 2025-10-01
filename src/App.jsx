import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/footer";
import PdfViewer from "./pages/PdfViewer";
import FlipkartCropper from './pages/FlipkartCropper';
import MeshooCropper from "./pages/MeshooCropper";
import JioMartCropper from "./pages/JioMartCropper";
import ContactUs from "./pages/ContactUs";
import PdfCropper from "./pages/crop";
import HistorySidebar from "./components/HistorySidebar"; // Add this import

import { Helmet } from "react-helmet";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading amazing tools...</p>
    </div>
  </div>
);

// Floating action button for quick access
const FloatingActionButton = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    { label: "PDF Tools", path: "/PdfViewer", color: "bg-blue-600 hover:bg-blue-700", icon: "📄" },
    { label: "Crop PDF", path: "/crop", color: "bg-purple-600 hover:bg-purple-700", icon: "✂️" },
    { label: "Support", path: "/ContactUs", color: "bg-green-600 hover:bg-green-700", icon: "💬" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end space-y-3 mb-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ scale: 0, opacity: 0, x: 20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0, opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(action.path)}
                className={`px-4 py-3 ${action.color} text-white rounded-full shadow-lg transition-all duration-300 text-sm font-medium flex items-center gap-2 min-w-[140px] justify-end`}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-indigo-700 transition-colors relative"
      >
        <motion.svg
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </motion.svg>
        
        {/* Pulse animation */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 border-2 border-indigo-400 rounded-full"
        />
      </motion.button>
    </div>
  );
};

// Enhanced Animated tool card component with images
const AnimatedToolCard = ({ tool, index }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const colorMap = {
    purple: { 
      bg: "from-purple-500 to-purple-600", 
      hover: "hover:from-purple-600 hover:to-purple-700",
      light: "bg-purple-50"
    },
    blue: { 
      bg: "from-blue-500 to-blue-600", 
      hover: "hover:from-blue-600 hover:to-blue-700",
      light: "bg-blue-50"
    },
    orange: { 
      bg: "from-orange-500 to-orange-600", 
      hover: "hover:from-orange-600 hover:to-orange-700",
      light: "bg-orange-50"
    },
    red: { 
      bg: "from-red-500 to-red-600", 
      hover: "hover:from-red-600 hover:to-red-700",
      light: "bg-red-50"
    },
    green: { 
      bg: "from-green-500 to-green-600", 
      hover: "hover:from-green-600 hover:to-green-700",
      light: "bg-green-50"
    },
    yellow: { 
      bg: "from-yellow-500 to-yellow-600", 
      hover: "hover:from-yellow-600 hover:to-yellow-700",
      light: "bg-yellow-50"
    }
  };

  const colors = colorMap[tool.color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer"
      onClick={() => navigate(tool.route)}
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      {/* Top accent bar */}
      <div className={`h-2 ${colors.light} group-hover:bg-gradient-to-r ${colors.bg} transition-all duration-300`} />
      
      <div className="p-6 relative z-10">
        {/* Icon with background */}
        <motion.div
          animate={{ scale: isHovered ? 1.2 : 1, rotate: isHovered ? 5 : 0 }}
          className={`w-16 h-16 rounded-2xl ${colors.light} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow duration-300`}
        >
          <span className="text-2xl">{tool.icon}</span>
        </motion.div>
        
        {/* Tool name and description */}
        <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-gray-900 transition-colors">
          {tool.name}
        </h3>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed group-hover:text-gray-700 transition-colors">
          {tool.desc}
        </p>

        {/* Tool image preview */}
        <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="w-full h-48 flex items-center justify-center relative">
            {/* Tool-specific preview image */}
            <div className={`w-full h-full flex items-center justify-center ${tool.previewBg || 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
              {tool.previewContent || (
                <div className="text-center p-4">
                  <div className="text-4xl mb-3">{tool.icon}</div>
                  <div className="text-sm font-semibold text-gray-700">{tool.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Interactive Preview</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Features list */}
        <div className="mb-6 space-y-2">
          {tool.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-1.5 h-1.5 rounded-full ${colors.light.replace('bg-', 'bg-')}`} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        
        {/* Action button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(tool.route);
          }}
          className={`w-full px-4 py-3 bg-gradient-to-r ${colors.bg} ${colors.hover} text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2`}
        >
          <span>Use Tool</span>
          <motion.svg
            animate={{ x: isHovered ? 3 : 0 }}
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </motion.svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

// Feature card with interactive elements
const FeatureCard = ({ feature, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -5 }}
    className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group"
  >
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow duration-300"
    >
      {feature.icon}
    </motion.div>
    <h3 className="font-bold text-xl mb-4 text-gray-900 text-center">{feature.title}</h3>
    <p className="text-gray-600 text-center leading-relaxed">{feature.description}</p>
  </motion.div>
);

// Scroll progress indicator
const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress((currentProgress / scrollHeight) * 100);
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <motion.div
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 origin-left z-50"
      style={{ scaleX: progress / 100 }}
    />
  );
};

// Platform showcase component
const PlatformShowcase = () => {
  const platforms = [
    { name: "Flipkart", color: "from-yellow-400 to-yellow-600", logo: "🛒" },
    { name: "Meesho", color: "from-pink-500 to-pink-700", logo: "📦" },
    { name: "JioMart", color: "from-blue-500 to-blue-700", logo: "🏪" },
    { name: "Amazon", color: "from-orange-400 to-orange-600", logo: "📦" },
    { name: "Myntra", color: "from-red-500 to-red-700", logo: "👕" }
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-8">
      {platforms.map((platform, index) => (
        <motion.div
          key={platform.name}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          className={`px-6 py-3 bg-gradient-to-r ${platform.color} text-white rounded-2xl font-semibold flex items-center gap-2 shadow-lg`}
        >
          <span className="text-lg">{platform.logo}</span>
          <span>{platform.name}</span>
        </motion.div>
      ))}
    </div>
  );
};

// Multi-image showcase component for hero section
const HeroImageShowcase = () => {
  const images = [
    {
      src: "/api/placeholder/300/200",
      alt: "PDF Conversion Tool",
      title: "PDF Converter",
      description: "Fast format conversion",
      icon: "🔄",
      rotateDirection: 5,
      floatDelay: 0
    },
    {
      src: "/api/placeholder/300/200",
      alt: "Smart Cropping Tool",
      title: "Smart Cropper",
      description: "Precise area selection",
      icon: "✂️",
      rotateDirection: -3,
      floatDelay: 0.5
    },
    {
      src: "/api/placeholder/300/200",
      alt: "E-commerce Analytics",
      title: "Order Analytics",
      description: "Sales insights & reports",
      icon: "📊",
      rotateDirection: 4,
      floatDelay: 1
    },
    {
      src: "/api/placeholder/300/200",
      alt: "Batch Processing",
      title: "Batch Processing",
      description: "Multiple files at once",
      icon: "⚡",
      rotateDirection: -2,
      floatDelay: 1.5
    }
  ];

  return (
    <div className="relative w-full max-w-2xl ml-12">
      {/* Main featured image with enhanced animations */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.8,
          type: "spring",
          stiffness: 100
        }}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.3 }
        }}
        className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 w-full"
      >
        <motion.div
          animate={{
            background: [
              "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 100%)",
              "linear-gradient(135deg, #e9d5ff 0%, #dbeafe 100%)",
              "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 100%)"
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="aspect-[4/3] flex items-center justify-center p-8 relative overflow-hidden"
        >
          {/* Animated background elements */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: {
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              },
              scale: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="absolute -top-20 -right-20 w-40 h-40 bg-blue-200 rounded-full opacity-20"
          />
          <motion.div
            animate={{
              rotate: -360,
              scale: [1.1, 1, 1.1]
            }}
            transition={{
              rotate: {
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              },
              scale: {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="absolute -bottom-20 -left-20 w-32 h-32 bg-purple-200 rounded-full opacity-20"
          />
          
          <div className="text-center relative z-10">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-6xl mb-6"
            >
              🚀
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-bold text-gray-800 mb-4"
            >
              Complete PDF & E-commerce Toolkit
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-gray-600 text-lg"
            >
              Professional tools for e-commerce success
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-6 flex justify-center gap-4"
            >
              {["Fast", "Secure", "Easy"].map((text, index) => (
                <motion.div
                  key={text}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  whileHover={{ scale: 1.2 }}
                  className="flex items-center gap-2"
                >
                  <div className={`w-3 h-3 ${
                    text === "Fast" ? "bg-green-500" :
                    text === "Secure" ? "bg-blue-500" : "bg-purple-500"
                  } rounded-full`}></div>
                  <span className="text-sm text-gray-600">{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating images with enhanced animations */}
      {images.map((image, index) => (
        <motion.div
          key={index}
          initial={{ 
            opacity: 0, 
            scale: 0.5,
            x: index % 2 === 0 ? -100 : 100, 
            y: index < 2 ? -80 : 80,
            rotate: index % 2 === 0 ? -45 : 45
          }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            x: 0, 
            y: 0,
            rotate: 0
          }}
          transition={{ 
            duration: 1, 
            delay: 0.3 + index * 0.2,
            type: "spring",
            stiffness: 80,
            damping: 10
          }}
          whileHover={{ 
            scale: 1.2,
            rotate: image.rotateDirection * 2,
            y: -15,
            zIndex: 40,
            transition: { 
              duration: 0.4,
              type: "spring",
              stiffness: 400
            }
          }}
          className={`absolute w-56 h-40 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ${
            index === 0 ? '-top-8 -left-10' :
            index === 1 ? '-top-8 -right-10' :
            index === 2 ? '-bottom-8 -left-10' :
            '-bottom-8 -right-10'
          } z-20 cursor-pointer group`}
        >
          {/* Floating animation */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: image.rotateDirection
            }}
            transition={{
              y: {
                duration: 3 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: image.floatDelay
              },
              rotate: {
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className={`w-full h-full ${
              index === 0 ? 'bg-gradient-to-br from-green-50 to-blue-50' :
              index === 1 ? 'bg-gradient-to-br from-purple-50 to-pink-50' :
              index === 2 ? 'bg-gradient-to-br from-orange-50 to-red-50' :
              'bg-gradient-to-br from-yellow-50 to-orange-50'
            } flex flex-col items-center justify-center p-4 relative overflow-hidden`}
          >
            {/* Rotating background pattern */}
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                rotate: 360,
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                rotate: {
                  duration: 30,
                  repeat: Infinity,
                  ease: "linear"
                },
                backgroundPosition: {
                  duration: 20,
                  repeat: Infinity,
                  repeatType: "reverse"
                }
              }}
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, #${
                  index === 0 ? '3B82F6' : 
                  index === 1 ? '8B5CF6' : 
                  index === 2 ? 'EF4444' : 'F59E0B'
                } 2px, transparent 2px)`,
                backgroundSize: '30px 30px'
              }}
            />
            
            {/* Pulsing icon */}
            <motion.div
              animate={{ 
                y: [0, -8, 0],
                scale: [1, 1.1, 1],
                rotate: index % 2 === 0 ? [0, 5, 0] : [0, -5, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                delay: index * 0.5
              }}
              className="text-4xl mb-3 relative z-10"
            >
              {image.icon}
            </motion.div>
            
            {/* Content with slide-in effect on hover */}
            <motion.div
              initial={{ y: 0 }}
              whileHover={{ y: -5 }}
              className="text-center relative z-10"
            >
              <motion.h4
                whileHover={{ scale: 1.05 }}
                className="font-bold text-gray-800 text-lg mb-1 group-hover:text-gray-900 transition-colors"
              >
                {image.title}
              </motion.h4>
              <motion.p
                initial={{ opacity: 0.8 }}
                whileHover={{ opacity: 1 }}
                className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors"
              >
                {image.description}
              </motion.p>
            </motion.div>

            {/* Enhanced shine effect on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12"
              initial={{ x: '-150%' }}
              whileHover={{ x: '150%' }}
              transition={{ duration: 0.8 }}
            />
          </motion.div>

          {/* Enhanced glow effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            animate={{
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.5
            }}
            style={{
              background: `radial-gradient(circle at center, ${
                index === 0 ? 'rgba(34, 197, 94, 0.4)' :
                index === 1 ? 'rgba(168, 85, 247, 0.4)' :
                index === 2 ? 'rgba(239, 68, 68, 0.4)' :
                'rgba(245, 158, 11, 0.4)'
              } 0%, transparent 70%)`
            }}
          />

          {/* Floating particles */}
          {[1, 2, 3].map((particle) => (
            <motion.div
              key={particle}
              className={`absolute w-2 h-2 rounded-full ${
                index === 0 ? 'bg-green-400' :
                index === 1 ? 'bg-purple-400' :
                index === 2 ? 'bg-red-400' : 'bg-yellow-400'
              }`}
              animate={{
                y: [0, -20, 0],
                x: [0, particle * 10, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 3 + particle,
                repeat: Infinity,
                delay: particle * 0.5 + index,
                ease: "easeInOut"
              }}
              style={{
                left: `${20 + particle * 20}%`,
                top: `${10 + particle * 25}%`
              }}
            />
          ))}
        </motion.div>
      ))}

      {/* Enhanced Floating badges with orbit animation */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute -top-6 left-1/4 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg z-30 flex items-center gap-2 whitespace-nowrap"
      >
        <motion.span
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "linear"
          }}
        >
          ⚡
        </motion.span>
        <span>Fast Processing</span>
      </motion.div>

      <motion.div
        animate={{ 
          y: [0, 20, 0],
          rotate: [0, -5, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1 
        }}
        className="absolute -bottom-6 right-1/4 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg z-30 flex items-center gap-2 whitespace-nowrap"
      >
        <motion.span
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            rotate: {
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            },
            scale: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          🎯
        </motion.span>
        <span>Smart Tools</span>
      </motion.div>

      {/* Orbiting elements around main image */}
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1]
        }}
        transition={{
          rotate: {
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          },
          scale: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        className="absolute top-1/2 left-1/2 w-8 h-8 -ml-4 -mt-4"
      >
        <motion.div
          animate={{
            rotate: -360,
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            rotate: {
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            },
            scale: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className="w-2 h-2 bg-blue-400 rounded-full"
        />
      </motion.div>

      {/* Enhanced floating elements */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.8, 0.3],
          y: [0, -30, 0],
          x: [0, 20, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 -left-6 w-4 h-4 bg-blue-400 rounded-full blur-sm z-0"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.6, 0.2],
          y: [0, 40, 0],
          x: [0, -15, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-1/3 -right-6 w-6 h-6 bg-purple-400 rounded-full blur-sm z-0"
      />

      {/* Pulsing ring around main image */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0, 0.1, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 border-2 border-blue-300 rounded-2xl pointer-events-none"
      />
    </div>
  );
};

function HomePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // State for history sidebar

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const scrollToTools = () => {
    const element = document.getElementById('tools-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const tools = [
    { 
      name: "PDF Converter", 
      desc: "Advanced file converter supporting multiple formats with batch processing and quality preservation", 
      route: "/PdfViewer",
      color: "green",
      icon: "🔄",
      previewBg: "bg-gradient-to-br from-green-50 to-blue-50",
      previewContent: (
        <div className="text-center p-4 w-full">
          <div className="inline-flex items-center gap-2 mb-3 bg-white/80 rounded-full px-4 py-2">
            <span className="text-lg">📄</span>
            <span className="text-sm font-semibold">PDF</span>
            <span className="text-gray-400">→</span>
            <span className="text-lg">🖼️</span>
            <span className="text-sm font-semibold">Images</span>
          </div>
          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
            <div className="bg-white rounded-lg p-2 shadow-sm border">
              <div className="text-xs text-gray-500">DOC</div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm border">
              <div className="text-xs text-gray-500">TXT</div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm border">
              <div className="text-xs text-gray-500">XLS</div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm border">
              <div className="text-xs text-gray-500">JPG</div>
            </div>
          </div>
        </div>
      ),
      features: ["Multiple formats", "Batch processing", "Quality preservation", "Fast conversion"]
    },
    { 
      name: "PDF Cropper", 
      desc: "Advanced tool for cropping PDF documents with precision control and batch processing capabilities", 
      route: "/crop",
      color: "purple",
      icon: "📄",
      previewBg: "bg-gradient-to-br from-purple-50 to-pink-50",
      previewContent: (
        <div className="text-center p-4 w-full">
          <div className="relative mx-auto w-32 h-40 bg-white border-2 border-dashed border-purple-300 rounded-lg mb-3">
            <div className="absolute inset-4 border-2 border-purple-500 rounded bg-purple-100/50 flex items-center justify-center">
              <span className="text-purple-600 text-sm">Crop Area</span>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✂️</span>
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-700">Drag to select area</div>
          <div className="text-xs text-gray-500 mt-1">Precision cropping tools</div>
        </div>
      ),
      features: ["Precision cropping", "Batch processing", "Multiple formats", "Quality preservation"]
    },
    { 
      name: "Flipkart Cropper", 
      desc: "Specialized tool optimized for Flipkart product labels with auto-formatting and order analytics", 
      route: "/FlipkartCropper",
      color: "yellow",
      icon: "🛒",
      previewBg: "bg-gradient-to-br from-yellow-50 to-orange-50",
      previewContent: (
        <div className="text-center p-4 w-full">
          <div className="mx-auto mb-3 w-24 h-8 bg-yellow-500 rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">Flipkart</span>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border mx-auto max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                <span className="text-yellow-600">📦</span>
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">Product Label</div>
                <div className="text-xs text-gray-500">Auto-formatting</div>
              </div>
            </div>
            <div className="flex gap-1">
              <div className="flex-1 bg-green-100 rounded p-1 text-center">
                <div className="text-xs text-green-800">Orders</div>
                <div className="text-sm font-bold">24</div>
              </div>
              <div className="flex-1 bg-blue-100 rounded p-1 text-center">
                <div className="text-xs text-blue-800">Revenue</div>
                <div className="text-sm font-bold">₹12K</div>
              </div>
            </div>
          </div>
        </div>
      ),
      features: ["Flipkart optimized", "Auto-formatting", "Order analytics", "Quick export"]
    },
    { 
      name: "Meesho Cropper", 
      desc: "Tailored tool for Meesho product image specifications with instant preview and sales insights", 
      route: "/MeshooCropper",
      color: "orange",
      icon: "📦",
      previewBg: "bg-gradient-to-br from-orange-50 to-red-50",
      previewContent: (
        <div className="text-center p-4 w-full">
          <div className="mx-auto mb-3 w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">M</span>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border mx-auto max-w-xs">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-pink-50 rounded p-2">
                <div className="text-xs text-pink-600">Images</div>
                <div className="text-sm font-bold">8/10</div>
              </div>
              <div className="bg-green-50 rounded p-2">
                <div className="text-xs text-green-600">Compliant</div>
                <div className="text-sm font-bold">✓</div>
              </div>
            </div>
            <div className="mt-2 bg-blue-50 rounded p-2">
              <div className="text-xs text-blue-600">Sales Trend</div>
              <div className="flex justify-center gap-1 mt-1">
                {[2, 4, 6, 8, 6, 4, 7].map((height, i) => (
                  <div key={i} className="w-2 bg-blue-500 rounded-t" style={{ height: `${height * 3}px` }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
      features: ["Meesho compliant", "Instant preview", "Sales analytics", "Quality check"]
    },
    { 
      name: "JioMart Cropper", 
      desc: "Comprehensive solution for JioMart product preparation with optimization and data analysis", 
      route: "/JioMartCropper",
      color: "red",
      icon: "🏪",
      previewBg: "bg-gradient-to-br from-red-50 to-blue-50",
      previewContent: (
        <div className="text-center p-4 w-full">
          <div className="mx-auto mb-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">J</span>
            </div>
            <div className="text-lg font-bold text-blue-600">JioMart</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border mx-auto max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Product Ready</div>
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Images:</span>
                <span className="text-green-600">Optimized</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Pricing:</span>
                <span className="text-green-600">Competitive</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Inventory:</span>
                <span className="text-green-600">In Stock</span>
              </div>
            </div>
          </div>
        </div>
      ),
      features: ["JioMart ready", "Smart optimization", "Order tracking", "Fast processing"]
    }
  ];

  const features = [
    {
      icon: <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>,
      title: "Lightning Fast Processing",
      description: "Process hundreds of files in seconds with our optimized algorithms and cloud infrastructure"
    },
    {
      icon: <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>,
      title: "Enterprise Security",
      description: "Your files are protected with bank-level encryption and secure cloud storage"
    },
    {
      icon: <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>,
      title: "Easy Integration",
      description: "Seamlessly integrate with your existing workflow and e-commerce platforms"
    }
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* History Sidebar */}
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isHistoryOpen ? 'ml-80' : 'ml-0'}`}>
        <Helmet>
          <title>Complete PDF & E-commerce Toolkit - Converter, Cropper & Analytics</title>
          <meta name="description" content="Professional PDF toolkit with converter, cropper, and e-commerce analytics. Optimized for Flipkart, Meesho, JioMart and more." />
          <meta name="keywords" content="PDF converter, PDF cropper, e-commerce tools, Flipkart, Meesho, JioMart, PDF tools, document processing" />
          <meta property="og:title" content="Complete PDF & E-commerce Toolkit - Converter, Cropper & Analytics" />
          <meta property="og:description" content="Professional PDF toolkit with file converter, cropper, and built-in e-commerce analytics. Optimized for Flipkart, Meesho, JioMart and more." />
          <meta property="og:type" content="website" />
          <link rel="canonical" href="https://yourdomain.com/" />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Complete PDF & E-commerce Toolkit",
              "description": "Professional PDF toolkit with converter, cropper, and e-commerce analytics",
              "url": "https://yourdomain.com/",
              "brand": {
                "@type": "Brand",
                "name": "PDF Toolkit Pro"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              }
            })}
          </script>
        </Helmet>
        
        <ScrollProgress />
        
        {/* Enhanced Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -top-10 -left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
            />
            <motion.div
              animate={{
                x: [0, -100, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -bottom-10 -right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
            />
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-25 flex flex-col md:flex-row items-center relative z-10">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="flex-1 text-center md:text-left"
            >
 <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6"
        >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-purple-800">
                Complete PDF &
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                E-commerce Toolkit
            </span>
        </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl"
              >
                Advanced PDF converter, intelligent cropper, and built-in e-commerce analytics. 
                Everything professionals and sellers need in one powerful toolkit.
              </motion.p>

              {/* Key Features Highlight */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {[
                  { icon: "🔄", text: "File Converter" },
                  { icon: "✂️", text: "Smart Cropper" },
                  { icon: "📊", text: "Order Analytics" }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-200"
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="font-semibold text-gray-700">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Supported Platforms */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
              >
                <p className="text-gray-500 mb-4 font-medium">Optimized for:</p>
                <PlatformShowcase />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={scrollToTools}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <span>Get Started Free</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Right side with multi-image showcase */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex-1 mt-16 md:mt-0 flex justify-center lg:justify-end relative"
            >
              <HeroImageShowcase />
            </motion.div>
          </div>
        </section>

        {/* Enhanced Tools Grid Section */}
        <section id="tools-section" className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Complete Tool Suite
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Specialized tools for every need - from basic conversions to advanced e-commerce optimization with built-in analytics
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tools.map((tool, index) => (
                <AnimatedToolCard key={tool.name} tool={tool} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Simple steps to optimize your e-commerce workflow
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Upload Your Files",
                  description: "Drag and drop your PDFs, images, or documents. Support for multiple formats.",
                  icon: "📤"
                },
                {
                  step: "02",
                  title: "Process & Analyze",
                  description: "Use our tools to convert, crop, and get order analytics all in one place.",
                  icon: "⚡"
                },
                {
                  step: "03",
                  title: "Download & Use",
                  description: "Get optimized files with analytics ready for your e-commerce platforms.",
                  icon: "📥"
                }
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="text-center p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl">
                    {item.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-300 mb-2">{item.step}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Why Choose Our Toolkit?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Built for professionals who demand quality and efficiency
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Stats Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-center mb-16"
            >
              Trusted by E-commerce Sellers
            </motion.h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: "1M+", label: "Files Processed" },
                { number: "50K+", label: "Happy Sellers" },
                { number: "10K+", label: "Businesses" },
                { number: "99.9%", label: "Uptime" }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <motion.h3
                    className="text-5xl font-bold mb-4"
                    whileHover={{ scale: 1.1 }}
                  >
                    {stat.number}
                  </motion.h3>
                  <p className="text-blue-100 text-lg font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Final CTA */}
        <section className="py-24 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl font-bold mb-8"
            >
              Ready to Boost Your Sales?
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="mb-12 text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed"
            >
              Get professional-quality product images with built-in order analytics optimized for all major e-commerce platforms.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row justify-center gap-6"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToTools}
                className="px-10 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 text-lg"
              >
                <span>Start Free Today</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="mt-8 text-blue-200 text-lg font-medium"
            >
              No credit card required • Free forever plan • Cancel anytime
            </motion.p>
          </div>
        </section>

        <Footer />
        <FloatingActionButton />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Helmet>
        <title>Complete PDF & E-commerce Toolkit - Converter, Cropper & Analytics</title>
        <meta name="description" content="Professional PDF toolkit with file converter, cropper, and built-in e-commerce analytics. Optimized for Flipkart, Meesho, JioMart and more." />
        <meta name="keywords" content="PDF converter, PDF cropper, e-commerce tools, Flipkart, Meesho, JioMart, PDF tools, document processing" />
        <meta property="og:title" content="Complete PDF & E-commerce Toolkit - Converter, Cropper & Analytics" />
        <meta property="og:description" content="Professional PDF toolkit with file converter, cropper, and built-in e-commerce analytics. Optimized for Flipkart, Meesho, JioMart and more." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Complete PDF & E-commerce Toolkit - Converter, Cropper & Analytics" />
        <meta name="twitter:description" content="Professional PDF toolkit with file converter, cropper, and built-in e-commerce analytics" />
        <link rel="canonical" href="https://yourdomain.com/" />
      </Helmet>
      
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/PdfViewer" element={<PdfViewer />} />
        <Route path="/FlipkartCropper" element={<FlipkartCropper />} />
        <Route path="/MeshooCropper" element={<MeshooCropper />} />
        <Route path="/JioMartCropper" element={<JioMartCropper />} />
        <Route path="/ContactUs" element={<ContactUs />} />
        <Route path="/crop" element={<PdfCropper />} />
      </Routes>
    </>
  );
}