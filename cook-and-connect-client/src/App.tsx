import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import FeedPage from './pages/Feed/FeedPage';
import ProtectedRoute from './components/layout/ProtectedRoute'; //Importamos el guardián de rutas
import EditProfilePage from './pages/Profile/ProfilePage';
import CreateRecipePage from './pages/Recipes/CreateRecipePage';
import RecipeDetailsPage from './pages/Recipes/RecipeDetailsPage';
import EditRecipePage from './pages/Recipes/EditRecipePage';
import MyRecipesPage from './pages/Recipes/MyRecipesPage';
import UserProfilePage from './pages/Profile/UserProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    // BrowserRouter debe envolver toda la aplicación para que funcionen los enlaces
    <BrowserRouter>
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}

        {/* Ruta raíz: Muestra la Landing Page cuando la web carga */}
        <Route path="/" element={<LandingPage />} />

        {/* Ruta Login: Muestra la pantalla de inicio de sesión cuando va a /login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Ruta Register: Muestra la pantalla de registro cuando va a /register */}
        <Route path="/register" element={<RegisterPage />} />
        
        {/* EL FEED ES PÚBLICO (Modo Mixto: Invitados ven, Usuarios interactúan) */}
        <Route path="/feed" element={<FeedPage />} />

        {/* La información completa de una Receta junto a las fotos y comentarios del mismo */}
        <Route path="/recipes/:id" element={<RecipeDetailsPage />} />

        {/* EDITAR RECETA es privado */}
        <Route path="/profile/:username" element={<UserProfilePage />}
        />

        {/* --- RUTAS PRIVADAS (Ejemplo futuro) --- */}
        {/* Si intentan entrar aquí sin sesión, el componente ProtectedRoute los mandará al Login */}

        {/* EDITAR PERFIL es privado */}
        <Route path="/profile/edit" 
          element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} 
        />

        {/* Mis Recetas */}
        <Route path="/my-recipes" 
          element={<ProtectedRoute><MyRecipesPage /></ProtectedRoute>} 
        />

        {/* CREAR RECETA es privado */}
        <Route path="/recipes/create" 
          element={<ProtectedRoute><CreateRecipePage /></ProtectedRoute>}
        />

        {/* EDITAR RECETA es privado */}
        <Route path="/recipes/edit/:id" 
          element={<ProtectedRoute><EditRecipePage /></ProtectedRoute>}
        />

        {/* RUTA 404 (Not Found) */}
        <Route path="*" element={<NotFoundPage />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;