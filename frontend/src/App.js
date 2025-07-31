import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './styles/auth.css';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Receipts from './pages/Receipts';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import Exports from './pages/Exports';
import ImportTransactions from './pages/ImportTransactions';
import CompanySettings from './pages/CompanySettings';
import MasterDataSettings from './pages/MasterDataSettings';
import Settings from './pages/Settings';
import AIDashboard from './pages/AIDashboard';
import LLMTest from './pages/LLMTest';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <div className="authenticated-app">
                    <Navbar />
                    <main className="main-content">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/receipts" element={<Receipts />} />
                        <Route path="/matches" element={<Matches />} />
                        <Route path="/import" element={<ImportTransactions />} />
                        <Route path="/exports" element={<Exports />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/company-settings" element={<CompanySettings />} />
                        <Route path="/master-data-settings" element={<MasterDataSettings />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/ai-dashboard" element={<AIDashboard />} />
                        <Route path="/llm-test" element={<LLMTest />} />
                      </Routes>
                    </main>
                  </div>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
          </Routes>
          
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
