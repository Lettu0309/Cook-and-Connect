import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Calendar, ChefHat, Loader2 } from 'lucide-react';
import Header from '../../components/layout/Header';
import RecipeCard, { type Recipe } from '../../components/ui/RecipeCard';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
}

const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { authFetch, user: currentUser } = useAuth(); // Para saber si soy yo mismo

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // Usamos authFetch para enviar token si lo tenemos (para los likes)
        const response = await authFetch(`http://localhost:3000/api/users/${username}`);
        
        if (!response.ok) {
            if (response.status === 404) throw new Error('Usuario no encontrado');
            throw new Error('Error al cargar perfil');
        }
        
        const data = await response.json();
        setProfile(data.profile);
        setRecipes(data.recipes);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchProfile();
  }, [username, authFetch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  if (loading) return <div className="min-h-screen bg-brand-cream dark:bg-brand-dark flex items-center justify-center"><Loader2 className="w-10 h-10 text-brand-brick animate-spin" /></div>;
  
  if (error || !profile) return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-dark transition-colors duration-300">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
            <User className="w-20 h-20 mx-auto text-brand-dark/20 dark:text-brand-cream/20 mb-4" />
            <h2 className="text-2xl font-bold text-brand-dark dark:text-brand-cream mb-2">Usuario no encontrado</h2>
            <p className="text-brand-dark/60 dark:text-brand-cream/60 mb-6">Parece que este chef no existe o cambió su nombre.</p>
            <Button onClick={() => navigate('/feed')}>Volver al Feed</Button>
        </div>
    </div>
  );

  const isOwnProfile = currentUser && currentUser.username === profile.username;

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-dark transition-colors duration-300">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* --- TARJETA DE PERFIL --- */}
        <div className="bg-white dark:bg-brand-warmGray rounded-3xl shadow-lg border border-brand-peach/50 dark:border-white/5 overflow-hidden mb-10 animate-fade-in-up">
            
            {/* Portada decorativa (Patrón o color sólido) */}
            <div className="h-32 bg-gradient-to-r from-brand-brick/80 to-brand-amber/80 dark:from-brand-brick/60 dark:to-brand-amber/60"></div>
            
            <div className="px-8 pb-8">
                <div className="flex flex-col md:flex-row gap-6 items-start -mt-12">
                    
                    {/* Avatar */}
                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-brand-warmGray bg-white dark:bg-brand-warmGray shadow-md overflow-hidden shrink-0">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-brand-peach/30 dark:bg-white/5">
                                <User className="w-12 h-12 text-brand-brick/50" />
                            </div>
                        )}
                    </div>

                    {/* Datos */}
                    <div className="flex-grow pt-14 md:pt-14 w-full">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-brand-dark dark:text-brand-cream">
                                    {profile.firstname} {profile.lastname}
                                </h1>
                                <p className="text-brand-brick dark:text-brand-amber font-medium">@{profile.username}</p>
                            </div>
                            
                            {/* Botón de Acción (Si es mi perfil, ir a editar) */}
                            {isOwnProfile && (
                                <Button variant="secondary" size="sm" onClick={() => navigate('/profile/edit')}>
                                    Editar Perfil
                                </Button>
                            )}
                        </div>

                        {/* Bio y Metadata */}
                        <div className="mt-6 space-y-4">
                            {profile.bio && (
                                <p className="text-brand-dark/80 dark:text-brand-cream/80 leading-relaxed max-w-2xl">
                                    {profile.bio}
                                </p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-sm text-brand-dark/50 dark:text-brand-cream/50">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> Se unió en {formatDate(profile.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <ChefHat className="w-4 h-4" /> {recipes.length} Recetas publicadas
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- GRID DE RECETAS --- */}
        <h3 className="text-2xl font-bold text-brand-dark dark:text-brand-cream mb-6 pl-2 border-l-4 border-brand-brick">
            Recetario de {profile.username}
        </h3>

        {recipes.length > 0 ? (
            <div className="space-y-6">
                {recipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
            </div>
        ) : (
            <div className="text-center py-16 bg-brand-peach/10 dark:bg-white/5 rounded-2xl border border-dashed border-brand-peach dark:border-white/10">
                <ChefHat className="w-12 h-12 mx-auto text-brand-dark/20 dark:text-brand-cream/20 mb-3" />
                <p className="text-brand-dark/50 dark:text-brand-cream/50">Este chef aún no ha publicado recetas.</p>
            </div>
        )}

      </main>
    </div>
  );
};

export default UserProfilePage;