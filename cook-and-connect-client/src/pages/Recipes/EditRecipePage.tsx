import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, Save, CheckCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';

interface Category {
  id: number;
  name: string;
}

const EditRecipePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  
  // Estados de carga
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Estados del Formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [difficulty, setDifficulty] = useState('Media');
  
  // Listas dinámicas
  const [ingredients, setIngredients] = useState<string[]>(['']);
  
  // Categorías
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  // 1. CARGAR DATOS INICIALES (Receta + Categorías disponibles)
  useEffect(() => {
    const loadData = async () => {
      try {
        // A. Cargar lista de categorías disponibles
        const catRes = await fetch('http://localhost:3000/api/categories');
        const categoriesData = await catRes.json();
        setAvailableCategories(categoriesData);

        // B. Cargar datos de la receta a editar
        const recipeRes = await authFetch(`http://localhost:3000/api/recipes/${id}`);
        if (!recipeRes.ok) throw new Error('No se pudo cargar la receta');
        
        const recipeData = await recipeRes.json();

        // C. Rellenar el formulario
        setTitle(recipeData.title);
        setDescription(recipeData.description);
        setPrepTime(recipeData.prep_time_minutes.toString());
        setDifficulty(recipeData.difficulty);
        setIngredients(recipeData.ingredients || ['']);
        
        // Mapear nombres de categorías a IDs (Un poco de lógica extra porque el endpoint GET devuelve nombres)
        // Nota: Idealmente el endpoint GET debería devolver objetos {id, name} en categories, 
        // pero como devuelve strings, hacemos el match inverso aquí.
        const activeCatIds = categoriesData
            .filter((cat: Category) => recipeData.categories.includes(cat.name))
            .map((cat: Category) => cat.id);
        
        setSelectedCategories(activeCatIds);

      } catch (error) {
        console.error(error);
        setMessage({ text: 'Error cargando los datos. Intenta volver atrás.', type: 'error' });
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [id, authFetch]);

  // --- MANEJO DE INGREDIENTES ---
  const handleAddIngredient = () => setIngredients([...ingredients, '']);
  
  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  // --- MANEJO DE CATEGORÍAS ---
  const toggleCategory = (catId: number) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  // --- GUARDAR CAMBIOS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    // Validación básica
    const validIngredients = ingredients.filter(i => i.trim() !== '');
    if (validIngredients.length === 0) {
      setMessage({ text: 'La receta debe tener al menos un ingrediente.', type: 'error' });
      setIsSaving(false);
      return;
    }

    try {
      // Preparamos el objeto JSON
      const payload = {
        title,
        description,
        prep_time_minutes: parseInt(prepTime),
        difficulty,
        ingredients: validIngredients,
        categories: selectedCategories
      };

      const response = await authFetch(`http://localhost:3000/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Error al guardar');

      setMessage({ text: '¡Receta actualizada correctamente!', type: 'success' });
      
      // Regresar al detalle después de 1.5s
      setTimeout(() => navigate(`/recipes/${id}`), 1500);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error : any) {
      setMessage({ text: 'No se pudieron guardar los cambios.', type: 'error' });
      console.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (initialLoading) return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-dark flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-brand-brick animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-dark transition-colors duration-300">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        
        {/* Encabezado */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(`/recipes/${id}`)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="text-brand-dark dark:text-brand-cream" />
          </button>
          <h1 className="text-3xl font-serif font-bold text-brand-dark dark:text-brand-cream">Editar Receta</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-brand-warmGray rounded-2xl p-8 shadow-sm border border-brand-peach/50 dark:border-white/5 space-y-8 animate-fade-in-up">
          
          {message && (
            <div className={`p-4 rounded-lg text-center font-medium flex items-center justify-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          {/* 1. Detalles Básicos */}
          <section className="space-y-4">
            <h3 className="font-bold text-lg text-brand-dark dark:text-brand-cream border-b border-gray-200 dark:border-white/10 pb-2">
              Información General
            </h3>
            <Input label="Título" value={title} onChange={e => setTitle(e.target.value)} required />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Tiempo (min)" type="number" value={prepTime} onChange={e => setPrepTime(e.target.value)} required />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-brand-dark/80 dark:text-brand-cream/90">Dificultad</label>
                <select 
                  value={difficulty} 
                  onChange={e => setDifficulty(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-brand-warmGray bg-white dark:bg-brand-warmGray text-brand-dark dark:text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-brick"
                >
                  <option value="Fácil" className="dark:bg-brand-warmGray">Fácil</option>
                  <option value="Media" className="dark:bg-brand-warmGray">Media</option>
                  <option value="Difícil" className="dark:bg-brand-warmGray">Difícil</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-brand-dark/80 dark:text-brand-cream/90">Categorías</label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedCategories.includes(cat.id)
                        ? 'bg-brand-brick text-white border-brand-brick'
                        : 'bg-transparent text-brand-dark dark:text-brand-cream border-brand-brick/30 hover:border-brand-brick'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 2. Ingredientes */}
          <section className="space-y-4">
            <h3 className="font-bold text-lg text-brand-dark dark:text-brand-cream border-b border-gray-200 dark:border-white/10 pb-2">
              Ingredientes
            </h3>
            <div className="space-y-3">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    label="" 
                    value={ing} 
                    onChange={e => handleIngredientChange(index, e.target.value)}
                    className="flex-1"
                    placeholder={`Ingrediente ${index + 1}`}
                  />
                  {ingredients.length > 1 && (
                    <button type="button" onClick={() => handleRemoveIngredient(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={handleAddIngredient} size="sm" className="mt-2">
                <Plus className="w-4 h-4 mr-2" /> Añadir Ingrediente
              </Button>
            </div>
          </section>

          {/* 3. Preparación */}
          <section className="space-y-4">
            <h3 className="font-bold text-lg text-brand-dark dark:text-brand-cream border-b border-gray-200 dark:border-white/10 pb-2">
              Pasos de Preparación
            </h3>
            <textarea
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-brand-warmGray bg-white dark:bg-white/5 text-brand-dark dark:text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-brick min-h-[200px] transition-all"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </section>

          {/* Botones Finales */}
          <div className="pt-6 flex justify-end gap-4 border-t border-gray-100 dark:border-white/5">
            <Button type="button" variant="secondary" onClick={() => navigate(`/recipes/${id}`)}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Guardar Cambios
            </Button>
          </div>

        </form>
      </main>
      <Footer />
    </div>
  );
};

export default EditRecipePage;