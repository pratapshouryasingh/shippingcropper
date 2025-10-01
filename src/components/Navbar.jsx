import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setToolsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isToolPage = [
    '/PdfViewer',
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

  return (
    <>
      <motion.nav 
        initial="hidden"
        animate="visible"
        variants={navVariants}
        className={`w-full px-6 lg:px-8 py-4 flex items-center justify-between fixed top-0 left-0 z-50 transition-all duration-500 ${
          scrolled 
            ? "bg-transparent backdrop-blur-xl border-b border-gray-100/20" 
            : "bg-transparent" // Always transparent background
        }`}
      >
        {/* Logo - Keep original colors */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-500">
              <span className="text-white font-bold text-lg">SLC</span>
            </div>
            {/* Animated glow effect */}
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl blur-sm -z-10"
            />
          </motion.div>
          <div className="flex flex-col">
            <motion.span 
              whileHover={{ x: 2 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              ShippingLabelCrop
            </motion.span>
            <span className="text-xs text-gray-500 font-medium tracking-wide">Professional PDF Toolkit</span>
          </div>
        </Link>

        {/* Desktop Navigation - Keep original styles */}
        <div className="hidden lg:flex items-center gap-1">
          <Link 
            to="/" 
            className={`relative px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 group mx-1 ${
              location.pathname === "/" 
                ? "text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg" // Lighter gradient
                : "text-gray-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80"
            }`}
          >
            <span className="relative z-10">Home</span>
            {location.pathname === "/" && (
              <motion.div 
                layoutId="nav-indicator"
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl -z-10" // Lighter gradient
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
          
          {/* Tools Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              className={`relative px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 group mx-1 flex items-center gap-2 ${
                isToolPage || toolsDropdownOpen
                  ? "text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg" // Lighter gradient
                  : "text-gray-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80"
              }`}
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
            >
              <span>Tools</span>
              <motion.svg 
                animate={{ rotate: toolsDropdownOpen ? 180 : 0 }}
                className="w-4 h-4 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
              {(isToolPage || toolsDropdownOpen) && (
                <motion.div 
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl -z-10" // Lighter gradient
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
            
            <AnimatePresence>
              {toolsDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                  className="absolute bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl py-4 w-64 mt-3 border border-gray-200/50 left-1/2 transform -translate-x-1/2 z-50"
                >
                  {/* PDF Tools Section */}
                  <div className="px-4 pb-2">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                      PDF Tools
                    </div>
                    <Link 
                      to="/PdfViewer" 
                      className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 mb-2 ${
                        location.pathname === "/PdfViewer" 
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200" 
                          : "hover:bg-gray-50/80 hover:scale-105"
                      }`}
                      onClick={() => setToolsDropdownOpen(false)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                        <span className="text-white text-lg">🔄</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 group-hover:text-blue-600">PDF Converter</div>
                        <div className="text-xs text-gray-500 mt-0.5">Convert multiple formats</div>
                      </div>
                    </Link>
                    <Link 
                      to="/crop" 
                      className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                        location.pathname === "/crop" 
                          ? "bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200" 
                          : "hover:bg-gray-50/80 hover:scale-105"
                      }`}
                      onClick={() => setToolsDropdownOpen(false)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                        <span className="text-white text-lg">✂️</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 group-hover:text-purple-600">PDF Cropper</div>
                        <div className="text-xs text-gray-500 mt-0.5">Precision cropping</div>
                      </div>
                    </Link>
                  </div>

                  {/* E-commerce Tools Section */}
                  <div className="px-4 pt-3 border-t border-gray-200/50">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                      <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                      E-commerce Tools
                    </div>
                    {[
                      { path: "/FlipkartCropper", name: "Flipkart", icon: "🛒", color: "from-yellow-500 to-yellow-600" },
                      { path: "/JioMartCropper", name: "JioMart", icon: "🏪", color: "from-blue-500 to-blue-600" },
                      { path: "/MeshooCropper", name: "Meesho", icon: "📦", color: "from-pink-500 to-pink-600" }
                    ].map((tool) => (
                      <Link 
                        key={tool.path}
                        to={tool.path} 
                        className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 mb-2 last:mb-0 ${
                          location.pathname === tool.path 
                            ? "bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200" 
                            : "hover:bg-gray-50/80 hover:scale-105"
                        }`}
                        onClick={() => setToolsDropdownOpen(false)}
                      >
                        <div className={`w-10 h-10 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all`}>
                          <span className="text-white text-lg">{tool.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 group-hover:text-gray-700">{tool.name} Cropper</div>
                          <div className="text-xs text-gray-500 mt-0.5">Platform optimized</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contact Us Link */}
          <Link 
            to="/ContactUs" 
            className={`relative px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 group mx-1 ${
              location.pathname === "/ContactUs" 
                ? "text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg" // Lighter gradient
                : "text-gray-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80"
            }`}
          >
            <span className="relative z-10">Contact Us</span>
            {location.pathname === "/ContactUs" && (
              <motion.div 
                layoutId="nav-indicator"
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl -z-10" // Lighter gradient
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        </div>

        {/* Desktop Auth Buttons - Lighter gradients */}
        <div className="hidden lg:flex items-center gap-3">
          <SignedOut>
            <SignInButton>
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-2xl font-semibold text-gray-700 hover:text-blue-700 transition-all duration-300 border-2 border-gray-300/80 hover:border-blue-400 bg-white/80 backdrop-blur-sm"
              >
                Sign In
              </motion.button>
            </SignInButton>
            <SignUpButton>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-2xl hover:shadow-3xl relative overflow-hidden group" // Lighter gradient
              >
                <span className="relative z-10">Get Started Free</span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
              </motion.button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3"
            >
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-12 w-12 rounded-2xl border-2 border-blue-200 shadow-lg",
                    userButtonPopoverCard: "bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl",
                    userButtonPopoverActionButton: "hover:bg-blue-50 rounded-xl transition-all duration-300"
                  }
                }}
              />
            </motion.div>
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 lg:hidden">
          <SignedOut>
            <SignInButton>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-xl font-medium text-gray-700 hover:text-blue-700 transition-all duration-300 border border-gray-300/80 hover:border-blue-400 text-sm bg-white/80 backdrop-blur-sm"
              >
                Sign In
              </motion.button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/" 
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-10 w-10 rounded-xl border border-gray-300"
                }
              }}
            />
          </SignedIn>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-300" // Lighter gradient
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, type: "spring" }}
              className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl shadow-2xl py-6 px-6 border-t border-gray-200/50 rounded-b-3xl"
            >
              {/* Navigation Links */}
              <div className="space-y-2 mb-6">
                {[
                  { path: "/", name: "Home" },
                  { path: "/ContactUs", name: "Contact Us" }
                ].map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    className={`block py-4 px-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                      location.pathname === item.path 
                        ? "text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg" // Lighter gradient
                        : "text-gray-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Tools Section */}
                <div className="py-4 px-4">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Tools</div>
                  <div className="space-y-3">
                    {[
                      { path: "/PdfViewer", name: "PDF Converter", icon: "🔄", color: "from-green-500 to-green-600" },
                      { path: "/crop", name: "PDF Cropper", icon: "✂️", color: "from-purple-500 to-purple-600" },
                      { path: "/FlipkartCropper", name: "Flipkart Cropper", icon: "🛒", color: "from-yellow-500 to-yellow-600" },
                      { path: "/JioMartCropper", name: "JioMart Cropper", icon: "🏪", color: "from-blue-500 to-blue-600" },
                      { path: "/MeshooCropper", name: "Meesho Cropper", icon: "📦", color: "from-pink-500 to-pink-600" }
                    ].map((tool) => (
                      <Link 
                        key={tool.path}
                        to={tool.path} 
                        className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-300 ${
                          location.pathname === tool.path 
                            ? "bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200" 
                            : "hover:bg-gray-50/80"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <span className="text-white text-lg">{tool.icon}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{tool.name}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Auth Section */}
              <div className="pt-4 border-t border-gray-200/50">
                <SignedOut>
                  <div className="flex gap-3">
                    <SignInButton>
                      <button
                        className="flex-1 text-center py-4 text-gray-700 border-2 border-gray-300/80 rounded-2xl font-semibold hover:border-blue-400 hover:text-blue-700 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton>
                      <button
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-4 rounded-2xl font-semibold shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300" // Lighter gradient
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </button>
                    </SignUpButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                    <UserButton 
                      afterSignOutUrl="/" 
                      appearance={{
                        elements: {
                          userButtonAvatarBox: "h-12 w-12 rounded-xl"
                        }
                      }}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">My Account</div>
                      <div className="text-sm text-gray-600">Manage your tools</div>
                    </div>
                  </div>
                </SignedIn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Remove the padding to let home section start from top */}
    </>
  );
}