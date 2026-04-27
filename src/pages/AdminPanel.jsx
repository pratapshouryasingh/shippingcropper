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
  const [deleteFromBackend, setDeleteFromBackend] = useState(false);

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@example.com";
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  const tools = ["All Files", "FlipkartCropper", "MeshooCropper", "JioMartCropper", "FrontendCropper"];

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
    console.log("🔄 Fetching user history...");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/all-history`);
      const data = await res.json();
      
      if (data.success && Array.isArray(data.history)) {
        setAllHistory(data.history);
        console.log(`✅ Loaded history for ${data.history.length} jobs from all users`);
        
        if (data.history.length > 0) {
          console.log("📋 Sample job from history:", data.history[0]);
        }
      } else {
        console.error("❌ Admin history endpoint failed");
        setAllHistory([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch all users history:", err);
      setAllHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Extract jobId directly from blob path
  const extractJobIdFromPath = (blobPath) => {
    if (!blobPath) return null;
    const match = blobPath.match(/job_\d+/);
    return match ? match[0] : null;
  };

  // Find matching job from history
  const findMatchingJobById = (jobId) => {
    if (!jobId || allHistory.length === 0) return null;
    return allHistory.find(job => job.jobId === jobId);
  };

  // Get tool icon
  const getToolIcon = (toolName) => {
    const icons = {
      FlipkartCropper: "🛍️",
      MeshooCropper: "🏪",
      JioMartCropper: "📱",
      FrontendCropper: "✂️",
      SelectionCropper: "✂️"
    };
    return icons[toolName] || "🛠️";
  };

  // Get user display name
  const getUserDisplay = (job) => {
    if (!job) return "Unknown User";
    if (job.userEmail) return job.userEmail;
    if (job.userName) return job.userName;
    if (job.userId) return `User: ${job.userId.substring(0, 8)}...`;
    return "Unknown User";
  };

  // 🔥 NEW: Fetch files from BACKEND API instead of direct blob
  const fetchFiles = async () => {
    console.log("🚀 fetchFiles called - using backend API");
    setLoading(true);
    try {
      // Call backend API endpoint
      const response = await fetch(`${API_BASE_URL}/api/admin/files`);
      
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("📦 Backend response:", data);
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch files");
      }
      
      // Parse files from backend response
      const parsedFiles = data.files.map(file => {
        const jobId = extractJobIdFromPath(file.name);
        const matchingJob = findMatchingJobById(jobId);
        
        let tool = "Unknown";
        let userId = "unknown";
        let userName = "Unknown User";
        
        if (matchingJob) {
          tool = matchingJob.toolName || "Unknown";
          userId = matchingJob.userId || "unknown";
          userName = getUserDisplay(matchingJob);
        }
        
        return {
          name: file.name.split('/').pop(),
          fullPath: file.name,
          size: file.size || 0,
          url: file.url, // URL from backend (may have SAS or public URL)
          tool: tool,
          jobId: jobId || "unknown",
          userId: userId,
          userName: userName,
          lastModified: file.lastModified,
          toolIcon: getToolIcon(tool),
        };
      });
      
      setFiles(parsedFiles);
      
      const matchedCount = parsedFiles.filter(f => f.tool !== "Unknown").length;
      const unknownCount = parsedFiles.filter(f => f.tool === "Unknown").length;
      console.log(`📊 Matching Stats: ${matchedCount} matched, ${unknownCount} unknown out of ${parsedFiles.length} total files`);
      
    } catch (err) {
      console.error("❌ Fetch files error:", err);
      alert(`Failed to fetch files: ${err.message}`);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW: Delete file using backend API
  const handleDelete = async (file, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm(`Are you sure you want to delete ${file.name}?`)) return;
    
    setDeleting(true);
    try {
      // Extract tool name from file
      const toolName = file.tool;
      const jobId = file.jobId;
      const filename = encodeURIComponent(file.name);
      
      // Call backend delete endpoint
      const deleteUrl = `${API_BASE_URL}/api/admin/files/${toolName}/${jobId}/${filename}`;
      console.log("🗑️ Deleting:", deleteUrl);
      
      const response = await fetch(deleteUrl, { method: "DELETE" });
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Delete successful:", result);
        
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

  // Delete selected files
  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) {
      alert("No files selected");
      return;
    }
    
    if (!window.confirm(`Delete ${selectedFiles.length} selected files?`)) return;
    
    setDeleting(true);
    let successCount = 0;
    
    for (const file of selectedFiles) {
      try {
        const toolName = file.tool;
        const jobId = file.jobId;
        const filename = encodeURIComponent(file.name);
        const deleteUrl = `${API_BASE_URL}/api/admin/files/${toolName}/${jobId}/${filename}`;
        
        const response = await fetch(deleteUrl, { method: "DELETE" });
        
        if (response.ok) {
          successCount++;
          setFiles(prevFiles => prevFiles.filter(f => f.fullPath !== file.fullPath));
        }
      } catch (err) {
        console.error(`Failed to delete ${file.name}:`, err);
      }
    }
    
    setSelectedFiles([]);
    setDeleting(false);
    alert(`Successfully deleted ${successCount} of ${selectedFiles.length} files`);
  };

  // Delete all files in current tab
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

    setDeleting(true);
    let successCount = 0;
    
    for (const file of filesToDelete) {
      try {
        const toolName = file.tool;
        const jobId = file.jobId;
        const filename = encodeURIComponent(file.name);
        const deleteUrl = `${API_BASE_URL}/api/admin/files/${toolName}/${jobId}/${filename}`;
        
        const response = await fetch(deleteUrl, { method: "DELETE" });
        
        if (response.ok) {
          successCount++;
          setFiles(prevFiles => prevFiles.filter(f => f.fullPath !== file.fullPath));
        }
      } catch (err) {
        console.error(`Failed to delete ${file.name}:`, err);
      }
    }
    
    setSelectedFiles([]);
    setDeleting(false);
    alert(`Successfully deleted ${successCount} of ${filesToDelete.length} files`);
  };

  // Download selected files as zip
  const handleDownloadSelected = async () => {
    if (!selectedFiles.length) {
      alert("No files selected");
      return;
    }
    
    const zip = new JSZip();
    let downloadCount = 0;
    
    try {
      for (const file of selectedFiles) {
        try {
          const response = await fetch(file.url);
          if (response.ok) {
            const blob = await response.blob();
            zip.file(file.name, blob);
            downloadCount++;
          } else {
            console.warn(`Failed to fetch ${file.name}: ${response.status}`);
          }
        } catch (err) {
          console.error(`Error downloading ${file.name}:`, err);
        }
      }
      
      if (downloadCount > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `selected_files_${Date.now()}.zip`);
        alert(`Downloaded ${downloadCount} of ${selectedFiles.length} files successfully`);
      } else {
        alert("No files could be downloaded");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to download selected files");
    }
  };

  // Download all files in current tab as zip
  const handleDownloadAll = async () => {
    const filesToDownload = activeTab === "All Files" 
      ? files 
      : files.filter(f => f.tool === activeTab);
    
    if (!filesToDownload.length) {
      alert("No files to download");
      return;
    }
    
    const zip = new JSZip();
    let downloadCount = 0;
    
    try {
      for (const file of filesToDownload) {
        try {
          const response = await fetch(file.url);
          if (response.ok) {
            const blob = await response.blob();
            zip.file(file.name, blob);
            downloadCount++;
          } else {
            console.warn(`Failed to fetch ${file.name}: ${response.status}`);
          }
        } catch (err) {
          console.error(`Error downloading ${file.name}:`, err);
        }
      }
      
      if (downloadCount > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${activeTab === "All Files" ? "all_files" : activeTab}_${Date.now()}.zip`);
        alert(`Downloaded ${downloadCount} of ${filesToDownload.length} files successfully`);
      } else {
        alert("No files could be downloaded");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to download files");
    }
  };

  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      console.log("🔐 Logged in, fetching data...");
      fetchAllUsersHistory();
      fetchFiles();
    }
  }, [isLoggedIn]);

  // Refetch files when history loads to update matching
  useEffect(() => {
    if (isLoggedIn && !historyLoading && files.length > 0) {
      console.log("🔄 History loaded, refreshing files to update matching...");
      fetchFiles();
    }
  }, [historyLoading]);

  // Format utilities
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const getFileDate = (lastModified) => {
    if (!lastModified) return "N/A";
    const date = new Date(lastModified);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const toggleSelectFile = (file) => {
    if (selectedFiles.find(f => f.fullPath === file.fullPath)) {
      setSelectedFiles(selectedFiles.filter(f => f.fullPath !== file.fullPath));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  // Statistics
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const filesToday = files.filter(f => {
    if (!f.lastModified) return false;
    const date = new Date(f.lastModified).toISOString().slice(0, 10);
    return date === todayStr;
  }).length;
  
  const filesThisMonth = files.filter(f => {
    if (!f.lastModified) return false;
    const date = new Date(f.lastModified).toISOString().slice(0, 7);
    return date === currentMonth;
  }).length;
  
  const filteredFiles = activeTab === "All Files" 
    ? files 
    : files.filter(f => f.tool === activeTab);
  
  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const maxSpace = 5 * 1024 * 1024 * 1024;

  const pdfCount = files.filter(f => f.name?.endsWith(".pdf")).length;
  const excelCount = files.filter(f => f.name?.endsWith(".xlsx")).length;

  const toolCounts = ["FlipkartCropper", "MeshooCropper", "JioMartCropper", "FrontendCropper"].map(tool => 
    files.filter(f => f.tool === tool).length
  );
  
  const pieData = {
    labels: ["FlipkartCropper", "MeshooCropper", "JioMartCropper", "FrontendCropper"],
    datasets: [
      {
        data: toolCounts,
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
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
              {tool === "All Files" ? "📁 All Files" : tool === "FlipkartCropper" ? "🛍️ Flipkart" : tool === "MeshooCropper" ? "🏪 Meesho" : tool === "JioMartCropper" ? "📱 JioMart" : "✂️ Cropper"}
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
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">Loading files from server...</p>
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
                        <span className={`px-2 py-0.5 rounded ${file.tool === "Unknown" ? "bg-red-100 text-red-700" : "bg-gray-100"}`}>
                          🔧 {file.tool}
                        </span>
                        <span className={`px-2 py-0.5 rounded ${file.userName === "Unknown User" ? "bg-red-100 text-red-700" : "bg-gray-100"}`}>
                          👤 {file.userName}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded font-mono">🆔 {file.jobId !== "unknown" ? file.jobId : "N/A"}</span>
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
              <p className="text-gray-500">No files found in the system</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}