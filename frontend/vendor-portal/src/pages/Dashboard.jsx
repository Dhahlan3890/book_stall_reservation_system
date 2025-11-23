import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reservationAPI, genreAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Download, QrCode, ChevronDown, Trash2, Calendar, MapPin } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const Dashboard = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [genres, setGenres] = useState([]);
  const [userGenres, setUserGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedReservation, setExpandedReservation] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, genreData, userGenreData] = await Promise.all([
        reservationAPI.getUserReservations(),
        genreAPI.getAllGenres(),
        genreAPI.getUserGenres(),
      ]);
      setReservations(resData.data);
      setGenres(genreData.data);
      setUserGenres(userGenreData.data);
      setSelectedGenres(userGenreData.data.map(g => g.id));
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreToggle = (genreId) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleSaveGenres = async () => {
    try {
      setSaving(true);
      await genreAPI.addUserGenres(selectedGenres);
      toast.success('Genres updated successfully!');
      setUserGenres(genres.filter(g => selectedGenres.includes(g.id)));
    } catch (error) {
      toast.error('Failed to update genres');
    } finally {
      setSaving(false);
    }
  };

  const downloadQR = (reservation) => {
    const qrElement = document.getElementById(`qr-${reservation.id}`);
    const canvas = qrElement.querySelector('canvas');
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qr-${reservation.qr_data}.png`;
    link.click();
  };

  const handleCancelReservation = async (reservation) => {
    if (!window.confirm(`Are you sure you want to cancel the reservation for Stall ${reservation.stall?.name}?`)) {
      return;
    }

    try {
      await reservationAPI.cancelReservation(reservation.id);
      toast.success('Reservation cancelled successfully');
      fetchData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel reservation');
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
      {/* Welcome */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Welcome, {user?.business_name}!</h1>
        <p className="mt-2">Manage your reservations and display preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reservations */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between"
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              Your Reservations
            </h2>
            {reservations.length > 0 && !loading && (
              <motion.span
                className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                {reservations.length}
              </motion.span>
            )}
          </motion.div>

          {loading ? (
            <motion.div
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"
              />
              <p className="text-gray-600">Loading your reservations...</p>
            </motion.div>
          ) : reservations.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-blue-50 via-blue-40 to-indigo-50 border-2 border-blue-200 rounded-lg p-8 text-center"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="text-5xl mb-3"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                📚
              </motion.div>
              <p className="text-lg text-gray-700 font-semibold mb-2">No reservations yet</p>
              <p className="text-gray-600 mb-4">Start by exploring available stalls and making your first reservation!</p>
              <motion.a
                href="/stalls"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Browse Stalls →
              </motion.a>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div className="space-y-3">
                {reservations.map((res, idx) => (
                  <motion.div
                    key={res.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="group"
                  >
                    <motion.button
                      onClick={() => setExpandedReservation(expandedReservation === res.id ? null : res.id)}
                      className="w-full text-left"
                    >
                      <motion.div
                        className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 rounded-lg p-4 transition-all hover:shadow-xl"
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            {/* Stall Info */}
                            <div className="flex items-center gap-3">
                              <motion.div
                                className="text-2xl"
                                initial={{ rotate: 0 }}
                                animate={{ rotate: expandedReservation === res.id ? 360 : 0 }}
                                transition={{ duration: 0.5 }}
                              >
                                📍
                              </motion.div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-800">Stall {res.stall?.name}</h3>
                                <p className="text-sm text-gray-600 capitalize">
                                  {res.stall?.size} • Rs. {res.stall?.price.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* Date and Size Info */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 ml-10">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(res.confirmed_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{res.stall?.dimensions}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status and Chevron */}
                          <div className="flex items-center gap-3">
                            <motion.span
                              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                                res.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800 shadow-md'
                                  : res.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 shadow-md'
                                  : 'bg-red-100 text-red-800 shadow-md'
                              }`}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                            >
                              {res.status === 'confirmed' ? '✓ Active' : res.status === 'pending' ? '⏳ Pending' : '✕ Cancelled'}
                            </motion.span>
                            <motion.div
                              animate={{ rotate: expandedReservation === res.id ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedReservation === res.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 20 }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 border-2 border-t-0 border-gray-200 rounded-b-lg p-6 space-y-4"
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                          >
                            {res.status === 'pending' ? (
                              // Pending Status View
                              <motion.div
                                className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 space-y-3"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-3xl">⏳</span>
                                  <div>
                                    <p className="font-bold text-yellow-900">Awaiting Approval</p>
                                    <p className="text-sm text-yellow-800">Your reservation request is pending admin review.</p>
                                  </div>
                                </div>
                                <p className="text-sm text-yellow-700 bg-white p-3 rounded">
                                  Once the admin approves your request, you'll receive a confirmation email with your QR code and access details.
                                </p>
                                <motion.button
                                  onClick={() => handleCancelReservation(res)}
                                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Trash2 className="w-5 h-5" />
                                  Cancel Request
                                </motion.button>
                              </motion.div>
                            ) : res.status === 'confirmed' ? (
                              // Confirmed Status View
                              <>
                                {/* QR Code Section */}
                                <motion.div
                                  className="bg-white rounded-lg p-4 border border-gray-200"
                                  initial={{ scale: 0.9 }}
                                  animate={{ scale: 1 }}
                                >
                                  <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <QrCode className="w-4 h-4" />
                                    Your Exhibition Pass
                                  </p>
                                  <motion.div
                                    id={`qr-${res.id}`}
                                    className="flex justify-center bg-white p-4 rounded-lg border-2 border-dashed border-primary-200"
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    <QRCodeCanvas value={res.qr_data} size={180} level="H" />
                                  </motion.div>
                                  <p className="text-center text-xs text-gray-600 mt-3 font-mono bg-gray-100 py-2 rounded">
                                    {res.qr_data}
                                  </p>
                                </motion.div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <motion.button
                                    onClick={() => downloadQR(res)}
                                    className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Download className="w-5 h-5" />
                                    Download QR
                                  </motion.button>

                                  <motion.button
                                    onClick={() => handleCancelReservation(res)}
                                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Trash2 className="w-5 h-5" />
                                    Cancel Booking
                                  </motion.button>
                                </div>

                                {/* Info Box */}
                                <motion.div
                                  className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.2 }}
                                >
                                  <p className="font-semibold mb-1">📋 Important</p>
                                  <p>Please present your QR code at the entrance to access your reserved stall.</p>
                                </motion.div>
                              </>
                            ) : (
                              // Cancelled Status View
                              <motion.div
                                className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                              >
                                <p className="text-2xl mb-2">❌</p>
                                <p className="font-bold text-red-900">Reservation Cancelled</p>
                                <p className="text-sm text-red-800 mt-2">This reservation has been cancelled.</p>
                              </motion.div>
                            )}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Genres */}
        <motion.div variants={itemVariants} className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Display Genres</h2>
          <p className="text-sm text-gray-600 mb-4">Select the literary genres you'll be displaying</p>
          
          {loading ? (
            <div className="text-center py-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-6 border-3 border-primary-200 border-t-primary-600 rounded-full mx-auto"
              />
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {genres.map(genre => (
                <label
                  key={genre.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre.id)}
                    onChange={() => handleGenreToggle(genre.id)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{genre.icon} {genre.name}</span>
                </label>
              ))}
            </div>
          )}

          <motion.button
            onClick={handleSaveGenres}
            disabled={saving}
            className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {saving ? 'Saving...' : 'Save Genres'}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;