import React, { useState, useEffect } from 'react';
import * as framerMotion from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  BarChart2, 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  HelpCircle,
  Image,
  Video,
  AudioWaveform,
  Text,
  Tv,
  ChevronRight,
  LogOut,
  X,
  User
} from 'lucide-react';
import AuthService from '../services/AuthService';

const { motion } = framerMotion;

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get current user from local storage
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Navigation items - all in one place
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/image-analysis', icon: Image, label: 'Image Analysis' },
    { path: '/video-analysis', icon: Video, label: 'Video Analysis' },
    { path: '/audio-analysis', icon: AudioWaveform, label: 'Audio Analysis' },
    { path: '/text-analysis', icon: Text, label: 'Text Analysis' },
    { path: '/live-streaming-analysis', icon: Tv, label: 'Live Streaming Analysis'},
  ];
  
  const bottomItems = [
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/help', icon: HelpCircle, label: 'Help & Support' },
  ];
  
  const toggleSubMenu = (path) => {
    setExpandedMenu(expandedMenu === path ? null : path);
  };
  
  // Determine if a route is active
  const isActive = (path) => {
    return window.location.pathname === path || 
          (path !== '/dashboard' && window.location.pathname.startsWith(path));
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/');
  };
  
  // Animation variants
  const sidebarVariants = {
    open: {
      width: '280px',
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    closed: {
      width: '80px',
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        className="fixed top-0 left-0 h-screen bg-white shadow-lg z-40 pt-16 flex flex-col"
        variants={sidebarVariants}
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
      >
        {/* User profile section */}
        {isOpen && (
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-gray-800 truncate">{user ? user.username : 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user ? user.email : 'user@example.com'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            <div className={isOpen ? "block" : "hidden"}>
              <p className="text-xs font-medium uppercase text-gray-500 mb-4">
                Main Menu
              </p>
            </div>
            
            <ul className="space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const hasChildren = item.children && item.children.length > 0;
                
                return (
                  <li key={item.path}>
                    <div className="relative">
                      {/* Main menu item */}
                      <a
                        href={item.path}
                        className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                          active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                        
                        {isOpen && (
                          <span className="ml-3 font-medium text-sm">
                            {item.label}
                          </span>
                        )}
                        
                        {hasChildren && isOpen && (
                          <button
                            className="ml-auto"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSubMenu(item.path);
                            }}
                          >
                            <div
                              style={{
                                transform: expandedMenu === item.path ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                              }}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </button>
                        )}
                      </a>
                      
                      {/* Submenu items */}
                      {hasChildren && isOpen && (
                        <div
                          className="overflow-hidden pl-10"
                          style={{
                            height: expandedMenu === item.path ? 'auto' : '0',
                            opacity: expandedMenu === item.path ? 1 : 0,
                            transition: 'height 0.3s, opacity 0.3s'
                          }}
                        >
                          <ul>
                            {item.children.map((child) => (
                              <li key={child.path}>
                                <a
                                  href={child.path}
                                  className={`flex items-center w-full p-2 rounded-lg text-sm transition-colors ${
                                    isActive(child.path) ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'
                                  }`}
                                >
                                  <div className="w-1 h-1 rounded-full bg-gray-400 mr-2"></div>
                                  {child.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-200 pt-4 pb-6 px-4">
          {isOpen && (
            <p className="text-xs font-medium uppercase text-gray-500 mb-4">
              Settings & Account
            </p>
          )}
          
          <ul className="space-y-2">
            {bottomItems.map((item) => {
              const active = isActive(item.path);
              
              return (
                <li key={item.path}>
                  <a
                    href={item.path}
                    className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                      active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                    
                    {isOpen && (
                      <span className="ml-3 font-medium text-sm">
                        {item.label}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className={`flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${!isOpen ? 'justify-center' : ''}`}
            >
              <LogOut className="w-6 h-6 text-red-500" />
              {isOpen && (
                <span className="ml-3 font-medium text-sm">
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;