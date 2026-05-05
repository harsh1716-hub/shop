import { Bell, Search, UserCircle } from 'lucide-react';

const TopBar = () => {
  // Mock low stock items length
  const lowStockCount = 3;

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm z-10 flex items-center justify-between px-8 transition-all">
      <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 w-96 ring-1 ring-slate-200 focus-within:ring-blue-500 focus-within:bg-white transition-all">
        <Search className="text-slate-400 mr-2" size={18} />
        <input 
          type="text" 
          placeholder="Search items, bills..." 
          className="bg-transparent border-none outline-none w-full text-sm text-slate-700 placeholder-slate-400"
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative cursor-pointer hover:bg-slate-100 p-2 rounded-full transition-colors">
          <Bell size={22} className="text-slate-600" />
          {lowStockCount > 0 && (
            <span className="absolute top-1 right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse shadow-md shadow-red-500/50">
              {lowStockCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3 border-l border-slate-200 pl-6 cursor-pointer">
          <UserCircle size={32} className="text-slate-400" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">Admin</span>
            <span className="text-xs text-slate-500">Store Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
