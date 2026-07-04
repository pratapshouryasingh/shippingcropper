import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { 
  History, 
  Clock, 
  FileText, 
  Image, 
  FileSpreadsheet,
  ChevronRight,
  X,
  RefreshCw,
  Download,
  CheckCircle2,
  Loader2
} from "lucide-react";

const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

const HistorySidebar = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, isLoaded } = useUser();

  // Fetch history
  const fetchHistory = async (showRefresh = false) => {
    if (!user || !isLoaded) return;
    
    try {
      if (showRefresh) setRefreshing(true);
      else setIsLoading(true);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/history/${user.id}`);
      const data = await res.json();
      
      if (data.success) {
        setHistory(Array.isArray(data.history) ? data.history : []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Socket connection
  useEffect(() => {
    if (!user || !isLoaded) return;

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("register", user.id);
    });
    
    socket.on("history:update", (newJob) => {
      console.log("Received real-time update:", newJob);
      setHistory((prev) => {
        if (prev.some(job => job.jobId === newJob.jobId)) {
          return prev.map(job => 
            job.jobId === newJob.jobId ? newJob : job
          );
        }
        return [newJob, ...prev];
      });
    });

    if (socket.connected) {
      socket.emit("register", user.id);
    }

    return () => {
      socket.off("connect");
      socket.off("history:update");
    };
  }, [user, isLoaded]);

  // Initial fetch
  useEffect(() => {
    if (user && isLoaded) {
      fetchHistory();
      const interval = setInterval(() => {
        fetchHistory(true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isLoaded]);

  const formatDate = (date) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    const now = new Date();
    const diffMins = Math.floor((now - d) / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return d.toLocaleDateString();
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

  const getFileIcon = (filename) => {
    if (filename?.endsWith('.pdf')) return <FileText className="w-4 h-4" />;
    if (filename?.endsWith('.xlsx')) return <FileSpreadsheet className="w-4 h-4" />;
    if (filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ type: "spring", damping: 25 }}
            // ✅ CHANGED: sidebar now starts below navbar (top-16 on mobile, top-20 on desktop)
            // and height fills remaining viewport
            className="fixed top-16 md:top-20 left-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] w-[380px] bg-white shadow-2xl z-40 flex flex-col"
          >
            {/* Header */}
            <div className="bg-blue-600 p-5 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6" />
                  <h2 className="font-bold text-xl">Job History</h2>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => fetchHistory(true)}
                    disabled={refreshing}
                    className="hover:bg-blue-700 rounded-lg p-2 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                    onClick={onClose}
                    className="hover:bg-blue-700 rounded-lg p-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-blue-100 mt-2">{history.length} total jobs</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No history yet</p>
                  <p className="text-sm text-gray-400 mt-1">Process files to see them here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((job, index) => (
                    <div
                      key={job.jobId || job._id || index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Job Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getToolIcon(job.toolName)}</span>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {job.toolName?.replace('Cropper', '') || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(job.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                            {job.fileCount || job.outputs?.length || 0} files
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                      </div>

                      {/* Output Files */}
                      {job.outputs?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-gray-600">Output Files</p>
                          {job.outputs.slice(0, 3).map((file, i) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {getFileIcon(file.name)}
                                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                              </div>
                              <Download className="w-4 h-4 text-gray-400" />
                            </a>
                          ))}
                          {job.outputs.length > 3 && (
                            <p className="text-xs text-gray-400 text-center">
                              +{job.outputs.length - 3} more files
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HistorySidebar;
