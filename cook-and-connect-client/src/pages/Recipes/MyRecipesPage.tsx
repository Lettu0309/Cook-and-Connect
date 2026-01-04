import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, PlusCircle } from 'lucide-react'; // Iconos nuevos
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import RecipeCard, { type Recipe } from '../../components/ui/RecipeCard';
import { useAuth } from '../../contexts/AuthContext';

const MyRecipesPage: React.FC = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyRecipes = async () => {
      try {
        // Usamos authFetch para manejar el token automáticamente
        const response = await authFetch('http://localhost:3000/api/user/recipes');
        
        if (!response.ok) throw new Error('Error al cargar tus recetas');
        
        const data = await response.json();
        setRecipes(data);
      } catch (err) {
        console.error(err);
        setError('No pudimos cargar tu recetario.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyRecipes();
  }, [authFetch]);

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-dark transition-colors duration-300">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Encabezado Personalizado */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
            <button onClick={() => navigate('/feed')} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full">
                <ArrowLeft className="text-brand-dark dark:text-brand-cream" />
            </button>
            <h1 className="text-3xl font-serif font-bold text-brand-dark dark:text-brand-cream">
              Mis Recetas
            </h1>
            <div>
                <p className="text-brand-dark/60 dark:text-brand-cream/60">
                    Tu colección personal de sabores.
                </p>
            </div>
        </div>

        {/* Contenido */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-brand-brick animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg">
              {error}
            </div>
          ) : recipes.length === 0 ? (
            // Estado Vacío: Anima a crear
            <div className="text-center py-16 bg-white dark:bg-brand-warmGray rounded-2xl border border-brand-peach/30 dark:border-white/5 shadow-sm">
              <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-brand-dark dark:text-brand-cream mb-2">
                Aún no has publicado nada
              </h3>
              <p className="text-brand-dark/60 dark:text-brand-cream/60 mb-6 max-w-xs mx-auto">
                ¡El mundo está esperando probar tus platillos! Crea tu primera receta ahora.
              </p>
              <Button onClick={() => navigate('/recipes/create')}>
                Crear mi primera receta
              </Button>
            </div>
          ) : (
            // Lista de Recetas Propias
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

export default MyRecipesPage;