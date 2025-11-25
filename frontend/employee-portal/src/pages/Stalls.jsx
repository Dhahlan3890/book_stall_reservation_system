import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeAPI } from '../api';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { Eye, Plus, Edit, Trash2, X } from 'lucide-react';

const Stalls = () => {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStall, setExpandedStall] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStall, setEditingStall] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    size: 'small',
    location_x: 0,
    location_y: 0,
    dimensions: '',
    price: 0,
    is_available: true
  });

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

  const handleCreate = () => {
    setEditingStall(null);
    setFormData({
      name: '',
      size: 'small',
      location_x: 0,
      location_y: 0,
      dimensions: '',
      price: 0,
      is_available: true
    });
    setShowModal(true);
  };

  const handleEdit = (stall) => {
    setEditingStall(stall);
    setFormData({
      name: stall.name,
      size: stall.size,
      location_x: stall.location_x,
      location_y: stall.location_y,
      dimensions: stall.dimensions || '',
      price: stall.price,
      is_available: stall.is_available
    });
    setShowModal(true);
  };

  const handleDelete = async (stallId, stallName) => {
    if (!window.confirm(`Are you sure you want to delete stall "${stallName}"?`)) {
      return;
    }

    try {
      await employeeAPI.deleteStall(stallId);
      toast.success('Stall deleted successfully');
      fetchStalls();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete stall');
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingStall) {
        await employeeAPI.updateStall(editingStall.id, formData);
        toast.success('Stall updated successfully');
      } else {
        await employeeAPI.createStall(formData);
        toast.success('Stall created successfully');
      }
      setShowModal(false);
      fetchStalls();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save stall');
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (type === 'number' ? parseFloat(value) || 0 : value)
    }));
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
      {/* Sticky Header */}
      <motion.div 
        variants={itemVariants} 
        className="sticky top-16 z-30 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-lg shadow-lg"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Stall Management</h1>
            <p className="mt-2">Manage all stalls and reservations</p>
          </div>
          <motion.button
            onClick={handleCreate}
            className="flex items-center space-x-2 bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>Add New Stall</span>
          </motion.button>
        </div>
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
        <>
          {/* Small Stalls */}
          {stalls.filter(s => s.size === 'small').length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <h2 className="text-2xl font-bold text-gray-800 px-2">Small Stalls</h2>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {stalls.filter(s => s.size === 'small').map((stall, idx) => (
                  <StallCard 
                    key={stall.id} 
                    stall={stall} 
                    idx={idx} 
                    expandedStall={expandedStall}
                    setExpandedStall={setExpandedStall}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Medium Stalls */}
          {stalls.filter(s => s.size === 'medium').length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <h2 className="text-2xl font-bold text-gray-800 px-2">Medium Stalls</h2>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {stalls.filter(s => s.size === 'medium').map((stall, idx) => (
                  <StallCard 
                    key={stall.id} 
                    stall={stall} 
                    idx={idx} 
                    expandedStall={expandedStall}
                    setExpandedStall={setExpandedStall}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Large Stalls */}
          {stalls.filter(s => s.size === 'large').length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <h2 className="text-2xl font-bold text-gray-800 px-2">Large Stalls</h2>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {stalls.filter(s => s.size === 'large').map((stall, idx) => (
                  <StallCard 
                    key={stall.id} 
                    stall={stall} 
                    idx={idx} 
                    expandedStall={expandedStall}
                    setExpandedStall={setExpandedStall}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingStall ? 'Edit Stall' : 'Add New Stall'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Stall Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., A1, B2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Size *
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Location X *
                    </label>
                    <input
                      type="number"
                      name="location_x"
                      value={formData.location_x}
                      onChange={handleInputChange}
                      required
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Location Y *
                    </label>
                    <input
                      type="number"
                      name="location_y"
                      value={formData.location_y}
                      onChange={handleInputChange}
                      required
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 10x10 sq ft"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm font-semibold text-gray-700">
                    Available for booking
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                  >
                    {editingStall ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Stall Card Component
const StallCard = ({ stall, idx, expandedStall, setExpandedStall, handleEdit, handleDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
      className={`rounded-lg p-4 border-2 transition h-full flex flex-col ${
        stall.reserved ? 'bg-green-50 border-green-300 hover:shadow-lg' : 'bg-white border-gray-200 hover:shadow-md'
      }`}
      whileHover={{ y: -4 }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: idx * 0.05 + 0.1 }}
        >
          <h3 className="text-xl font-bold">{stall.name}</h3>
          <p className="text-sm text-gray-600 capitalize">{stall.size}</p>
        </motion.div>
        <motion.span 
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            stall.reserved 
              ? 'bg-green-200 text-green-800' 
              : stall.is_available 
                ? 'bg-blue-200 text-blue-800' 
                : 'bg-gray-300 text-gray-700'
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: idx * 0.05 + 0.15 }}
        >
          {stall.reserved ? '✓ Reserved' : stall.is_available ? '● Available' : '✕ Unavailable'}
        </motion.span>
      </div>

      {/* Reservation Info */}
      {stall.reserved && (
        <motion.div 
          className="space-y-1 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: idx * 0.05 + 0.2 }}
        >
          <p className="text-sm"><strong>Vendor:</strong> {stall.reserved_by}</p>
          <p className="text-sm"><strong>Date:</strong> {new Date(stall.reserved_date).toLocaleDateString()}</p>
        </motion.div>
      )}

      {/* Price */}
      <motion.p 
        className="text-lg font-bold text-primary-600 mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: idx * 0.05 + 0.1 }}
      >
        Rs. {stall.price.toLocaleString()}
      </motion.p>

      {/* Spacer to push buttons to bottom */}
      <div className="flex-grow"></div>

      {/* QR Expanded View */}
      {expandedStall === stall.id && stall.qr_code && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-3 bg-white p-3 rounded text-center border"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 150 }}
          >
            <QRCodeCanvas value={stall.qr_data} size={120} />
          </motion.div>
          <p className="text-xs text-gray-600 mt-2">{stall.qr_data}</p>
        </motion.div>
      )}

      {/* Bottom Actions */}
      <div className="flex justify-between items-center pt-2 border-t">
        {stall.reserved ? (
          <motion.button
            onClick={() => setExpandedStall(expandedStall === stall.id ? null : stall.id)}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-semibold transition text-sm"
            whileHover={{ x: 2 }}
            whileTap={{ x: -2 }}
          >
            <Eye className="w-4 h-4" />
            <span>{expandedStall === stall.id ? 'Hide' : 'View'} QR</span>
          </motion.button>
        ) : (
          <div></div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <motion.button
            onClick={() => handleEdit(stall)}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Edit stall"
          >
            <Edit className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => handleDelete(stall.id, stall.name)}
            className={`p-2 rounded transition ${
              stall.reserved 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
            whileHover={stall.reserved ? {} : { scale: 1.1 }}
            whileTap={stall.reserved ? {} : { scale: 0.95 }}
            disabled={stall.reserved}
            title={stall.reserved ? 'Cannot delete reserved stall' : 'Delete stall'}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Stalls;
