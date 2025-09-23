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
  FiGrid, FiType, FiTrash2, FiFileText, FiEye, FiEyeOff
} from "react-icons/fi";

const PdfCropper = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [cropBox, setCropBox] = useState(null);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [originalPageSize, setOriginalPageSize] = useState({ width: 0, height: 0 });
  const [pagePreviews, setPagePreviews] = useState([]);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [selectionOpacity, setSelectionOpacity] = useState(0.2);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

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

  // Load PDF when file changes
  useEffect(() => {
    if (!file) {
      setPdfDoc(null);
      setPageNum(1);
      setTotalPages(0);
      setCropBox(null);
      setPagePreviews([]);
      setUploadProgress(0);
      setUploadSpeed(null);
      setDownloadUrl(null);
      setDownloadFilename("");
      return;
    }
    
    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const typedArray = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setPageNum(1);
        
        // Generate previews for all pages
        generatePagePreviews(pdf);
      } catch (err) {
        setError("Failed to load PDF. Please try another file.");
        console.error(err);
      }
      setIsLoading(false);
    };
    loadPdf();
  }, [file]);

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
    if (!pdfDoc || containerSize.width === 0) return;
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
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
  }, [pdfDoc, pageNum, containerSize]);

const handleCrop = async () => {
  if (!isLoaded) return;
  if (!user) {
    openSignIn({ redirectUrl: window.location.href });
    return;
  }
  if (!file || !cropBox || !pdfDoc) return;

  setIsCropping(true);
  setError(null);
  setSuccess(null);
  setUploadProgress(0);
  setUploadSpeed(null);
  setDownloadUrl(null);
  setDownloadFilename("");

  try {
    const page = await pdfDoc.getPage(pageNum);
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
    formData.append("files", file);
    formData.append("settings", JSON.stringify(cropData));
    formData.append("userId", user.id);

    const startTime = Date.now();

    // FIX: Use the correct endpoint - remove /upload if route is mounted at /api/cropper
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/cropper`, // Changed from /api/cropper/upload to /api/cropper
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
      const output = res.data.outputs[0];
      const fullDownloadUrl = `${import.meta.env.VITE_API_URL}${output.url}`;
      
      setDownloadUrl(fullDownloadUrl);
      setDownloadFilename(output.name);
      setSuccess("PDF cropped successfully! The same crop area has been applied to all pages.");
      
      // Create preview from the download URL
      try {
        const previewResponse = await axios.get(fullDownloadUrl, { responseType: 'blob' });
        const blob = new Blob([previewResponse.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (previewError) {
        console.warn("Could not create preview:", previewError);
      }
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

  const handleDownload = () => {
    if (downloadUrl) {
      // Open download in new tab
      window.open(downloadUrl, '_blank');
      
      // Alternative: Trigger download programmatically
      // handleUrlDownload(downloadUrl, downloadFilename);
    } else if (previewUrl) {
      // Fallback to preview URL download
      const a = document.createElement("a");
      a.href = previewUrl;
      a.download = downloadFilename || `cropped_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleUrlDownload = (url, filename) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    setUploadSpeed(null);
    setDownloadUrl(null);
    setDownloadFilename("");
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === "application/pdf"
    );
    
    if (droppedFiles.length > 0) {
      setFile(droppedFiles[0]); // Only take the first file
    } else {
      setError("Please upload a valid PDF file.");
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type === "application/pdf"
    );
    
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]); // Only take the first file
    } else {
      setError("Please select a valid PDF file.");
    }
    
    // Reset the input
    e.target.value = null;
  };

  const removeFile = () => {
    setFile(null);
    setPdfDoc(null);
    setCropBox(null);
    setError(null);
    setSuccess(null);
    setPreviewUrl(null);
    setPageNum(1);
    setTotalPages(0);
    setPagePreviews([]);
    setUploadProgress(0);
    setUploadSpeed(null);
    setDownloadUrl(null);
    setDownloadFilename("");
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

  const handlePageSelect = (pageNumber) => {
    setPageNum(pageNumber);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
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
              <p className="text-indigo-100 mt-2">Upload a PDF, select the area to crop, and download. The same crop will be applied to all pages.</p>
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
              file ? "border-gray-300 bg-gray-50" : "border-indigo-400 bg-indigo-50 hover:bg-indigo-100"
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {!file ? (
              <div className="flex flex-col items-center space-y-4 text-center">
                <FiUpload className="text-4xl text-indigo-500" />
                <p className="text-gray-600 text-lg">Drag & drop a PDF here, or</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-md"
                >
                  <FiUpload />
                  Browse File
                </button>
                <p className="text-sm text-gray-500">Max file size: 50MB</p>
              </div>
            ) : (
              <>
                {isLoading ? (
                  <div className="flex flex-col items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    <p className="mt-4 text-gray-600">Loading PDF...</p>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center space-y-6">
                    {/* File Info */}
                    <div className="w-full flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 truncate">
                        <FiFileText className="text-indigo-500 flex-shrink-0" />
                        <span className="truncate font-medium" title={file.name}>
                          {formatFileName(file.name)}
                        </span>
                        {downloadUrl && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                            Ready to Download
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {downloadUrl && (
                          <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-1 transition-colors shadow-sm text-sm"
                          >
                            <FiDownload size={14} />
                            <span className="hidden sm:inline">Download</span>
                          </button>
                        )}
                        <button
                          onClick={removeFile}
                          className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-red-50 text-red-600 transition-colors shadow-sm flex items-center gap-2"
                          title="Remove file"
                        >
                          <FiTrash2 />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>

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
                            Processing...
                          </>
                        ) : (
                          <>
                            <FiCrop />
                            Crop All Pages
                          </>
                        )}
                      </button>
                      
                      {downloadUrl && (
                        <button 
                          onClick={handleDownload}
                          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2 transition-colors shadow-md"
                        >
                          <FiDownload />
                          Download Cropped PDF
                        </button>
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
            className="hidden"
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
              <div className="font-semibold text-indigo-600 mb-1">1. Upload PDF</div>
              <p className="text-gray-600">Drag & drop or browse to select a PDF file</p>
            </li>
            <li className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="font-semibold text-indigo-600 mb-1">2. Select Area</div>
              <p className="text-gray-600">Drag and resize the selection box</p>
            </li>
            <li className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="font-semibold text-indigo-600 mb-1">3. Crop All Pages</div>
              <p className="text-gray-600">Apply the same crop to every page</p>
            </li>
            <li className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="font-semibold text-indigo-600 mb-1">4. Download</div>
              <p className="text-gray-600">Get your cropped PDF file</p>
            </li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
};

export default PdfCropper;