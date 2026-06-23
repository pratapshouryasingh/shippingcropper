import React, { useState, useEffect, useMemo } from "react";
import { Toaster, toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function AdminPanel() {
  // ==================== STATE ====================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeTab, setActiveTab] = useState("All Files");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTool, setFilterTool] = useState("All");
  const [filterUser, setFilterUser] = useState("All");
  const [filterDate, setFilterDate] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");
  const [darkMode, setDarkMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [deletingFileIds, setDeletingFileIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // ==================== CONSTANTS ====================
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@example.com";
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const tools = ["All", "FlipkartCropper", "MeshooCropper", "JioMartCropper", "FrontendCropper"];

  // ==================== HELPERS ====================
  const extractJobIdFromPath = (blobPath) => {
    if (!blobPath) return null;
    const match = blobPath.match(/job_\d+/);
    return match ? match[0] : null;
  };

  const findMatchingJobById = (jobId) => {
    if (!jobId || allHistory.length === 0) return null;
    return allHistory.find(job => job.jobId === jobId);
  };

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

  const getUserDisplay = (job) => {
    if (!job) return "Unknown";
    if (job.userEmail) return job.userEmail;
    if (job.userName) return job.userName;
    if (job.userId) return `User ${job.userId.substring(0, 6)}`;
    return "Unknown";
  };

  const getUserAvatar = (name) => {
    if (!name || name === "Unknown") return "👤";
    return name.charAt(0).toUpperCase();
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  const getFileDate = (lastModified) => {
    if (!lastModified) return "N/A";
    const date = new Date(lastModified);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getFileTime = (lastModified) => {
    if (!lastModified) return "";
    const date = new Date(lastModified);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // ==================== API CALLS ====================
  const fetchAllUsersHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/all-history`);
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setAllHistory(data.history);
      } else {
        setAllHistory([]);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setAllHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/files`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch");

      const parsed = data.files.map(file => {
        const jobId = extractJobIdFromPath(file.name);
        const job = findMatchingJobById(jobId);
        const tool = job?.toolName || "Unknown";
        const userName = job ? getUserDisplay(job) : "Unknown";
        const userId = job?.userId || "unknown";
        return {
          name: file.name.split('/').pop(),
          fullPath: file.name,
          size: file.size || 0,
          url: file.url,
          tool,
          jobId: jobId || "unknown",
          userId,
          userName,
          toolIcon: getToolIcon(tool),
          lastModified: file.lastModified,
          isDeleting: false,
        };
      });
      setFiles(parsed);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (file, skipModal = false) => {
    if (!skipModal) {
      setFileToDelete(file);
      setIsDeleteModalOpen(true);
      return;
    }

    setIsDeletingSingle(true);
    setDeletingFileIds(prev => new Set(prev).add(file.fullPath));

    try {
      const encodedName = encodeURIComponent(file.name);
      const url = `${API_BASE_URL}/api/admin/files/${file.tool}/${file.jobId}/${encodedName}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setFiles(prev => prev.filter(f => f.fullPath !== file.fullPath));
      setSelectedFiles(prev => prev.filter(f => f.fullPath !== file.fullPath));
      toast.success(`“${file.name}” deleted`);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(`Failed to delete “${file.name}”`);
    } finally {
      setIsDeletingSingle(false);
      setDeletingFileIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.fullPath);
        return newSet;
      });
      setIsDeleteModalOpen(false);
      setFileToDelete(null);
    }
  };

  const deleteSelected = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(`Delete ${selectedFiles.length} selected files?`)) return; // using confirm for bulk as per UX (could also use modal)
    setDeleting(true);
    let success = 0;
    for (const file of selectedFiles) {
      try {
        const encodedName = encodeURIComponent(file.name);
        const url = `${API_BASE_URL}/api/admin/files/${file.tool}/${file.jobId}/${encodedName}`;
        const res = await fetch(url, { method: "DELETE" });
        if (res.ok) {
          success++;
          setFiles(prev => prev.filter(f => f.fullPath !== file.fullPath));
        }
      } catch (err) { console.error(err); }
    }
    setSelectedFiles([]);
    setDeleting(false);
    toast.success(`Deleted ${success} of ${selectedFiles.length} files`);
  };

  const downloadSelected = async () => {
    if (selectedFiles.length === 0) return;
    const zip = new JSZip();
    let count = 0;
    for (const file of selectedFiles) {
      try {
        const res = await fetch(file.url);
        if (res.ok) {
          const blob = await res.blob();
          zip.file(file.name, blob);
          count++;
        }
      } catch (err) { console.error(err); }
    }
    if (count > 0) {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `selected_${Date.now()}.zip`);
      toast.success(`Downloaded ${count} files`);
    } else {
      toast.error("No files could be downloaded");
    }
  };

  const downloadAll = async () => {
    const filesToDownload = filteredFiles;
    if (filesToDownload.length === 0) return;
    const zip = new JSZip();
    let count = 0;
    for (const file of filesToDownload) {
      try {
        const res = await fetch(file.url);
        if (res.ok) {
          const blob = await res.blob();
          zip.file(file.name, blob);
          count++;
        }
      } catch (err) { console.error(err); }
    }
    if (count > 0) {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${activeTab === "All" ? "all" : activeTab}_${Date.now()}.zip`);
      toast.success(`Downloaded ${count} files`);
    } else {
      toast.error("No files could be downloaded");
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  // ==================== COMPUTED DATA ====================
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const filesToday = files.filter(f => {
    if (!f.lastModified) return false;
    return new Date(f.lastModified).toISOString().slice(0, 10) === todayStr;
  }).length;

  const jobsToday = useMemo(() => {
    const jobIds = new Set();
    files.forEach(f => {
      if (f.jobId && f.jobId !== "unknown") {
        const date = f.lastModified ? new Date(f.lastModified).toISOString().slice(0, 10) : null;
        if (date === todayStr) jobIds.add(f.jobId);
      }
    });
    return jobIds.size;
  }, [files, todayStr]);

  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const maxSpace = 5 * 1024 * 1024 * 1024; // 5GB
  const storagePercent = Math.min((totalSizeBytes / maxSpace) * 100, 100);

  const uniqueUsers = useMemo(() => {
    const users = new Set();
    files.forEach(f => { if (f.userName) users.add(f.userName); });
    return users.size;
  }, [files]);

  const activeTools = useMemo(() => {
    const tools = new Set();
    files.forEach(f => { if (f.tool && f.tool !== "Unknown") tools.add(f.tool); });
    return tools.size;
  }, [files]);

  // Recent activity: combine files and history
  const recentActivity = useMemo(() => {
    const activities = [];
    // Use files as upload events
    files.forEach(f => {
      if (f.lastModified) {
        activities.push({
          id: f.fullPath,
          time: f.lastModified,
          user: f.userName,
          tool: f.tool,
          action: "uploaded",
          fileName: f.name,
          type: "file",
        });
      }
    });
    // Also could include history entries if they have timestamps
    // Sort by time desc
    activities.sort((a, b) => b.time - a.time);
    return activities.slice(0, 10);
  }, [files]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    let result = files;

    // Tool filter
    if (filterTool !== "All") {
      result = result.filter(f => f.tool === filterTool);
    }

    // User filter
    if (filterUser !== "All") {
      result = result.filter(f => f.userName === filterUser);
    }

    // Date filter
    if (filterDate === "Today") {
      result = result.filter(f => f.lastModified && new Date(f.lastModified).toISOString().slice(0, 10) === todayStr);
    } else if (filterDate === "This Week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter(f => f.lastModified && new Date(f.lastModified) >= weekAgo);
    } else if (filterDate === "This Month") {
      result = result.filter(f => f.lastModified && new Date(f.lastModified).toISOString().slice(0, 7) === currentMonth);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.userName.toLowerCase().includes(q) ||
        f.jobId.toLowerCase().includes(q) ||
        f.tool.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "name-asc": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-desc": result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "size-asc": result.sort((a, b) => (a.size || 0) - (b.size || 0)); break;
      case "size-desc": result.sort((a, b) => (b.size || 0) - (a.size || 0)); break;
      case "date-asc": result.sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0)); break;
      case "date-desc": default: result.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0)); break;
    }

    return result;
  }, [files, filterTool, filterUser, filterDate, searchQuery, sortBy, todayStr, currentMonth]);

  // User options for filter
  const userOptions = useMemo(() => {
    const users = new Set();
    files.forEach(f => { if (f.userName) users.add(f.userName); });
    return ["All", ...Array.from(users)];
  }, [files]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (isLoggedIn) {
      fetchAllUsersHistory();
      fetchFiles();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && !historyLoading && files.length > 0) {
      fetchFiles(); // refresh after history loads
    }
  }, [historyLoading]);

  // ==================== MODALS ====================
  const DeleteModal = () => {
    if (!isDeleteModalOpen || !fileToDelete) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete File?</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete <span className="font-medium">{fileToDelete.name}</span>? This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => { setIsDeleteModalOpen(false); setFileToDelete(null); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              disabled={isDeletingSingle}
            >
              Cancel
            </button>
            <button
              onClick={() => deleteFile(fileToDelete, true)}
              disabled={isDeletingSingle}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {isDeletingSingle && <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PreviewModal = () => {
    if (!isPreviewModalOpen || !previewFile) return null;
    const isPDF = previewFile.name.toLowerCase().endsWith('.pdf');
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{previewFile.name}</h3>
            <button
              onClick={() => { setIsPreviewModalOpen(false); setPreviewFile(null); }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            {isPDF ? (
              <iframe src={previewFile.url} className="w-full h-[70vh]" title="PDF Preview" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Preview not available for this file type</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 p-4 border-t dark:border-gray-700">
            <a
              href={previewFile.url}
              download
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Download
            </a>
            <button
              onClick={() => { setIsPreviewModalOpen(false); setPreviewFile(null); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <form onSubmit={(e) => { e.preventDefault(); if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) { setIsLoggedIn(true); } else { toast.error("Invalid credentials"); } }} className="p-8 shadow-lg rounded-xl bg-white dark:bg-gray-800 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Admin Login</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-200">
        <Toaster position="top-right" richColors closeButton />

        {/* ===== HEADER ===== */}
        <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛒</span>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Cropper Admin</h1>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search files, users, job ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => { setRefreshing(true); Promise.all([fetchAllUsersHistory(), fetchFiles()]).finally(() => setRefreshing(false)); }}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* ===== STATS ===== */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard icon="📋" label="Jobs Today" value={jobsToday} />
          <StatCard icon="📄" label="Files Today" value={filesToday} />
          <StatCard icon="💾" label="Storage" value={formatSize(totalSizeBytes)} sub={`${storagePercent.toFixed(0)}%`} progress={storagePercent} />
          <StatCard icon="👤" label="Users" value={uniqueUsers} />
          <StatCard icon="🔧" label="Active Tools" value={activeTools} />
        </div>

        {/* ===== RECENT ACTIVITY (right panel) ===== */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* ===== FILTERS ===== */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tool</span>
                <select
                  value={filterTool}
                  onChange={(e) => setFilterTool(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  {tools.map(t => <option key={t} value={t}>{t === "All" ? "All" : t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User</span>
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  {userOptions.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</span>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="All">All</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="date-desc">Newest</option>
                  <option value="date-asc">Oldest</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="size-desc">Largest</option>
                  <option value="size-asc">Smallest</option>
                </select>
              </div>
            </div>

            {/* ===== BULK ACTIONS TOOLBAR ===== */}
            {selectedFiles.length > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedFiles.length} selected</span>
                <button
                  onClick={downloadSelected}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition disabled:opacity-50"
                >
                  📥 Download
                </button>
                <button
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition disabled:opacity-50"
                >
                  🗑️ Delete
                </button>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* ===== TABLE ===== */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {loading ? (
                <div className="p-8 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                    </div>
                  ))}
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Everything looks clean.</h3>
                  <p className="text-gray-500 dark:text-gray-400">No jobs found for this filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={filteredFiles.length > 0 && selectedFiles.length === filteredFiles.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedFiles(filteredFiles);
                              else setSelectedFiles([]);
                            }}
                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">File</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tool</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredFiles.map((file) => {
                        const isDeleting = deletingFileIds.has(file.fullPath);
                        return (
                          <tr key={file.fullPath} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedFiles.some(f => f.fullPath === file.fullPath)}
                                onChange={() => {
                                  if (selectedFiles.some(f => f.fullPath === file.fullPath)) {
                                    setSelectedFiles(prev => prev.filter(f => f.fullPath !== file.fullPath));
                                  } else {
                                    setSelectedFiles(prev => [...prev, file]);
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                disabled={isDeleting}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => { setPreviewFile(file); setIsPreviewModalOpen(true); }}
                                className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs flex items-center gap-1"
                              >
                                <span>{file.toolIcon}</span>
                                <span className="truncate">{file.name}</span>
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {getUserAvatar(file.userName)}
                                </div>
                                <span className="text-gray-700 dark:text-gray-300">{file.userName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${file.tool === "Unknown" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
                                {file.tool}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {getFileDate(file.lastModified)} <span className="text-xs">{getFileTime(file.lastModified)}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatSize(file.size)}</td>
                            <td className="px-4 py-3 text-right">
                              {isDeleting ? (
                                <span className="inline-block animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                              ) : (
                                <div className="relative inline-block text-left">
                                  <button
                                    onClick={() => {
                                      // Toggle dropdown - we'll implement a simple dropdown per row using state
                                      // For simplicity, we'll use a dropdown menu with buttons
                                      // Could use a popover but to keep it simple we'll show a small menu
                                      // We'll use a simple inline menu with icons
                                    }}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                  >
                                    ⋮
                                  </button>
                                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 hidden">
                                    {/* Dropdown items - we'll use a state to toggle, but for brevity we'll just show buttons */}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-end gap-2">
                                <a href={file.url} download className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="Download">⬇</a>
                                <button onClick={() => deleteFile(file)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-500" title="Delete">🗑</button>
                                <button
                                  onClick={() => copyToClipboard(file.url, "File URL")}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                  title="Copy URL"
                                >
                                  📋
                                </button>
                                <button
                                  onClick={() => copyToClipboard(file.jobId, "Job ID")}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                  title="Copy Job ID"
                                >
                                  🆔
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ===== RIGHT PANEL: RECENT ACTIVITY ===== */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Recent Activity</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                ) : (
                  recentActivity.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                        {getUserAvatar(act.user)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 dark:text-gray-200">
                          <span className="font-medium">{act.user}</span> {act.action} <span className="font-mono text-xs">{act.fileName}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {act.tool} · {new Date(act.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== MODALS ===== */}
        <DeleteModal />
        <PreviewModal />
      </div>
    </div>
  );
}

// ==================== STAT CARD COMPONENT ====================
function StatCard({ icon, label, value, sub, progress }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-2 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
}