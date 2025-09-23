import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ecommerceDropdownOpen, setEcommerceDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

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

  // Check if current path is one of the e-commerce croppers
  const isEcommercePage = [
    '/FlipkartCropper',
    '/JioMartCropper', 
    '/MeshooCropper',
    '/crop'  // Added the new crop route
  ].includes(location.pathname);

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  return (
    <>
      <motion.nav 
        initial="hidden"
        animate="visible"
        variants={navVariants}
        className={`w-full px-6 py-4 flex items-center justify-between fixed top-0 left-0 z-50 backdrop-blur-md transition-all duration-300 ${
          scrolled ? "bg-white/95 border-b border-gray-200 shadow-sm" : "bg-white/80"
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-xl font-bold flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SLC</span>
            </div>
            <span className="text-gray-900">shippinglabelcrop</span>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className={`transition-colors duration-300 px-3 py-2 font-medium ${
              location.pathname === "/" 
                ? "text-blue-600 underline underline-offset-4 decoration-2" 
                : "text-gray-700 hover:text-blue-600"
            }`}
          >
            Home
          </Link>
          <Link 
            to="/PdfViewer" 
            className={`transition-colors duration-300 px-3 py-2 font-medium ${
              location.pathname === "/PdfViewer" 
                ? "text-blue-600 underline underline-offset-4 decoration-2" 
                : "text-gray-700 hover:text-blue-600"
            }`}
          >
            File Converter
          </Link>
          
          {/* E-commerce Tools Dropdown - Now click-based */}
          <div className="relative" ref={dropdownRef}>
            <button 
              className={`transition-colors duration-300 px-3 py-2 flex items-center gap-1.5 font-medium ${
                isEcommercePage || ecommerceDropdownOpen
                  ? "text-blue-600 underline underline-offset-4 decoration-2" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
              onClick={() => setEcommerceDropdownOpen(!ecommerceDropdownOpen)}
            >
              Cropper Tools
              <svg 
                className={`w-4 h-4 transition-transform ${ecommerceDropdownOpen ? "rotate-180" : ""}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {ecommerceDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bg-white shadow-xl rounded-lg py-2 w-48 mt-2 border border-gray-100 left-1/2 transform -translate-x-1/2 z-50"
                >
                  <Link 
                    to="/crop" 
                    className={`block px-4 py-2 hover:bg-blue-50 transition-colors ${
                      location.pathname === "/crop" 
                        ? "text-blue-600 bg-blue-50" 
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                    onClick={() => setEcommerceDropdownOpen(false)}
                  >
                    Selection Cropper
                  </Link>
                  <Link 
                    to="/FlipkartCropper" 
                    className={`block px-4 py-2 hover:bg-blue-50 transition-colors ${
                      location.pathname === "/FlipkartCropper" 
                        ? "text-blue-600 bg-blue-50" 
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                    onClick={() => setEcommerceDropdownOpen(false)}
                  >
                    Flipkart Cropper
                  </Link>
                  <Link 
                    to="/JioMartCropper" 
                    className={`block px-4 py-2 hover:bg-blue-50 transition-colors ${
                      location.pathname === "/JioMartCropper" 
                        ? "text-blue-600 bg-blue-50" 
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                    onClick={() => setEcommerceDropdownOpen(false)}
                  >
                    JioMart Cropper
                  </Link>
                  <Link 
                    to="/MeshooCropper" 
                    className={`block px-4 py-2 hover:bg-blue-50 transition-colors ${
                      location.pathname === "/MeshooCropper" 
                        ? "text-blue-600 bg-blue-50" 
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                    onClick={() => setEcommerceDropdownOpen(false)}
                  >
                    Meshoo Cropper
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contact Us Link */}
          <Link 
            to="/ContactUs" 
            className={`transition-colors duration-300 px-3 py-2 font-medium ${
              location.pathname === "/ContactUs" 
                ? "text-blue-600 underline underline-offset-4 decoration-2" 
                : "text-gray-700 hover:text-blue-600"
            }`}
          >
            Contact Us
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <SignedOut>
            <SignInButton>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300 font-medium"
              >
                Sign In
              </motion.button>
            </SignInButton>
            <SignUpButton>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-md"
              >
                Sign Up
              </motion.button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-9 w-9",
                    userButtonPopoverCard: "bg-white border border-gray-200 shadow-xl"
                  }
                }}
              />
            </motion.div>
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-4 md:hidden">
          <button 
            className="text-gray-700 focus:outline-none p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl py-4 px-6 border-t border-gray-200"
            >
              <Link 
                to="/" 
                className={`block py-3 font-medium border-b border-gray-100 ${
                  location.pathname === "/" 
                    ? "text-blue-600" 
                    : "text-gray-700 hover:text-blue-600"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/PdfViewer" 
                className={`block py-3 font-medium border-b border-gray-100 ${
                  location.pathname === "/PdfViewer" 
                    ? "text-blue-600" 
                    : "text-gray-700 hover:text-blue-600"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                PDF Viewer
              </Link>
              
              <div className="py-3 border-b border-gray-100">
                <div className={`font-medium mb-2 ${
                  isEcommercePage 
                    ? "text-blue-600" 
                    : "text-gray-700"
                }`}>
                  E-commerce Tools
                </div>
                <div className="pl-4 space-y-2">
                  <Link 
                    to="/crop" 
                    className={`block py-2 ${
                      location.pathname === "/crop" 
                        ? "text-blue-600" 
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Cropper
                  </Link>
                  <Link 
                    to="/FlipkartCropper" 
                    className={`block py-2 ${
                      location.pathname === "/FlipkartCropper" 
                        ? "text-blue-600" 
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Flipkart Cropper
                  </Link>
                  <Link 
                    to="/JioMartCropper" 
                    className={`block py-2 ${
                      location.pathname === "/JioMartCropper" 
                        ? "text-blue-600" 
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    JioMart Cropper
                  </Link>
                  <Link 
                    to="/MeshooCropper" 
                    className={`block py-2 ${
                      location.pathname === "/MeshooCropper" 
                        ? "text-blue-600" 
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Meshoo Cropper
                  </Link>
                </div>
              </div>

              <Link 
                to="/ContactUs" 
                className={`block py-3 font-medium border-b border-gray-100 ${
                  location.pathname === "/ContactUs" 
                    ? "text-blue-600" 
                    : "text-gray-700 hover:text-blue-600"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </Link>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <SignedOut>
                  <SignInButton>
                    <button
                      className="w-full text-left py-3 text-gray-700 hover:text-blue-600 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button
                      className="w-full mt-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center gap-3">
                    <UserButton 
                      afterSignOutUrl="/" 
                      appearance={{
                        elements: {
                          userButtonAvatarBox: "h-8 w-8",
                          userButtonPopoverCard: "bg-white border border-gray-200"
                        }
                      }}
                    />
                    <span className="text-gray-700 font-medium">My Account</span>
                  </div>
                </SignedIn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Add padding to prevent content from being hidden under fixed navbar */}
      <div className="h-20"></div>
    </>
  );
}