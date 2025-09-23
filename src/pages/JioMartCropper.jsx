import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser, useClerk } from "@clerk/clerk-react";
import Cookies from "js-cookie";

// Initial settings for JioMart
const initialSettings = {
  courier_sort: true,
  sku_sort: true,
  soldBy_sort: true,
  add_date_on_top: true,
  keep_invoice: false,
  sku_order_count: true,
};

const JioMartCropper = () => {
  const fileInputRef = useRef(null);
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  // Load settings from cookie if exists
  const savedSettings = Cookies.get("jiomart_settings");
  const [settings, setSettings] = useState(
    savedSettings ? JSON.parse(savedSettings) : initialSettings
  );

  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(null);

  // Persist settings to cookie whenever it changes
  useEffect(() => {
    Cookies.set("jiomart_settings", JSON.stringify(settings), { expires: 7 });
  }, [settings]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).filter(
      (file) => file.type === "application/pdf"
    );
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      setError("");
    } else {
      setError("Please upload valid PDF files");
    }
  };

  const handleSettingToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!isLoaded) return; // Still loading auth state
    
    if (!user) {
      // Redirect to login if not authenticated
      openSignIn({
        redirectUrl: window.location.href,
      });
      return;
    }
    
    if (files.length === 0) return setError("Select at least one PDF");

    setIsProcessing(true);
    setError("");
    setProcessedFiles([]);
    setUploadProgress(0);
    setUploadSpeed(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("userId", user.id);
      formData.append("settings", JSON.stringify(settings));

      const startTime = Date.now();

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/jiomart`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);

            const elapsed = (Date.now() - startTime) / 1000; 
            const speed = (progressEvent.loaded / 1024 / elapsed).toFixed(2);
            setUploadSpeed(speed);
          },
        }
      );

      setProcessedFiles(res.data.outputs || []);
    } catch (err) {
      console.error(err);
      setError("Failed to process PDFs. Try again.");
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
      setUploadSpeed(null);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setProcessedFiles([]);
    setError("");
    setUploadProgress(0);
    setUploadSpeed(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>JioMart Label Cropper | Free PDF Invoice & Label Tool</title>
        <meta 
          name="description" 
          content="Free online JioMart cropper to crop, resize, and process PDF shipping labels and invoices for JioMart sellers. Simple and efficient." 
        />
        <meta 
          name="keywords" 
          content="JioMart label cropper, JioMart invoice tool, crop JioMart PDF, JioMart seller tools, e-commerce PDF crop, JioMart shipping label resize" 
        />
        <link rel="canonical" href="https://www.shippinglabelcrop.in/JioMartCropper" />

        <meta property="og:title" content="JioMart Label Cropper | Free PDF Tool" />
        <meta property="og:description" content="Free JioMart PDF label & invoice cropper. Process seller invoices with ease." />
        <meta property="og:url" content="https://www.shippinglabelcrop.in/JioMartCropper" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.shippinglabelcrop.in/preview-jiomart.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="JioMart Label Cropper | Free PDF Invoice Tool" />
        <meta name="twitter:description" content="Crop & process JioMart PDF invoices and labels instantly." />
        <meta name="twitter:image" content="https://www.shippinglabelcrop.in/preview-jiomart.png" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden transform transition-all duration-300">
          <div className="md:flex">
            {/* Left - Main Content */}
            <div className="md:w-2/3 p-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
                  <span className="bg-blue-500 text-white rounded-xl px-5 py-3 mr-3">
                    J
                  </span>
                  JioMart Label Cropper
                </h1>
                <button
                  onClick={() => navigate(0)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {processedFiles.length === 0 ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* File Upload Area */}
                  <div className="relative border-4 border-dashed border-blue-200 rounded-xl p-8 text-center bg-blue-50 hover:bg-blue-100 transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="file-upload"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mt-4 text-xl font-semibold text-gray-700">
                        Drag & drop PDFs here
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        or click to browse
                      </p>
                    </div>
                    {files.length > 0 && (
                      <p className="mt-4 text-sm font-medium text-blue-600">
                        {files.length} file(s) selected
                      </p>
                    )}
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border border-gray-200 rounded-xl divide-y divide-gray-200 max-h-72 overflow-y-auto shadow-inner"
                    >
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="truncate flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Upload Progress */}
                  {isProcessing && uploadProgress > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Uploading: {uploadProgress}%</span>
                        {uploadSpeed && <span>{uploadSpeed} KB/s</span>}
                      </div>
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg"
                    >
                      <p className="font-medium">{error}</p>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={isProcessing}
                      className="px-6 py-3 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing || files.length === 0}
                      className="px-6 py-3 rounded-full text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        "✨"
                      )}
                      Process {files.length} File(s)
                    </button>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
                    <p className="font-semibold">
                      ✅ {processedFiles.length} file(s) processed
                      successfully!
                    </p>
                    <p className="text-sm">
                      Your cropped labels are ready for download.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {processedFiles.map((file, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="p-4 bg-gray-50 rounded-lg flex items-center justify-between shadow-sm"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <a
                          href={`${import.meta.env.VITE_API_URL}${file.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          Download
                        </a>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Process More Files
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right - Settings Panel */}
            <div className="md:w-1/3 p-8 bg-blue-500 text-white rounded-r-2xl shadow-inner">
              <h2 className="text-xl font-bold mb-4">Processing Settings</h2>
              <p className="text-sm text-blue-100 mb-6">
                Configure how your JioMart labels will be cropped and sorted.
              </p>
              <div className="space-y-5">
                {Object.keys(settings).map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() => handleSettingToggle(key)}
                  >
                    <label
                      htmlFor={key}
                      className="flex-1 text-sm font-medium capitalize select-none text-blue-100 group-hover:text-white transition-colors cursor-pointer"
                    >
                      {key.replace(/_/g, " ")}
                    </label>
                    <input
                      id={key}
                      type="checkbox"
                      checked={settings[key]}
                      readOnly
                      className="h-5 w-5 text-blue-600 bg-blue-300 border-blue-600 rounded cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-12 border-t border-blue-400 pt-6">
                <h3 className="text-base font-semibold text-blue-100">
                  Files Summary
                </h3>
                <p className="mt-2 text-sm text-blue-100">
                  {files.length > 0
                    ? `You have ${files.length} file(s) ready to be processed.`
                    : "No files uploaded yet. Please select PDFs on the left."}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Platform Showcase */}
        <div className="mt-14">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Other Platforms</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <div 
              onClick={() => navigate("/FlipkartCropper")}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-gray-100 flex flex-col items-center"
            >
              <div className="bg-blue-50 p-4 rounded-xl mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">F</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Flipkart</h3>
            </div>
            
            <div 
              onClick={() => navigate("/MeshooCropper")}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-gray-100 flex flex-col items-center"
            >
              <div className="bg-orange-50 p-4 rounded-xl mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">M</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Meesho</h3>
            </div>
            
            <div 
              onClick={() => navigate("/JioMartCropper")}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-2 border-blue-500 flex flex-col items-center"
            >
              <div className="bg-red-50 p-4 rounded-xl mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">J</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">JioMart</h3>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JioMartCropper;