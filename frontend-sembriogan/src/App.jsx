import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública temporal: si entran a la raíz, los manda al login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Pantalla de Login Unificado */}
        <Route path="/login" element={<Login />} />

        {/* Estas rutas las crearemos en el próximo paso */}
        {/* <Route path="/admin" element={<AdminDashboard />} /> */}
        {/* <Route path="/vet" element={<VetDashboard />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;