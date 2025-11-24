import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { stallAPI, reservationAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import StallMap from '../components/StallMap';
import ReservationModal from '../components/ReservationModal';

const Stalls = () => {
  const { user } = useAuth();
  const [stalls, setStalls] = useState([]);
  const [filteredStalls, setFilteredStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedStall, setSelectedStall] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userReservations, setUserReservations] = useState([]);

  useEffect(() => {
    fetchStalls();
    fetchUserReservations();
  }, []);

  useEffect(() => {
    filterStalls();
  }, [stalls, selectedSize]);

  const fetchStalls = async () => {
    try {
      setLoading(true);
      const response = await stallAPI.getAllStalls();
      setStalls(response.data);
    } catch (error) {
      toast.error('Failed to load stalls');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReservations = async () => {
    try {
      const response = await reservationAPI.getUserReservations();
      setUserReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const filterStalls = () => {
    if (selectedSize === 'all') {
      setFilteredStalls(stalls);
    } else {
      setFilteredStalls(stalls.filter(stall => stall.size === selectedSize));
    }
  };

  const handleSelectStall = (stall) => {
    const reserved = userReservations.some(res => res.stall_id === stall.id && res.status === 'confirmed');
    if (stall.is_reserved && !reserved) {
      toast.error('This stall is already reserved');
      return;
    }
    if (reserved) {
      toast.error('You have already reserved this stall');
      return;
    }
    if (userReservations.filter(r => r.status === 'confirmed').length >= 3) {
      toast.error('Maximum 3 stalls per business allowed');
      return;
    }
    setSelectedStall(stall);
    setShowModal(true);
  };

  const handleConfirmReservation = async (notes) => {
    try {
      await reservationAPI.createReservation(selectedStall.id, notes);
      toast.success('Stall reserved successfully! Check your email.');
      setShowModal(false);
      fetchStalls();
      fetchUserReservations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Reservation failed');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Reserve Your Stall</h1>
        <p className="mt-2">Welcome, {user?.business_name}! Select a stall to reserve.</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {['all', 'small', 'medium', 'large'].map(size => (
          <motion.button
            key={size}
            onClick={() => setSelectedSize(size)}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              selectedSize === size
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {size.charAt(0).toUpperCase() + size.slice(1)}
          </motion.button>
        ))}
      </motion.div>

      {/* Stall Map */}
      <motion.div variants={itemVariants}>
        <StallMap stalls={filteredStalls} onSelectStall={handleSelectStall} userReservations={userReservations} />
      </motion.div>

      {/* Stalls Grid */}
      <motion.div variants={itemVariants}>
        <motion.h2 
          className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Available Stalls
        </motion.h2>
        {loading ? (
          <motion.div 
            className="flex justify-center items-center h-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full"
            />
          </motion.div>
        ) : filteredStalls.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-gray-50 rounded-lg"
          >
            <p className="text-gray-500 text-lg">No stalls available in this category</p>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
          >
            {filteredStalls.map((stall, idx) => {
              const isUserReserved = userReservations.some(
                res => res.stall_id === stall.id && res.status === 'confirmed'
              );
              
              return (
                <motion.div
                  key={stall.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: idx * 0.08, type: "spring", stiffness: 100 }}
                  className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                    stall.is_reserved && !isUserReserved
                      ? 'border-gray-300 bg-gray-100 opacity-50'
                      : isUserReserved
                      ? 'border-green-500 bg-green-50'
                      : 'border-primary-200 bg-white hover:border-primary-600 hover:shadow-lg'
                  }`}
                  onClick={() => !stall.is_reserved && handleSelectStall(stall)}
                  whileHover={!stall.is_reserved && !isUserReserved ? { scale: 1.08, y: -4 } : {}}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{stall.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{stall.size} Stall</p>
                    </div>
                    {stall.is_reserved && !isUserReserved && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Reserved</span>
                    )}
                    {isUserReserved && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Your Stall</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{stall.dimensions}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary-600">
                      Rs. {stall.price.toLocaleString()}
                    </span>
                    {!stall.is_reserved && !isUserReserved && (
                      <button className="text-primary-600 font-semibold hover:text-primary-700">
                        Reserve →
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Reservation Modal */}
      {showModal && (
        <ReservationModal
          stall={selectedStall}
          onConfirm={handleConfirmReservation}
          onClose={() => setShowModal(false)}
        />
      )}
    </motion.div>
  );
};

export default Stalls;