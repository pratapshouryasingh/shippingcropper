import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ecommerceDropdownOpen, setEcommerceDropdownOpen] = useState(false);
  const [hoveredTool, setHoveredTool] = useState(null);
  const location = useLocation();
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setEcommerceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Check if current path is one of the e-commerce croppers
  const isEcommercePage = [
    '/FlipkartCropper',
    '/JioMartCropper', 
    '/MeshooCropper',
    '/crop'
  ].includes(location.pathname);

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  const tools = [
    { path: "/crop", name: "Selection Cropper", icon: "✂️", description: "Custom crop any area" },
    { path: "/FlipkartCropper", name: "Flipkart Cropper", icon: "🛍️", description: "Flipkart label cropping" },
    { path: "/JioMartCropper", name: "JioMart Cropper", icon: "📦", description: "JioMart label cropping" },
    { path: "/MeshooCropper", name: "Meshoo Cropper", icon: "🏪", description: "Meshoo label cropping" }
  ];

  return (
    <>
      <motion.nav 
        initial="hidden"
        animate="visible"
        variants={navVariants}
        className={`w-full px-4 md:px-8 py-3 md:py-4 flex items-center justify-between fixed top-0 left-0 z-50 backdrop-blur-xl transition-all duration-300 ${
          scrolled ? "bg-white/95 border-b border-gray-200 shadow-lg" : "bg-white/80"
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300">
              <span className="text-white font-bold text-sm md:text-base">SLC</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-bold text-base md:text-lg">ShippingLabelCrop</span>
            <span className="text-xs text-gray-500 hidden sm:block">Smart PDF Cropping Tools</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link 
            to="/" 
            className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              location.pathname === "/" 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            }`}
          >
            Home
            {location.pathname === "/" && (
              <motion.div layoutId="activeNav" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </Link>
          
          <Link 
            to="/PdfViewer" 
            className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              location.pathname === "/PdfViewer" 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            }`}
          >
            File Converter
            {location.pathname === "/PdfViewer" && (
              <motion.div layoutId="activeNav" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </Link>
          
          {/* E-commerce Tools Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                isEcommercePage || ecommerceDropdownOpen
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
              onClick={() => setEcommerceDropdownOpen(!ecommerceDropdownOpen)}
              onMouseEnter={() => setEcommerceDropdownOpen(true)}
              onMouseLeave={() => setEcommerceDropdownOpen(false)}
            >
              <span>🛠️</span>
              E-commerce Tools
              <motion.svg 
                animate={{ rotate: ecommerceDropdownOpen ? 180 : 0 }}
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
            
            <AnimatePresence>
              {ecommerceDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 w-64 overflow-hidden"
                  onMouseEnter={() => setEcommerceDropdownOpen(true)}
                  onMouseLeave={() => setEcommerceDropdownOpen(false)}
                >
                  <div className="p-2">
                    {tools.map((tool, index) => (
                      <Link 
                        key={index}
                        to={tool.path} 
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                          location.pathname === tool.path 
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => setEcommerceDropdownOpen(false)}
                        onMouseEnter={() => setHoveredTool(tool.name)}
                        onMouseLeave={() => setHoveredTool(null)}
                      >
                        <span className="text-xl">{tool.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{tool.name}</div>
                          <div className="text-xs text-gray-500">{tool.description}</div>
                        </div>
                        {location.pathname === tool.path && (
                          <motion.div
                            layoutId="activeTool"
                            className="w-1.5 h-1.5 bg-blue-600 rounded-full"
                          />
                        )}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-500 text-center">
                      ✨ AI-powered label cropping for all platforms
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contact Us - Now at the end */}
          <Link 
            to="/ContactUs" 
            className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              location.pathname === "/ContactUs" 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            }`}
          >
            Contact Us
            {location.pathname === "/ContactUs" && (
              <motion.div layoutId="activeNav" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-700 px-5 py-2 rounded-xl hover:bg-gray-100 transition-all duration-300 font-medium"
              >
                Sign In
              </motion.button>
            </SignInButton>
            <SignUpButton mode="modal">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                Get Started
              </motion.button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-1"
            >
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-9 w-9",
                    userButtonPopoverCard: "bg-white border border-gray-200 shadow-xl rounded-xl"
                  }
                }}
              />
            </motion.div>
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/" 
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8"
                }
              }}
            />
          </SignedIn>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="text-gray-700 focus:outline-none p-2 hover:bg-gray-100 rounded-xl transition-all duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              ref={mobileMenuRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden absolute top-full left-0 right-0 bg-white shadow-2xl rounded-b-2xl border-t border-gray-100 overflow-hidden"
            >
              <div className="max-h-[80vh] overflow-y-auto">
                {/* User Info for Mobile */}
                <SignedIn>
                  <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <UserButton afterSignOutUrl="/" />
                      <div>
                        <p className="font-semibold text-gray-900">My Account</p>
                        <p className="text-xs text-gray-500">Manage your files</p>
                      </div>
                    </div>
                  </div>
                </SignedIn>

                <div className="p-4 space-y-1">
                  <Link 
                    to="/" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      location.pathname === "/" 
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600" 
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-xl">🏠</span>
                    Home
                  </Link>
                  
                  <Link 
                    to="/PdfViewer" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      location.pathname === "/PdfViewer" 
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600" 
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-xl">📄</span>
                    File Converter
                  </Link>
                  
                  {/* Mobile E-commerce Tools Section */}
                  <div className="mt-2 pt-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      E-commerce Tools
                    </div>
                    <div className="space-y-1">
                      {tools.map((tool, index) => (
                        <Link 
                          key={index}
                          to={tool.path} 
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            location.pathname === tool.path 
                              ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600" 
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="text-xl">{tool.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium">{tool.name}</div>
                            <div className="text-xs text-gray-500">{tool.description}</div>
                          </div>
                          {location.pathname === tool.path && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Contact Us - Last in mobile menu */}
                  <Link 
                    to="/ContactUs" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      location.pathname === "/ContactUs" 
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600" 
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-xl">📧</span>
                    Contact Us
                  </Link>
                </div>

                {/* Mobile Auth Buttons */}
                <SignedOut>
                  <div className="p-4 pt-2 border-t border-gray-100 bg-gray-50">
                    <SignInButton mode="modal">
                      <button
                        className="w-full text-center py-3 text-gray-700 hover:text-blue-600 font-medium rounded-xl transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        className="w-full mt-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started Free
                      </button>
                    </SignUpButton>
                  </div>
                </SignedOut>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Add padding to prevent content from being hidden under fixed navbar */}
      <div className="h-16 md:h-20"></div>
    </>
  );
}