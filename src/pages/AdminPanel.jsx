import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("All Files");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [allHistory, setAllHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@example.com";
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
  const BLOB_BASE_URL = import.meta.env.VITE_BLOB_BASE_URL;
  let BLOB_SAS_TOKEN = import.meta.env.VITE_BLOB_SAS_TOKEN || "";

  const tools = ["All Files", "FlipkartCropper", "MeshooCropper", "JioMartCropper"];

  // Clean SAS token (remove leading ? if present)
  const cleanSasToken = () => {
    if (BLOB_SAS_TOKEN.startsWith("?")) {
      return BLOB_SAS_TOKEN.substring(1);
    }
    return BLOB_SAS_TOKEN;
  };

  // Handle login function
  const handleLogin = (e) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
  };

  // Fetch ALL users' history data (admin endpoint)
  const fetchAllUsersHistory = async () => {
    setHistoryLoading(true);
    try {
      // Use admin endpoint to get all users' history
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/all-history`);
      const data = await res.json();
      
      if (data.success && Array.isArray(data.history)) {
        setAllHistory(data.history);
        console.log(`Loaded history for ${data.history.length} jobs from all users`);
      } else {
        console.error("Admin history endpoint not found. Please create /api/admin/all-history");
        setAllHistory([]);
      }
    } catch (err) {
      console.error("Failed to fetch all users history:", err);
      setAllHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Extract timestamp from filename (format: *_YYYY-MM-DD_HH-MM-SS.*)
  const extractTimestampFromFilename = (filename) => {
    const match = filename.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
    if (match) {
      return match[1].replace(/_/g, ' ').replace(/-/g, ':');
    }
    return null;
  };

  // Parse date from various formats
  const parseJobDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      if (dateStr.includes('T')) {
        return new Date(dateStr);
      }
      const [date, time] = dateStr.split(' ');
      if (date && time) {
        const [year, month, day] = date.split('-');
        const [hour, minute, second] = time.split(':');
        return new Date(year, month - 1, day, hour, minute, second);
      }
    } catch (e) {
      console.error("Date parse error:", e);
    }
    return null;
  };

  // Find which job produced this file by matching timestamps across all users
  const findMatchingJob = (filename, blobDate) => {
    const fileTimestamp = extractTimestampFromFilename(filename);
    
    // Try to find a job with matching timestamp from any user
    for (const job of allHistory) {
      const jobDate = parseJobDate(job.timestamp);
      if (!jobDate) continue;
      
      // If file has timestamp, compare with job timestamp (within 2 minutes window)
      if (fileTimestamp) {
        const fileDate = parseJobDate(fileTimestamp);
        if (fileDate && Math.abs(jobDate - fileDate) < 120000) { // Within 2 minutes
          return job;
        }
      }
      
      // Check if filename contains jobId
      if (job.jobId && filename.includes(job.jobId)) {
        return job;
      }
      
      // Check output files in job
      if (job.outputs && Array.isArray(job.outputs)) {
        const matchingOutput = job.outputs.find(out => out.name === filename);
        if (matchingOutput) {
          return job;
        }
      }
    }
    
    return null;
  };

  // Get tool icon
  const getToolIcon = (toolName) => {
    const icons = {
      FlipkartCropper: "🛍️",
      MeshooCropper: "🏪",
      JioMartCropper: "📱",
      SelectionCropper: "✂️"
    };
    return icons[toolName] || "🛠️";
  };

  // Direct BLOB fetch with CORRECT query string
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const cleanSas = cleanSasToken();
      const url = `${BLOB_BASE_URL}?restype=container&comp=list&${cleanSas}`;
      
      console.log("Fetching from URL:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log("Response XML:", text);
      
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");
      
      const errorCode = xml.getElementsByTagName("Code")[0]?.textContent;
      if (errorCode) {
        console.error("Azure Error:", errorCode);
        alert(`Azure Storage Error: ${errorCode}. Please check your SAS token and permissions.`);
        setFiles([]);
        setLoading(false);
        return;
      }

      const blobs = Array.from(xml.getElementsByTagName("Blob"));
      
      const parsedFiles = blobs.map((blob) => {
        const name = blob.getElementsByTagName("Name")[0]?.textContent || "";
        const size = blob.getElementsByTagName("Content-Length")[0]?.textContent || "0";
        const lastModified = blob.getElementsByTagName("Last-Modified")[0]?.textContent;
        
        // Find matching job from all users' history
        const matchingJob = findMatchingJob(name, lastModified);
        
        let tool = "Unknown";
        let jobId = "unknown";
        let userId = "unknown";
        let userName = "Unknown User";
        
        if (matchingJob) {
          tool = matchingJob.toolName || "Unknown";
          jobId = matchingJob.jobId || "unknown";
          userId = matchingJob.userId || "unknown";
          userName = matchingJob.userEmail || matchingJob.userName || "Unknown User";
          console.log(`Matched ${name} -> User: ${userName}, Tool: ${tool}, Job: ${jobId}`);
        }
        
        return {
          name: name,
          fullPath: name,
          size: parseInt(size, 10) || 0,
          url: `${BLOB_BASE_URL}/${encodeURIComponent(name)}?${cleanSas}`,
          tool: tool,
          jobId: jobId,
          userId: userId,
          userName: userName,
          lastModified: lastModified,
          toolIcon: getToolIcon(tool),
        };
      });
      
      // Sort files by last modified date (newest first)
      parsedFiles.sort((a, b) => {
        const dateA = new Date(a.lastModified);
        const dateB = new Date(b.lastModified);
        return dateB - dateA;
      });
      
      setFiles(parsedFiles);
    } catch (err) {
      console.error("Blob fetch error:", err);
      alert(`Failed to fetch files: ${err.message}`);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete with proper URL construction
  const handleDelete = async (file, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm(`Are you sure you want to delete ${file.name}?`)) return;
    
    setDeleting(true);
    try {
      const cleanSas = cleanSasToken();
      const deleteUrl = `${BLOB_BASE_URL}/${encodeURIComponent(file.fullPath)}?${cleanSas}`;
      
      const response = await fetch(deleteUrl, { method: "DELETE" });
      
      if (response.ok || response.status === 202 || response.status === 204) {
        setFiles(prevFiles => prevFiles.filter(f => f.fullPath !== file.fullPath));
        setSelectedFiles(prev => prev.filter(f => f.fullPath !== file.fullPath));
        if (!skipConfirm) alert(`${file.name} deleted successfully`);
      } else {
        const errorText = await response.text();
        console.error("Delete failed:", errorText);
        if (!skipConfirm) alert(`Failed to delete: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      if (!skipConfirm) alert("Error deleting file. Check console for details.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selectedFiles.length} selected files?`)) return;
    
    for (const file of selectedFiles) {
      await handleDelete(file, true);
    }
    setSelectedFiles([]);
    alert(`Successfully deleted ${selectedFiles.length} files`);
  };

  const handleDeleteAll = async () => {
    const filesToDelete = activeTab === "All Files" 
      ? files 
      : files.filter(f => f.tool === activeTab);
    
    if (!filesToDelete.length) {
      alert("No files to delete");
      return;
    }

    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete ALL ${filesToDelete.length} files? This action cannot be undone.`)) {
      return;
    }

    for (const file of filesToDelete) {
      await handleDelete(file, true);
    }
    setSelectedFiles([]);
    alert(`Successfully deleted ${filesToDelete.length} files`);
  };

  const handleDownloadSelected = async () => {
    if (!selectedFiles.length) return;
    
    const zip = new JSZip();
    try {
      await Promise.all(selectedFiles.map(async (file) => {
        const response = await fetch(file.url);
        if (!response.ok) throw new Error(`Failed to fetch ${file.name}`);
        const blob = await response.blob();
        zip.file(file.name, blob);
      }));
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `selected_files_${Date.now()}.zip`);
      alert(`Downloaded ${selectedFiles.length} files successfully`);
    } catch (err) {
      console.error(err);
      alert("Failed to download selected files");
    }
  };

  const handleDownloadAll = async () => {
    const filesToDownload = activeTab === "All Files" 
      ? files 
      : files.filter(f => f.tool === activeTab);
    
    if (!filesToDownload.length) {
      alert("No files to download");
      return;
    }
    
    const zip = new JSZip();
    try {
      await Promise.all(filesToDownload.map(async (file) => {
        const response = await fetch(file.url);
        if (!response.ok) throw new Error(`Failed to fetch ${file.name}`);
        const blob = await response.blob();
        zip.file(file.name, blob);
      }));
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${activeTab === "All Files" ? "all_files" : activeTab}_${Date.now()}.zip`);
      alert(`Downloaded ${filesToDownload.length} files successfully`);
    } catch (err) {
      console.error(err);
      alert("Failed to download all files");
    }
  };

  // Fetch history first, then fetch files
  useEffect(() => {
    if (isLoggedIn) {
      fetchAllUsersHistory();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && BLOB_BASE_URL && BLOB_SAS_TOKEN && !historyLoading) {
      fetchFiles();
    }
  }, [isLoggedIn, historyLoading]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const getFileDate = (lastModified) => {
    if (!lastModified) return "N/A";
    const date = new Date(lastModified);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const toggleSelectFile = (file) => {
    if (selectedFiles.find(f => f.fullPath === file.fullPath)) {
      setSelectedFiles(selectedFiles.filter(f => f.fullPath !== file.fullPath));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const filesToday = files.filter(f => {
    const date = new Date(f.lastModified).toISOString().slice(0, 10);
    return date === todayStr;
  }).length;
  const filesThisMonth = files.filter(f => {
    const date = new Date(f.lastModified).toISOString().slice(0, 7);
    return date === currentMonth;
  }).length;

  const filteredFiles = activeTab === "All Files" 
    ? files 
    : files.filter(f => f.tool === activeTab);
  
  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const maxSpace = 5 * 1024 * 1024 * 1024;

  const pdfCount = files.filter(f => f.name.endsWith(".pdf")).length;
  const excelCount = files.filter(f => f.name.endsWith(".xlsx")).length;

  const toolCounts = ["FlipkartCropper", "MeshooCropper", "JioMartCropper"].map(tool => 
    files.filter(f => f.tool === tool).length
  );
  
  const pieData = {
    labels: ["FlipkartCropper", "MeshooCropper", "JioMartCropper"],
    datasets: [
      {
        data: toolCounts,
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: "Files Distribution by Tool" },
    },
  };

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <form onSubmit={handleLogin} className="p-8 shadow-lg rounded-xl bg-white w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Login</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  // Main admin panel
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">🛒 E-Commerce Cropper Admin</h2>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="w-full lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Today's Files", value: filesToday, icon: "📊", bg: "bg-blue-100" },
              { label: "This Month", value: filesThisMonth, icon: "📅", bg: "bg-green-100" },
              { label: "Total Files", value: totalFiles, icon: "🗂️", bg: "bg-purple-100", extra: `PDF: ${pdfCount} | Excel: ${excelCount}` },
              { label: "Storage Used", value: formatSize(totalSizeBytes), icon: "💾", bg: "bg-yellow-100", extra: `/ ${formatSize(maxSpace)}` }
            ].map((card, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg mr-4 ${card.bg}`}><span className="text-2xl">{card.icon}</span></div>
                  <div>
                    <p className="text-sm text-gray-900">{card.label}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{card.value} {card.extra && <span className="text-sm font-normal">{card.extra}</span>}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="w-full lg:w-1/2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 flex-wrap">
          {tools.map(tool => (
            <button 
              key={tool} 
              onClick={() => setActiveTab(tool)} 
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tool ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tool === "All Files" ? "📁 All Files" : tool === "FlipkartCropper" ? "🛍️ Flipkart" : tool === "MeshooCropper" ? "🏪 Meesho" : "📱 JioMart"}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button
            onClick={handleDownloadAll}
            disabled={loading || deleting || filteredFiles.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition duration-200 disabled:opacity-50"
          >
            📥 Download All ({filteredFiles.length})
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={loading || deleting || filteredFiles.length === 0}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition duration-200 disabled:opacity-50"
          >
            🗑️ Delete All ({filteredFiles.length})
          </button>
          {selectedFiles.length > 0 && (
            <>
              <button 
                onClick={handleDownloadSelected} 
                disabled={loading || deleting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition duration-200"
              >
                📥 Download Selected ({selectedFiles.length})
              </button>
              <button 
                onClick={handleDeleteSelected} 
                disabled={loading || deleting}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg transition duration-200"
              >
                🗑️ Delete Selected ({selectedFiles.length})
              </button>
            </>
          )}
        </div>

        {/* File List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading || historyLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">{historyLoading ? "Loading user history..." : "Loading files from Azure Blob..."}</p>
            </div>
          ) : filteredFiles.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {filteredFiles.map((file, idx) => (
                <li key={idx} className="p-4 hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input 
                      type="checkbox" 
                      checked={!!selectedFiles.find(f => f.fullPath === file.fullPath)} 
                      onChange={() => toggleSelectFile(file)} 
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{file.toolIcon}</span>
                        <span className="font-semibold text-gray-800 truncate">{file.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-gray-100 rounded">🔧 {file.tool}</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded">👤 {file.userName}</span>
                        <span>🆔 {file.jobId !== "unknown" ? file.jobId.substring(0, 20) : "N/A"}</span>
                        <span>💾 {formatSize(file.size)}</span>
                        <span>📅 {getFileDate(file.lastModified)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm transition duration-200"
                      download
                    >
                      📥 Download
                    </a>
                    <button 
                      onClick={() => handleDelete(file)} 
                      disabled={deleting}
                      className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition duration-200 disabled:opacity-50"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📁</div>
              <h3 className="text-lg font-medium text-gray-700">No files found</h3>
              <p className="text-gray-500">No files found in Azure Blob Storage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}