import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, LogOut, UserCircle, User, X } from 'lucide-react';
import AuthService from '../services/AuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const Navbar = ({ toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(AuthService.getCurrentUser());
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/');
  };

  return (
    <nav className="fixed right-0 top-0 left-0 z-20 bg-background border-b border-border h-14 flex items-center px-4 gap-4">
      {/* Menu button + logo */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
          <Menu className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-foreground rounded-md flex items-center justify-center">
            <span className="text-background font-bold text-xs">D</span>
          </div>
          <span className="font-semibold text-sm hidden md:block">DeepFake Detector</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 bg-muted border-0 focus-visible:ring-1"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="w-4 h-4" />
        </Button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="hidden md:block text-sm font-medium">{user?.username ?? 'User'}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-popover border border-border rounded-md shadow-md py-1 z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">{user?.username ?? 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
              </div>
              <a href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                <UserCircle className="w-4 h-4" /> Profile
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
