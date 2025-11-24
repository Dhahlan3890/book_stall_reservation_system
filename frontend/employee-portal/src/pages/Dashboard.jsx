import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { employeeAPI } from '../api';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashData, occData, revData] = await Promise.all([
        employeeAPI.getDashboard(),
        employeeAPI.getOccupancyAnalytics(),
        employeeAPI.getRevenueAnalytics(),
      ]);
      setData(dashData.data);
      setOccupancy(occData.data);
      setRevenue(revData.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2">Exhibition Management Overview</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-gray-600 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-primary-600">{data?.total_users}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-gray-600 text-sm">Total Stalls</p>
          <p className="text-3xl font-bold text-blue-600">{data?.total_stalls}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-gray-600 text-sm">Reservations</p>
          <p className="text-3xl font-bold text-green-600">{data?.confirmed_reservations}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-gray-600 text-sm">Occupancy</p>
          <p className="text-3xl font-bold text-orange-600">{data?.occupancy_rate.toFixed(1)}%</p>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy by Size */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Occupancy by Size</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(occupancy || {}).map(([key, val]) => ({ name: key, reserved: val.reserved, available: val.available }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="reserved" fill="#3b82f6" />
              <Bar dataKey="available" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Revenue by Stall Size</h2>
          <div className="space-y-3">
            {revenue && Object.entries(revenue.revenue_by_size).map(([size, amount]) => (
              <div key={size} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="capitalize font-medium">{size} Stalls</span>
                <span className="text-lg font-bold text-green-600">Rs. {amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center font-bold">
                <span>Total Revenue</span>
                <span className="text-xl text-primary-600">Rs. {revenue?.total_revenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
