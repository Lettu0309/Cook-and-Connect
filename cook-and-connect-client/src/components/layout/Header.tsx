import React, { useState, useRef, useEffect } from 'react';
import { ChefHat, Moon, Sun, Menu, User, LogOut, Settings, PlusCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Estado para controlar si el menú desplegable está abierto o cerrado
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  //Estado para detectar si la imagen falló al cargar
  const [imageError, setImageError] = useState(false);
  
  // Referencia para detectar clics fuera del menú
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  // Efecto para cerrar el menú si haces clic en cualquier otro lado de la pantalla
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función auxiliar para decidir qué mostrar (Foto o Icono)
  const renderAvatar = (className: string) => {
    // Si hay avatar Y no ha dado error, mostramos la imagen
    if (user?.avatar && !imageError) {
      return (
        <img 
          src={user.avatar} 
          alt={user.username} 
          className={className}
          // Si falla la carga, activamos el error para mostrar el icono
          onError={() => setImageError(true)} 
        />
      );
    }
    // Si no hay avatar O dio error, mostramos el icono por defecto
    return <User className="w-full h-full p-1 text-brand-brick dark:text-brand-amber" />;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-peach dark:border-brand-warmGray bg-brand-cream/90 dark:bg-brand-dark/90 backdrop-blur-sm transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-6 flex h-20 items-center justify-between">
        
        {/* --- LOGO (Clic lleva al inicio o al feed según estado) --- */}
        <div 
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => navigate(isAuthenticated ? '/feed' : '/')}
        >
          <ChefHat className="h-8 w-8 text-brand-brick dark:text-brand-amber" />
          <span className="text-2xl font-serif font-bold text-brand-brick dark:text-brand-amber tracking-tight hidden sm:block">
            Cook & Connect
          </span>
        </div>

        <div className="flex items-center gap-4">
          
          {/* --- BOTÓN DE TEMA (Siempre visible) --- */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-brand-peach dark:hover:bg-brand-warmGray transition-colors text-brand-dark dark:text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-brick dark:focus:ring-brand-amber"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>

          {/* --- LÓGICA CONDICIONAL: ¿LOGUEADO O INVITADO? --- */}
          {isAuthenticated && user ? (
            
            // === VISTA: USUARIO LOGUEADO ===
            <div className="relative" ref={menuRef}>
              
              {/* Trigger (Botón que abre el menú) */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full border border-brand-peach dark:border-brand-warmGray hover:bg-brand-peach/50 dark:hover:bg-brand-warmGray/50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-brick"
              >
                {/* 1. Nombre del Usuario */}
                <span className="text-sm font-bold text-brand-dark dark:text-brand-cream hidden md:block">
                  {user.username}
                </span>
                
                {/* 2. Avatar Pequeño (Header) */}
                {/* <div className="w-8 h-8 rounded-full bg-brand-brick/10 dark:bg-brand-amber/20 flex items-center justify-center overflow-hidden border border-brand-brick/20">
                   {user.avatar ? (
                     <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <User className="w-5 h-5 text-brand-brick dark:text-brand-amber" />
                   )}
                </div> */}
                <div className="w-8 h-8 rounded-full bg-brand-brick/10 dark:bg-brand-amber/20 flex items-center justify-center overflow-hidden border border-brand-brick/20">
                   {renderAvatar("w-full h-full object-cover")}
                </div>

                {/* 3. Icono Hamburguesa */}
                <Menu className="w-5 h-5 text-brand-dark dark:text-brand-cream ml-1" />
              </button>

              {/* === MENÚ DESPLEGABLE (Dropdown) === */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-brand-warmGray rounded-xl shadow-2xl border border-brand-peach/50 dark:border-white/10 overflow-hidden transform origin-top-right animate-fade-in-up">
                  
                  {/* Cabecera del Menú: Foto Grande y Datos */}
                  <div className="p-6 bg-brand-peach/30 dark:bg-black/20 flex flex-col items-center border-b border-brand-peach/30 dark:border-white/5">
                    {/* Foto Grande (w-20 h-20) */}
                    <div className="w-20 h-20 rounded-full bg-brand-cream dark:bg-brand-dark p-1 shadow-md mb-3">
                       <div className="w-full h-full rounded-full bg-brand-brick/10 dark:bg-brand-amber/10 flex items-center justify-center overflow-hidden">
                         {user.avatar ? (
                           <img src={user.avatar} alt="Avatar Grande" className="w-full h-full object-cover" />
                         ) : (
                           <User className="w-10 h-10 text-brand-brick dark:text-brand-amber" />
                         )}
                       </div>
                    </div>
                    <h3 className="text-lg font-bold text-brand-dark dark:text-brand-cream font-serif">
                      {user.username}
                    </h3>
                    <p className="text-xs text-brand-dark/60 dark:text-brand-cream/60">
                      {user.email}
                    </p>
                  </div>

                  {/* Lista de Opciones */}
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => { setIsMenuOpen(false); navigate('/recipes/create'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-dark dark:text-brand-cream hover:bg-brand-cream dark:hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <PlusCircle className="w-4 h-4 text-brand-brick dark:text-brand-amber" />
                      Nueva Receta
                    </button>

                    {/* --- BOTÓN MIS RECETAS (Aquí está el BookOpen) --- */}
                    <button 
                      onClick={() => { setIsMenuOpen(false); navigate('/my-recipes'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-dark dark:text-brand-cream hover:bg-brand-cream dark:hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <BookOpen className="w-4 h-4 text-brand-brick dark:text-brand-amber" />
                      Mis Recetas
                    </button>

                    <button 
                      onClick={() => navigate('/profile/edit')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-dark dark:text-brand-cream hover:bg-brand-cream dark:hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-brand-brick dark:text-brand-amber" />
                      Editar Perfil
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

          ) : (
            
            // === VISTA: INVITADO (Sin sesión) ===
            <div className="hidden md:flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
                Iniciar sesión
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                Registrarse
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;