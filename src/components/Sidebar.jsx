import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Image, Video, User } from 'lucide-react';
import AuthService from '../services/AuthService';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/image-analysis', icon: Image, label: 'Image Analysis' },
  { path: '/video-analysis', icon: Video, label: 'Video Analysis' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(AuthService.getCurrentUser());
  }, []);

  const isActive = (path) =>
    window.location.pathname === path ||
    (path !== '/dashboard' && window.location.pathname.startsWith(path));

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={toggleSidebar} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-foreground border-r border-foreground z-40 pt-14 flex flex-col transition-all duration-300",
          isOpen ? "w-64" : "w-16"
        )}
      >
        {/* User profile */}
        {isOpen && (
          <div className="px-3 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white/70" />
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-sm text-white truncate">{user?.username ?? 'User'}</p>
                <p className="text-xs text-white/50 truncate">{user?.email ?? ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-3 px-2">
          {isOpen && (
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider px-2 mb-2">
              Main Menu
            </p>
          )}
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <a
                    href={item.path}
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-white text-black"
                        : "text-white/70 hover:bg-white/10 hover:text-white",
                      !isOpen && "justify-center"
                    )}
                    title={!isOpen ? item.label : undefined}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {isOpen && <span>{item.label}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
