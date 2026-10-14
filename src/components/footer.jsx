import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-black text-zinc-300 border-t border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-white text-black font-black rounded flex items-center justify-center text-sm">
                SLC
              </div>
              <span className="text-white font-extrabold text-lg tracking-tight">Shipping Label Cropper</span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-5">
              High-performance, minimal PDF cropping and label conversion tools built for online sellers.
            </p>
            <div className="flex space-x-3 text-zinc-400">
              <a href="#" className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all">
                <i className="fab fa-twitter text-sm"></i>
              </a>
              <a href="#" className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all">
                <i className="fab fa-facebook-f text-sm"></i>
              </a>
              <a href="#" className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all">
                <i className="fab fa-linkedin-in text-sm"></i>
              </a>
            </div>
          </div>

          {/* E-commerce Tools */}
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">E-commerce Tools</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/FlipkartCropper" className="hover:text-white transition-colors">
                  Flipkart Label Cropper
                </Link>
              </li>
              <li>
                <Link to="/MeshooCropper" className="hover:text-white transition-colors">
                  Meesho Label Cropper
                </Link>
              </li>
              <li>
                <Link to="/JioMartCropper" className="hover:text-white transition-colors">
                  JioMart Label Cropper
                </Link>
              </li>
              <li>
                <Link to="/crop" className="hover:text-white transition-colors">
                  Selection Cropper
                </Link>
              </li>
              <li>
                <Link to="/PdfViewer" className="hover:text-white transition-colors">
                  File Converter
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/ContactUs" className="hover:text-white transition-colors">Contact Support</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">Admin Panel</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Support</h4>
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
              Have feedback or need custom features for your store? Contact our support team.
            </p>
            <Link
              to="/ContactUs"
              className="inline-block px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded font-semibold text-xs tracking-wider uppercase transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-900 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-400 gap-4">
          <p>© {new Date().getFullYear()} Shipping Label Cropper. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/ContactUs" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
            <span>Developed by <a href="https://pratap-portfolio-beta.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:text-white underline font-medium">Pratap</a></span>
          </div>
        </div>
      </div>
    </footer>
  );
}