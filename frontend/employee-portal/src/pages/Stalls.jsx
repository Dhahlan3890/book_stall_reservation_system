import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { employeeAPI } from '../api';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { Eye } from 'lucide-react';

const Stalls = () => {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStall, setExpandedStall] = useState(null);

  useEffect(() => {
    fetchStalls();
  }, []);

  const fetchStalls = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getStalls();
      setStalls(response.data);
    } catch (error) {
      toast.error('Failed to load stalls');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Stall Management</h1>
        <p className="mt-2">View all stalls and reservations</p>
      </motion.div>

      {loading ? (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 2, repeat: Infinity }} 
            className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" 
          />
        </motion.div>
      ) : stalls.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-gray-50 rounded-lg"
        >
          <p className="text-gray-500 text-lg">No stalls available</p>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
        >
          {stalls.map((stall, idx) => (
            <motion.div
              key={stall.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: idx * 0.08, type: "spring", stiffness: 100 }}
              className={`rounded-lg p-4 border-2 transition cursor-pointer ${
                stall.reserved ? 'bg-green-50 border-green-300 hover:shadow-lg' : 'bg-white border-gray-200 hover:shadow-md'
              }`}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex justify-between items-start mb-3">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.08 + 0.1 }}
                >
                  <h3 className="text-xl font-bold">{stall.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{stall.size}</p>
                </motion.div>
                <motion.span 
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${stall.reserved ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.08 + 0.15 }}
                >
                  {stall.reserved ? '✓ Reserved' : '● Available'}
                </motion.span>
              </div>

              {stall.reserved && (
                <motion.div 
                  className="space-y-2 mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.08 + 0.2 }}
                >
                  <p className="text-sm"><strong>Vendor:</strong> {stall.reserved_by}</p>
                  <p className="text-sm"><strong>Date:</strong> {new Date(stall.reserved_date).toLocaleDateString()}</p>
                </motion.div>
              )}

              <motion.p 
                className="text-lg font-bold text-primary-600 mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.08 + 0.1 }}
              >
                Rs. {stall.price.toLocaleString()}
              </motion.p>

              {stall.reserved && (
                <motion.button
                  onClick={() => setExpandedStall(expandedStall === stall.id ? null : stall.id)}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-semibold transition"
                  whileHover={{ x: 4 }}
                  whileTap={{ x: -2 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.08 + 0.25 }}
                >
                  <Eye className="w-4 h-4" />
                  <span>{expandedStall === stall.id ? 'Hide' : 'View'} QR</span>
                </motion.button>
              )}

              {expandedStall === stall.id && stall.qr_code && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="mt-3 bg-gray-50 p-3 rounded text-center"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 150 }}
                  >
                    <QRCodeCanvas value={stall.qr_data} size={100} />
                  </motion.div>
                  <p className="text-xs text-gray-600 mt-2">{stall.qr_data}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Stalls;
