import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function Navbar({ onToggleHistory }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ecommerceDropdownOpen, setEcommerceDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setEcommerceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  const isEcommercePage = [
    "/FlipkartCropper",
    "/JioMartCropper",
    "/MeshooCropper",
    "/crop"
  ].includes(location.pathname);

  const tools = [
    { path: "/crop", name: "Selection Cropper", icon: "✂️", description: "Custom crop any PDF page" },
    { path: "/FlipkartCropper", name: "Flipkart Cropper", icon: "🛍️", description: "Flipkart shipping label cropping" },
    { path: "/MeshooCropper", name: "Meesho Cropper", icon: "🏪", description: "Meesho label & invoice crop" },
    { path: "/JioMartCropper", name: "JioMart Cropper", icon: "📦", description: "JioMart product label crop" }
  ];

  return (
    <>
      <nav
        className={`w-full px-4 md:px-8 py-3 flex items-center justify-between fixed top-0 left-0 z-50 transition-all duration-200 bg-white border-b border-zinc-900 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-black text-white rounded-md flex items-center justify-center font-black text-sm shadow-sm group-hover:bg-zinc-800 transition-colors">
            SLC
          </div>
          <div className="flex flex-col">
            <span className="text-black font-extrabold text-base leading-tight tracking-tight">Shipping Label Cropper</span>
            <span className="text-[11px] text-zinc-500 font-medium tracking-wide uppercase hidden sm:block">Smart PDF Tools for E-commerce Sellers</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1.5">
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
              location.pathname === "/"
                ? "text-black bg-zinc-100 font-bold border-b-2 border-black"
                : "text-zinc-700 hover:text-black hover:bg-zinc-100"
            }`}
          >
            Home
          </Link>

          <Link
            to="/PdfViewer"
            className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
              location.pathname === "/PdfViewer"
                ? "text-black bg-zinc-100 font-bold border-b-2 border-black"
                : "text-zinc-700 hover:text-black hover:bg-zinc-100"
            }`}
          >
            File Converter
          </Link>

          {/* E-commerce Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isEcommercePage || ecommerceDropdownOpen
                  ? "text-black bg-zinc-100 font-bold border-b-2 border-black"
                  : "text-zinc-700 hover:text-black hover:bg-zinc-100"
              }`}
              onClick={() => setEcommerceDropdownOpen(!ecommerceDropdownOpen)}
            >
              <span>E-commerce Tools</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${ecommerceDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {ecommerceDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-black w-64 overflow-hidden z-50 p-1.5"
                >
                  {tools.map((tool) => (
                    <Link
                      key={tool.path}
                      to={tool.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                        location.pathname === tool.path
                          ? "bg-black text-white font-medium"
                          : "text-zinc-800 hover:bg-zinc-100"
                      }`}
                      onClick={() => setEcommerceDropdownOpen(false)}
                    >
                      <span className="text-lg">{tool.icon}</span>
                      <div>
                        <div className="text-sm font-semibold">{tool.name}</div>
                        <div className={`text-xs ${location.pathname === tool.path ? "text-zinc-300" : "text-zinc-500"}`}>{tool.description}</div>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navbar History Button */}
          <button
            onClick={() => onToggleHistory && onToggleHistory()}
            className="px-3.5 py-2 rounded-md text-sm font-medium text-zinc-800 hover:text-black hover:bg-zinc-100 flex items-center gap-2 transition-colors cursor-pointer"
            title="View History"
          >
            <i className="fas fa-history text-black"></i>
            <span>History</span>
          </button>

          {/* Contact Us */}
          <Link
            to="/ContactUs"
            className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
              location.pathname === "/ContactUs"
                ? "text-black bg-zinc-100 font-bold border-b-2 border-black"
                : "text-zinc-700 hover:text-black hover:bg-zinc-100"
            }`}
          >
            Contact Us
          </Link>
        </div>

        {/* Auth Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-semibold text-zinc-800 hover:text-black hover:bg-zinc-100 rounded-md transition-colors border border-transparent">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-4 py-2 text-sm font-semibold text-white bg-black hover:bg-zinc-800 rounded-md transition-colors shadow-sm border border-black">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-2 bg-zinc-100 border border-zinc-300 rounded-md px-2 py-1">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8",
                  },
                }}
              />
            </div>
          </SignedIn>
        </div>

        {/* Mobile Buttons */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => onToggleHistory && onToggleHistory()}
            className="p-2 text-black hover:bg-zinc-100 rounded-md transition-colors text-sm flex items-center gap-1 font-semibold"
            title="History"
          >
            <i className="fas fa-history text-base"></i>
          </button>
          <button
            className="text-black focus:outline-none p-2 hover:bg-zinc-100 rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              ref={mobileMenuRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-black shadow-2xl overflow-hidden"
            >
              <div className="p-4 space-y-1">
                <Link
                  to="/"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md font-medium text-sm transition-colors ${
                    location.pathname === "/" ? "bg-black text-white" : "text-zinc-800 hover:bg-zinc-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>🏠</span> Home
                </Link>

                <Link
                  to="/PdfViewer"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md font-medium text-sm transition-colors ${
                    location.pathname === "/PdfViewer" ? "bg-black text-white" : "text-zinc-800 hover:bg-zinc-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>📄</span> File Converter
                </Link>

                <button
                  onClick={() => {
                    if (onToggleHistory) onToggleHistory();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-medium text-sm text-zinc-800 hover:bg-zinc-100 transition-colors text-left"
                >
                  <i className="fas fa-history text-black text-base"></i> Job History
                </button>

                <div className="pt-2">
                  <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    E-commerce Croppers
                  </div>
                  {tools.map((tool) => (
                    <Link
                      key={tool.path}
                      to={tool.path}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm transition-colors ${
                        location.pathname === tool.path
                          ? "bg-black text-white font-medium"
                          : "text-zinc-800 hover:bg-zinc-100"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{tool.icon}</span>
                      <span>{tool.name}</span>
                    </Link>
                  ))}
                </div>

                <Link
                  to="/ContactUs"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md font-medium text-sm transition-colors ${
                    location.pathname === "/ContactUs" ? "bg-black text-white" : "text-zinc-800 hover:bg-zinc-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>📧</span> Contact Us
                </Link>

                <SignedOut>
                  <div className="pt-3 border-t border-zinc-200 flex flex-col gap-2">
                    <SignInButton mode="modal">
                      <button className="w-full text-center py-2.5 text-zinc-800 font-semibold rounded-md border border-zinc-300 hover:bg-zinc-100 transition-colors text-sm">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="w-full text-center py-2.5 bg-black text-white font-semibold rounded-md hover:bg-zinc-800 transition-colors text-sm border border-black">
                        Get Started Free
                      </button>
                    </SignUpButton>
                  </div>
                </SignedOut>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      {/* Spacer */}
      <div className="h-16"></div>
    </>
  );
}