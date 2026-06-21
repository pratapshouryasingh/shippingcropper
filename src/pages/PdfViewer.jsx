import React, { useState, useCallback, useEffect, useRef } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, ImageRun } from "docx";
import { jsPDF } from "jspdf";
import mammoth from "mammoth";
import html2canvas from "html2canvas";
import { useUser, useClerk } from "@clerk/clerk-react";
import { createPageStateStore } from "../utils/pageStateStore";
import { Image, FileImage, FileText, FileArchive, FileDown } from "lucide-react";

GlobalWorkerOptions.workerSrc = workerSrc;

const pdfViewerInitialState = {
  pages: [],
  status: "",
  isDragging: false,
  fileName: "",
  isProcessing: false,
  extractedText: "",
  activeTab: "preview",
  fileSize: 0,
  // showMobileMenu removed
  hasFile: false,
  fileType: null,
  docxHtml: "",
  extractedImages: [],
};

const pdfViewerStateStore = createPageStateStore(pdfViewerInitialState);

export default function UniversalConverter() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const restoredState = pdfViewerStateStore.getState();
  const [pages, setPages] = useState(restoredState.pages);
  const [status, setStatus] = useState(restoredState.status);
  const [isDragging, setIsDragging] = useState(restoredState.isDragging);
  const [fileName, setFileName] = useState(restoredState.fileName);
  const [isProcessing, setIsProcessing] = useState(restoredState.isProcessing);
  const [extractedText, setExtractedText] = useState(restoredState.extractedText);
  const [activeTab, setActiveTab] = useState(restoredState.activeTab);
  const [fileSize, setFileSize] = useState(restoredState.fileSize);
  const [hasFile, setHasFile] = useState(restoredState.hasFile);
  const [fileType, setFileType] = useState(restoredState.fileType);
  const [docxHtml, setDocxHtml] = useState(restoredState.docxHtml);
  const [extractedImages, setExtractedImages] = useState(restoredState.extractedImages);

  useEffect(() => {
    return pdfViewerStateStore.subscribe((state) => {
      setPages(state.pages);
      setStatus(state.status);
      setIsDragging(state.isDragging);
      setFileName(state.fileName);
      setIsProcessing(state.isProcessing);
      setExtractedText(state.extractedText);
      setActiveTab(state.activeTab);
      setFileSize(state.fileSize);
      setHasFile(state.hasFile);
      setFileType(state.fileType);
      setDocxHtml(state.docxHtml);
      setExtractedImages(state.extractedImages);
    });
  }, []);

  useEffect(() => {
    pdfViewerStateStore.setState({
      pages,
      status,
      isDragging,
      fileName,
      isProcessing,
      extractedText,
      activeTab,
      fileSize,
      hasFile,
      fileType,
      docxHtml,
      extractedImages,
    });
  }, [
    pages,
    status,
    isDragging,
    fileName,
    isProcessing,
    extractedText,
    activeTab,
    fileSize,
    hasFile,
    fileType,
    docxHtml,
    extractedImages,
  ]);

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
    setFileType(type);
    setDocxHtml("");
    setExtractedImages([]);

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
      setStatus("Ready to convert");
    } catch (error) {
      console.error("Error processing file:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ---- PDF handling ----
  const handlePDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const pageImages = [];
      let fullPlainText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        setStatus(`Rendering page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        pageImages.push(canvas.toDataURL("image/jpeg", 0.95));

        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullPlainText += pageText + "\n\n";
      }

      setPages(pageImages);
      setExtractedText(fullPlainText.trim());
      setStatus(`Ready to convert`);
    } catch (error) {
      console.error("PDF processing error:", error);
      throw new Error("Failed to process PDF file. It may be corrupted or password protected.");
    }
  };

  // ---- Image handling ----
  const handleImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target.result;
        setPages([imageData]);
        setExtractedText("");
        resolve();
      };
      reader.readAsDataURL(file);
    });
  };

  // ---- DOCX handling ----
  const handleDOCX = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();

      const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

      const zip = await JSZip.loadAsync(arrayBuffer);
      const imageUrls = [];
      const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith("word/media/"));
      for (const mediaPath of mediaFiles) {
        const blob = await zip.files[mediaPath].async("blob");
        const url = URL.createObjectURL(blob);
        imageUrls.push(url);
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 800;
      canvas.height = Math.max(1000, rawText.split("\n").length * 20 + 50);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      const lines = rawText.split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, 20, 30 + i * 20);
      });
      setPages([canvas.toDataURL("image/jpeg", 0.95)]);
      setExtractedText(rawText);
      setDocxHtml(html);
      setExtractedImages(imageUrls);
    } catch (error) {
      console.error("DOCX processing error:", error);
      throw new Error("Failed to process DOCX file.");
    }
  };

  // ---- TXT handling ----
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

  // ---- DOCX → PDF using html2canvas (preserve aspect ratio) ----
  const convertDocxToPdf = async () => {
    if (!docxHtml) {
      setStatus("No HTML content available for DOCX conversion.");
      return;
    }

    setStatus("Rendering DOCX to PDF...");

    try {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "794px";
      container.style.backgroundColor = "white";
      container.style.padding = "0";
      container.innerHTML = docxHtml;
      document.body.appendChild(container);

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");

      // Preserve aspect ratio and center
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;
      const pageRatio = pageWidth / pageHeight;

      let width, height;
      if (imgRatio > pageRatio) {
        width = pageWidth;
        height = pageWidth / imgRatio;
      } else {
        height = pageHeight;
        width = pageHeight * imgRatio;
      }

      const x = (pageWidth - width) / 2;
      const y = (pageHeight - height) / 2;

      pdf.addImage(imgData, "JPEG", x, y, width, height);
      pdf.save(`${fileName.replace(/\.[^/.]+$/, "")}-docx-converted.pdf`);

      setStatus("Ready to convert");
    } catch (error) {
      console.error("DOCX to PDF error:", error);
      setStatus("Failed to convert DOCX to PDF");
    }
  };

  // ---- downloadAsPDF (for non-DOCX files) ----
  const downloadAsPDF = async () => {
    if (!pages.length) return;

    if (fileType === "docx") {
      await convertDocxToPdf();
      return;
    }

    setStatus("Creating searchable PDF...");

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageTexts = extractedText.split("\n\n");

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();

        const imgData = pages[i];
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Preserve aspect ratio and center
        const imgProps = pdf.getImageProperties(imgData);
        const imgRatio = imgProps.width / imgProps.height;
        const pageRatio = pageWidth / pageHeight;

        let width, height;
        if (imgRatio > pageRatio) {
          width = pageWidth;
          height = pageWidth / imgRatio;
        } else {
          height = pageHeight;
          width = pageHeight * imgRatio;
        }

        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        pdf.addImage(imgData, "JPEG", x, y, width, height);

        const text = pageTexts[i] || "No text extracted";
        pdf.setFont("Times", "Normal");
        pdf.setFontSize(8);
        const splitText = pdf.splitTextToSize(text, 190);
        pdf.text(splitText, 10, 10);
      }

      pdf.save(`${fileName.replace(/\.[^/.]+$/, "")}-searchable.pdf`);
      setStatus("Ready to convert");
    } catch (err) {
      console.error(err);
      setStatus("PDF failed");
    }
  };

  // ---- downloadAsDOCX: FIXED version ----
  const downloadAsDOCX = async () => {
    if (!pages.length) return;

    setStatus("Creating exact DOCX copy...");

    try {
      const children = [];

      for (let i = 0; i < pages.length; i++) {
        const base64 = pages[i];
        const base64Data = base64.split(",")[1];
        if (!base64Data || base64Data.length < 100) continue;

        // 1. Detect image type from data URL
        const mimeMatch = base64.match(/^data:(image\/[a-zA-Z]+);base64,/);
        const type = mimeMatch ? mimeMatch[1].split('/')[1] : 'jpg'; // 'png', 'jpeg', etc.

        const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        const imageRun = new ImageRun({
          data: imageBuffer,
          type: type,               // now dynamic
          transformation: {
            width: 794,             // A4 width in twips (≈1:√2)
            height: 1123,
          },
        });

        const paragraph = new Paragraph({
          pageBreakBefore: i > 0,
          spacing: {
            before: 0,
            after: 0,
          },
          children: [imageRun],
        });

        children.push(paragraph);
      }

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                },
              },
            },
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileName.replace(/\.[^/.]+$/, "")}-exact.docx`);

      setStatus("Ready to convert");
    } catch (err) {
      console.error(err);
      setStatus("DOCX failed: " + err.message);
    }
  };

  // ---- JPG, PNG, TXT exports ----
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
      setStatus("Ready to convert");
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
      setStatus("Ready to convert");
    } catch (error) {
      setStatus("Error converting to PNG", error);
    }
  };

  const downloadAsTXT = async () => {
    if (!pages.length) return;
    setStatus("Converting to TXT...");
    try {
      let textContent = extractedText || "No text could be extracted from the document.";
      const header = `File: ${fileName}
Converted: ${new Date().toLocaleString()}
Total Pages: ${pages.length}
File Size: ${formatFileSize(fileSize)}
---
\n`;
      const fullText = header + textContent;
      const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
      saveAs(blob, `${fileName.replace(/\.[^/.]+$/, "")}-converted.txt`);
      setStatus("Ready to convert");
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
    extractedImages.forEach(url => URL.revokeObjectURL(url));
    pdfViewerStateStore.reset();
    setPages([]);
    setFileName("");
    setStatus("");
    setExtractedText("");
    setFileSize(0);
    setHasFile(false);
    setFileType(null);
    setDocxHtml("");
    setExtractedImages([]);
  };

  const handleNewFile = () => {
    clearFiles();
  };

  const conversionOptions = [
    { name: "JPG", icon: Image, color: "emerald", action: downloadAsJPG },
    { name: "PNG", icon: FileImage, color: "emerald", action: downloadAsPNG },
    { name: "PDF", icon: FileText, color: "blue", action: downloadAsPDF },
    { name: "DOCX", icon: FileArchive, color: "indigo", action: downloadAsDOCX },
    { name: "TXT", icon: FileDown, color: "slate", action: downloadAsTXT },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Processing Bar */}
      {isProcessing && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {!hasFile && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-3xl">
              <div
                className={`relative bg-white rounded-3xl shadow-xl border-2 transition-all duration-300 ${
                  isDragging
                    ? "border-indigo-500 border-dashed scale-[1.02] shadow-2xl"
                    : "border-slate-200 border-dashed"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                <div className="p-8 sm:p-12 lg:p-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md">
                    <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                    {isDragging ? "Drop your file here" : "Drop a file or click to browse"}
                  </h2>
                  <p className="text-slate-500 mb-6 text-sm sm:text-base">
                    Supports PDF, DOCX, JPG, PNG, TXT — up to 50MB
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,image/*"
                      className="hidden"
                      id="fileInput"
                      onChange={(e) => e.target.files.length && handleFile(e.target.files[0])}
                    />
                    <label
                      htmlFor="fileInput"
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all cursor-pointer w-full sm:w-auto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Choose File
                    </label>
                    <span className="text-sm text-slate-400">or drag & drop anywhere</span>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center mt-8">
                    {["PDF", "DOCX", "JPG", "PNG", "TXT"].map((format) => (
                      <span key={format} className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {hasFile && pages.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - File Info & Conversion */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Compact File Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <h3 className="font-bold text-slate-800 truncate text-sm">{fileName}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatFileSize(fileSize)} • {fileType?.toUpperCase()} • {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={handleNewFile}
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors p-1.5 rounded-lg"
                        title="Convert new file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        onClick={clearFiles}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors p-1.5 rounded-lg"
                        title="Clear file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status message (one-liner) */}
                {!isProcessing && status && !status.includes("Error") && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Ready to convert</span>
                  </div>
                )}

                {/* Conversion Buttons - horizontal grid */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <h3 className="font-bold text-slate-800 mb-3 text-sm">Convert to</h3>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {conversionOptions.map((option) => (
                      <button
                        key={option.name}
                        onClick={() => handleDownloadAction(option.action)}
                        disabled={isProcessing}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:scale-[1.02] active:scale-95 ${
                          option.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                          option.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                          option.color === 'indigo' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' :
                          'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <option.icon className="w-5 h-5" />
                        <span>{option.name}</span>
                      </button>
                    ))}
                  </div>

                  {!isSignedIn && (
                    <div className="mt-3 p-2 bg-amber-50 rounded-xl border border-amber-100 text-center">
                      <p className="text-xs text-amber-700 font-medium">
                        🔒 Sign in to enable downloads
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview / Text Area - larger */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                {/* Tabs */}
                <div className="border-b border-slate-200 bg-slate-50/80">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
                        activeTab === "preview"
                          ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Preview</span>
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab("text")}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-all border-l border-slate-200 ${
                        activeTab === "text"
                          ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">Text</span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 flex-1 overflow-y-auto max-h-[600px]">
                  {activeTab === "preview" ? (
                    <div className="space-y-4">
                      {pages.map((src, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100 shadow-sm">
                          <div className="text-center text-xs text-slate-400 mb-2 font-medium tracking-wide">
                            Page {i + 1} of {pages.length}
                          </div>
                          <img
                            src={src}
                            alt={`Page ${i + 1}`}
                            className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
                          />
                        </div>
                      ))}

                      {extractedImages.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 shadow-sm">
                          <div className="text-center text-xs text-slate-400 mb-2 font-medium tracking-wide">
                            Embedded Images ({extractedImages.length})
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {extractedImages.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Embedded ${idx+1}`}
                                className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full">
                      {extractedText ? (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 h-full">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                            {extractedText}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center py-12 flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📄</span>
                          </div>
                          <p className="text-slate-600 font-semibold">No text extracted yet</p>
                          <p className="text-sm text-slate-400 mt-1">
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