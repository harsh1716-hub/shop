import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Orders from './pages/Orders';
import AIAssistant from './pages/AIAssistant';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Layout wrapper for authenticated pages
const AppLayout = ({ children }) => (
  <div className="flex bg-background min-h-screen text-slate-800 font-sans print:bg-white print:min-h-0">
    <div className="print:hidden z-30">
      <Sidebar />
    </div>
    <div className="flex flex-col flex-1 pl-64 print:pl-0 print:w-full">
      <div className="print:hidden z-20">
        <TopBar />
      </div>
      <main className="p-8 pt-24 h-screen overflow-y-auto print:overflow-visible print:p-0 print:h-auto print:m-0">
        {children}
      </main>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/ai" element={<AIAssistant />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
