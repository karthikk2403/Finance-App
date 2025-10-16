import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, FileText, GitCompare, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const Sidebar = ({ user, onLogout, sheets }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed left-0 top-0 h-screen w-64 glass-effect border-r border-gray-200 z-50">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800" data-testid="sidebar-title">Expense Wizard</h1>
        <p className="text-sm text-gray-600 mt-1" data-testid="user-name">{user.name}</p>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)] px-4 py-6">
        <div className="space-y-2">
          <Link to="/" data-testid="nav-home">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-2" />
              Overview
            </Button>
          </Link>

          <Link to="/compare" data-testid="nav-compare">
            <Button
              variant={isActive('/compare') ? 'default' : 'ghost'}
              className="w-full justify-start"
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare
            </Button>
          </Link>

          <div className="pt-6 pb-2">
            <p className="text-xs font-semibold text-gray-500 px-3 mb-2">YOUR SHEETS</p>
          </div>

          {sheets.slice(0, 8).map((sheet) => (
            <Link key={sheet.id} to={`/sheet/${sheet.id}`} data-testid={`sheet-link-${sheet.id}`}>
              <Button
                variant={location.pathname.includes(sheet.id) ? 'default' : 'ghost'}
                className="w-full justify-start text-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="truncate">{sheet.name}</span>
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 glass-effect">
        <Button
          onClick={onLogout}
          data-testid="logout-button"
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;