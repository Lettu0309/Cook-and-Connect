import React, { useState, useEffect } from 'react'; // 1. Importamos useEffect
import { Clock, ChefHat, Heart, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export interface Recipe {
  id: number;
  title: string;
  description: string;
  prep_time_minutes: number;
  difficulty: 'Fácil' | 'Media' | 'Difícil';
  created_at: string;
  is_edited: boolean;
  username: string;
  author_avatar: string | null;
  cover_image: string | null;
  likes_count: number;
  comments_count: number;
  my_reaction: 'like' | 'dislike' | null;
}

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(recipe.my_reaction === 'like');
  const [likesCount, setLikesCount] = useState(recipe.likes_count);
  const [isAnimating, setIsAnimating] = useState(false);

  // --- CORRECCIÓN CRÍTICA ---
  // Este efecto escucha cambios en la receta que viene "desde arriba" (el Feed).
  // Si el Feed se actualiza (ej: carga el token y descubre que ya diste like),
  // esto fuerza a la tarjeta a actualizarse visualmente.
  useEffect(() => {
    setIsLiked(recipe.my_reaction === 'like');
    setLikesCount(recipe.likes_count);
  }, [recipe]); 

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

    // Función específica para la hora (24h)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert("🔒 Inicia sesión para dar 'Me gusta' a las recetas.");
      return;
    }

    // Actualización Optimista
    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsAnimating(true);

    try {
      const response = await fetch(`http://localhost:3000/api/recipes/${recipe.id}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'like' })
      });

      if (!response.ok) throw new Error('Error al dar like');

      const data = await response.json();
      // Confirmación final del servidor (opcional, pero buena práctica)
      if (data.newLikesCount !== undefined) {
          setLikesCount(data.newLikesCount);
      }

    } catch (error) {
      // Rollback si falla
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error(error);
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

    // Función para ir al perfil (usamos stopPropagation por si acaso la tarjeta entera tuviera click en el futuro)
  const goToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${recipe.username}`);
  };

  return (
    <article className="bg-white dark:bg-brand-warmGray rounded-2xl shadow-sm border border-brand-peach/50 dark:border-white/5 overflow-hidden hover:shadow-md transition-shadow duration-300 mb-8">
      
      {/* Cabecera */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar Cliqueable */}
          <div 
            onClick={goToProfile}
            className="w-10 h-10 rounded-full bg-brand-brick/10 dark:bg-brand-amber/10 overflow-hidden border border-brand-peach/50 cursor-pointer hover:opacity-80 transition-opacity"
            title={`Ver perfil de ${recipe.username}`}
          >
            {recipe.author_avatar ? (
              <img src={recipe.author_avatar} alt={recipe.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-5 h-5 text-brand-brick dark:text-brand-amber" />
              </div>
            )}
          </div>

          {/* <div className="w-10 h-10 rounded-full bg-brand-brick/10 dark:bg-brand-amber/10 overflow-hidden border border-brand-peach/50">
            {recipe.author_avatar ? (
              <img src={recipe.author_avatar} alt={recipe.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-5 h-5 text-brand-brick dark:text-brand-amber" />
              </div>
            )}
          </div> */}
          <div>
            {/* Nombre de Usuario Cliqueable */}
            <h3 
              onClick={goToProfile}
              className="text-sm font-bold text-brand-dark dark:text-brand-cream cursor-pointer hover:text-brand-brick dark:hover:text-brand-amber hover:underline transition-colors"
            >
              {recipe.username}
            </h3>
            
            {/* Fecha y Hora */}
            <div className="text-xs text-brand-dark/50 dark:text-brand-cream/50 flex flex-col">
              <span>{formatDate(recipe.created_at)} a las {formatTime(recipe.created_at)}{recipe.is_edited ? <span className="italic text-[10px] opacity-80 ml-1">(editado)</span> : null}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Imagen */}
      {recipe.cover_image && (
        <div className="w-full h-64 overflow-hidden bg-gray-100 dark:bg-black/20 group cursor-pointer"
        onClick={() => navigate(`/recipes/${recipe.id}`)}>
          <img 
            src={recipe.cover_image} 
            alt={recipe.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy" 
          />
        </div>
      )}

      {/* Contenido */}
      <div className="p-5">
        <div className="flex items-center gap-4 text-xs font-semibold text-brand-brick dark:text-brand-amber mb-2 uppercase tracking-wide">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {recipe.prep_time_minutes} min
          </span>
          <span className="flex items-center gap-1">
            <ChefHat className="w-3 h-3" /> {recipe.difficulty}
          </span>
        </div>

        <h2 className="text-xl font-serif font-bold text-brand-dark dark:text-brand-cream mb-2 leading-tight"
        onClick={() => navigate(`/recipes/${recipe.id}`)}>
          {recipe.title}
        </h2>
        
        <p className="text-sm text-brand-dark/70 dark:text-brand-cream/70 line-clamp-3 mb-4">
          {recipe.description}
        </p>

        {/* Acciones */}
        <div className="flex items-center gap-6 pt-4 border-t border-brand-peach/30 dark:border-white/5">
          
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
              isLiked 
                ? 'text-red-500' 
                : 'text-brand-dark/60 dark:text-brand-cream/60 hover:text-red-500 dark:hover:text-red-400'
            } ${isAnimating ? 'scale-125' : 'scale-100'}`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button 
            className="flex items-center gap-2 text-sm font-medium transition-colors text-brand-dark/60 dark:text-brand-cream/60 hover:text-brand-brick dark:hover:text-brand-amber"
          >
            <MessageCircle className="w-6 h-6" />
            <span>{recipe.comments_count}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default RecipeCard;