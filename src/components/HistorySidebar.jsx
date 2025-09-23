import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";

const HistorySidebar = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const { user, isLoaded } = useUser();

  // Fetch history function
  const fetchHistory = async () => {
    if (!user || !isLoaded) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/history/${user.id}`);
      const data = await res.json();
      if (data.success) setHistory(data.history);
      else console.error("Failed to fetch history:", data.error);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [user, isLoaded]);

  // Polling for updates every 5 seconds when hovered
  useEffect(() => {
    if (!isHovered) return;

    const interval = setInterval(() => {
      fetchHistory();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [isHovered, user, isLoaded]);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <>
      {/* Thicker Pipe Trigger */}
      <div 
        className="fixed left-0 top-1/2 transform -translate-y-1/2 z-40"
        onMouseEnter={() => setIsHovered(true)}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-10 h-28 bg-gradient-to-b from-blue-300 to-blue-700 rounded-r-full flex items-center justify-center cursor-pointer shadow-lg"
        >
          <span className="text-white font-bold text-3xl">▶️</span>
        </motion.div>
      </div>

      {/* Sliding Sidebar */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full bg-gradient-to-b from-blue-50 to-indigo-50 shadow-xl z-50 overflow-y-auto border-r border-gray-200"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="p-6 w-[320px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Recent work</h2>
                <button
                  onClick={() => setIsHovered(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No processing history found.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto pr-2">
                  {history.map((job) => (
                    <motion.div
                      key={job.jobId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
                    >
                      <p className="font-semibold text-sm text-gray-700 mb-1">
                        Job ID: <span className="text-blue-600">{job.jobId}</span>
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {formatDate(job.timestamp)}
                      </p>
                      <div className="mt-2 space-y-2">
                        {job.outputs.map((output, idx) => (
                          <a
                            key={idx}
                            href={`${import.meta.env.VITE_API_URL}${output.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-blue-600 transition-colors flex items-center text-sm group"
                          >
                            <span className="truncate group-hover:underline">{output.name}</span>
                          </a>
                        ))}
                      </div>
                    </motion.div>
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
