import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeAPI } from '../api';
import toast from 'react-hot-toast';
import { ChevronDown, Trash2, CheckCircle, XCircle } from 'lucide-react';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedReservation, setExpandedReservation] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, statusFilter]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getReservations();
      setReservations(response.data);
    } catch (error) {
      toast.error('Failed to load reservations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    if (statusFilter === 'all') {
      setFilteredReservations(reservations);
    } else {
      setFilteredReservations(reservations.filter(r => r.status === statusFilter));
    }
  };

  const handleCancelReservation = async (reservation) => {
    if (!window.confirm(`Cancel reservation for Stall ${reservation.stall?.name} (${reservation.user?.business_name})?`)) {
      return;
    }

    try {
      setCancelling(reservation.id);
      await employeeAPI.cancelReservation(reservation.id);
      toast.success(`Reservation cancelled successfully. Email sent to vendor.`);
      
      // Remove from local state
      setReservations(reservations.filter(r => r.id !== reservation.id));
      setExpandedReservation(null);
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel reservation');
    } finally {
      setCancelling(null);
    }
  };

  const handleApproveReservation = async (reservation) => {
    if (!window.confirm(`Approve reservation for Stall ${reservation.stall?.name} (${reservation.user?.business_name})?`)) {
      return;
    }

    try {
      setCancelling(reservation.id);
      await employeeAPI.approveReservation(reservation.id);
      toast.success(`Reservation approved! Confirmation email sent to vendor.`);
      
      // Update the reservation status in local state
      setReservations(reservations.map(r => 
        r.id === reservation.id ? { ...r, status: 'confirmed' } : r
      ));
      setExpandedReservation(null);
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.response?.data?.error || 'Failed to approve reservation');
    } finally {
      setCancelling(null);
    }
  };

  const handleRejectReservation = async (reservation) => {
    const reason = window.prompt(`Reject reservation for Stall ${reservation.stall?.name}?\n\nOptional reason:`, '');
    if (reason === null) return;

    try {
      setCancelling(reservation.id);
      await employeeAPI.rejectReservation(reservation.id, reason || 'No reason provided');
      toast.success(`Reservation rejected. Notification sent to vendor.`);
      
      // Remove from local state
      setReservations(reservations.filter(r => r.id !== reservation.id));
      setExpandedReservation(null);
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error(error.response?.data?.error || 'Failed to reject reservation');
    } finally {
      setCancelling(null);
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
        <h1 className="text-3xl font-bold">Reservations</h1>
        <p className="mt-2">Monitor and manage all stall reservations</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex gap-2 flex-wrap">
        {['all', 'confirmed', 'pending', 'cancelled'].map(status => (
          <motion.button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              statusFilter === status ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </motion.button>
        ))}
      </motion.div>

      {/* Reservations List */}
      {loading ? (
        <motion.div className="text-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <p className="text-gray-600">No reservations found</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredReservations.map((res, idx) => (
                <motion.div
                  key={res.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition"
                >
                  <motion.button
                    onClick={() => setExpandedReservation(expandedReservation === res.id ? null : res.id)}
                    className="w-full"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Vendor</p>
                              <p className="font-bold">{res.user?.business_name}</p>
                              <p className="text-sm text-gray-600">{res.user?.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Stall</p>
                              <p className="font-bold text-lg">{res.stall?.name}</p>
                              <p className="text-sm text-gray-600">{res.stall?.size}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Date</p>
                              <p className="font-bold">{new Date(res.confirmed_at).toLocaleDateString()}</p>
                              <p className="text-sm text-gray-600">{new Date(res.confirmed_at).toLocaleTimeString()}</p>
                            </div>
                            <div className="flex items-center justify-between md:justify-start">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                res.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                res.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedReservation === res.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.button>

                  <AnimatePresence>
                    {expandedReservation === res.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="border-t border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-semibold">{res.user?.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Business Type</p>
                            <p className="font-semibold">{res.user?.business_type || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Stall Price</p>
                            <p className="font-semibold">Rs. {res.stall?.price.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">QR Code</p>
                            <p className="font-semibold text-xs">{res.qr_data}</p>
                          </div>
                        </div>

                        {res.notes && (
                          <div className="mb-4 bg-white p-3 rounded border border-gray-300">
                            <p className="text-sm text-gray-600">Notes</p>
                            <p className="text-gray-800">{res.notes}</p>
                          </div>
                        )}

                        {res.status === 'pending' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <motion.button
                              onClick={() => handleApproveReservation(res)}
                              disabled={cancelling === res.id}
                              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <CheckCircle className="w-5 h-5" />
                              <span>{cancelling === res.id ? 'Approving...' : 'Approve Request'}</span>
                            </motion.button>
                            <motion.button
                              onClick={() => handleRejectReservation(res)}
                              disabled={cancelling === res.id}
                              className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <XCircle className="w-5 h-5" />
                              <span>{cancelling === res.id ? 'Rejecting...' : 'Reject Request'}</span>
                            </motion.button>
                          </div>
                        )}

                        {res.status === 'confirmed' && (
                          <motion.button
                            onClick={() => handleCancelReservation(res)}
                            disabled={cancelling === res.id}
                            className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Trash2 className="w-5 h-5" />
                            <span>{cancelling === res.id ? 'Cancelling...' : 'Cancel Reservation'}</span>
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Reservations;
