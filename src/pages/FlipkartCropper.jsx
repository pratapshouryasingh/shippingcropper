import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser, useClerk } from "@clerk/clerk-react";
import Cookies from "js-cookie";

const FlipkartCropper = () => {
  const fileInputRef = useRef(null);
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  // Load settings from cookie if exists
  const savedSettings = Cookies.get("flipkart_settings");
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
  const [isDragging, setIsDragging] = useState(false);

  // Persist settings to cookie whenever it changes
  useEffect(() => {
    Cookies.set("flipkart_settings", JSON.stringify(settings), { expires: 7 });
  }, [settings]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const newFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
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

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("userId", user.id);
      formData.append("settings", JSON.stringify(settings));

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/flipkart`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
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
    }
  };

  const handleReset = () => {
    setFiles([]);
    setProcessedFiles([]);
    setError("");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const settingLabels = {
    courier_sort: "Sort by Courier",
    sku_sort: "Sort by SKU", 
    soldBy_sort: "Sort by Seller",
    add_date_on_top: "Add Date on Top",
    keep_invoice: "Keep Invoice Copy",
    sku_order_count: "Show Order Count"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4 sm:px-6 lg:px-8 mt-20">
      <Helmet>
        <title>Flipkart Label Cropper | Free PDF Processing Tool</title>
        <meta name="description" content="Crop and process Flipkart shipping labels and invoices easily." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header - Compact */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-xl font-bold text-white">F</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Flipkart Label Cropper</h1>
          <p className="text-gray-600">Process Flipkart PDF labels instantly</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Compact */}
          <div className="lg:col-span-2">
            <motion.div className="bg-white rounded-2xl shadow-xl p-6">
              {processedFiles.length === 0 ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Compact File Upload */}
                  <div 
                    className={`relative border-3 border-dashed rounded-xl p-8 text-center transition-all ${
                      isDragging ? 'border-blue-500 bg-blue-50' : 'border-blue-200 bg-blue-50/50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-gray-700 font-medium mb-2">Drop PDFs or click to browse</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                      >
                        Choose Files
                      </button>
                    </div>
                  </div>

                  {/* File List - Compact */}
                  <AnimatePresence>
                    {files.length > 0 && (
                      <motion.div className="space-y-2">
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {files.map((file, index) => (
                            <motion.div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                  <span className="text-red-600 font-bold text-xs">PDF</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Progress Bar - Compact */}
                  {isProcessing && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Uploading...</span>
                        <span className="text-gray-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error Message - Compact */}
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Action Buttons - Compact */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={isProcessing}
                      className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing || files.length === 0}
                      className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        `Process ${files.length} File${files.length !== 1 ? 's' : ''}`
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Results - Compact */
                <div className="space-y-6">
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-green-800 font-medium">
                        Processed {processedFiles.length} file{processedFiles.length !== 1 ? 's' : ''} successfully!
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {processedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <span className="text-green-600 font-bold text-xs">PDF</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{file.name}</span>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_URL}${file.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 transition-colors"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleReset}
                      className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      Process More Files
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Settings Panel - Compact */}
          <div className="lg:col-span-1">
            <motion.div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-xl p-6 text-white h-fit">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className="text-lg font-bold">Settings</h2>
              </div>

              <div className="space-y-3 mb-6">
                {Object.keys(settings).map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-yellow-500/30 transition-colors"
                    onClick={() => handleSettingToggle(key)}
                  >
                    <span className="text-sm font-medium flex-1">{settingLabels[key]}</span>
                    <div className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors ${
                      settings[key] ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      <span className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform ${
                        settings[key] ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Files Summary - Compact */}
              <div className="pt-4 border-t border-yellow-500/30">
                <div className="text-center">
                  <p className="text-yellow-100 text-sm mb-1">Files Ready</p>
                  <p className="text-2xl font-bold">{files.length}</p>
                  <p className="text-yellow-100 text-xs mt-1">
                    {files.length > 0 ? 'Ready to process' : 'Upload files to start'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Platform Showcase - Compact */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Other Platforms</h3>
          <div className="flex justify-center gap-4">
            {[
              { name: "Flipkart", path: "/FlipkartCropper", color: "from-yellow-400 to-yellow-600", active: true },
              { name: "Meesho", path: "/MeshooCropper", color: "from-pink-500 to-pink-700" },
              { name: "JioMart", path: "/JioMartCropper", color: "from-blue-500 to-blue-700" }
            ].map((platform, index) => (
              <div
                key={platform.name}
                onClick={() => !platform.active && navigate(platform.path)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  platform.active 
                    ? 'bg-yellow-500 text-white shadow-lg' 
                    : 'bg-white text-gray-700 shadow hover:shadow-md'
                }`}
              >
                <div className={`w-6 h-6 rounded bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white">{platform.name.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlipkartCropper;