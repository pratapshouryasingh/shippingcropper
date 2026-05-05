import { useState, useEffect, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import * as pdfjsLib from "pdfjs-dist/webpack";
import axios from "axios";
import { useUser, useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { io } from "socket.io-client";
import { createSessionJobStore } from "../utils/sessionJobStore";
import { 
  FiUpload, FiDownload, FiCrop, FiX, FiChevronLeft, 
  FiChevronRight, FiInfo, FiCheck, FiAlertCircle, FiLoader, FiFile,
  FiGrid, FiTrash2, FiFileText, FiPlus, FiSliders, FiCornerUpRight, FiFolder
} from "react-icons/fi";

const PDF_CROPPER_TOOL_NAME = "FrontendCropper";

const cropperJobInitialState = {
  isCropping: false,
  error: null,
  success: null,
  uploadProgress: 0,
  uploadSpeed: null,
  processedFiles: [],
  totalSizeError: "",
  currentJobId: null,
};

const cropperJobStore = createSessionJobStore(
  "pdf_cropper_job_state",
  cropperJobInitialState
);

let cropperSocket = null;
let cropperSocketApiUrl = "";
let cropperSocketUserId = "";

const applyCropperSocketUpdate = (job) => {
  console.log("PdfCropper received socket update:", job);
  const { currentJobId } = cropperJobStore.getState();

  if (job.toolName && job.toolName !== PDF_CROPPER_TOOL_NAME) {
    console.log("Socket update ignored - not a PDF cropper job");
    return;
  }

  if (!currentJobId || job.jobId !== currentJobId) {
    console.log("Socket update ignored - not for current job or no current job");
    return;
  }

  if (job.status === "completed" && job.outputs && job.outputs.length > 0) {
    cropperJobStore.setState({
      processedFiles: job.outputs,
      success: `Done! ${job.outputs.length} file(s) ready to download.`,
      isCropping: false,
      uploadProgress: 0,
      uploadSpeed: null,
      currentJobId: null,
    });
    setTimeout(() => cropperJobStore.setState({ success: null }), 5000);
    return;
  }

  if (job.status === "error") {
    cropperJobStore.setState({
      error: job.error || "Processing failed",
      isCropping: false,
      uploadProgress: 0,
      uploadSpeed: null,
      currentJobId: null,
    });
    return;
  }

  if (job.status === "processing") {
    cropperJobStore.setState({ success: "Processing your PDFs..." });
  } else if (job.status === "uploading") {
    cropperJobStore.setState({ success: "Uploading results to cloud..." });
  }
};

const ensureCropperSocket = (apiUrl, userId) => {
  if (!apiUrl || !userId) return;

  const shouldReconnect =
    !cropperSocket ||
    cropperSocketApiUrl !== apiUrl ||
    cropperSocketUserId !== userId;

  if (shouldReconnect) {
    if (cropperSocket) {
      cropperSocket.disconnect();
    }

    cropperSocketApiUrl = apiUrl;
    cropperSocketUserId = userId;
    cropperSocket = io(apiUrl, {
      transports: ["websocket"],
      withCredentials: true,
    });

    cropperSocket.on("connect", () => {
      console.log("Socket connected in PdfCropper");
      cropperSocket.emit("register", userId);
    });

    cropperSocket.on("history:update", applyCropperSocketUpdate);

    cropperSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  } else if (cropperSocket.connected) {
    cropperSocket.emit("register", userId);
  }
};

const PdfCropper = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const addMoreInputRef = useRef(null);
  
  const [pdfDocs, setPdfDocs] = useState([]);
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [cropBox, setCropBox] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCropping, setIsCropping] = useState(cropperJobStore.getState().isCropping);
  const [error, setError] = useState(cropperJobStore.getState().error);
  const [success, setSuccess] = useState(cropperJobStore.getState().success);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pagePreviews, setPagePreviews] = useState([]);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [selectionOpacity, setSelectionOpacity] = useState(0.25);
  const [uploadProgress, setUploadProgress] = useState(cropperJobStore.getState().uploadProgress);
  const [uploadSpeed, setUploadSpeed] = useState(cropperJobStore.getState().uploadSpeed);
  const [processedFiles, setProcessedFiles] = useState(cropperJobStore.getState().processedFiles);
  const [totalSizeError, setTotalSizeError] = useState(cropperJobStore.getState().totalSizeError);
  const [currentJobId, setCurrentJobId] = useState(cropperJobStore.getState().currentJobId);
  
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  const currentPdfDoc = pdfDocs[currentPdfIndex];

  useEffect(() => {
    return cropperJobStore.subscribe((state) => {
      setIsCropping(state.isCropping);
      setError(state.error);
      setSuccess(state.success);
      setUploadProgress(state.uploadProgress);
      setUploadSpeed(state.uploadSpeed);
      setProcessedFiles(state.processedFiles);
      setTotalSizeError(state.totalSizeError);
      setCurrentJobId(state.currentJobId);
    });
  }, []);

  // Debug logger for processedFiles
  useEffect(() => {
    console.log("ProcessedFiles state updated:", processedFiles);
    console.log("ProcessedFiles count:", processedFiles.length);
    if (processedFiles.length > 0) {
      console.log("First file URL:", processedFiles[0].url);
    }
  }, [processedFiles]);

  // Socket connection
  useEffect(() => {
    ensureCropperSocket(import.meta.env.VITE_API_URL, user?.id);
  }, [user?.id]);

  // Check total size of files
  const getTotalSize = (fileList) => {
    return fileList.reduce((total, file) => total + file.size, 0);
  };

  const isTotalSizeValid = (fileList) => {
    const totalSize = getTotalSize(fileList);
    const maxSize = 30 * 1024 * 1024;
    return totalSize <= maxSize;
  };

  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const width = Math.min(800, containerRef.current.offsetWidth - 40);
        const height = Math.min(800, window.innerHeight - 300);
        setContainerSize({ width, height });
      }
    };
    
    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);
    return () => window.removeEventListener("resize", updateContainerSize);
  }, []);

  useEffect(() => {
    if (!files || files.length === 0) {
      setPdfDocs([]);
      setCurrentPdfIndex(0);
      setPageNum(1);
      setTotalPages(0);
      setCropBox(null);
      setPagePreviews([]);
      cropperJobStore.setState({
        uploadProgress: 0,
        uploadSpeed: null,
        processedFiles: [],
        currentJobId: null,
      });
      return;
    }
    
    const loadPdfs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const pdfPromises = files.map(async (file) => {
          const typedArray = new Uint8Array(await file.arrayBuffer());
          return await pdfjsLib.getDocument({ data: typedArray }).promise;
        });
        
        const loadedPdfs = await Promise.all(pdfPromises);
        setPdfDocs(loadedPdfs);
        setCurrentPdfIndex(0);
        
        if (loadedPdfs.length > 0) {
          setTotalPages(loadedPdfs[0].numPages);
          setPageNum(1);
          generatePagePreviews(loadedPdfs[0]);
        }
      } catch (err) {
        setError("Failed to load PDFs. Please try other files.");
        console.error(err);
      }
      setIsLoading(false);
    };
    loadPdfs();
  }, [files]);

  useEffect(() => {
    if (pdfDocs.length > 0 && currentPdfIndex < pdfDocs.length) {
      const currentDoc = pdfDocs[currentPdfIndex];
      setTotalPages(currentDoc.numPages);
      setPageNum(1);
      generatePagePreviews(currentDoc);
      setCropBox(null);
    }
  }, [currentPdfIndex, pdfDocs]);

  const generatePagePreviews = async (pdf) => {
    const previews = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        
        previews.push({
          pageNum: i,
          dataUrl: canvas.toDataURL()
        });
      } catch (err) {
        console.error(`Error generating preview for page ${i}:`, err);
      }
    }
    setPagePreviews(previews);
  };

  useEffect(() => {
    if (!currentPdfDoc || containerSize.width === 0) return;
    const renderPage = async () => {
      try {
        const page = await currentPdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        const scaledViewport = page.getViewport({ scale: 1.0 });
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        await page.render({ 
          canvasContext: ctx, 
          viewport: scaledViewport 
        }).promise;

        if (!cropBox) {
          setCropBox({
            x: scaledViewport.width * 0.1,
            y: scaledViewport.height * 0.1,
            width: scaledViewport.width * 0.6,
            height: scaledViewport.height * 0.6,
          });
        }
      } catch (err) {
        setError("Failed to render PDF page.");
        console.error(err);
      }
    };
    renderPage();
  }, [currentPdfDoc, pageNum, containerSize]);

  const handleCrop = async () => {
    if (!isLoaded) return;
    if (!user) {
      openSignIn({ redirectUrl: window.location.href });
      return;
    }
    if (!files || files.length === 0 || !cropBox || !currentPdfDoc) return;
    
    if (!isTotalSizeValid(files)) {
      setTotalSizeError(`Total file size exceeds 30MB limit. Please remove some files.`);
      return;
    }

    cropperJobStore.setState({
      isCropping: true,
      error: null,
      totalSizeError: "",
      success: "Starting crop process...",
      uploadProgress: 0,
      uploadSpeed: null,
      processedFiles: [],
      currentJobId: null,
    });

    try {
      const canvas = canvasRef.current;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      let normalizedCoords = {
        x: cropBox.x / canvasWidth,
        y: 1 - ((cropBox.y + cropBox.height) / canvasHeight),
        width: cropBox.width / canvasWidth,
        height: cropBox.height / canvasHeight,
        page: pageNum
      };

      normalizedCoords.x = Math.max(0, Math.min(1, normalizedCoords.x));
      normalizedCoords.y = Math.max(0, Math.min(1, normalizedCoords.y));
      normalizedCoords.width = Math.max(0.01, Math.min(1 - normalizedCoords.x, normalizedCoords.width));
      normalizedCoords.height = Math.max(0.01, Math.min(1 - normalizedCoords.y, normalizedCoords.height));

      const cropData = {
        crop: normalizedCoords,
        applyTo: "all"
      };

      const formData = new FormData();
      
      files.forEach(file => {
        formData.append("files", file);
      });
      
      formData.append("settings", JSON.stringify(cropData));
      formData.append("userId", user.id);

      const startTime = Date.now();

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/cropper`,
        formData,
        { 
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            const elapsed = (Date.now() - startTime) / 1000; 
            const speed = (progressEvent.loaded / 1024 / elapsed).toFixed(2);
            cropperJobStore.setState({ uploadProgress: percent, uploadSpeed: speed });
          }
        }
      );

      console.log("API Response:", res.data);

      if (res.data.toolName && res.data.toolName !== PDF_CROPPER_TOOL_NAME) {
        console.log("Ignored response for different tool:", res.data.toolName);
        return;
      }
      
      // Store job ID for socket tracking
      if (res.data.jobId) {
        cropperJobStore.setState({ currentJobId: res.data.jobId });
        console.log("Setting current job ID:", res.data.jobId);
      }
      
      // Get outputs directly from API response
      const outputs = res.data.outputs || [];
      
      if (outputs && outputs.length > 0) {
        console.log("Outputs found in API response:", outputs.length);
        console.log("First output URL:", outputs[0].url);
        
        // Set processed files immediately from API response
        cropperJobStore.setState({
          processedFiles: outputs,
          success: `Done! ${outputs.length} file(s) ready to download.`,
          isCropping: false,
          uploadProgress: 0,
          uploadSpeed: null,
          currentJobId: null,
        });
        
        // Auto clear success message after 5 seconds
        setTimeout(() => cropperJobStore.setState({ success: null }), 5000);
      } else {
        console.log("No outputs in API response, waiting for socket update for job:", res.data.jobId);
        cropperJobStore.setState({ success: "Processing completed! Waiting for download links..." });
        // Don't set isCropping to false yet - wait for socket
        // Socket will handle setting isCropping to false when completed
      }
      
    } catch (err) {
      console.error("Crop error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Crop operation failed. Please try again.";
      cropperJobStore.setState({
        error: errorMsg,
        isCropping: false,
        uploadProgress: 0,
        uploadSpeed: null,
        currentJobId: null,
      });
    }
  };

  const handleDownload = async (fileUrl, fileName) => {
    try {
      console.log("Downloading:", fileUrl, fileName);
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
      window.open(fileUrl, '_blank');
    }
  };

  const handleDownloadAll = () => {
    processedFiles.forEach((file) => {
      handleDownload(file.url, file.name);
    });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    cropperJobStore.setState({
      error: null,
      success: null,
      totalSizeError: "",
      uploadProgress: 0,
      uploadSpeed: null,
      processedFiles: [],
      currentJobId: null,
    });
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === "application/pdf"
    );
    
    if (droppedFiles.length === 0) {
      setError("Please upload valid PDF files.");
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
  }, [files]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type === "application/pdf"
    );
    
    if (selectedFiles.length === 0) {
      setError("Please select valid PDF files.");
      return;
    }
    
    const currentFiles = [...files, ...selectedFiles];
    
    if (!isTotalSizeValid(currentFiles)) {
      setTotalSizeError(`Total file size exceeds 30MB limit. Current total: ${(getTotalSize(currentFiles) / (1024 * 1024)).toFixed(2)}MB`);
      setError("");
      return;
    }
    
    setTotalSizeError("");
    setFiles(currentFiles);
    e.target.value = null;
  };

  const removeFile = (index = null) => {
    if (index === null) {
      setFiles([]);
      setPdfDocs([]);
      setCurrentPdfIndex(0);
      cropperJobStore.setState({
        totalSizeError: "",
        processedFiles: [],
        currentJobId: null,
      });
    } else {
      const newFiles = files.filter((_, i) => i !== index);
      const newPdfDocs = pdfDocs.filter((_, i) => i !== index);
      setFiles(newFiles);
      setPdfDocs(newPdfDocs);
      
      if (!isTotalSizeValid(newFiles) && newFiles.length > 0) {
        setTotalSizeError(`Total file size exceeds 30MB limit. Current total: ${(getTotalSize(newFiles) / (1024 * 1024)).toFixed(2)}MB`);
      } else {
        setTotalSizeError("");
      }
      
      if (currentPdfIndex >= newFiles.length) {
        setCurrentPdfIndex(Math.max(0, newFiles.length - 1));
      }
    }
    
    setCropBox(null);
    cropperJobStore.setState({
      error: null,
      success: null,
      uploadProgress: 0,
      uploadSpeed: null,
    });
    setPageNum(1);
    setTotalPages(0);
    setPagePreviews([]);
  };

  const addMoreFiles = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type === "application/pdf"
    );
    
    if (selectedFiles.length === 0) return;
    
    const currentFiles = [...files, ...selectedFiles];
    
    if (!isTotalSizeValid(currentFiles)) {
      setTotalSizeError(`Total file size exceeds 30MB limit. Current total: ${(getTotalSize(currentFiles) / (1024 * 1024)).toFixed(2)}MB`);
      setError("");
      return;
    }
    
    setFiles(currentFiles);
    e.target.value = null;
  };

  const goToPreviousPage = () => {
    if (pageNum > 1) {
      setPageNum(pageNum - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNum < totalPages) {
      setPageNum(pageNum + 1);
    }
  };

  const goToPreviousPdf = () => {
    if (currentPdfIndex > 0) {
      setCurrentPdfIndex(currentPdfIndex - 1);
    }
  };

  const goToNextPdf = () => {
    if (currentPdfIndex < files.length - 1) {
      setCurrentPdfIndex(currentPdfIndex + 1);
    }
  };

  const handlePageSelect = (pageNumber) => {
    setPageNum(pageNumber);
  };

  const handlePdfSelect = (index) => {
    setCurrentPdfIndex(index);
  };

  const handleReset = () => {
    setFiles([]);
    cropperJobStore.reset();
    setCropBox(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const calculateNormalizedCoordinates = () => {
    if (!cropBox || !canvasRef.current) return null;
    
    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;
    
    return {
      x: (cropBox.x / canvasWidth).toFixed(3),
      y: (cropBox.y / canvasHeight).toFixed(3),
      width: (cropBox.width / canvasWidth).toFixed(3),
      height: (cropBox.height / canvasHeight).toFixed(3)
    };
  };

  const normalizedCoordsDisplay = calculateNormalizedCoordinates();

  const formatFileName = (name) => {
    if (name.length > 30) {
      return name.substring(0, 18) + '...' + name.substring(name.length - 12);
    }
    return name;
  };

  const totalSize = getTotalSize(files);
  const maxSizeMB = 30;
  const currentTotalMB = (totalSize / (1024 * 1024)).toFixed(2);
  const isOverLimit = files.length > 0 && !isTotalSizeValid(files);
  const hasProcessedFiles = processedFiles.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-2 px-4">
      <Helmet>
        <title>PDF Cropper Pro | Precision Crop Tool</title>
        <meta name="description" content="Crop PDFs online for free with precise controls. Upload multiple files, crop once, apply to all." />
        <link rel="canonical" href="https://www.shippinglabelcrop.in/PdfCropper" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-4xl mx-auto"
        ref={containerRef}
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="relative px-6 py-8 bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-48 bg-white/10 rounded-full -mr-32 -mt-16" />
            <div className="absolute bottom-0 left-0 w-48 h-40 bg-purple-500/20 rounded-full -ml-24 -mb-12" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <h1 className="text-2xl md:text-2xl font-bold tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                    <FiCrop className="text-white text-xl" />
                  </div>
                  PDF Cropper Pro
                </h1>
                <p className="text-indigo-100 mt-1 max-w-xl text-sm md:text-base">
                  Smart batch cropping — define one area and apply to every page of all your PDFs.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  className="group px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2 text-sm font-medium backdrop-blur-sm"
                >
                  <FiInfo className="text-lg" />
                  <span className="hidden sm:inline">{showInfoPanel ? "Hide coords" : "Show coords"}</span>
                </button>
                <button
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="group px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2 text-sm font-medium"
                >
                  <FiGrid className="text-lg" />
                  <span className="hidden sm:inline">{showThumbnails ? "Hide pages" : "Show pages"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div
              className={`relative transition-all duration-300 rounded-2xl border-2 border-dashed ${
                files.length > 0 
                  ? "border-indigo-200 bg-indigo-50/30" 
                  : "border-indigo-300 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 hover:from-indigo-100/40 hover:to-purple-100/40"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-20 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <FiUpload className="text-3xl text-indigo-600" />
                  </div>
                  <p className="text-gray-700 text-lg font-medium">Drag & drop PDFs here</p>
                  <p className="text-gray-500 text-sm mt-1 mb-4">or</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <FiFolder className="text-lg" />
                    Browse files
                  </button>
                  <p className="text-xs text-gray-400 mt-4">Supports multiple PDFs, max 30MB total</p>
                </div>
              ) : (
                <>
                  {isLoading ? (
                    <div className="flex flex-col items-center py-16">
                      <div className="relative w-16 h-8">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                      </div>
                      <p className="mt-4 text-gray-600 font-medium">Loading PDF documents...</p>
                    </div>
                  ) : (
                    <div className="p-5 space-y-5">
                      {/* File Queue Section */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <FiFileText className="text-indigo-500" />
                            <span>Queue · {files.length} PDF(s)</span>
                            <span className="text-xs text-gray-500 ml-2">
                              Total: {currentTotalMB}MB / {maxSizeMB}MB
                            </span>
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => addMoreInputRef.current?.click()}
                              className="text-sm px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <FiPlus size={14} />
                              Add more
                            </button>
                            <button
                              onClick={() => removeFile()}
                              className="text-sm px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <FiTrash2 size={14} />
                              Clear all
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {files.map((file, index) => (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${
                                currentPdfIndex === index 
                                  ? "bg-indigo-100 border-indigo-400 shadow-sm ring-1 ring-indigo-300" 
                                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                              }`}
                              onClick={() => handlePdfSelect(index)}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FiFile className={`flex-shrink-0 ${currentPdfIndex === index ? "text-indigo-600" : "text-gray-500"}`} />
                                <span className={`truncate text-sm ${currentPdfIndex === index ? "font-medium text-indigo-800" : "text-gray-700"}`}>
                                  {formatFileName(file.name)}
                                </span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                              >
                                <FiX size={14} />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                        {isOverLimit && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <FiAlertCircle />
                              Total size exceeds {maxSizeMB}MB limit. Please remove some files.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* PDF Navigation */}
                      {files.length > 1 && (
                        <div className="flex items-center justify-between gap-4 p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                          <button
                            onClick={goToPreviousPdf}
                            disabled={currentPdfIndex <= 0}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            <FiChevronLeft />
                          </button>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 px-4 py-1.5 rounded-full">
                            <span className="text-indigo-600">{currentPdfIndex + 1}</span>
                            <span>/</span>
                            <span>{files.length}</span>
                            <span className="ml-1 text-gray-500 hidden sm:inline">active file</span>
                          </div>
                          <button
                            onClick={goToNextPdf}
                            disabled={currentPdfIndex >= files.length - 1}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            <FiChevronRight />
                          </button>
                        </div>
                      )}

                      {/* Progress Bar */}
                      {isCropping && uploadProgress > 0 && (
                        <motion.div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Cropping & processing...</span>
                            <span className="font-mono">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          {uploadSpeed && <p className="text-xs text-gray-400 mt-2">{uploadSpeed} KB/s</p>}
                        </motion.div>
                      )}

                      {/* Processing Status Message */}
                      {isCropping && uploadProgress === 0 && (
                        <motion.div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                          <FiLoader className="animate-spin text-blue-600 mx-auto mb-2" size={24} />
                          <p className="text-sm text-blue-700">Processing your PDFs. This may take a few moments...</p>
                        </motion.div>
                      )}

                      {/* Page Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                          <button onClick={goToPreviousPage} disabled={pageNum <= 1} className="p-2 rounded-md hover:bg-white disabled:opacity-40 transition">
                            <FiChevronLeft size={16} />
                          </button>
                          <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">Pg {pageNum} / {totalPages}</span>
                          <button onClick={goToNextPage} disabled={pageNum >= totalPages} className="p-2 rounded-md hover:bg-white disabled:opacity-40 transition">
                            <FiChevronRight size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <FiSliders size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-600">Zoom 100%</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <span className="text-xs text-gray-500">Overlay opacity</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectionOpacity * 100}
                            onChange={(e) => setSelectionOpacity(e.target.value / 100)}
                            className="w-24 h-1"
                          />
                          <span className="text-xs w-8 text-gray-500">{Math.round(selectionOpacity * 100)}%</span>
                        </div>
                      </div>

                      {/* Page Thumbnails */}
                      {showThumbnails && pagePreviews.length > 0 && (
                        <div className="overflow-x-auto pb-2">
                          <div className="flex gap-3 p-2 bg-gray-50/80 rounded-xl">
                            {pagePreviews.map((preview) => (
                              <button
                                key={preview.pageNum}
                                onClick={() => handlePageSelect(preview.pageNum)}
                                className={`flex-shrink-0 transition-all rounded-lg overflow-hidden border-2 ${
                                  pageNum === preview.pageNum ? "border-indigo-500 shadow-md scale-105" : "border-transparent opacity-80 hover:opacity-100"
                                }`}
                              >
                                <img src={preview.dataUrl} alt={`page ${preview.pageNum}`} className="h-20 w-auto" />
                                <div className="text-[11px] text-center bg-white/80 py-0.5 font-medium">{preview.pageNum}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Canvas with Crop Box */}
                      <div className="relative bg-white rounded-xl shadow-md border border-gray-200 p-3 flex justify-center overflow-auto">
                        <div className="relative inline-block">
                          <canvas ref={canvasRef} className="rounded-lg shadow-sm border border-gray-300" />
                          {cropBox && (
                            <Rnd
                              bounds="parent"
                              size={{ width: cropBox.width, height: cropBox.height }}
                              position={{ x: cropBox.x, y: cropBox.y }}
                              onDragStop={(e, d) => {
                                const maxX = canvasRef.current.width - cropBox.width;
                                const maxY = canvasRef.current.height - cropBox.height;
                                const newX = Math.max(0, Math.min(d.x, maxX));
                                const newY = Math.max(0, Math.min(d.y, maxY));
                                setCropBox({ ...cropBox, x: newX, y: newY });
                              }}
                              onResizeStop={(e, dir, ref, delta, pos) => {
                                const maxWidth = canvasRef.current.width - pos.x;
                                const maxHeight = canvasRef.current.height - pos.y;
                                const newWidth = Math.max(50, Math.min(ref.offsetWidth, maxWidth));
                                const newHeight = Math.max(50, Math.min(ref.offsetHeight, maxHeight));
                                setCropBox({ width: newWidth, height: newHeight, x: pos.x, y: pos.y });
                              }}
                              minWidth={50}
                              minHeight={50}
                              style={{
                                border: "2px solid #4f46e5",
                                background: `rgba(79, 70, 229, ${selectionOpacity})`,
                                borderRadius: 8,
                                boxShadow: "0 0 0 9999px rgba(0,0,0,0.1)",
                                zIndex: 20
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-4 justify-center pt-2">
                        <button 
                          onClick={handleCrop} 
                          disabled={isCropping || !cropBox || isOverLimit}
                          className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md font-medium"
                        >
                          {isCropping ? (
                            <><FiLoader className="animate-spin" /> Processing {files.length} file(s)...</>
                          ) : (
                            <><FiCrop className="text-lg" /> Apply Crop to All PDFs</>
                          )}
                        </button>
                        
                        {hasProcessedFiles && (
                          <button 
                            onClick={handleDownloadAll}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition shadow-md"
                          >
                            <FiDownload /> Download All ({processedFiles.length})
                          </button>
                        )}
                      </div>

                      {/* RESULTS SECTION - Individual Download Buttons */}
                      {hasProcessedFiles && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-xl border border-green-200 overflow-hidden shadow-sm mt-4"
                        >
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-green-200">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <FiCheck className="text-white" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-gray-900">Processing Complete!</h3>
                                <p className="text-xs text-green-700">{processedFiles.length} file(s) ready to download</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {processedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FiFile className="text-green-600 flex-shrink-0" />
                                    <p className="text-xs text-gray-700 truncate flex-1">
                                      {file.name || `cropped_file_${idx + 1}.pdf`}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleDownload(file.url, file.name)}
                                    className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1 transition"
                                  >
                                    <FiDownload size={12} />
                                    Download
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={handleReset}
                              className="mt-4 w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center justify-center gap-2"
                            >
                              <FiUpload size={14} />
                              Process More Files
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Info Panel */}
                      {showInfoPanel && cropBox && normalizedCoordsDisplay && !hasProcessedFiles && (
                        <motion.div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <div className="flex items-center gap-2 text-indigo-700 mb-3">
                            <FiCornerUpRight />
                            <span className="font-semibold">Crop dimensions (normalized 0-1 coordinates)</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-gray-50 p-2 rounded-lg"><span className="text-gray-500">X:</span> <strong>{normalizedCoordsDisplay.x}</strong></div>
                            <div className="bg-gray-50 p-2 rounded-lg"><span className="text-gray-500">Y:</span> <strong>{normalizedCoordsDisplay.y}</strong></div>
                            <div className="bg-gray-50 p-2 rounded-lg"><span className="text-gray-500">Width:</span> <strong>{normalizedCoordsDisplay.width}</strong></div>
                            <div className="bg-gray-50 p-2 rounded-lg"><span className="text-gray-500">Height:</span> <strong>{normalizedCoordsDisplay.height}</strong></div>
                          </div>
                          <p className="text-xs text-gray-400 mt-3 text-center">
                            Coordinates are normalized relative to page dimensions (0 = left/top, 1 = right/bottom)
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Error and Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div className="mt-5 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 flex gap-3 shadow-sm">
                  <FiAlertCircle className="text-red-500 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {totalSizeError && !isCropping && (
                <motion.div className="mt-5 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 flex gap-3 shadow-sm">
                  <FiAlertCircle className="text-red-500 mt-0.5" />
                  <p className="text-sm">{totalSizeError}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {success && !hasProcessedFiles && (
                <motion.div className="mt-5 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl text-emerald-700 flex gap-3 shadow-sm">
                  <FiCheck className="text-emerald-500 mt-0.5" />
                  <p className="text-sm">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Steps Footer */}
          <div className="px-6 py-5 bg-gray-50/80 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">1</div> Upload PDFs (max 30MB total)</div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</div> Adjust crop box</div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">3</div> Crop all files</div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">4</div> Download instantly</div>
            </div>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileSelect} multiple className="hidden" />
        <input ref={addMoreInputRef} type="file" accept="application/pdf" onChange={addMoreFiles} multiple className="hidden" />
      </motion.div>
    </div>
  );
};

export default PdfCropper;
