import React, { useState, useEffect, useRef} from 'react';
import { User, Save, ArrowLeft, Loader2, CheckCircle, XCircle, Camera, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth(); // Obtenemos datos actuales

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados de datos del formulario
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [bio, setBio] = useState('');
//   const [avatarUrl, setAvatarUrl] = useState('');

    // --- MANEJO DE IMÁGENES ---
  const [previewUrl, setPreviewUrl] = useState(''); // Para mostrar en pantalla
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // El archivo real
  const [removeAvatar, setRemoveAvatar] = useState(false); // Bandera para borrar


  // --- LÓGICA DE USUARIO (USERNAME) ---
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | undefined>(undefined);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  
  // Estados de carga y mensajes generales
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Cargar datos actuales al abrir la página
  useEffect(() => {
    if (user) {
      setFirstname(user.firstname || ''); // Asumiendo que agregaste estos campos al AuthContext, si no, usar placeholders
      setLastname(user.lastname || '');
      setBio(user.bio || '');
      setPreviewUrl(user.avatar || '');
      setUsername(user.username || '');
    }
  }, [user]);

  // EFECTO: Validación de Username en tiempo real (Debounce)
  useEffect(() => {
    // Si no hay datos aún o está vacío, salimos
    if (!user || !username) return;

    // Si el nombre es igual al que ya tengo, es válido por defecto
    if (username === user.username) {
      setUsernameError(undefined);
      setIsUsernameValid(true);
      return;
    }

    // Regla local: Mínimo 3 caracteres
    if (username.length < 3) {
      setUsernameError("Mínimo 3 caracteres");
      setIsUsernameValid(false);
      return;
    }

    // Iniciamos la verificación con retraso (500ms)
    setIsCheckingUsername(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/user/check-username?username=${username}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.available) {
          setUsernameError(undefined);
          setIsUsernameValid(true);
        } else {
          setUsernameError("Este nombre ya está en uso");
          setIsUsernameValid(false);
        }
      } catch (err) {
        console.error("Error verificando usuario", err);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    // Limpieza: Si el usuario escribe antes de los 500ms, cancelamos la petición anterior
    return () => clearTimeout(timeoutId);
  }, [username, user, token]);

// --- LÓGICA DE FOTOS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Creamos una URL temporal para que el usuario vea la foto al instante
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setSelectedFile(file);
      setRemoveAvatar(false); // Cancelamos borrado si sube una nueva
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    setSelectedFile(null);
    setRemoveAvatar(true); // Marcamos para que el servidor la borre
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Seguridad: No enviar si el usuario es inválido
    if (!isUsernameValid) return;

    setIsLoading(true);
    setMessage(null);

    try {
    // --- USO DE FORMDATA ---
      // Obligatorio para enviar archivos al servidor
      const formData = new FormData();
      formData.append('firstname', firstname);
      formData.append('lastname', lastname);
      formData.append('bio', bio);
      formData.append('username', username);

      if (selectedFile) {
        formData.append('avatarFile', selectedFile);
      }
      
      if (removeAvatar) {
        formData.append('removeAvatar', 'true');
      }

    //   const response = await fetch('http://localhost:3000/api/user/profile', {
    //     method: 'PUT',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${token}` // Enviamos el token al "portero"
    //     },
    //     body: JSON.stringify({ 
    //       firstname, 
    //       lastname, 
    //       bio, 
    //       avatar_url: avatarUrl,
    //       username
    //     }),
    //   });

          const response = await fetch('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // NO poner Content-Type aquí, el navegador lo pone solo con el boundary correcto
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error('Error al actualizar');

      // Aquí deberíamos actualizar el contexto global con los nuevos datos
      // Por simplicidad, actualizamos el localStorage y recargamos (o usamos una función updateUser del contexto si la creamos)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setMessage({ text: '¡Perfil actualizado con éxito!', type: 'success' });
      
      // Pequeña pausa antes de volver al feed para que lean el mensaje
      setTimeout(() => {
         window.location.href = '/feed'; // Forzamos recarga para ver cambios en Header
      }, 1500);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMessage({ text: 'No se pudo guardar los cambios.', type: 'error' });
      console.error("Update profile error: ", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-dark transition-colors duration-300">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Encabezado con flecha atrás */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/feed')} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="text-brand-dark dark:text-brand-cream" />
          </button>
          <h1 className="text-3xl font-serif font-bold text-brand-dark dark:text-brand-cream">
            Editar Perfil
          </h1>
        </div>

        <div className="bg-white dark:bg-brand-warmGray rounded-2xl p-8 shadow-sm border border-brand-peach/50 dark:border-white/5 animate-fade-in-up">
          
          {/* Mensaje de éxito/error global */}
          {message && (
            <div className={`p-4 mb-6 rounded-lg text-center font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- SECCIÓN AVATAR VISUAL --- */}
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Círculo de previsualización */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-brand-brick/10 dark:bg-brand-amber/10 overflow-hidden border-4 border-brand-cream dark:border-brand-dark shadow-lg">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-full h-full p-6 text-brand-brick/50" />
                  )}
                </div>
              </div>

              {/* Controles */}
              <div className="flex flex-col gap-3 w-full sm:w-auto">
                <h3 className="font-bold text-brand-dark dark:text-brand-cream text-lg text-center sm:text-left">
                  Tu Foto de Perfil
                </h3>
                <div className="flex gap-3 justify-center sm:justify-start">
                  
                  {/* Botón CAMBIAR (Dispara el input oculto) */}
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-brick text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    Cambiar
                  </button>
                  
                  {/* Botón QUITAR (Solo si hay foto) */}
                  {previewUrl && (
                    <button 
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Quitar
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-brand-dark/50 dark:text-brand-cream/50 text-center sm:text-left mt-1">
                  Se recomienda imagen cuadrada (JPG, PNG).
                </p>

                {/* Input Oculto Real */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

            {/* <div className="flex flex-col items-center gap-4 mb-8">
              <div className="w-32 h-32 rounded-full bg-brand-brick/10 dark:bg-brand-amber/10 overflow-hidden border-4 border-brand-cream dark:border-brand-dark shadow-lg relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-6 text-brand-brick/50" />
                )}
              </div> */}
              
              {/* <div className="w-full">
                <Input 
                  label="URL de tu Foto de Perfil" 
                  placeholder="https://ejemplo.com/mifoto.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
                <p className="text-xs text-brand-dark/50 dark:text-brand-cream/50 mt-1 ml-1">
                  * Pega un enlace directo a una imagen (jpg, png).
                </p>
              </div> */}
            </div>

            {/* --- CAMPO DE USUARIO (Con validación visual) --- */}
            <div className="relative">
                <Input 
                    label="Nombre de Usuario" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.trim())} // Trim para evitar espacios accidentales
                    required
                    error={usernameError ? " " : undefined} // Pone el borde rojo si hay error
                />
                
                {/* Iconos de estado (Spinner, Check, X) a la derecha del input */}
                <div className="absolute right-0 top-0 mt-8 mr-3 pointer-events-none">
                    {isCheckingUsername && <Loader2 className="w-5 h-5 animate-spin text-brand-brick" />}
                    
                    {!isCheckingUsername && !usernameError && username !== user?.username && username.length >= 3 && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    
                    {!isCheckingUsername && usernameError && (
                        <XCircle className="w-5 h-5 text-red-500" />
                    )}
                </div>

                {/* Texto explicativo del error */}
                {usernameError && (
                    <p className="text-xs text-red-500 mt-1 font-medium ml-1 animate-pulse">
                        {usernameError}
                    </p>
                )}
            </div>

            {/* --- NOMBRE Y APELLIDO --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Nombre" 
                value={firstname} 
                onChange={(e) => setFirstname(e.target.value)}
                required
              />
              <Input 
                label="Apellido" 
                value={lastname} 
                onChange={(e) => setLastname(e.target.value)}
                required
              />
            </div>

            {/* BIO (TextArea manual porque no tenemos componente Input textarea aún) */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-semibold text-brand-dark/80 dark:text-brand-cream/90">
                Biografía (Cuéntanos de ti)
              </label>
              <textarea
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-brand-warmGray bg-white dark:bg-white/5 text-brand-dark dark:text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-brick dark:focus:ring-brand-amber min-h-[120px]"
                placeholder="Me encanta la cocina italiana y los postres..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate('/feed')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Cambios
              </Button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProfilePage;