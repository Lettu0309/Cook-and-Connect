import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, Loader2, Save, X } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';

interface Category {
  id: number;
  name: string;
}

const CreateRecipePage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // Estados del Formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [difficulty, setDifficulty] = useState('Media');
  
  // Ingredientes Dinámicos
  const [ingredients, setIngredients] = useState<string[]>(['']);
  
  // Categorías
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  // Imágenes
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // 1. Cargar categorías al iniciar
  useEffect(() => {
    fetch('http://localhost:3000/api/categories')
      .then(res => res.json())
      .then(data => setAvailableCategories(data))
      .catch(err => console.error("Error cargando categorías", err));
  }, []);

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
  const toggleCategory = (id: number) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(catId => catId !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  // --- MANEJO DE IMÁGENES ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImages = [...images, ...filesArray].slice(0, 5); // Máximo 5
      setImages(newImages);

      // Generar previews
      const newPreviews = newImages.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
  };

  // --- ENVÍO DEL FORMULARIO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validaciones básicas
    const validIngredients = ingredients.filter(i => i.trim() !== '');
    if (validIngredients.length === 0) {
      setMessage({ text: 'Debes añadir al menos un ingrediente.', type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('prep_time_minutes', prepTime);
      formData.append('difficulty', difficulty);
      
      // Enviamos arrays como JSON string
      formData.append('ingredients', JSON.stringify(validIngredients));
      formData.append('categories', JSON.stringify(selectedCategories));

      // Adjuntar imágenes
      images.forEach((file) => {
        formData.append('recipeImages', file);
      });

      const response = await fetch('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // Token para el middleware
        body: formData,
      });

      if (!response.ok) throw new Error('Error al publicar');

      setMessage({ text: '¡Receta publicada con éxito!', type: 'success' });
      
      setTimeout(() => navigate('/feed'), 1500);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error : any) {
      setMessage({ text: 'No se pudo publicar la receta.', type: 'error' });
      console.error("Error al publicar receta: ", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-dark transition-colors duration-300">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        
        {/* Encabezado */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/feed')} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full">
            <ArrowLeft className="text-brand-dark dark:text-brand-cream" />
          </button>
          <h1 className="text-3xl font-serif font-bold text-brand-dark dark:text-brand-cream">Nueva Receta</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-brand-warmGray rounded-2xl p-8 shadow-sm border border-brand-peach/50 dark:border-white/5 space-y-8">
          
          {message && (
            <div className={`p-4 rounded-lg text-center font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {/* 1. Detalles Básicos */}
          <section className="space-y-4">
            <h3 className="font-bold text-lg text-brand-dark dark:text-brand-cream border-b border-gray-200 dark:border-white/10 pb-2">
              Detalles del Platillo
            </h3>
            <Input label="Título de la Receta" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Paella Valenciana" required />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Tiempo (min)" type="number" min="0" value={prepTime} onChange={e => setPrepTime(e.target.value)} placeholder="45" required />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-brand-dark/80 dark:text-brand-cream/90">Dificultad</label>
                <select 
                  value={difficulty} 
                  onChange={e => setDifficulty(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-brand-warmGray bg-white dark:bg-brand-warmGray text-brand-dark dark:text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-brick"
                >
                  {/* Forzamos el fondo oscuro en las opciones para que sea legible */}
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
                    placeholder={`Ingrediente ${index + 1}`} 
                    value={ing} 
                    onChange={e => handleIngredientChange(index, e.target.value)}
                    className="flex-1"
                  />
                  {ingredients.length > 1 && (
                    <button type="button" onClick={() => handleRemoveIngredient(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-1">
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

          {/* 3. Pasos (Descripción) */}
          <section className="space-y-4">
            <h3 className="font-bold text-lg text-brand-dark dark:text-brand-cream border-b border-gray-200 dark:border-white/10 pb-2">
              Preparación
            </h3>
            <textarea
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-brand-warmGray bg-white dark:bg-white/5 text-brand-dark dark:text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-brick min-h-[150px]"
              placeholder="Describe los pasos detalladamente..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </section>

          {/* 4. Fotos */}
          <section className="space-y-4">
            <h3 className="font-bold text-lg text-brand-dark dark:text-brand-cream border-b border-gray-200 dark:border-white/10 pb-2">
              Fotos del Platillo (Máx 5)
            </h3>
            <div className="flex flex-wrap gap-4">
              {previews.map((src, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-brand-peach">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-brand-brick/30 rounded-lg cursor-pointer hover:bg-brand-peach/20 transition-colors">
                  <Upload className="w-6 h-6 text-brand-brick" />
                  <span className="text-xs text-brand-brick font-medium mt-1">Subir</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                </label>
              )}
            </div>
          </section>

          {/* Botón Final */}
          <div className="pt-6 flex justify-end">
            <Button type="submit" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Publicar Receta
            </Button>
          </div>

        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CreateRecipePage;