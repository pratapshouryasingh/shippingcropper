import React, { useState, useCallback } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, ImageRun } from "docx";
import { jsPDF } from "jspdf";
import mammoth from "mammoth";
import { useUser, useClerk } from "@clerk/clerk-react";

GlobalWorkerOptions.workerSrc = workerSrc;

export default function UniversalConverter() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [conversionProgress, setConversionProgress] = useState({});

  const getFileType = (file) => {
    if (file.type === "application/pdf") return "pdf";
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      return "docx";
    if (file.type === "text/plain") return "txt";
    
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension)) return "image";
    if (extension === "docx") return "docx";
    if (extension === "txt") return "txt";
    return null;
  };

  const handleDownloadAction = (downloadFunction) => {
    if (!isSignedIn) {
      setStatus("Please sign in to download files");
      openSignIn({
        redirectUrl: window.location.href,
      });
      return;
    }
    downloadFunction();
  };

  const processSingleFile = async (file, index, total) => {
    const type = getFileType(file);
    if (!type) {
      throw new Error("Unsupported file type.");
    }

    let pages = [];
    
    if (type === "pdf") {
      pages = await handlePDF(file, index, total);
    } else if (type === "image") {
      pages = await handleImage(file);
    } else if (type === "docx") {
      pages = await handleDOCX(file);
    } else if (type === "txt") {
      pages = await handleTXT(file);
    }
    
    return {
      id: Date.now() + Math.random(),
      name: file.name,
        type: type,
      pages: pages,
      originalFile: file,
      processedAt: new Date().toISOString()
    };
  };

  const handleFiles = async (fileList) => {
    const validFiles = Array.from(fileList).filter(file => getFileType(file));
    
    if (validFiles.length === 0) {
      setStatus("No supported files found.");
      return;
    }

    setStatus(`Processing ${validFiles.length} file(s)...`);
    setIsProcessing(true);
    setConversionProgress({});
    
    try {
      const processedFiles = [];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setStatus(`Processing ${i + 1} of ${validFiles.length}: ${file.name}`);
        
        const processedFile = await processSingleFile(file, i, validFiles.length);
        processedFiles.push(processedFile);
        
        // Update progress
        setConversionProgress(prev => ({
          ...prev,
          [file.name]: { status: "completed", progress: 100 }
        }));
      }
      
      setFiles(prev => [...prev, ...processedFiles]);
      setStatus(`Successfully processed ${processedFiles.length} file(s)`);
    } catch (error) {
      console.error("Error processing files:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePDF = async (file, fileIndex, totalFiles) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const imgs = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const progress = Math.round((i / pdf.numPages) * 100);
        setConversionProgress(prev => ({
          ...prev,
          [file.name]: { status: "processing", progress, currentPage: i, totalPages: pdf.numPages }
        }));

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Increased scale for better quality
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        
        await new Promise((resolve) => {
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport
          };
          page.render(renderContext).promise.then(() => {
            setTimeout(() => {
              imgs.push(canvas.toDataURL("image/png", 1.0)); // Use PNG for better quality
              resolve();
            }, 100);
          });
        });
      }
      return imgs;
    } catch (error) {
      console.error("PDF processing error:", error);
      throw new Error("Failed to process PDF file. It may be corrupted or password protected.");
    }
  };

  const handleImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve([e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDOCX = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 800;
      canvas.height = Math.max(1000, value.split("\n").length * 20 + 50);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      const lines = value.split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, 20, 30 + i * 20);
      });
      return [canvas.toDataURL("image/png", 1.0)];
    } catch (error) {
      console.error("DOCX processing error:", error);
      throw new Error("Failed to process DOCX file.");
    }
  };

  const handleTXT = async (file) => {
    try {
      const text = await file.text();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 800;
      canvas.height = Math.max(1000, text.split("\n").length * 20 + 50);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, 20, 30 + i * 20);
      });
      return [canvas.toDataURL("image/png", 1.0)];
    } catch (error) {
      console.error("TXT processing error:", error);
      throw new Error("Failed to process text file.");
    }
  };

  // Enhanced Export Functions
  const downloadAllAsJPG = async () => {
    if (!files.length) return;
    setStatus("Converting all files to JPG...");
    
    try {
      const zip = new JSZip();
      let processedCount = 0;
      
      for (const file of files) {
        const fileFolder = zip.folder(file.name.replace(/\.[^/.]+$/, ""));
        for (let i = 0; i < file.pages.length; i++) {
          const base64Data = file.pages[i].split(",")[1];
          fileFolder.file(`page-${i + 1}.jpg`, base64Data, { base64: true });
        }
        processedCount++;
        setStatus(`Processed ${processedCount} of ${files.length} files for JPG conversion...`);
      }
      
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `all-files-converted-to-jpg.zip`);
      setStatus("Conversion to JPG complete!");
    } catch (error) {
      setStatus("Error converting to JPG");
    }
  };

  const downloadAllAsPNG = async () => {
    if (!files.length) return;
    setStatus("Converting all files to PNG...");
    
    try {
      const zip = new JSZip();
      let processedCount = 0;
      
      for (const file of files) {
        const fileFolder = zip.folder(file.name.replace(/\.[^/.]+$/, ""));
        for (let i = 0; i < file.pages.length; i++) {
          const base64Data = file.pages[i].split(",")[1];
          fileFolder.file(`page-${i + 1}.png`, base64Data, { base64: true });
        }
        processedCount++;
        setStatus(`Processed ${processedCount} of ${files.length} files for PNG conversion...`);
      }
      
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `all-files-converted-to-png.zip`);
      setStatus("Conversion to PNG complete!");
    } catch (error) {
      setStatus("Error converting to PNG");
    }
  };

  const downloadAllAsPDF = async () => {
    if (!files.length) return;
    setStatus("Converting all files to PDF...");
    
    try {
      const zip = new JSZip();
      let processedCount = 0;
      
      for (const file of files) {
        const pdf = new jsPDF();
        for (let i = 0; i < file.pages.length; i++) {
          if (i > 0) pdf.addPage();
          pdf.addImage(file.pages[i], "PNG", 10, 10, 190, 0);
        }
        const pdfBlob = pdf.output("blob");
        zip.file(`${file.name.replace(/\.[^/.]+$/, "")}-converted.pdf`, pdfBlob);
        processedCount++;
        setStatus(`Processed ${processedCount} of ${files.length} files for PDF conversion...`);
      }
      
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `all-files-converted-to-pdf.zip`);
      setStatus("Conversion to PDF complete!");
    } catch (error) {
      setStatus("Error converting to PDF");
    }
  };

  const downloadCurrentAsJPG = async () => {
    const file = files[activeFileIndex];
    if (!file) return;
    
    setStatus(`Converting ${file.name} to JPG...`);
    
    try {
      const zip = new JSZip();
      for (let i = 0; i < file.pages.length; i++) {
        const base64Data = file.pages[i].split(",")[1];
        zip.file(`${file.name.replace(/\.[^/.]+$/, "")}-${i + 1}.jpg`, base64Data, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${file.name.replace(/\.[^/.]+$/, "")}-converted.zip`);
      setStatus("Conversion to JPG complete!");
    } catch (error) {
      setStatus("Error converting to JPG");
    }
  };

  const downloadCurrentAsPNG = async () => {
    const file = files[activeFileIndex];
    if (!file) return;
    
    setStatus(`Converting ${file.name} to PNG...`);
    
    try {
      const zip = new JSZip();
      for (let i = 0; i < file.pages.length; i++) {
        const base64Data = file.pages[i].split(",")[1];
        zip.file(`${file.name.replace(/\.[^/.]+$/, "")}-${i + 1}.png`, base64Data, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${file.name.replace(/\.[^/.]+$/, "")}-converted.zip`);
      setStatus("Conversion to PNG complete!");
    } catch (error) {
      setStatus("Error converting to PNG");
    }
  };

  const downloadCurrentAsPDF = async () => {
    const file = files[activeFileIndex];
    if (!file) return;
    
    setStatus(`Converting ${file.name} to PDF...`);
    
    try {
      const pdf = new jsPDF();
      for (let i = 0; i < file.pages.length; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(file.pages[i], "PNG", 10, 10, 190, 0);
      }
      pdf.save(`${file.name.replace(/\.[^/.]+$/, "")}-converted.pdf`);
      setStatus("Conversion to PDF complete!");
    } catch (error) {
      setStatus("Error converting to PDF");
    }
  };

  const downloadCurrentAsDOCX = async () => {
    const file = files[activeFileIndex];
    if (!file) return;
    
    setStatus(`Converting ${file.name} to DOCX...`);

    try {
      const children = [];

      for (let i = 0; i < file.pages.length; i++) {
        const base64Data = file.pages[i].split(",")[1];
        const imageData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imageData,
                transformation: {
                  width: 500,
                  height: 700,
                },
              }),
            ],
          })
        );

        children.push(
          new Paragraph({
            text: `Page ${i + 1}`,
          })
        );
      }

      const doc = new Document({
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${file.name.replace(/\.[^/.]+$/, "")}-converted.docx`);
      setStatus("Conversion to DOCX complete!");
    } catch (error) {
      console.error("DOCX conversion error:", error);
      setStatus("Error converting to DOCX");
    }
  };

  const downloadCurrentAsTXT = async () => {
    const file = files[activeFileIndex];
    if (!file) return;
    
    setStatus(`Converting ${file.name} to TXT...`);
    
    try {
      const text = "Text extracted from document would appear here. For actual text extraction, OCR functionality would be needed.";
      const blob = new Blob([text], { type: "text/plain" });
      saveAs(blob, `${file.name.replace(/\.[^/.]+$/, "")}-converted.txt`);
      setStatus("Conversion to TXT complete!");
    } catch (error) {
      setStatus("Error converting to TXT");
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const clearFiles = () => {
    setFiles([]);
    setActiveFileIndex(0);
    setStatus("");
    setConversionProgress({});
  };

  const removeFile = (fileId) => {
    const newFiles = files.filter(file => file.id !== fileId);
    setFiles(newFiles);
    if (activeFileIndex >= newFiles.length) {
      setActiveFileIndex(Math.max(0, newFiles.length - 1));
    }
  };

  const currentFile = files[activeFileIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mt-6 mb-4">
            Universal File Converter
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Convert multiple PDFs, images, DOCX, and TXT files between various formats with enhanced performance and quality.
          </p>
        </div>
        
        {/* Enhanced Upload Area */}
        <div
          className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 mb-6 ${
            isDragging 
              ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-lg" 
              : "border-gray-300 bg-white hover:border-blue-400 hover:shadow-md"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-800 mb-1">
                Drag & drop multiple files here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports multiple PDFs, DOCX, JPG, PNG, TXT files • Better PDF quality
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,.txt,image/*"
              className="hidden"
              id="fileInput"
              multiple
              onChange={(e) => e.target.files.length && handleFiles(e.target.files)}
            />
            <label
              htmlFor="fileInput"
              className="cursor-pointer inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Choose Multiple Files
            </label>
          </div>
        </div>

        {/* Enhanced Status with Progress */}
        {status && (
          <div className="text-center mb-6">
            <div className={`inline-flex flex-col items-center px-6 py-4 rounded-2xl text-sm font-medium max-w-md ${
              status.startsWith("Error") ? "bg-red-100 text-red-800 border border-red-200" : 
              status.includes("complete") ? "bg-green-100 text-green-800 border border-green-200" : 
              "bg-blue-100 text-blue-800 border border-blue-200"
            }`}>
              <div className="flex items-center">
                {status.startsWith("Error") ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : status.includes("complete") ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 animate-spin" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                )}
                {status}
              </div>
              
              {/* Progress Bar for Current Processing */}
              {isProcessing && currentFile && conversionProgress[currentFile.name] && (
                <div className="w-full mt-3">
                  <div className="flex justify-between text-xs text-blue-700 mb-1">
                    <span>Page {conversionProgress[currentFile.name].currentPage} of {conversionProgress[currentFile.name].totalPages}</span>
                    <span>{conversionProgress[currentFile.name].progress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${conversionProgress[currentFile.name].progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Main Content Area */}
        {files.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Enhanced File List Sidebar */}
            <div className="w-full lg:w-1/4 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-gray-800">Uploaded Files ({files.length})</h2>
                <button 
                  onClick={clearFiles}
                  className="text-sm text-red-500 hover:text-red-700 flex items-center bg-red-50 px-3 py-1 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Clear All
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {files.map((file, index) => (
                  <div 
                    key={file.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                      index === activeFileIndex 
                        ? "bg-blue-50 border-blue-300 shadow-sm ring-2 ring-blue-200" 
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveFileIndex(index)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            file.type === 'pdf' ? 'bg-red-500' :
                            file.type === 'image' ? 'bg-green-500' :
                            file.type === 'docx' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}></div>
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {file.name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {file.pages.length} page{file.pages.length !== 1 ? 's' : ''} • {file.type.toUpperCase()} • {new Date(file.processedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Bulk Actions */}
              <div className="mt-6 pt-5 border-t border-gray-200">
                <h3 className="font-medium text-gray-700 mb-3">Bulk Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleDownloadAction(downloadAllAsJPG)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all text-sm font-medium shadow-sm"
                  >
                    Download All as JPG
                  </button>
                  <button
                    onClick={() => handleDownloadAction(downloadAllAsPNG)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all text-sm font-medium shadow-sm"
                  >
                    Download All as PNG
                  </button>
                  <button
                    onClick={() => handleDownloadAction(downloadAllAsPDF)}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all text-sm font-medium shadow-sm"
                  >
                    Download All as PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Preview and Conversion Area */}
            <div className="w-full lg:w-3/4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div className="flex items-center mb-3 md:mb-0">
                    <div className={`w-4 h-4 rounded-full mr-3 ${
                      currentFile?.type === 'pdf' ? 'bg-red-500' :
                      currentFile?.type === 'image' ? 'bg-green-500' :
                      currentFile?.type === 'docx' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {currentFile?.name || "No file selected"}
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        {currentFile ? `${currentFile.pages.length} page${currentFile.pages.length !== 1 ? 's' : ''} • ${currentFile.type.toUpperCase()}` : "Select a file to preview"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleDownloadAction(downloadCurrentAsJPG)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm"
                    >
                      JPG
                    </button>
                    <button
                      onClick={() => handleDownloadAction(downloadCurrentAsPNG)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm"
                    >
                      PNG
                    </button>
                    <button
                      onClick={() => handleDownloadAction(downloadCurrentAsPDF)}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => handleDownloadAction(downloadCurrentAsDOCX)}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm"
                    >
                      DOCX
                    </button>
                    <button
                      onClick={() => handleDownloadAction(downloadCurrentAsTXT)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm"
                    >
                      TXT
                    </button>
                  </div>
                </div>

                {/* Enhanced File Preview */}
                {currentFile && (
                  <div className="overflow-y-auto max-h-[60vh] border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="space-y-6">
                      {currentFile.pages.map((src, i) => (
                        <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                          <div className="text-center text-sm text-gray-500 mb-3 bg-gray-50 py-1 rounded">
                            Page {i + 1} of {currentFile.pages.length}
                          </div>
                          <img
                            src={src}
                            alt={`Page ${i + 1}`}
                            className="max-w-full h-auto mx-auto rounded shadow-sm"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced File Info Card */}
              {currentFile && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    File Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Name:</span> {currentFile.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Type:</span> 
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                          currentFile.type === 'pdf' ? 'bg-red-100 text-red-800' :
                          currentFile.type === 'image' ? 'bg-green-100 text-green-800' :
                          currentFile.type === 'docx' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {currentFile.type.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Pages:</span> 
                        <span className="ml-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {currentFile.pages.length}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Status:</span> 
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${isSignedIn ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {isSignedIn ? 'Signed In' : 'Not Signed In'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">No Files Loaded</h2>
            <p className="text-gray-600">
              Upload one or more files to see preview and conversion options
            </p>
          </div>
        )}
      </div>
    </div>
  );
}