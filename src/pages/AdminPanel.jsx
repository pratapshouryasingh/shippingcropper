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
  const [activeTab, setActiveTab] = useState("FlipkartCropper");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@example.com";
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

  const tools = ["FlipkartCropper", "MeshooCropper", "JioMartCropper"];

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
  };

  const fetchFiles = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/files`)
      .then((res) => res.json())
      .then((data) => {
        setFiles(data.files || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isLoggedIn) fetchFiles();
  }, [isLoggedIn]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const getFileDate = (name) => {
    const match = name.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  };

  const toggleSelectFile = (file) => {
    if (selectedFiles.find(f => f.name === file.name)) {
      setSelectedFiles(selectedFiles.filter(f => f.name !== file.name));
    } else setSelectedFiles([...selectedFiles, file]);
  };
const handleDelete = async (tool, jobId, name, skipConfirm = false) => {
  if (!skipConfirm && !window.confirm(`Are you sure you want to delete ${name}?`)) return;
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/files/${tool}/${jobId}/${name}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (data.success) {
      fetchFiles();
      setSelectedFiles(selectedFiles.filter(f => f.name !== name));
    } else alert("Failed to delete");
  } catch (err) {
    console.error(err);
    alert("Error deleting file");
  }
};
  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selectedFiles.length} selected files?`)) return;
    for (const f of selectedFiles) await handleDelete(f.tool, f.jobId, f.name);
    setSelectedFiles([]);
  };

  const handleDeleteAll = async () => {
  const filesToDelete = files.filter(f => f.tool === activeTab);
  if (!filesToDelete.length) return alert("No files to delete");
  if (!window.confirm(`Are you sure you want to delete ALL files in ${activeTab}?`)) return;

  for (const f of filesToDelete) {
    await handleDelete(f.tool, f.jobId, f.name, true); // skipConfirm = true
  }
  setSelectedFiles([]);
};
  const handleDownloadSelected = async () => {
    if (!selectedFiles.length) return;
    const zip = new JSZip();
    try {
      await Promise.all(selectedFiles.map(async (file) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}${file.url}`);
        const blob = await res.blob();
        zip.file(file.name, blob);
      }));
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `files_${Date.now()}.zip`);
    } catch (err) {
      console.error(err);
      alert("Failed to download selected files");
    }
  };

  const handleDownloadAll = async () => {
    const filesToDownload = files.filter(f => f.tool === activeTab);
    if (!filesToDownload.length) return alert("No files to download");
    const zip = new JSZip();
    try {
      await Promise.all(filesToDownload.map(async (file) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}${file.url}`);
        const blob = await res.blob();
        zip.file(file.name, blob);
      }));
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${activeTab}_files_${Date.now()}.zip`);
    } catch (err) {
      console.error(err);
      alert("Failed to download all files");
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const filesToday = files.filter(f => getFileDate(f.name) === todayStr).length;
  const filesThisMonth = files.filter(f => getFileDate(f.name)?.startsWith(currentMonth)).length;

  const filteredFiles = files.filter(f => f.tool === activeTab);
  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const maxSpace = 20 * 1024 * 1024 * 1024; // 20GB

  const pdfCount = files.filter(f => f.name.endsWith(".pdf")).length;
  const excelCount = files.filter(f => f.name.endsWith(".xlsx")).length;

  const toolCounts = tools.map(tool => files.filter(f => f.tool === tool).length);
  
  const pieData = {
    labels: tools,
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">🛒 E-Commerce Cropper</h2>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>

        {/* Stats and Pie Chart */}
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
              {tool}
            </button>
          ))}
        </div>

        {/* Section actions */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition duration-200"
          >
            📥 Download All ({filteredFiles.length})
          </button>
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition duration-200"
          >
            🗑️ Delete All ({filteredFiles.length})
          </button>
          {selectedFiles.length > 0 && (
            <>
              <button 
                onClick={handleDownloadSelected} 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition duration-200"
              >
                📥 Download Selected ({selectedFiles.length})
              </button>
              <button 
                onClick={handleDeleteSelected} 
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg transition duration-200"
              >
                🗑️ Delete Selected ({selectedFiles.length})
              </button>
            </>
          )}
        </div>

        {/* File list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">Loading files...</p>
            </div>
          ) : filteredFiles.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {filteredFiles.map((file, idx) => (
                <li key={idx} className="p-4 hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={!!selectedFiles.find(f => f.name === file.name)} 
                      onChange={() => toggleSelectFile(file)} 
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" 
                    />
                    <div>
                      <span className="font-semibold text-gray-800 block mb-1">{file.name}</span>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>Job: {file.jobId}</span>
                        <span>Size: {formatSize(file.size)}</span>
                        <span>Date: {getFileDate(file.name) || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <a 
                      href={`http://localhost:5000${file.url}`} 
                      className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm transition duration-200"
                    >
                      📥 Download
                    </a>
                    <button 
                      onClick={() => handleDelete(file.tool, file.jobId, file.name)} 
                      className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition duration-200"
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
              <p className="text-gray-500">No files found for {activeTab}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
