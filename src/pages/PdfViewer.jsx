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
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const getFileType = (file) => {
    if (file.type === "application/pdf") return "pdf";
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      return "docx";
    if (file.type === "text/plain") return "txt";
    // Fallback for files that might not have the correct type
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

  const handleFile = async (file) => {
    const type = getFileType(file);
    if (!type) {
      setStatus("Unsupported file type.");
      return;
    }

    setFileName(file.name);
    setStatus(`Loading ${type.toUpperCase()}...`);
    setIsProcessing(true);
    
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
        
        // Create a promise to handle the rendering
        await new Promise((resolve) => {
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport
          };
          page.render(renderContext).promise.then(() => {
            // Add a small delay to ensure rendering is complete
            setTimeout(() => {
              imgs.push(canvas.toDataURL("image/jpeg", 0.95));
              resolve();
            }, 50);
          });
        });
      }
      setPages(imgs);
    } catch (error) {
      console.error("PDF processing error:", error);
      throw new Error("Failed to process PDF file. It may be corrupted or password protected.");
    }
  };

  const handleImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPages([e.target.result]);
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
    } catch (error) {
      console.error("TXT processing error:", error);
      throw new Error("Failed to process text file.");
    }
  };

  // Export Functions
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
      setStatus("Error converting to JPG",error);
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
      setStatus("Error converting to PNG",error);
    }
  };

const downloadAsDOCX = async () => {
  if (!pages.length) return;
  setStatus("Converting to DOCX...");

  try {
    const children = [];

    for (let i = 0; i < pages.length; i++) {
      const base64Data = pages[i].split(",")[1];
      const imageData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageData,
              transformation: {
                width: 500, // scale to fit nicely
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
    saveAs(blob, `${fileName.replace(/\.[^/.]+$/, "")}-converted.docx`);
    setStatus("Conversion to DOCX complete!");
  } catch (error) {
    console.error("DOCX conversion error:", error);
    setStatus("Error converting to DOCX");
  }
};


  const downloadAsPDF = async () => {
    if (!pages.length) return;
    setStatus("Converting to PDF...");
    
    try {
      const pdf = new jsPDF();
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(pages[i], "JPEG", 10, 10, 190, 0);
      }
      pdf.save(`${fileName.replace(/\.[^/.]+$/, "")}-converted.pdf`);
      setStatus("Conversion to PDF complete!");
    } catch (error) {
      setStatus("Error converting to PDF",error);
    }
  };

  const downloadAsTXT = async () => {
    if (!pages.length) return;
    setStatus("Converting to TXT...");
    
    try {
      // For demonstration purposes - in a real app you'd use OCR
      const text = "Text extracted from document would appear here. For actual text extraction, OCR functionality would be needed.";
      const blob = new Blob([text], { type: "text/plain" });
      saveAs(blob, `${fileName.replace(/\.[^/.]+$/, "")}-converted.txt`);
      setStatus("Conversion to TXT complete!");
    } catch (error) {
      setStatus("Error converting to TXT",error);
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
  };

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mt-8 mb-4">
            Universal File Converter
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert your files between various formats with ease. Upload, preview, and download in your preferred format.
          </p>
        </div>
        
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 mb-8 ${
            isDragging 
              ? "border-blue-500 bg-blue-100 scale-[1.02] shadow-lg" 
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-600"
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
            </div>
            <div>
              <p className="text-xl font-medium text-gray-700 mb-1">
                Drag & drop files here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports PDF, DOCX, JPG, PNG, TXT
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,.txt,image/*"
              className="hidden"
              id="fileInput"
              onChange={(e) => e.target.files.length && handleFile(e.target.files[0])}
            />
            <label
              htmlFor="fileInput"
              className="cursor-pointer inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Browse Files
            </label>
          </div>
        </div>

        {status && (
          <div className="text-center mb-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              status.startsWith("Error") ? "bg-red-100 text-red-800" : 
              status.includes("complete") ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
            }`}>
              {status.startsWith("Error") ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : status.includes("complete") ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 animate-spin" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              )}
              {status}
              {fileName && !status.startsWith("Error") && !status.includes("complete") && (
                <span className="ml-2 text-gray-600">({fileName})</span>
              )}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-center mb-6">
            <div className="relative w-12 h-12">
              <div className="w-full h-full border-4 border-blue-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent rounded-full border-t-blue-600 animate-spin"></div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {pages.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Conversion Options Sidebar */}
            <div className="w-full lg:w-1/4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Conversion Options</h2>
                <button 
                  onClick={clearFiles}
                  className="text-sm text-red-500 hover:text-red-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Clear File
                </button>
              </div>
              
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    Image Formats
                  </h3>
                  <button
                    onClick={() => handleDownloadAction(downloadAsJPG)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 mb-3 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download as JPG
                  </button>
                  <button
                    onClick={() => handleDownloadAction(downloadAsPNG)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download as PNG
                  </button>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Document Formats
                  </h3>
                  <button
                    onClick={() => handleDownloadAction(downloadAsPDF)}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-lg hover:from-red-600 hover:to-pink-600 mb-3 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download as PDF
                  </button>
                  <button
                    onClick={() => handleDownloadAction(downloadAsDOCX)}
                    className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-fuchsia-600 mb-3 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download as DOCX
                  </button>
                  <button
                    onClick={() => handleDownloadAction(downloadAsTXT)}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download as TXT
                  </button>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    File Info
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 flex justify-between">
                      <span className="font-medium">Name:</span> 
                      <span className="truncate max-w-[150px]">{fileName}</span>
                    </p>
                    <p className="text-sm text-gray-600 flex justify-between">
                      <span className="font-medium">Pages:</span> 
                      <span>{pages.length}</span>
                    </p>
                    <p className="text-sm text-gray-600 flex justify-between">
                      <span className="font-medium">Status:</span> 
                      <span className={`${isSignedIn ? 'text-green-600' : 'text-amber-600'}`}>
                        {isSignedIn ? 'Signed In' : 'Not Signed In'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simplified Preview Area */}
            <div className="w-full lg:w-3/4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2h-1.528A6 6 0 014 9.528V4zm2 6a1 1 0 011-1h1.128a1 1 0 01.764.357l1.327 1.527a1 1 0 01.059 1.279l-1.11 1.44a1 1 0 01-1.664.028L7.5 11.5l-1.5 2H6a1 1 0 010-2zm3.5 2a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
                </svg>
                File Preview
              </h2>
              
              <div className="flex items-center justify-center mb-4">
                <span className="text-sm text-gray-500">
                  Showing {pages.length} page{pages.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="overflow-y-auto max-h-[70vh] border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="space-y-4">
                  {pages.map((src, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 shadow-sm">
                      <div className="text-center text-sm text-gray-500 mb-2">
                        Page {i + 1} of {pages.length}
                      </div>
                      <img
                        src={src}
                        alt={`Page ${i + 1}`}
                        className="max-w-full h-auto mx-auto rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">No File Loaded</h2>
            <p className="text-gray-600">
              Upload a file to see preview and conversion options
            </p>
          </div>
        )}
      </div>
    </div>
  );
}