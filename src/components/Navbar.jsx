import React, { useState, useEffect } from 'react';
import * as framerMotion from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  MessageSquare, 
  User, 
  Menu,
  LogOut,
  Settings,
  UserCircle
} from 'lucide-react';
import AuthService from '../services/AuthService';

const { motion } = framerMotion;

const Navbar = ({ toggleSidebar }) => {
  const [scrolled, setScrolled] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user from local storage
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/');
  };

  return (
    <motion.nav 
      className={`fixed right-0 top-0 left-0 z-20 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="flex justify-between items-center px-4 py-3">
        {/* Left section with menu button */}
        <div className="flex items-center">
          <motion.button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-blue-50 transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </motion.button>
          
          <div className="ml-4 flex items-center">
            <motion.div 
              className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center"
              whileHover={{ rotate: 10 }}
            >
              <span className="text-white font-bold">D</span>
            </motion.div>
            <span className="ml-2 font-semibold text-gray-800 hidden md:block">Dashboard</span>
          </div>
        </div>

        {/* Center section with search */}
        <div className="flex-1 mx-8 max-w-xl">
          <motion.div 
            className={`relative flex items-center ${
              searchActive ? 'bg-gray-100' : 'bg-gray-50'
            } rounded-full px-3 py-2 border-2 transition-all ${
              searchActive ? 'border-blue-400' : 'border-transparent'
            }`}
            animate={{ width: searchActive ? '100%' : '100%' }}
          >
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchActive(true)}
              onBlur={() => setSearchActive(false)}
              className="w-full bg-transparent outline-none ml-2 text-sm text-gray-700"
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery('')}
              >
                <span className="sr-only">Clear</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Right section with actions */}
        <div className="flex items-center space-x-1">
          <motion.button
            className="relative p-2 rounded-full hover:bg-blue-50 transition-colors"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
          >
            <MessageSquare className="w-6 h-6 text-gray-600" />
          </motion.button>
          
          <motion.button
            className="relative p-2 rounded-full hover:bg-blue-50 transition-colors"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {notifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 bg-blue-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full"
              >
                {notifications}
              </motion.span>
            )}
          </motion.button>
          
          <div className="ml-2 relative">
            <motion.button 
              className="flex items-center bg-white p-1 rounded-full border-2 border-gray-200 hover:border-blue-300 transition-colors"
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <span className="hidden md:block ml-2 mr-1 text-sm font-medium text-gray-700">
                {user ? user.username : 'User'}
              </span>
            </motion.button>
            
            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">{user ? user.username : 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user ? user.email : 'user@example.com'}</p>
                </div>
                <a 
                  href="#profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <UserCircle className="w-4 h-4 mr-2" />
                  Your Profile
                </a>
                <a 
                  href="#settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </a>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Unusual navbar footer - a unique element */}
      <motion.div 
        className="h-1 w-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400"
          initial={{ x: '-100%' }}
          animate={{ 
            x: ['-100%', '100%'],
            transition: { 
              duration: 3, 
              repeat: Infinity,
              ease: "linear" 
            }
          }}
        />
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;