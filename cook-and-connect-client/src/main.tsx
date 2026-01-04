import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css' // Importante: tus estilos de Tailwind
import { ThemeProvider } from './contexts/ThemeContext.tsx' // Importante: El Proveedor
import { AuthProvider } from './contexts/AuthContext.tsx' // Importamos el nuevo proveedor

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* AQUÍ ESTÁ LA CLAVE: Envolvemos toda la App con el ThemeProvider */}
    <ThemeProvider>
      {/* Envolvemos la App con AuthProvider para manejar las sesiones */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)