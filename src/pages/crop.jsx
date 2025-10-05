import { useState, useEffect, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import * as pdfjsLib from "pdfjs-dist/webpack";
import axios from "axios";
import { useUser, useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { 
  FiUpload, FiDownload, FiCrop, FiX, FiChevronLeft, 
  FiChevronRight, FiInfo, FiCheck, FiAlertCircle, FiLoader, FiFile,
  FiGrid, FiType, FiTrash2, FiFileText, FiEye, FiEyeOff,
  FiPlus, FiMinus
} from "react-icons/fi";

const PdfCropper = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [pdfDocs, setPdfDocs] = useState([]);
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [cropBox, setCropBox] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [originalPageSize, setOriginalPageSize] = useState({ width: 0, height: 0 });
  const [pagePreviews, setPagePreviews] = useState([]);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [selectionOpacity, setSelectionOpacity] = useState(0.2);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [downloadUrls, setDownloadUrls] = useState([]);
  const [downloadFilenames, setDownloadFilenames] = useState([]);
  
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  // Get current PDF doc
  const currentPdfDoc = pdfDocs[currentPdfIndex];

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

  // Load PDFs when files change
  useEffect(() => {
    if (!files || files.length === 0) {
      setPdfDocs([]);
      setCurrentPdfIndex(0);
      setPageNum(1);
      setTotalPages(0);
      setCropBox(null);
      setPagePreviews([]);
      setUploadProgress(0);
      setUploadSpeed(null);
      setDownloadUrls([]);
      setDownloadFilenames([]);
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
        
        // Generate previews for first PDF
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

  // When current PDF index changes, update the displayed PDF
  useEffect(() => {
    if (pdfDocs.length > 0 && currentPdfIndex < pdfDocs.length) {
      const currentDoc = pdfDocs[currentPdfIndex];
      setTotalPages(currentDoc.numPages);
      setPageNum(1);
      generatePagePreviews(currentDoc);
      setCropBox(null); // Reset crop box when switching PDFs
    }
  }, [currentPdfIndex, pdfDocs]);

  // Generate thumbnails for all pages
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

  // Render PDF page
  useEffect(() => {
    if (!currentPdfDoc || containerSize.width === 0) return;
    const renderPage = async () => {
      try {
        const page = await currentPdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Store original page size for coordinate conversion
        setOriginalPageSize({ width: viewport.width, height: viewport.height });
        
        // Calculate scale to fit container (fixed at 100% zoom)
        const calculatedScale = 1.0;
        
        const scaledViewport = page.getViewport({ scale: calculatedScale });
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        // Set canvas size
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.width);
        
        // Render PDF page
        await page.render({ 
          canvasContext: ctx, 
          viewport: scaledViewport 
        }).promise;

        // Set initial crop box if not set
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

    setIsCropping(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    setUploadSpeed(null);
    setDownloadUrls([]);
    setDownloadFilenames([]);

    try {
      const page = await currentPdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      
      const canvas = canvasRef.current;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const scaleX = viewport.width / canvasWidth;
      const scaleY = viewport.height / canvasHeight;

      let pdfCoords = {
        x: Math.round(cropBox.x * scaleX),
        y: Math.round((canvasHeight - (cropBox.y + cropBox.height)) * scaleY),
        width: Math.round(cropBox.width * scaleX),
        height: Math.round(cropBox.height * scaleY),
        canvasWidth: viewport.width,
        canvasHeight: viewport.height,
        page: pageNum
      };

      // Clamp values to be inside PDF bounds
      pdfCoords.x = Math.max(0, pdfCoords.x);
      pdfCoords.y = Math.max(0, pdfCoords.y);

      if (pdfCoords.x + pdfCoords.width > viewport.width) {
        pdfCoords.width = viewport.width - pdfCoords.x;
      }
      if (pdfCoords.y + pdfCoords.height > viewport.height) {
        pdfCoords.height = viewport.height - pdfCoords.y;
      }

      if (pdfCoords.width <= 0 || pdfCoords.height <= 0) {
        throw new Error("Invalid crop box. Please select a valid area inside the page.");
      }

      const cropData = {
        crop: pdfCoords,
        applyTo: "all"
      };

      const formData = new FormData();
      
      // Append all files at once
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
            setUploadProgress(percent);

            const elapsed = (Date.now() - startTime) / 1000; 
            const speed = (progressEvent.loaded / 1024 / elapsed).toFixed(2);
            setUploadSpeed(speed);
          }
        }
      );

      if (res.data.success && res.data.outputs && res.data.outputs.length > 0) {
        const outputs = res.data.outputs;
        const urls = outputs.map(output => `${import.meta.env.VITE_API_URL}${output.url}`);
        const filenames = outputs.map(output => output.name);
        
        setDownloadUrls(urls);
        setDownloadFilenames(filenames);
        setSuccess(`Successfully cropped ${files.length} PDF file(s)! The same crop area has been applied to all pages.`);
        
        // Create previews from download URLs
        const previewPromises = urls.map(async (url, index) => {
          try {
            const previewResponse = await axios.get(url, { responseType: 'blob' });
            const blob = new Blob([previewResponse.data], { type: 'application/pdf' });
            return URL.createObjectURL(blob);
          } catch (previewError) {
            console.warn(`Could not create preview for file ${index}:`, previewError);
            return null;
          }
        });
        
        const previews = await Promise.all(previewPromises);
        setPreviewUrls(previews.filter(url => url !== null));
      } else {
        throw new Error("No output files generated");
      }
      
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Crop operation failed. Please try again.");
      console.error("Crop error:", err);
    }
    setIsCropping(false);
    setUploadProgress(0);
    setUploadSpeed(null);
  };

  const handleDownload = (index = null) => {
    if (index !== null && downloadUrls[index]) {
      // Download specific file
      window.open(downloadUrls[index], '_blank');
    } else if (downloadUrls.length > 0) {
      // Download all files
      downloadUrls.forEach((url, idx) => {
        window.open(url, '_blank');
      });
    } else if (previewUrls.length > 0) {
      // Fallback to preview URLs
      previewUrls.forEach((url, idx) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadFilenames[idx] || `cropped_${files[idx]?.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    setUploadSpeed(null);
    setDownloadUrls([]);
    setDownloadFilenames([]);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === "application/pdf"
    );
    
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
    } else {
      setError("Please upload valid PDF files.");
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type === "application/pdf"
    );
    
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
    } else {
      setError("Please select valid PDF files.");
    }
    
    // Reset the input
    e.target.value = null;
  };

  const removeFile = (index = null) => {
    if (index === null) {
      // Remove all files
      setFiles([]);
      setPdfDocs([]);
      setCurrentPdfIndex(0);
    } else {
      // Remove specific file
      const newFiles = files.filter((_, i) => i !== index);
      const newPdfDocs = pdfDocs.filter((_, i) => i !== index);
      setFiles(newFiles);
      setPdfDocs(newPdfDocs);
      
      // Adjust current index if needed
      if (currentPdfIndex >= newFiles.length) {
        setCurrentPdfIndex(Math.max(0, newFiles.length - 1));
      }
    }
    
    setCropBox(null);
    setError(null);
    setSuccess(null);
    setPreviewUrls([]);
    setPageNum(1);
    setTotalPages(0);
    setPagePreviews([]);
    setUploadProgress(0);
    setUploadSpeed(null);
    setDownloadUrls([]);
    setDownloadFilenames([]);
  };

  const addMoreFiles = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type === "application/pdf"
    );
    
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
    }
    
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

  // Calculate PDF coordinates for display
  const calculatePdfCoordinates = () => {
    if (!cropBox || !canvasRef.current || !originalPageSize.width) return null;
    
    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;
    
    // Calculate scaling factors
    const scaleX = originalPageSize.width / canvasWidth;
    const scaleY = originalPageSize.height / canvasHeight;
    
    // Convert coordinates
    return {
      x: Math.round(cropBox.x * scaleX),
      y: Math.round((canvasHeight - (cropBox.y + cropBox.height)) * scaleY),
      width: Math.round(cropBox.width * scaleX),
      height: Math.round(cropBox.height * scaleY)
    };
  };

  const pdfCoords = calculatePdfCoordinates();

  // Format file name for display (truncate if too long)
  const formatFileName = (name) => {
    if (name.length > 25) {
      return name.substring(0, 10) + '...' + name.substring(name.length - 10);
    }
    return name;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 mt-20">
      <Helmet>
        <title>PDF Cropper | Free PDF Tool</title>
        <meta name="description" content="Crop PDFs online for free with precise controls." />
        <link rel="canonical" href="https://www.shippinglabelcrop.in/PdfCropper" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
        ref={containerRef}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FiFile className="text-indigo-200" />
                PDF Cropper
              </h1>
              <p className="text-indigo-100 mt-2">Upload multiple PDFs, select the area to crop, and download. The same crop will be applied to all pages.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowInfoPanel(!showInfoPanel)}
                className="p-2 rounded-lg bg-indigo-500 hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <FiInfo className="text-lg" />
                <span className="hidden sm:inline">{showInfoPanel ? "Hide Info" : "Show Info"}</span>
              </button>
              <button
                onClick={() => setShowThumbnails(!showThumbnails)}
                className="p-2 rounded-lg bg-indigo-500 hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <FiGrid className="text-lg" />
                <span className="hidden sm:inline">{showThumbnails ? "Hide Thumbnails" : "Show Thumbnails"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* File Upload Area */}
          <div
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg w-full transition-all duration-200 ${
              files.length > 0 ? "border-gray-300 bg-gray-50" : "border-indigo-400 bg-indigo-50 hover:bg-indigo-100"
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {files.length === 0 ? (
              <div className="flex flex-col items-center space-y-4 text-center">
                <FiUpload className="text-4xl text-indigo-500" />
                <p className="text-gray-600 text-lg">Drag & drop PDFs here, or</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-md"
                >
                  <FiUpload />
                  Browse Files
                </button>
                <p className="text-sm text-gray-500">Max file size: 50MB each</p>
              </div>
            ) : (
              <>
                {isLoading ? (
                  <div className="flex flex-col items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    <p className="mt-4 text-gray-600">Loading PDFs...</p>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center space-y-6">
                    {/* File List */}
                    <div className="w-full space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Selected Files ({files.length})</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-1 text-sm transition-colors shadow-sm"
                          >
                            <FiPlus size={14} />
                            Add More
                          </button>
                          <button
                            onClick={() => removeFile()}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-1 text-sm transition-colors shadow-sm"
                          >
                            <FiTrash2 size={14} />
                            Clear All
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {files.map((file, index) => (
                          <div 
                            key={index}
                            className={`flex justify-between items-center p-3 rounded-lg border transition-all cursor-pointer ${
                              currentPdfIndex === index 
                                ? "bg-indigo-50 border-indigo-300 shadow-sm" 
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => handlePdfSelect(index)}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FiFileText className={`flex-shrink-0 ${
                                currentPdfIndex === index ? "text-indigo-500" : "text-gray-500"
                              }`} />
                              <span 
                                className={`truncate text-sm ${
                                  currentPdfIndex === index ? "font-medium text-indigo-700" : "text-gray-700"
                                }`}
                                title={file.name}
                              >
                                {formatFileName(file.name)}
                              </span>
                              {downloadUrls[index] && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                  Ready
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Remove file"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PDF Navigation */}
                    {files.length > 1 && (
                      <div className="flex items-center justify-center gap-4 p-3 bg-gray-50 rounded-lg w-full">
                        <button
                          onClick={goToPreviousPdf}
                          disabled={currentPdfIndex <= 0}
                          className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          <FiChevronLeft />
                        </button>
                        <span className="text-gray-700 font-medium bg-white px-4 py-2 rounded-md border border-gray-300 shadow-sm">
                          File {currentPdfIndex + 1} of {files.length}
                        </span>
                        <button
                          onClick={goToNextPdf}
                          disabled={currentPdfIndex >= files.length - 1}
                          className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          <FiChevronRight />
                        </button>
                      </div>
                    )}

                    {/* Upload Progress */}
                    {isCropping && uploadProgress > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-2"
                      >
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Processing: {uploadProgress}%</span>
                          {uploadSpeed && <span>{uploadSpeed} KB/s</span>}
                        </div>
                      </motion.div>
                    )}

                    {/* Controls */}
                    <div className="flex flex-wrap items-center justify-between w-full gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={goToPreviousPage}
                          disabled={pageNum <= 1}
                          className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          <FiChevronLeft />
                        </button>
                        <span className="text-gray-700 font-medium bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
                          Page {pageNum} of {totalPages}
                        </span>
                        <button
                          onClick={goToNextPage}
                          disabled={pageNum >= totalPages}
                          className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          <FiChevronRight />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
                          100% Zoom
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
                          <span className="text-sm text-gray-600 mr-2">Opacity:</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectionOpacity * 100}
                            onChange={(e) => setSelectionOpacity(e.target.value / 100)}
                            className="w-20"
                          />
                          <span className="text-xs text-gray-500 ml-2 w-8">
                            {Math.round(selectionOpacity * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Page thumbnails slider */}
                    {showThumbnails && pagePreviews.length > 0 && (
                      <div className="w-full overflow-x-auto pb-4">
                        <div className="flex space-x-2 p-2 bg-gray-100 rounded-lg">
                          {pagePreviews.map((preview) => (
                            <div
                              key={preview.pageNum}
                              className={`flex-shrink-0 cursor-pointer border-2 rounded p-1 transition-all ${
                                pageNum === preview.pageNum 
                                  ? "border-indigo-500 bg-indigo-50 shadow-sm" 
                                  : "border-gray-200 hover:border-gray-400 bg-white"
                              }`}
                              onClick={() => handlePageSelect(preview.pageNum)}
                              title={`Page ${preview.pageNum}`}
                            >
                              <img
                                src={preview.dataUrl}
                                alt={`Page ${preview.pageNum}`}
                                className="h-16 w-auto"
                              />
                              <div className="text-xs text-center mt-1 font-medium">{preview.pageNum}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PDF Canvas */}
                    <div className="relative border rounded-lg overflow-hidden shadow-md bg-white p-4">
                      <div className="relative mx-auto" style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}>
                        <canvas 
                          ref={canvasRef} 
                          className="block mx-auto border border-gray-200"
                        />
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
                              
                              setCropBox({ 
                                width: newWidth, 
                                height: newHeight, 
                                x: pos.x, 
                                y: pos.y 
                              });
                            }}
                            minWidth={50}
                            minHeight={50}
                            style={{
                              border: "2px dashed #6366F1",
                              background: `rgba(99, 102, 241, ${selectionOpacity})`,
                              zIndex: 10
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 justify-center p-4 bg-gray-50 rounded-lg w-full">
                      <button 
                        onClick={handleCrop} 
                        disabled={isCropping || !cropBox}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                      >
                        {isCropping ? (
                          <>
                            <FiLoader className="animate-spin" />
                            Processing {files.length} file(s)...
                          </>
                        ) : (
                          <>
                            <FiCrop />
                            Crop All {files.length} PDF(s)
                          </>
                        )}
                      </button>
                      
                      {downloadUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => handleDownload()}
                            className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2 transition-colors shadow-md"
                          >
                            <FiDownload />
                            Download All
                          </button>
                          {downloadUrls.map((url, index) => (
                            <button 
                              key={index}
                              onClick={() => handleDownload(index)}
                              className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors shadow-md text-sm"
                            >
                              <FiDownload size={14} />
                              File {index + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Info Panel */}
                    {showInfoPanel && cropBox && originalPageSize.width > 0 && pdfCoords && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-gray-600 bg-white p-4 rounded-lg w-full border border-gray-200 shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <FiType className="text-indigo-500" />
                            Crop Coordinates
                          </h3>
                          <button 
                            onClick={() => setShowInfoPanel(false)}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                          >
                            <FiX />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Canvas Coordinates</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-gray-400">X:</span> {Math.round(cropBox.x)}px
                              </div>
                              <div>
                                <span className="text-gray-400">Y:</span> {Math.round(cropBox.y)}px
                              </div>
                              <div>
                                <span className="text-gray-400">Width:</span> {Math.round(cropBox.width)}px
                              </div>
                              <div>
                                <span className="text-gray-400">Height:</span> {Math.round(cropBox.height)}px
                              </div>
                            </div>
                          </div>
                          <div className="bg-indigo-50 p-3 rounded-md">
                            <p className="text-indigo-500 text-xs uppercase font-semibold mb-1">PDF Coordinates</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-indigo-400">X:</span> {pdfCoords.x}pt
                              </div>
                              <div>
                                <span className="text-indigo-400">Y:</span> {pdfCoords.y}pt
                              </div>
                              <div>
                                <span className="text-indigo-400">Width:</span> {pdfCoords.width}pt
                              </div>
                              <div>
                                <span className="text-indigo-400">Height:</span> {pdfCoords.height}pt
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3"
              >
                <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3"
              >
                <FiCheck className="text-green-600 mt-0.5 flex-shrink-0" />
                <p>{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            multiple // Allow multiple file selection
            className="hidden"
          />
          
          {/* Hidden input for adding more files */}
          <input
            type="file"
            accept="application/pdf"
            onChange={addMoreFiles}
            multiple
            className="hidden"
            id="add-more-files"
          />
        </div>

        {/* Footer Instructions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiInfo className="text-indigo-500" />
            How to use:
          </h3>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <li className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="font-semibold text-indigo-600 mb-1">1. Upload PDFs</div>
              <p className="text-gray-600">Drag & drop or browse to select multiple PDF files</p>
            </li>
            <li className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="font-semibold text-indigo-600 mb-1">2. Select Area</div>
              <p className="text-gray-600">Drag and resize the selection box on any file</p>
            </li>
            <li className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="font-semibold text-indigo-600 mb-1">3. Crop All Files</div>
              <p className="text-gray-600">Apply the same crop to every page of all files</p>
            </li>
            <li className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="font-semibold text-indigo-600 mb-1">4. Download</div>
              <p className="text-gray-600">Get all your cropped PDF files</p>
            </li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
};

export default PdfCropper;