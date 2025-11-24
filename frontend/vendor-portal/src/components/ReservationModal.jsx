import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const ReservationModal = ({ stall, onConfirm, onClose }) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onConfirm(notes);
    } finally {
      setSubmitting(false);
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Confirm Reservation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Stall</p>
            <p className="text-2xl font-bold text-gray-800">{stall.name}</p>
            <p className="text-sm text-gray-600 mt-2 capitalize">{stall.size} • {stall.dimensions}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Price</p>
              <p className="text-xl font-bold text-primary-600">Rs. {stall.price.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-xl font-bold text-green-600">Available</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows="3"
              placeholder="Any special requirements or notes..."
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> A confirmation email with your QR code will be sent to your email address.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Confirming...</span>
              </>
            ) : (
              <span>Confirm Reservation</span>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReservationModal;