import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser, useClerk } from "@clerk/clerk-react";
import Cookies from "js-cookie";
import { io } from "socket.io-client";

const FLIPKART_JOB_STATE_KEY = "flipkart_cropper_job_state";
const FLIPKART_TOOL_NAME = "FlipkartCropper";

const emptyJobState = {
  isProcessing: false,
  processedFiles: [],
  error: "",
  uploadProgress: 0,
  uploadSpeed: null,
  successMessage: "",
  processingStatus: "",
  totalSizeError: "",
  currentJobId: null,
};

const isBrowserReload = () => {
  if (typeof window === "undefined" || !window.performance) return false;
  const navigation = performance.getEntriesByType?.("navigation")?.[0];
  return navigation?.type === "reload";
};

const loadJobState = () => {
  if (typeof window === "undefined") return emptyJobState;

  if (isBrowserReload()) {
    sessionStorage.removeItem(FLIPKART_JOB_STATE_KEY);
    return emptyJobState;
  }

  try {
    const stored = sessionStorage.getItem(FLIPKART_JOB_STATE_KEY);
    return stored ? { ...emptyJobState, ...JSON.parse(stored) } : emptyJobState;
  } catch (error) {
    console.error("Failed to restore Flipkart job state:", error);
    return emptyJobState;
  }
};

let flipkartJobState = loadJobState();
let flipkartSocket = null;
let flipkartSocketApiUrl = "";
let flipkartSocketUserId = "";
let heartbeatInterval = null;
const jobStateListeners = new Set();

const persistJobState = () => {
  if (typeof window === "undefined") return;

  if (
    !flipkartJobState.isProcessing &&
    flipkartJobState.processedFiles.length === 0 &&
    !flipkartJobState.processingStatus &&
    !flipkartJobState.successMessage &&
    !flipkartJobState.error &&
    !flipkartJobState.totalSizeError
  ) {
    sessionStorage.removeItem(FLIPKART_JOB_STATE_KEY);
    return;
  }

  sessionStorage.setItem(FLIPKART_JOB_STATE_KEY, JSON.stringify(flipkartJobState));
};

const setFlipkartJobState = (patch) => {
  flipkartJobState = { ...flipkartJobState, ...patch };
  persistJobState();
  jobStateListeners.forEach((listener) => listener(flipkartJobState));
};

const resetFlipkartJobState = () => {
  flipkartJobState = { ...emptyJobState };
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(FLIPKART_JOB_STATE_KEY);
  }
  jobStateListeners.forEach((listener) => listener(flipkartJobState));
};

const applySocketJobUpdate = (job) => {
  console.log("SOCKET UPDATE:", job);
  const { currentJobId, isProcessing } = flipkartJobState;

  if (job.toolName && job.toolName !== FLIPKART_TOOL_NAME) {
    console.log("Socket update ignored - not a Flipkart job");
    return;
  }

  if (!currentJobId && job.toolName !== FLIPKART_TOOL_NAME) {
    console.log("Socket update ignored - Flipkart job id is not known yet");
    return;
  }

  if (currentJobId && job.jobId && job.jobId !== currentJobId) {
    console.log("Socket update ignored - not the current Flipkart job");
    return;
  }

  if (!isProcessing && !currentJobId && job.status !== "started") {
    console.log("Socket update ignored - no active Flipkart job");
    return;
  }

  switch (job.status) {
    case "started":
      setFlipkartJobState({
        isProcessing: true,
        currentJobId: job.jobId || currentJobId,
        processingStatus: "Job started...",
        successMessage: "Job started...",
      });
      break;

    case "processing":
      setFlipkartJobState({
        isProcessing: true,
        currentJobId: job.jobId || currentJobId,
        processingStatus: "Processing PDFs...",
        successMessage: "Processing PDFs...",
      });
      break;

    case "uploading":
      setFlipkartJobState({
        isProcessing: true,
        currentJobId: job.jobId || currentJobId,
        processingStatus: "Uploading to storage...",
        successMessage: "Uploading to storage...",
      });
      break;

    case "completed": {
      const outputs = job.outputs || [];
      setFlipkartJobState({
        processedFiles: outputs,
        processingStatus: "Completed!",
        successMessage: `Successfully processed ${outputs.length} file(s)!`,
        isProcessing: false,
        uploadProgress: 0,
        uploadSpeed: null,
        currentJobId: null,
      });
      setTimeout(() => setFlipkartJobState({ successMessage: "" }), 5000);
      setTimeout(() => setFlipkartJobState({ processingStatus: "" }), 3000);
      break;
    }

    case "error":
      if (job.error && !job.error.toLowerCase().includes("failed to process")) {
        setFlipkartJobState({ error: job.error });
      } else if (job.error && job.error.toLowerCase().includes("failed to process")) {
        console.log("Ignored generic processing error:", job.error);
      }
      setFlipkartJobState({
        processingStatus: "",
        isProcessing: false,
        uploadProgress: 0,
        uploadSpeed: null,
        currentJobId: null,
      });
      break;

    default:
      console.log("Unknown job status:", job.status);
  }
};

const ensureFlipkartSocket = (apiUrl, userId) => {
  if (!apiUrl || !userId) return;

  const shouldReconnect =
    !flipkartSocket ||
    flipkartSocketApiUrl !== apiUrl ||
    flipkartSocketUserId !== userId;

  if (shouldReconnect) {
    if (flipkartSocket) {
      flipkartSocket.disconnect();
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    flipkartSocketApiUrl = apiUrl;
    flipkartSocketUserId = userId;
    flipkartSocket = io(apiUrl, {
      transports: ["websocket"],
      withCredentials: true,
    });

    flipkartSocket.on("connect", () => {
      console.log("Socket connected");
      flipkartSocket.emit("register", userId);
    });

    flipkartSocket.on("history:update", applySocketJobUpdate);

    flipkartSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    heartbeatInterval = setInterval(() => {
      if (flipkartSocket?.connected) {
        flipkartSocket.emit("ping");
      }
    }, 20000);
  } else if (flipkartSocket.connected) {
    flipkartSocket.emit("register", userId);
  }
};

const subscribeToFlipkartJobState = (listener) => {
  jobStateListeners.add(listener);
  listener(flipkartJobState);
  return () => jobStateListeners.delete(listener);
};

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
  const [isProcessing, setIsProcessing] = useState(flipkartJobState.isProcessing);
  const [processedFiles, setProcessedFiles] = useState(flipkartJobState.processedFiles);
  const [error, setError] = useState(flipkartJobState.error);
  const [uploadProgress, setUploadProgress] = useState(flipkartJobState.uploadProgress);
  const [uploadSpeed, setUploadSpeed] = useState(flipkartJobState.uploadSpeed);
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState(flipkartJobState.successMessage);
  const [processingStatus, setProcessingStatus] = useState(flipkartJobState.processingStatus);
  const [totalSizeError, setTotalSizeError] = useState(flipkartJobState.totalSizeError);

  useEffect(() => {
    return subscribeToFlipkartJobState((state) => {
      setIsProcessing(state.isProcessing);
      setProcessedFiles(state.processedFiles);
      setError(state.error);
      setUploadProgress(state.uploadProgress);
      setUploadSpeed(state.uploadSpeed);
      setSuccessMessage(state.successMessage);
      setProcessingStatus(state.processingStatus);
      setTotalSizeError(state.totalSizeError);
    });
  }, []);

  // Socket connection
  useEffect(() => {
    ensureFlipkartSocket(import.meta.env.VITE_API_URL, user?.id);
  }, [user?.id]);

  // Persist settings to cookie whenever it changes
  useEffect(() => {
    Cookies.set("flipkart_settings", JSON.stringify(settings), { expires: 7 });
  }, [settings]);

  // Check total size of files
  const getTotalSize = (fileList) => {
    return fileList.reduce((total, file) => total + file.size, 0);
  };

  const isTotalSizeValid = (fileList) => {
    const totalSize = getTotalSize(fileList);
    const maxSize = 30 * 1024 * 1024; // 30MB in bytes
    return totalSize <= maxSize;
  };

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
    
    if (droppedFiles.length === 0) {
      setError("Please upload valid PDF files");
      return;
    }

    const currentFiles = [...files, ...droppedFiles];
    
    if (!isTotalSizeValid(currentFiles)) {
      setTotalSizeError(`Total file size exceeds 30MB limit. Current total: ${(getTotalSize(currentFiles) / (1024 * 1024)).toFixed(2)}MB`);
      setError("");
      return;
    }
    
    setTotalSizeError("");
    setFiles(currentFiles);
    setError("");
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).filter(
      (file) => file.type === "application/pdf"
    );
    
    if (newFiles.length === 0) {
      setError("Please upload valid PDF files");
      return;
    }

    const currentFiles = [...files, ...newFiles];
    
    if (!isTotalSizeValid(currentFiles)) {
      setTotalSizeError(`Total file size exceeds 30MB limit. Current total: ${(getTotalSize(currentFiles) / (1024 * 1024)).toFixed(2)}MB`);
      setError("");
      return;
    }
    
    setTotalSizeError("");
    setFiles(currentFiles);
    setError("");
  };

  const handleSettingToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    
    // Check if removing this file brings total size back under limit
    if (!isTotalSizeValid(newFiles) && newFiles.length > 0) {
      setTotalSizeError(`Total file size exceeds 30MB limit. Current total: ${(getTotalSize(newFiles) / (1024 * 1024)).toFixed(2)}MB`);
    } else {
      setTotalSizeError("");
    }
    
    setFiles(newFiles);
  };

  const clearAllFiles = () => {
    setFiles([]);
    setTotalSizeError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle file download - forces download instead of opening in browser
  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab if fetch fails
      window.open(fileUrl, '_blank');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoaded) return;
    if (!user) {
      openSignIn({ redirectUrl: window.location.href });
      return;
    }
    
    if (files.length === 0) {
      setError("Select at least one PDF");
      return;
    }
    
    // Final size check before submission
    if (!isTotalSizeValid(files)) {
      setTotalSizeError(`Total file size exceeds 30MB limit. Please remove some files.`);
      return;
    }

    setFlipkartJobState({
      isProcessing: true,
      error: "",
      totalSizeError: "",
      processedFiles: [],
      uploadProgress: 0,
      uploadSpeed: null,
      successMessage: "",
      processingStatus: "Starting upload...",
      currentJobId: null,
    });

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("userId", user.id);
      formData.append("settings", JSON.stringify(settings));

      const startTime = Date.now();

      // DON'T wait for response - socket will handle updates
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/flipkart`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 0, // No timeout - let socket handle it
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = (progressEvent.loaded / 1024 / elapsed).toFixed(2);
            setFlipkartJobState({ uploadProgress: percent, uploadSpeed: speed });
          },
        }
      );

      // DEBUG: Log the API response
      console.log("API RESPONSE:", res.data);

      if (res.data.toolName && res.data.toolName !== FLIPKART_TOOL_NAME) {
        console.log("Ignored response for different tool:", res.data.toolName);
        return;
      }

      const responseJobId = res.data.jobId || null;

      if (responseJobId) {
        setFlipkartJobState({ currentJobId: responseJobId });
      }
      
      // ✅ CORRECT: Check for outputs (not output)
      const outputs = res.data.outputs || [];
      
      if (outputs.length > 0) {
        setFlipkartJobState({
          processedFiles: outputs,
          successMessage: `Successfully processed ${outputs.length} file(s)!`,
          processingStatus: "Completed!",
          isProcessing: false,
          uploadProgress: 0,
          uploadSpeed: null,
          currentJobId: null,
        });
        setTimeout(() => setFlipkartJobState({ successMessage: "" }), 5000);
        setTimeout(() => setFlipkartJobState({ processingStatus: "" }), 3000);
      } else {
        console.log("No outputs received", res.data);
      }
      
    } catch (err) {
      console.error(err);
      // Check if error message contains "failed to process" and ignore if so
      const errorMsg = err.response?.data?.error || "Failed to process PDFs. Try again.";
      if (!errorMsg.toLowerCase().includes("failed to process")) {
        setFlipkartJobState({ error: errorMsg });
      }
      setFlipkartJobState({
        isProcessing: false,
        uploadProgress: 0,
        uploadSpeed: null,
        processingStatus: "",
        currentJobId: null,
      });
    }
  };

  const handleReset = () => {
    setFiles([]);
    resetFlipkartJobState();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Get total size of all files
  const totalSize = getTotalSize(files);
  const maxSizeMB = 30;
  const currentTotalMB = (totalSize / (1024 * 1024)).toFixed(2);
  const isOverLimit = !isTotalSizeValid(files);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50/30">
      <Helmet>
        <title>Flipkart Label Cropper | Professional Dashboard</title>
        <meta 
          name="description" 
          content="Professional Flipkart shipping label and invoice cropping tool. Optimize your Flipkart seller documents with precision and speed." 
        />
        <meta 
          name="keywords" 
          content="Flipkart label cropper, Flipkart invoice tool, crop Flipkart PDF, Flipkart seller tools" 
        />
        <link rel="canonical" href="https://www.shippinglabelcrop.in/FlipkartCropper" />
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
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🛒</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flipkart Label Cropper</h1>
              <p className="text-xs text-gray-500">Professional PDF cropping for sellers</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">✓ 10K+ Sellers</span>
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
                        ? "border-yellow-500 bg-yellow-50" 
                        : "border-gray-300 bg-gray-50 hover:border-yellow-400 hover:bg-yellow-50/30"
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
                        ${dragActive ? "bg-yellow-200 scale-105" : "bg-yellow-100"}`}>
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        {dragActive ? "Drop PDFs here" : "Drag & drop PDF files"}
                      </p>
                      <p className="text-xs text-gray-500">or click to browse</p>
                      <div className="flex gap-2 mt-3">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">PDF only</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">Max 30MB total</span>
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
                            <span className="text-xs text-gray-500">
                              Total: {currentTotalMB}MB / {maxSizeMB}MB
                            </span>
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
                              disabled={isProcessing || isOverLimit}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-1.5 ${
                                isProcessing || isOverLimit
                                  ? "bg-gray-400 cursor-not-allowed" 
                                  : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-md"
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
                                <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                        {/* Total size warning */}
                        {isOverLimit && (
                          <div className="px-3 py-2 bg-red-50 border-t border-red-200">
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Total size exceeds {maxSizeMB}MB limit. Please remove some files.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Progress & Messages */}
                  {isProcessing && (
                    <div className="mx-4 mb-4 space-y-2">
                      {uploadProgress > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          {uploadSpeed && <p className="text-xs text-gray-400 mt-1">{uploadSpeed} KB/s</p>}
                        </div>
                      )}
                      
                      {processingStatus && (
                        <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                          <p className="text-xs text-blue-700 flex items-center gap-2">
                            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {processingStatus}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="mx-4 mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                      <p className="text-xs text-red-700">{error}</p>
                    </div>
                  )}

                  {totalSizeError && !isProcessing && (
                    <div className="mx-4 mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                      <p className="text-xs text-red-700">{totalSizeError}</p>
                    </div>
                  )}

                  {successMessage && !isProcessing && (
                    <div className="mx-4 mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                      <p className="text-xs text-green-700">{successMessage}</p>
                    </div>
                  )}

                  {/* Reset Button */}
                  {files.length > 0 && !isProcessing && (
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
                        <button
                          onClick={() => handleDownload(file.url, file.name)}
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1 transition"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
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
              <div className="px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-yellow-500' : 'bg-gray-300'}`}>
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
                      <span>Total PDF size limit: 30MB</span>
                    </div>
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-500">•</span>
                      <span>Real-time status updates via WebSocket</span>
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
              { name: "Meesho", path: "/MeshooCropper", icon: "📦" },
              { name: "JioMart", path: "/JioMartCropper", icon: "🏪" },
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
          background: #fbbf24;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default FlipkartCropper;
