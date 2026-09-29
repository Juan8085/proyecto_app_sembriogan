import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PublicHome from './pages/PublicHome';
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz ahora muestra la Página Web Pública */}
        <Route path="/" element={<PublicHome />} />
        
        {/* Rutas de Operación */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>

      {/* 
        Widget Flotante de WhatsApp e IA 
        Al colocarlo debajo de Routes (pero dentro de BrowserRouter), 
        los botones flotarán por encima de cualquier pantalla.
      */}
      <ChatWidget />
    </BrowserRouter>
  );
}

export default App;