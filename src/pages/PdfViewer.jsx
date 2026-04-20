import React, { useState, useCallback } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, ImageRun } from "docx";
import { jsPDF } from "jspdf";
import mammoth from "mammoth";
import { useUser, useClerk } from "@clerk/clerk-react";
import Tesseract from "tesseract.js";

GlobalWorkerOptions.workerSrc = workerSrc;

export default function UniversalConverter() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [activeTab, setActiveTab] = useState("preview");
  const [fileSize, setFileSize] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hasFile, setHasFile] = useState(false);

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  const handleFile = async (file) => {
    const type = getFileType(file);
    if (!type) {
      setStatus("Unsupported file type.");
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    setHasFile(true);
    setStatus(`Loading ${type.toUpperCase()}...`);
    setIsProcessing(true);
    setExtractedText("");
    setActiveTab("preview");
    setShowMobileMenu(false);
    
    try {
      if (type === "pdf") {
        await handlePDF(file);
      } else if (type === "image") {
        await handleImage(file);
      } else if (type === "docx") {
        await handleDOCX(file);
      } else if (type === "txt") {
        await handleTXT(file);
      }
      setStatus("File loaded successfully!");
    } catch (error) {
      console.error("Error processing file:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const imgs = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setStatus(`Rendering page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await new Promise((resolve) => {
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport
          };
          page.render(renderContext).promise.then(() => {
            setTimeout(() => {
              imgs.push(canvas.toDataURL("image/jpeg", 0.95));
              resolve();
            }, 50);
          });
        });
      }
      setPages(imgs);
      await extractTextFromImages(imgs);
    } catch (error) {
      console.error("PDF processing error:", error);
      throw new Error("Failed to process PDF file. It may be corrupted or password protected.");
    }
  };

  const handleImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target.result;
        setPages([imageData]);
        await extractTextFromImages([imageData]);
        resolve();
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
      setPages([canvas.toDataURL("image/jpeg", 0.95)]);
      setExtractedText(value);
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
      setPages([canvas.toDataURL("image/jpeg", 0.95)]);
      setExtractedText(text);
    } catch (error) {
      console.error("TXT processing error:", error);
      throw new Error("Failed to process text file.");
    }
  };

  const extractTextFromImages = async (images) => {
    setStatus("Extracting text from images...");
    let allText = "";
    
    for (let i = 0; i < images.length; i++) {
      setStatus(`Processing page ${i + 1} of ${images.length} for text extraction...`);
      
      try {
        const { data: { text } } = await Tesseract.recognize(
          images[i],
          'eng',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        );
        allText += text + "\n\n";
      } catch (error) {
        console.error(`OCR failed for page ${i + 1}:`, error);
        allText += `[Error extracting text from page ${i + 1}]\n\n`;
      }
    }
    
    setExtractedText(allText.trim());
    setStatus("Text extraction complete!");
    return allText;
  };

  const downloadAsJPG = async () => {
    if (!pages.length) return;
    setStatus("Converting to JPG...");
    
    try {
      const zip = new JSZip();
      for (let i = 0; i < pages.length; i++) {
        const base64Data = pages[i].split(",")[1];
        zip.file(`${fileName.replace(/\.[^/.]+$/, "")}-${i + 1}.jpg`, base64Data, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${fileName.replace(/\.[^/.]+$/, "")}-converted.zip`);
      setStatus("Conversion to JPG complete!");
    } catch (error) {
      setStatus("Error converting to JPG", error);
    }
  };

  const downloadAsPNG = async () => {
    if (!pages.length) return;
    setStatus("Converting to PNG...");
    
    try {
      const zip = new JSZip();
      for (let i = 0; i < pages.length; i++) {
        const base64Data = pages[i].split(",")[1];
        zip.file(`${fileName.replace(/\.[^/.]+$/, "")}-${i + 1}.png`, base64Data, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${fileName.replace(/\.[^/.]+$/, "")}-converted.zip`);
      setStatus("Conversion to PNG complete!");
    } catch (error) {
      setStatus("Error converting to PNG", error);
    }
  };

  const downloadAsDOCX = async () => {
    if (!pages.length) return;

    setStatus("Creating editable DOCX...");

    try {
      const children = [];

      for (let i = 0; i < pages.length; i++) {
        const pageText = extractedText?.split("\n\n")[i] || "No text found";

        children.push(
          new Paragraph({
            text: `Page ${i + 1}`,
            heading: "Heading1",
          })
        );

        children.push(
          new Paragraph({
            text: pageText,
          })
        );

        const base64 = pages[i];
        const base64Data = base64.split(",")[1];

        if (base64Data && base64Data.length > 100) {
          const imageBuffer = Uint8Array.from(
            atob(base64Data),
            (c) => c.charCodeAt(0)
          );

          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 600,
                    height: 800,
                  },
                  type: "jpg",
                }),
              ],
            })
          );
        }

        children.push(
          new Paragraph({
            children: [],
            pageBreakBefore: true,
          })
        );
      }

      const doc = new Document({
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileName.replace(/\.[^/.]+$/, "")}-editable.docx`);

      setStatus("Editable DOCX ready ✅");
    } catch (err) {
      console.error(err);
      setStatus("DOCX failed");
    }
  };

  const downloadAsPDF = async () => {
    if (!pages.length) return;

    setStatus("Creating searchable PDF...");

    try {
      const pdf = new jsPDF();
      const pageTexts = extractedText.split("\n\n");

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();

        pdf.addImage(pages[i], "JPEG", 10, 10, 190, 100);

        const text = pageTexts[i] || "No text extracted";
        pdf.setFont("Times", "Normal");
        pdf.setFontSize(10);

        const splitText = pdf.splitTextToSize(text, 180);
        pdf.text(splitText, 10, 120);
      }

      pdf.save(`${fileName.replace(/\.[^/.]+$/, "")}-searchable.pdf`);

      setStatus("Searchable PDF ready ✅");
    } catch (err) {
      console.error(err);
      setStatus("PDF failed");
    }
  };

  const downloadAsTXT = async () => {
    if (!pages.length) return;
    setStatus("Converting to TXT...");
    
    try {
      let textContent = "";
      
      if (extractedText) {
        textContent = extractedText;
      } else {
        setStatus("Extracting text for TXT conversion...");
        await extractTextFromImages(pages);
        textContent = extractedText || "No text could be extracted from the document.";
      }
      
      const header = `File: ${fileName}
Converted: ${new Date().toLocaleString()}
Total Pages: ${pages.length}
File Size: ${formatFileSize(fileSize)}
---
\n`;
      
      const fullText = header + textContent;
      const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
      saveAs(blob, `${fileName.replace(/\.[^/.]+$/, "")}-converted.txt`);
      setStatus("Conversion to TXT complete!");
    } catch (error) {
      console.error("TXT conversion error:", error);
      setStatus("Error converting to TXT: " + error.message);
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const clearFiles = () => {
    setPages([]);
    setFileName("");
    setStatus("");
    setExtractedText("");
    setFileSize(0);
    setHasFile(false);
    setShowMobileMenu(false);
  };

  const handleNewFile = () => {
    clearFiles();
  };

  const conversionOptions = [
    { name: "JPG", icon: "🖼️", color: "emerald", action: downloadAsJPG },
    { name: "PNG", icon: "📷", color: "emerald", action: downloadAsPNG },
    { name: "PDF", icon: "📕", color: "blue", action: downloadAsPDF },
    { name: "DOCX", icon: "📘", color: "indigo", action: downloadAsDOCX },
    { name: "TXT", icon: "📝", color: "slate", action: downloadAsTXT },
  ];

  const getButtonClasses = (color) => {
    const colors = {
      emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      indigo: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
      slate: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
    };
    return colors[color] || colors.indigo;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Processing Status Bar - Only shows when processing */}
      {isProcessing && (
        <div className="sticky top-0 z-50 bg-indigo-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium">{status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Upload Area - Only shows when no file is loaded */}
        {!hasFile && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-2xl">
              <div
                className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 ${
                  isDragging 
                    ? "border-indigo-500 border-dashed scale-[1.02]" 
                    : "border-slate-200 border-dashed"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                <div className="p-8 sm:p-12 lg:p-16">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-3">
                      {isDragging ? "Drop your file here" : "Convert any file"}
                    </h2>
                    <p className="text-slate-600 mb-8 text-base sm:text-lg">
                      PDF, DOCX, JPG, PNG, or TXT (Max 50MB)
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,image/*"
                        className="hidden"
                        id="fileInput"
                        onChange={(e) => e.target.files.length && handleFile(e.target.files[0])}
                      />
                      <label
                        htmlFor="fileInput"
                        className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Choose File
                      </label>
                      <p className="text-sm text-slate-500 self-center">
                        or drag and drop anywhere
                      </p>
                    </div>

                    {/* Supported formats */}
                    <div className="flex flex-wrap gap-2 justify-center mt-8">
                      {["PDF", "DOCX", "JPG", "PNG", "TXT"].map((format) => (
                        <span key={format} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section - Shows when file is loaded */}
        {hasFile && pages.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sidebar - Conversion Options */}
            <div className="lg:col-span-1">
              {/* Mobile toggle */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4"
                >
                  <span className="font-medium text-slate-900">Conversion Options</span>
                  <svg className={`w-5 h-5 text-slate-500 transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div className={`space-y-4 lg:block ${showMobileMenu ? 'block' : 'hidden'}`}>
                {/* File Info */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate">{fileName}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatFileSize(fileSize)} • {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleNewFile}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                        title="Convert new file"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        onClick={clearFiles}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Clear file"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Success Status */}
                  {!isProcessing && status && !status.includes("Error") && (
                    <div className="mt-3 p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {status}
                      </p>
                    </div>
                  )}
                </div>

                {/* Conversion Buttons */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <h3 className="font-medium text-slate-900 mb-3">Convert to</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                    {conversionOptions.map((option) => (
                      <button
                        key={option.name}
                        onClick={() => handleDownloadAction(option.action)}
                        disabled={isProcessing}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${getButtonClasses(option.color)}`}
                      >
                        <span className="text-xl">{option.icon}</span>
                        <span className="font-medium text-xs">{option.name}</span>
                      </button>
                    ))}
                  </div>
                  
                  {!isSignedIn && (
                    <p className="text-xs text-amber-600 mt-3 text-center bg-amber-50 rounded-lg p-2">
                      Sign in to enable downloads
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-slate-200">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                        activeTab === "preview"
                          ? "text-indigo-600 border-b-2 border-indigo-600"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Preview
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab("text")}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                        activeTab === "text"
                          ? "text-indigo-600 border-b-2 border-indigo-600"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Extracted Text
                      </span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {activeTab === "preview" ? (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {pages.map((src, i) => (
                        <div key={i} className="bg-slate-50 rounded-lg p-4">
                          <div className="text-center text-xs text-slate-500 mb-3">
                            Page {i + 1} of {pages.length}
                          </div>
                          <img
                            src={src}
                            alt={`Page ${i + 1}`}
                            className="max-w-full h-auto mx-auto rounded shadow-sm"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto">
                      {extractedText ? (
                        <div className="bg-slate-50 rounded-lg p-4">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                            {extractedText}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📄</span>
                          </div>
                          <p className="text-slate-600 font-medium">No text extracted yet</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {isProcessing ? "Extracting text..." : "Text will appear here after processing"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}