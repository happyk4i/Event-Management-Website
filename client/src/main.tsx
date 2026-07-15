import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RouteGuard } from './component/RouteGuard.tsx';

import DashboardStats from './pages/dashboard/DashboardStats.tsx';
import Login from './pages/auth/Login.tsx';
import Register from './pages/auth/Register.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* RUTE PUBLIK: Halaman utama penuh animasi dan menu login/register */}
        <Route path="/" element={<App />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* RUTE KHUSUS CUSTOMER (Fitur 1)
        <Route element={<RouteGuard allowedRoles={['Customer']} />}>
          <Route path="/buy-ticket" element={<TransactionPage />} />
        </Route> */}

        {/* RUTE KHUSUS ORGANIZER */}
        <Route element={<RouteGuard allowedRoles={['Organizer']} />}>
          <Route path="/dashboard" element={<DashboardStats />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);