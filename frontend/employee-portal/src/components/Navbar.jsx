import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home, BookOpen } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <motion.div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="text-2xl">🛡️</span>
            <div className="text-xl font-bold hidden sm:block">Employee Portal</div>
          </motion.div>

          <div className="hidden md:flex items-center space-x-6">
            <a href="/dashboard" className="flex items-center space-x-1 hover:opacity-80">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            <a href="/stalls" className="flex items-center space-x-1 hover:opacity-80">
              <BookOpen className="w-5 h-5" />
              <span>Stalls</span>
            </a>
            <a href="/reservations" className="flex items-center space-x-1 hover:opacity-80">
              <BookOpen className="w-5 h-5" />
              <span>Reservations</span>
            </a>
            <button onClick={handleLogout} className="flex items-center space-x-1 hover:opacity-80">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div className="md:hidden pb-4 space-y-2">
            <a href="/dashboard" className="block px-4 py-2 hover:bg-primary-500 rounded">Dashboard</a>
            <a href="/stalls" className="block px-4 py-2 hover:bg-primary-500 rounded">Stalls</a>
            <a href="/reservations" className="block px-4 py-2 hover:bg-primary-500 rounded">Reservations</a>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-600 rounded">Logout</button>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
