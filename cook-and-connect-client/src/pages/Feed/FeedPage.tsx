import React, { useEffect, useState } from 'react';
import { Lock, ChefHat, Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import RecipeCard, { type Recipe } from '../../components/ui/RecipeCard';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Category {
  id: number;
  name: string;
}

const FeedPage: React.FC = () => {
  const { isAuthenticated, user, token, authFetch } = useAuth();
  const navigate = useNavigate();

  // Estados de Datos
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de Filtros
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  
  // Valores de los filtros seleccionados
  const [selectedTime, setSelectedTime] = useState('all'); // all, week, month, year
  const [selectedDifficulty, setSelectedDifficulty] = useState('Todas'); // Todas, Fácil, Media, Difícil
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  // 1. Cargar Categorías al inicio (para el filtro)
  useEffect(() => {
    fetch('http://localhost:3000/api/categories')
      .then(res => res.json())
      .then(data => setAvailableCategories(data))
      .catch(err => console.error("Error cats", err));
  }, []);

  // 2. Función Maestra de Búsqueda (CORREGIDA)
  const fetchRecipes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Detectamos si hay algún filtro activo
      const hasFilters = searchText.trim() !== '' || 
                         selectedTime !== 'all' || 
                         selectedDifficulty !== 'Todas' || 
                         selectedCategories.length > 0;

      let url = '';

      if (hasFilters) {
        // SI HAY FILTROS: Usamos la ruta de búsqueda avanzada
        const params = new URLSearchParams();
        if (searchText) params.append('q', searchText);
        if (selectedTime !== 'all') params.append('time', selectedTime);
        if (selectedDifficulty !== 'Todas') params.append('difficulty', selectedDifficulty);
        if (selectedCategories.length > 0) params.append('categories', selectedCategories.join(','));
        
        url = `http://localhost:3000/api/recipes/search?${params.toString()}`;
      } else {
        // SI NO HAY FILTROS (Carga inicial): Usamos la ruta estándar del feed
        url = 'http://localhost:3000/api/recipes';
      }

      // Headers (Token opcional para likes)
      // Aunque sea pública, enviamos token si existe para ver mis likes (corazones rojos)
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      
      if (!response.ok) throw new Error('Error al cargar resultados');
      
      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      setError('Ocurrió un problema al cargar las recetas.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto: Buscar cuando cambia el token (login) o montar componente
  useEffect(() => {
    fetchRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); 

  // Handlers de Filtros
  const toggleCategory = (id: number) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(c => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedTime('all');
    setSelectedDifficulty('Todas');
    setSelectedCategories([]);
    // Importante: No llamamos fetchRecipes() aquí directamente porque los estados 
    // no se actualizan al instante. Dejamos que el usuario pulse "Buscar" o "Limpiar Búsqueda" abajo.
  };

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-dark transition-colors duration-300">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        
        {/* --- BARRA DE BÚSQUEDA Y BIENVENIDA --- */}
        <div className="mb-8 space-y-6">
          
          {/* Saludo (Solo si no hay búsqueda activa para no estorbar visualmente) */}
          {!searchText && !showFilters && (
            isAuthenticated && user ? (
                <div className="flex items-center justify-between animate-fade-in-up">
                <h1 className="text-2xl font-serif font-bold text-brand-dark dark:text-brand-cream">
                    ¡A cocinar, {user.username}! 👨‍🍳
                </h1>
                <Button size="sm" onClick={() => navigate('/recipes/create')} className="hidden md:flex">
                    Nueva Receta
                </Button>
                </div>
            ) : (
                // (Bloque de invitado resumido)
                <div className="bg-brand-brick/10 dark:bg-brand-amber/10 border border-brand-brick/20 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-brand-brick" />
                        <span className="text-sm font-bold text-brand-dark dark:text-brand-cream">Modo Invitado</span>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => navigate('/register')}>Crear Cuenta</Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/login')}>Login</Button>
                    </div>
                </div>
            )
          )}

          {/* --- COMPONENTE DE BÚSQUEDA --- */}
          <div className="relative z-10">
            <div className="flex gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar recetas o chefs..." 
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-brand-dark dark:text-brand-cream focus:ring-2 focus:ring-brand-brick focus:outline-none shadow-sm transition-all"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchRecipes()}
                    />
                    {searchText && (
                        <button onClick={() => { setSearchText(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-brick">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-3 rounded-xl border transition-colors ${showFilters ? 'bg-brand-peach border-brand-brick text-brand-brick' : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    title="Filtros avanzados"
                >
                    <SlidersHorizontal className="w-5 h-5" />
                </button>
                <Button onClick={fetchRecipes}>
                    Buscar
                </Button>
            </div>

            {/* --- PANEL DE FILTROS (Desplegable) --- */}
            {showFilters && (
                <div className="absolute top-full left-0 right-0 mt-2 p-6 bg-white dark:bg-brand-warmGray rounded-2xl shadow-xl border border-brand-peach/50 dark:border-white/10 animate-fade-in-up z-20">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-brand-dark dark:text-brand-cream">Filtros Avanzados</h3>
                        <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">Limpiar todo</button>
                    </div>
                    
                    <div className="space-y-5">
                        {/* Tiempo */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Publicado</label>
                            <div className="flex flex-wrap gap-2">
                                {['all:Siempre', 'week:Última Semana', 'month:Último Mes', 'year:A 1 Año'].map(opt => {
                                    const [val, label] = opt.split(':');
                                    return (
                                        <button 
                                            key={val}
                                            onClick={() => setSelectedTime(val)}
                                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selectedTime === val ? 'bg-brand-brick text-white border-brand-brick font-medium' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                        >
                                            {label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Dificultad */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Dificultad</label>
                            <div className="flex flex-wrap gap-2">
                                {['Todas', 'Fácil', 'Media', 'Difícil'].map(diff => (
                                    <button 
                                        key={diff}
                                        onClick={() => setSelectedDifficulty(diff)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selectedDifficulty === diff ? 'bg-brand-brick text-white border-brand-brick font-medium' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Categorías */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Categorías</label>
                            <div className="flex flex-wrap gap-2">
                                {availableCategories.map(cat => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => toggleCategory(cat.id)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selectedCategories.includes(cat.id) ? 'bg-brand-peach text-brand-brick border-brand-brick font-bold' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-brand-brick/50'}`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
                        <Button size="sm" onClick={() => { fetchRecipes(); setShowFilters(false); }}>
                            Aplicar Filtros
                        </Button>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* --- RESULTADOS --- */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-brand-brick animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
              {error}
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-brand-warmGray rounded-2xl border border-brand-peach/30 dark:border-white/5 shadow-sm">
              <Search className="w-16 h-16 mx-auto text-brand-brick/30 mb-4" />
              <h3 className="text-xl font-bold text-brand-dark dark:text-brand-cream mb-2">No encontramos nada</h3>
              <p className="text-brand-dark/60 dark:text-brand-cream/60 mb-6">
                Intenta con otros términos o quita algunos filtros.
              </p>
              <Button variant="outline" onClick={() => { 
                  clearFilters(); 
                  // Truco: Forzamos la búsqueda limpia manualmente aquí para reactividad inmediata
                  setSearchText(''); 
                  setSelectedTime('all'); 
                  setSelectedDifficulty('Todas'); 
                  setSelectedCategories([]);
                  setTimeout(() => document.getElementById('search-btn-hidden')?.click(), 100); 
                  // O simplemente recargamos la página o llamamos a fetchRecipes en el siguiente ciclo.
                  // Para simplificar en este ejemplo, dejamos que el usuario de click en buscar o recargue.
                  window.location.reload(); 
              }}>
                  Limpiar Búsqueda
              </Button>
            </div>
          ) : (
            recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          )}
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default FeedPage;