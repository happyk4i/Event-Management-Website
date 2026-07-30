import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RouteGuard } from './routes/RouteGuard';

import OrganizerDashboard from './pages/dashboard/OrganizerDashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        { }
        <Route path="/*" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        { }

        { }
        <Route element={<RouteGuard allowedRoles={['Organizer']} />}>

        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);