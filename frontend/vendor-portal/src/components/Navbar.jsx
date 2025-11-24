import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Home, BookOpen, User } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const menuVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <nav className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <span className="text-2xl">📚</span>
            <div className="text-xl font-bold hidden sm:block">Bookfair Vendor</div>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <motion.a
              href="/stalls"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                isActive('/stalls') ? 'bg-primary-500' : 'hover:bg-primary-500'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              <BookOpen className="w-5 h-5" />
              <span>Stalls</span>
            </motion.a>
            <motion.a
              href="/dashboard"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                isActive('/dashboard') ? 'bg-primary-500' : 'hover:bg-primary-500'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </motion.a>
            <motion.button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-red-600 transition"
              whileHover={{ scale: 1.05 }}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden pb-4 space-y-2"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
          >
            <a href="/stalls" className="block px-4 py-2 rounded-lg hover:bg-primary-500">
              Stalls
            </a>
            <a href="/dashboard" className="block px-4 py-2 rounded-lg hover:bg-primary-500">
              Dashboard
            </a>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;