import React from 'react';
import { motion } from 'framer-motion';

const StallMap = ({ stalls, onSelectStall, userReservations }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.03,
        delayChildren: 0.1,
      },
    },
  };

  const stallVariants = {
    hidden: { opacity: 0, scale: 0.6, rotate: -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 20,
      }
    },
    hover: { 
      scale: 1.15,
      rotate: 2,
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      }
    },
    tap: { scale: 0.95 }
  };

  const getStallColor = (stall) => {
    const isUserReserved = userReservations.some(
      res => res.stall_id === stall.id && res.status === 'confirmed'
    );
    
    if (isUserReserved) return 'from-green-400 to-green-500';
    if (stall.is_reserved) return 'from-gray-400 to-gray-500';
    
    switch (stall.size) {
      case 'small':
        return 'from-blue-400 to-blue-500';
      case 'medium':
        return 'from-yellow-400 to-yellow-500';
      case 'large':
        return 'from-purple-400 to-purple-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const legendVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8">
      <motion.h2 
        className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        Exhibition Floor Map
      </motion.h2>
      
      {/* Legend */}
      <motion.div 
        className="flex flex-wrap gap-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { color: 'from-blue-400 to-blue-500', label: 'Small Stalls' },
          { color: 'from-yellow-400 to-yellow-500', label: 'Medium Stalls' },
          { color: 'from-purple-400 to-purple-500', label: 'Large Stalls' },
          { color: 'from-green-400 to-green-500', label: 'Your Stalls' },
          { color: 'from-gray-400 to-gray-500', label: 'Reserved' },
        ].map((item, idx) => (
          <motion.div 
            key={item.label}
            className="flex items-center space-x-2"
            variants={legendVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15 + idx * 0.08 }}
          >
            <motion.div 
              className={`w-6 h-6 bg-gradient-to-br ${item.color} rounded shadow-md`}
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ type: "spring", stiffness: 200 }}
            />
            <span className="text-sm text-gray-700 font-medium">{item.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Map Container */}
      <motion.div 
        className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-4 overflow-x-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="inline-grid gap-4 p-4 min-w-full"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stalls.map((stall, idx) => {
            const isUserReserved = userReservations.some(
              res => res.stall_id === stall.id && res.status === 'confirmed'
            );
            const isReserved = stall.is_reserved && !isUserReserved;
            
            return (
              <motion.button
                key={stall.id}
                onClick={() => !isReserved && onSelectStall(stall)}
                variants={stallVariants}
                whileHover={!isReserved ? 'hover' : {}}
                whileTap={!isReserved ? 'tap' : {}}
                className={`bg-gradient-to-br ${getStallColor(stall)} text-white rounded-lg p-4 font-bold text-center transition shadow-lg relative overflow-hidden ${
                  isReserved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-2xl'
                }`}
                disabled={isReserved}
              >
                {/* Shimmer effect on hover for available stalls */}
                {!isReserved && (
                  <motion.div
                    className="absolute inset-0 bg-white opacity-0 rounded-lg"
                    whileHover={{ opacity: [0, 0.2, 0] }}
                    transition={{ duration: 0.6 }}
                  />
                )}
                
                {/* Badge for user's stalls */}
                {isUserReserved && (
                  <motion.div
                    className="absolute top-1 right-1 bg-white text-green-600 text-xs font-bold px-2 py-1 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: idx * 0.03 }}
                  >
                    ✓
                  </motion.div>
                )}
                
                <motion.div 
                  className="text-lg mb-1 font-bold"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.03 }}
                >
                  {stall.name}
                </motion.div>
                <motion.div 
                  className="text-xs opacity-90 capitalize font-semibold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + idx * 0.03 }}
                >
                  {stall.size}
                </motion.div>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StallMap;