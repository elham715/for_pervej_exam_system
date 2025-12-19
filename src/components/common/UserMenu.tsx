import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { logOut } from '../../lib/auth';

interface UserMenuProps {
  onNavigateToProfile?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onNavigateToProfile }) => {
  const { currentUser, userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    if (onNavigateToProfile) {
      onNavigateToProfile();
    }
  };

  if (!currentUser) return null;

  const displayName = userData?.name || currentUser.displayName || currentUser.email || 'User';
  const userRole = userData?.role || 'STUDENT';
  const userEmail = userData?.email || currentUser.email;

  return (
    <div className="relative" ref={menuRef}>
      {/* User Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-blue-700" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs text-blue-600">
            {userRole === 'ADMIN' ? 'Admin' : 'Student'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500 mt-1">{userEmail}</p>
            <span
              className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                userRole === 'ADMIN'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {userRole === 'ADMIN' ? 'Administrator' : 'Student'}
            </span>
            {userData?.is_enrolled !== undefined && (
              <span
                className={`inline-block mt-2 ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  userData.is_enrolled
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {userData.is_enrolled ? 'Enrolled' : 'Not Enrolled'}
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {onNavigateToProfile && (
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>View Profile</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
