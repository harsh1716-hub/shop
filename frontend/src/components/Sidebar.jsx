import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Receipt, CalendarClock, LogOut, Bot } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'POS / Billing', path: '/billing', icon: <Receipt size={20} /> },
    { name: 'Advanced Orders', path: '/orders', icon: <CalendarClock size={20} /> },
    { name: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
    { name: 'AI Assistant ✨', path: '/ai', icon: <Bot size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col pt-8 pb-6 border-r border-slate-800 shadow-2xl z-20">
      <div className="px-8 mb-10 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-900 border-2 border-amber-300 shadow-lg shadow-amber-500/20">
          B
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Bakery<span className="text-amber-500"> Shop</span></h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm ${
                isActive 
                  ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20 shadow-inner border border-amber-400' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700'
              }`
            }
          >
            <span className="opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform">{link.icon}</span>
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 mt-auto">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-inner cursor-pointer hover:bg-slate-700 transition" onClick={handleLogout}>
          <div className="flex items-center space-x-3">
            <div className="bg-slate-700 p-2 rounded-lg text-slate-300">
              <LogOut size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Sign Out</p>
              <p className="text-xs text-slate-400 font-medium tracking-wide">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
