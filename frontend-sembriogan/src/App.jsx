import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PublicHome from './pages/PublicHome'; // <-- Importamos la web pública

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
    </BrowserRouter>
  );
}

export default App;