import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ChefHat, Heart, MessageCircle, User, Send, Smile, Trash2, Edit2 } from 'lucide-react';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
  likes_count: number;
  my_reaction: 'like' | 'dislike' | null;
}

interface FullRecipe {
  id: number;
  title: string;
  description: string;
  prep_time_minutes: number;
  difficulty: string;
  created_at: string;
  is_edited: boolean;
  username: string;
  author_avatar: string | null;
  likes_count: number;
  comments_count: number;
  my_reaction: 'like' | 'dislike' | null;
  ingredients: string[];
  categories: string[];
  images: string[];
  comments: Comment[]; 
}

const RecipeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Usamos authFetch del contexto para peticiones seguras
  const { user, isAuthenticated, authFetch } = useAuth();
  const { theme } = useTheme();

  const [recipe, setRecipe] = useState<FullRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Estados para Likes de Receta
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Estados para Comentarios
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMainEmojiPicker, setShowMainEmojiPicker] = useState(false);
  
  // Estado para edición
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);

  // Cargar Receta (Blindado contra race conditions)
  useEffect(() => {
    let isMounted = true; 

    const fetchDetails = async () => {
      try {
        // authFetch maneja los headers y el token automáticamente
        const response = await authFetch(`http://localhost:3000/api/recipes/${id}`);

        // // authFetch maneja los headers y el token automáticamente
        // const headers: HeadersInit = {};
        // if (token) headers['Authorization'] = `Bearer ${token}`;
        
        // const response = await fetch(`http://localhost:3000/api/recipes/${id}`, { headers });
        
        if (!response.ok) throw new Error('Receta no encontrada');
        
        const data = await response.json();
        
        if (isMounted) {
            setRecipe(data);
            setLoading(false);
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (isMounted) {
          // Si authFetch redirigió por token expirado, este error es visual momentáneo
            setError('No pudimos cargar la receta.');
            console.error(err.message);
            setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [id, authFetch]);  // Dependencia authFetch (estable gracias al useCallback interno del contexto o definición externa)

  // Sincronizar estado visual de likes de receta
  useEffect(() => {
    if (recipe) {
      setIsLiked(recipe.my_reaction === 'like');
      setLikesCount(Number(recipe.likes_count || 0));
    }
  }, [recipe]);

  // Manejo de clics fuera para cerrar emoji pickers
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMainEmojiPicker(false);
      setShowEditEmojiPicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
  };

  // Función específica para la hora (24h)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  };

    // --- NAVEGACIÓN A PERFIL ---
  const goToProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  // --- ACCIONES DE DUEÑO DE RECETA (NUEVO) ---
  const handleDeleteRecipe = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta receta permanentemente? Esta acción no se puede deshacer.')) return;
    
    try {
        await authFetch(`http://localhost:3000/api/recipes/${id}`, {
            method: 'DELETE'
        });
        // Éxito: Volver al feed
        navigate('/feed');
    } catch (error) {
        console.error("Error eliminando receta:", error);
        alert("No se pudo eliminar la receta.");
    }
  };

  // --- LOGICA DE LIKE A RECETA ---
  const handleLike = async () => {
    if (!isAuthenticated) {
      alert("🔒 Inicia sesión para dar 'Me gusta' a las recetas.");
      return;
    }
    const previousLiked = isLiked;
    const previousCount = likesCount;

    // UI Optimista
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsAnimating(true);

    try {
      const response = await authFetch(`http://localhost:3000/api/recipes/${id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'like' })
      });
      if (!response.ok) throw new Error('Error al dar like');

      // Sincronización final
      const data = await response.json();
      if (data.newLikesCount !== undefined) setLikesCount(data.newLikesCount);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err : any) {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error(err.message);
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // --- LOGICA DE LIKE A COMENTARIO ---
  const handleCommentLike = async (commentId: number) => {
    if (!isAuthenticated || !recipe) {
        alert("🔒 Inicia sesión para dar 'Me gusta'.");
        return;
    }

    // Actualización Optimista local en la lista de comentarios
    const updatedComments = recipe.comments.map(c => {
        if (c.id === commentId) {
            const isCurrentlyLiked = c.my_reaction === 'like';
            // Conversión explícita a número para evitar NaN en optimismo
            const currentCount = Number(c.likes_count || 0);

            return {
                ...c,
                my_reaction: isCurrentlyLiked ? null : 'like',
                likes_count: isCurrentlyLiked ? currentCount - 1 : currentCount + 1
            };
        }
        return c;
    });

    setRecipe({ ...recipe, comments: updatedComments as Comment[] });

    try {
        const response = await authFetch(`http://localhost:3000/api/comments/${commentId}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'like' })
        });
        
        if (!response.ok) throw new Error('Error');
    } catch (error) {
        console.error(error);
        // Si hay error, podrías recargar aquí para revertir
    }
  };

  // --- ACCIONES DE COMENTARIOS ---
  const handleMainEmojiClick = (emojiData: EmojiClickData) => setNewComment(prev => prev + emojiData.emoji);
  const handleEditEmojiClick = (emojiData: EmojiClickData) => setEditText(prev => prev + emojiData.emoji);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const response = await authFetch(`http://localhost:3000/api/recipes/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      if (response.ok) {
        setNewComment('');
        setShowMainEmojiPicker(false);
        // Recargamos los detalles para ver el nuevo comentario
        // const headers: HeadersInit = {};
        // if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await authFetch(`http://localhost:3000/api/recipes/${id}`);
        const data = await res.json();
        setRecipe(data);
      }
    } catch (err) { console.error(err); } finally { setSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('¿Eliminar comentario?')) return;
    try {
      await authFetch(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      // Recargar datos
      // const headers: HeadersInit = {};
      // if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await authFetch(`http://localhost:3000/api/recipes/${id}`);
      const data = await res.json();
      setRecipe(data);
    } catch (err) { console.error(err); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startEditing = (comment: any) => {
      setEditingCommentId(comment.id);
      setEditText(comment.content);
      setShowMainEmojiPicker(false); 
      setShowEditEmojiPicker(false); 
  };

  const cancelEditing = () => {
      setEditingCommentId(null);
      setEditText('');
      setShowEditEmojiPicker(false);
  };

  const handleUpdateComment = async () => {
      if (!editText.trim()) return;
      try {
        await authFetch(`http://localhost:3000/api/comments/${editingCommentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editText })
        });
        setEditingCommentId(null);

        // Recargar datos
        // const headers: HeadersInit = {};
        // if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await authFetch(`http://localhost:3000/api/recipes/${id}`);
        const data = await res.json();
        setRecipe(data);
      } catch (err) { console.error(err); }
  };

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  if (loading) return <div className="min-h-screen bg-brand-cream dark:bg-brand-dark flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-brick"></div></div>;
  if (error || !recipe) return <div className="min-h-screen bg-brand-cream dark:bg-brand-dark p-8 text-center"><h2 className="text-2xl text-red-500 mb-4">{error}</h2><Button onClick={() => navigate('/feed')}>Volver</Button></div>;

  // Verificamos si el usuario actual es el dueño de la receta
  const isOwner = user && user.username === recipe.username;

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-dark transition-colors duration-300">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <button onClick={() => navigate('/feed')} className="mb-6 flex items-center gap-2 text-brand-dark/60 dark:text-brand-cream/60 hover:text-brand-brick transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver al Feed
        </button>

        {/* --- CONTROLES DE DUEÑO --- */}
            {/* Solo se muestran si eres el creador de la receta */}
            {isOwner && (
                <div className="flex gap-3">
                    <button 
                        // Navegaremos a esta ruta en el siguiente paso
                        onClick={() => navigate(`/recipes/edit/${recipe.id}`)} 
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                        <Edit2 className="w-4 h-4" /> Editar
                    </button>
                    <button 
                        onClick={handleDeleteRecipe}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                        <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                </div>
            )}

        <article className="bg-white dark:bg-brand-warmGray rounded-3xl shadow-lg border border-brand-peach/50 dark:border-white/5 overflow-hidden">
          {recipe.images.length > 0 && (
            <div className="relative w-full bg-black/10 dark:bg-black/30">
              <div className="aspect-video w-full overflow-hidden">
                <img src={recipe.images[activeImageIndex]} alt={recipe.title} className="w-full h-full object-cover transition-all duration-500" />
              </div>
              {recipe.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-xl backdrop-blur-sm">
                  {recipe.images.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${idx === activeImageIndex ? 'border-brand-brick scale-110' : 'border-white/50 opacity-70 hover:opacity-100'}`}>
                      <img src={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-8">
             <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 border-b border-gray-100 dark:border-white/5 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-brand-peach/50 dark:bg-brand-brick/20 text-brand-brick dark:text-brand-amber text-xs font-bold uppercase rounded-full">{recipe.difficulty}</span>
                        <span className="flex items-center gap-1 text-xs text-brand-dark/60 dark:text-brand-cream/60"><Clock className="w-3 h-3" /> {recipe.prep_time_minutes} min</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark dark:text-brand-cream mb-2">{recipe.title}</h1>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {recipe.categories.map((cat, idx) => <span key={idx} className="text-xs font-medium text-brand-dark/50 dark:text-brand-cream/50 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">#{cat}</span>)}
                    </div>
                </div>

                <div onClick={() => goToProfile(recipe.username)}
                className="cursor-pointer hover:bg-brand-cream/70 dark:hover:bg-black/30 transition-colors rounded-xl"
                title="Ver perfil del autor">
                    <div className="w-10 h-10 rounded-full bg-brand-brick/10 overflow-hidden">
                        {recipe.author_avatar ? <img src={recipe.author_avatar} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-brand-brick" />}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-brand-dark dark:text-brand-cream">{recipe.username}</p>
                        <p className="text-xs text-brand-dark/50 dark:text-brand-cream/50">
                          {formatDate(recipe.created_at)} a las {formatTime(recipe.created_at)}

                          {recipe.is_edited ? <span className="italic text-[10px] opacity-80"> (editado) </span> : null}
                        </p>
                    </div>
                </div>
             </div>

             <div className="grid md:grid-cols-[1fr_2fr] gap-8 mb-12">
                <div className="bg-brand-peach/10 dark:bg-white/5 p-6 rounded-2xl h-fit">
                    <h3 className="flex items-center gap-2 font-bold text-lg text-brand-brick dark:text-brand-amber mb-4"><ChefHat className="w-5 h-5" /> Ingredientes</h3>
                    <ul className="space-y-3">
                        {recipe.ingredients.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-brand-dark dark:text-brand-cream"><span className="w-1.5 h-1.5 rounded-full bg-brand-brick/50 mt-1.5 shrink-0" />{item}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-xl text-brand-dark dark:text-brand-cream mb-4 border-b border-brand-peach dark:border-white/10 pb-2 inline-block">Preparación</h3>
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-brand-dark/80 dark:text-brand-cream/80 whitespace-pre-line leading-relaxed text-lg">{recipe.description}</p>
                    </div>
                </div>
             </div>

             <div className="mt-12 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center gap-6">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-2 text-lg font-medium transition-all duration-200 ${isLiked ? 'text-red-500' : 'text-brand-dark/70 dark:text-brand-cream/70 hover:text-red-500 dark:hover:text-red-400'} ${isAnimating ? 'scale-125' : 'scale-100'}`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="font-bold">{likesCount}</span> Me gusta
                </button>
                <div className="flex items-center gap-2 text-lg font-medium text-brand-dark/70 dark:text-brand-cream/70">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-bold">{recipe.comments_count}</span> Comentarios
                </div>
             </div>

             <div className="pt-8 border-t border-brand-peach/30 dark:border-white/10 mt-8">
                <h3 className="flex items-center gap-2 font-bold text-2xl text-brand-dark dark:text-brand-cream mb-6">
                    <MessageCircle className="w-6 h-6" /> Conversación
                </h3>

                {isAuthenticated ? (
                    <div className="mb-10 flex gap-4 relative">
                        <div className="w-10 h-10 rounded-full bg-brand-brick/10 overflow-hidden shrink-0 hidden sm:block">
                            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-brand-brick" />}
                        </div>
                        <div className="flex-grow relative">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Añade un comentario..."
                                className="w-full p-4 pr-12 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-brand-dark dark:text-brand-cream focus:ring-2 focus:ring-brand-brick focus:outline-none min-h-[100px] resize-none"
                            />
                            <button onMouseDown={stopPropagation} onClick={() => setShowMainEmojiPicker(!showMainEmojiPicker)} className="absolute bottom-3 right-3 p-2 text-gray-500 hover:text-brand-brick transition-colors z-20 cursor-pointer bg-transparent" title="Añadir emoji"><Smile className="w-6 h-6" /></button>
                            {showMainEmojiPicker && (
                                <div className="absolute top-full right-0 mt-2 z-50 shadow-2xl rounded-xl" onMouseDown={stopPropagation}>
                                    <EmojiPicker onEmojiClick={handleMainEmojiClick} theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT} searchDisabled={false} width={300} height={400} />
                                </div>
                            )}
                        </div>
                        <button onClick={handlePostComment} disabled={!newComment.trim() || submittingComment} className="self-end p-3 bg-brand-brick text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"><Send className="w-5 h-5" /></button>
                    </div>
                ) : (
                    <div className="bg-brand-peach/20 dark:bg-white/5 p-6 rounded-xl text-center mb-10">
                        <p className="text-brand-dark dark:text-brand-cream mb-4">Inicia sesión para unirte a la conversación.</p>
                        <Button size="sm" onClick={() => navigate('/login')}>Iniciar Sesión</Button>
                    </div>
                )}

                <div className="space-y-6">
                  {/* --- LISTA DE COMENTARIOS --- */}
                    {recipe.comments.length === 0 ? (
                        <p className="text-center text-brand-dark/50 dark:text-brand-cream/50 italic py-4">Sé el primero en comentar esta delicia.</p>
                    ) : (
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        recipe.comments.map((comment: any) => (
                            <div key={comment.id} className="flex gap-4 group">
                              {/* Avatar Comentarista Cliqueable */}
                              <div 
                                onClick={() => goToProfile(comment.username)}
                                className="w-10 h-10 rounded-full bg-brand-brick/10 overflow-hidden shrink-0 border border-brand-peach/30 cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                {comment.avatar_url ? <img src={comment.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-brand-brick" />}
                              </div>
                                {/* <div className="w-10 h-10 rounded-full bg-brand-brick/10 overflow-hidden shrink-0 border border-brand-peach/30">
                                    {comment.avatar_url ? <img src={comment.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-brand-brick" />}
                                </div> */}
                                <div className="flex-grow">
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl rounded-tl-none relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                            {/* Nombre Comentarista Cliqueable */}
                                            <span 
                                                onClick={() => goToProfile(comment.username)}
                                                className="font-bold text-sm text-brand-dark dark:text-brand-cream block cursor-pointer hover:text-brand-brick hover:underline"
                                                title={`Ver perfil de ${comment.username}`}
                                            >
                                                {comment.username}
                                            </span>
                                            
                                                {/* <span className="font-bold text-sm text-brand-dark dark:text-brand-cream block">{comment.username}</span> */}
                                                <span className="text-xs text-brand-dark/40 dark:text-brand-cream/40">{formatDate(comment.created_at)} a las {formatTime(comment.created_at)}</span>
                                            </div>
                                            {user && user.username === comment.username && (
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEditing(comment)} className="text-blue-500 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteComment(comment.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            )}
                                        </div>

                                        {editingCommentId === comment.id ? (
                                            <div className="mt-2 relative">
                                                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full p-2 pr-10 rounded border dark:bg-black/20 dark:text-white dark:border-white/10 text-sm" />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button onMouseDown={stopPropagation} onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)} className="mr-auto text-gray-400 hover:text-brand-brick relative z-20"><Smile className="w-4 h-4" /></button>
                                                    <button onClick={cancelEditing} className="text-xs px-3 py-1 text-gray-500 hover:bg-gray-200 rounded">Cancelar</button>
                                                    <button onClick={handleUpdateComment} className="text-xs px-3 py-1 bg-brand-brick text-white rounded hover:bg-orange-700">Guardar</button>
                                                </div>
                                                {showEditEmojiPicker && editingCommentId === comment.id && (
                                                    <div className="absolute z-50 mt-2 top-full left-0 shadow-xl" onMouseDown={stopPropagation}><EmojiPicker onEmojiClick={handleEditEmojiClick} theme={Theme.AUTO} width={250} height={300} /></div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-brand-dark/80 dark:text-brand-cream/80 whitespace-pre-wrap">{comment.content}</p>
                                                
                                                {/* --- BOTÓN DE LIKE PARA COMENTARIOS --- */}
                                                <div className="mt-2 flex items-center gap-2">
                                                    <button 
                                                        onClick={() => handleCommentLike(comment.id)}
                                                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                                            comment.my_reaction === 'like' 
                                                                ? 'text-red-500' 
                                                                : 'text-gray-400 hover:text-red-400'
                                                        }`}
                                                    >
                                                        <Heart className={`w-3.5 h-3.5 ${comment.my_reaction === 'like' ? 'fill-current' : ''}`} />
                                                        {/* CONTADOR DE LIKES SIEMPRE VISIBLE */}
                                                        <span>{comment.likes_count}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>

          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default RecipeDetailsPage;