import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser, useClerk } from "@clerk/clerk-react";
import Cookies from "js-cookie";

const JioMartCropper = () => {
  const fileInputRef = useRef(null);
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  // Load settings from cookie if exists
  const savedSettings = Cookies.get("jiomart_settings");
  const [settings, setSettings] = useState(
    savedSettings
      ? JSON.parse(savedSettings)
      : {
          courier_sort: true,
          sku_sort: true,
          soldBy_sort: true,
          add_date_on_top: true,
          keep_invoice: false,
          sku_order_count: true,
        }
  );

  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Persist settings to cookie whenever it changes
  useEffect(() => {
    Cookies.set("jiomart_settings", JSON.stringify(settings), { expires: 7 });
  }, [settings]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
      setError("");
    } else {
      setError("Please upload valid PDF files");
    }
  };

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

  const clearAllFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoaded) return;
    if (!user) {
      openSignIn({ redirectUrl: window.location.href });
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
      setSuccessMessage(`Successfully processed ${res.data.outputs?.length || 0} file(s)!`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to process PDFs. Try again.");
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
    setSuccessMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      <Helmet>
        <title>JioMart Label Cropper | Professional Dashboard</title>
        <meta 
          name="description" 
          content="Professional JioMart shipping label and invoice cropping tool. Optimize your JioMart seller documents with precision and speed." 
        />
        <meta 
          name="keywords" 
          content="JioMart label cropper, JioMart invoice tool, crop JioMart PDF, JioMart seller tools" 
        />
        <link rel="canonical" href="https://www.shippinglabelcrop.in/JioMartCropper" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🏪</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">JioMart Label Cropper</h1>
              <p className="text-xs text-gray-500">Professional PDF cropping for sellers</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">✓ 5K+ Sellers</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">⚡ Enterprise</span>
          </div>
        </div>

        {/* Two Column Layout - SWAPPED: Upload on LEFT, Settings on RIGHT */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Upload & Processing Area (70%) */}
          <div className="lg:col-span-8">
            {processedFiles.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <form onSubmit={handleSubmit}>
                  {/* Drag & Drop Area */}
                  <div
                    className={`relative border-2 border-dashed m-4 rounded-lg transition-all duration-300 cursor-pointer
                      ${dragActive 
                        ? "border-red-500 bg-red-50" 
                        : "border-gray-300 bg-gray-50 hover:border-red-400 hover:bg-red-50/30"
                      }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    
                    <div className="flex flex-col items-center py-8 px-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300
                        ${dragActive ? "bg-red-200 scale-105" : "bg-red-100"}`}>
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        {dragActive ? "Drop PDFs here" : "Drag & drop PDF files"}
                      </p>
                      <p className="text-xs text-gray-500">or click to browse</p>
                      <div className="flex gap-2 mt-3">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">PDF only</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">Up to 50MB</span>
                      </div>
                    </div>
                  </div>

                  {/* File List with Process Button at Top */}
                  <AnimatePresence>
                    {files.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-4 mb-4 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                      >
                        {/* Header with Process Button */}
                        <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">{files.length} file(s)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={clearAllFiles}
                              className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition"
                            >
                              Clear
                            </button>
                            <button
                              type="submit"
                              disabled={isProcessing}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-1.5 ${
                                isProcessing 
                                  ? "bg-gray-400 cursor-not-allowed" 
                                  : "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-md"
                              }`}
                            >
                              {isProcessing ? (
                                <>
                                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Process All
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* File List */}
                        <div className="max-h-48 overflow-y-auto">
                          {files.map((file, index) => (
                            <div key={index} className="px-3 py-2 border-b border-gray-100 last:border-0 flex items-center justify-between hover:bg-white transition group">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <p className="text-xs text-gray-700 truncate flex-1">{file.name}</p>
                                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="ml-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Progress & Messages */}
                  {isProcessing && uploadProgress > 0 && (
                    <div className="mx-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      {uploadSpeed && <p className="text-xs text-gray-400 mt-1">{uploadSpeed} KB/s</p>}
                    </div>
                  )}

                  {error && (
                    <div className="mx-4 mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                      <p className="text-xs text-red-700">{error}</p>
                    </div>
                  )}

                  {successMessage && (
                    <div className="mx-4 mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                      <p className="text-xs text-green-700">{successMessage}</p>
                    </div>
                  )}

                  {/* Reset Button */}
                  {files.length > 0 && (
                    <div className="px-4 pb-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Reset All
                      </button>
                    </div>
                  )}
                </form>
              </div>
            ) : (
              /* Results Area */
              <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Processing Complete!</h3>
                      <p className="text-xs text-green-700">{processedFiles.length} file(s) ready</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {processedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-xs text-gray-700 truncate flex-1">{file.name}</p>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleReset}
                    className="mt-4 w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Process More Files
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Settings & Tips (30%) - MOVED TO RIGHT SIDE */}
          <div className="lg:col-span-4 space-y-4">
            {/* Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-red-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h2 className="font-semibold text-gray-800 text-sm">Processing Settings</h2>
                  <span className="text-xs text-gray-400 ml-auto">Auto-saved</span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {Object.entries(settings).map(([key, value]) => (
                  <div
                    key={key}
                    onClick={() => handleSettingToggle(key)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
                  >
                    <span className="text-xs text-gray-700 capitalize group-hover:text-gray-900">
                      {key.replace(/_/g, " ")}
                    </span>
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-red-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-xs mb-2">Quick Tips</h3>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-500">•</span>
                      <span>Upload multiple PDFs for batch processing</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-500">•</span>
                      <span>Settings apply to all files in batch</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-500">•</span>
                      <span>Files auto-deleted after processing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Navigation - Bottom */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">Other Platforms</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { name: "Flipkart", path: "/FlipkartCropper", icon: "🛒" },
              { name: "Meesho", path: "/MeshooCropper", icon: "📦" },
              { name: "PDF Cropper", path: "/crop", icon: "✂️" },
              { name: "PDF Converter", path: "/PdfViewer", icon: "🔄" }
            ].map((tool) => (
              <button
                key={tool.name}
                onClick={() => navigate(tool.path)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              >
                <span>{tool.icon}</span>
                <span>{tool.name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #ef4444;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default JioMartCropper;