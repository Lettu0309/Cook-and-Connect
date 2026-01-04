import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, ArrowLeft, Loader2, Camera, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
// import { useAuth } from '../../contexts/AuthContext'; // Para loguear al usuario automáticamente

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  // Necesitamos acceder a la función interna del contexto para "inyectar" la sesión sin llamar a login()
  // pero como el contexto expone login(), haremos un truco: guardaremos token manualmente y recargaremos
  // o mejor, simplemente redirigimos al login si queremos ser estrictos, 
  // PERO la mejor UX es auto-login.
  
  // Referencia para foto
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ESTADOS ---
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  
  // Username con validación en vivo
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | undefined>(undefined);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [, setIsUsernameValid] = useState(false); // False al inicio

  // Contraseñas
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Foto
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // --- VALIDACIÓN USERNAME (Reutilizada y simplificada) ---
  useEffect(() => {
    if (!username) {
        setUsernameError(undefined);
        setIsUsernameValid(false);
        return;
    }
    if (username.length < 3) {
      setUsernameError("Mínimo 3 caracteres");
      setIsUsernameValid(false);
      return;
    }

    setIsCheckingUsername(true);
    const timeoutId = setTimeout(async () => {
      try {
        // Nota: Esta ruta check-username requiere token según tu backend actual (verifyToken).
        // COMO ES REGISTRO, el usuario NO tiene token.
        // DEBERÍAS hacer esa ruta PÚBLICA en el backend o crear una específica para registro publico.
        // Por ahora, asumiremos que quitaste 'verifyToken' de check-username o creaste una pública.
        // Si no, esta llamada fallará (403). 
        // FIX RÁPIDO: Si falla por auth, lo dejamos pasar (optimista) o el backend debe abrirse.
        
        // *Recomendación:* Ve a index.ts y quita 'verifyToken' de '/api/user/check-username' 
        // para que los invitados puedan comprobar nombres.
        
        const response = await fetch(`http://localhost:3000/api/user/check-username?username=${username}`);
        if (response.status === 403 || response.status === 401) {
             // Si el backend pide token, no podemos validar en vivo sin sesión. 
             // Asumimos válido y dejamos que el submit final capture el error.
             setIsUsernameValid(true);
             setUsernameError(undefined);
             return;
        }
        
        const data = await response.json();
        if (data.available) {
          setUsernameError(undefined);
          setIsUsernameValid(true);
        } else {
          setUsernameError("Ocupado");
          setIsUsernameValid(false);
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        // Si falla la red, permitimos intentar enviar
        setIsUsernameValid(true); 
        console.error('Error checking username: ', err.message);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  // --- MANEJO FOTO ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setSelectedFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (password !== confirmPassword) {
        setGlobalError('Las contraseñas no coinciden.');
        return;
    }

    setIsLoading(true);

    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password); // Se envía plana, el backend la hashea
        formData.append('firstname', firstname);
        formData.append('lastname', lastname);
        // Bio opcional, la mandamos vacía si quieres
        
        if (selectedFile) {
            formData.append('avatarFile', selectedFile);
        }

        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al registrarse');
        }

        // AUTO-LOGIN: Guardamos sesión
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Forzamos recarga para que el AuthContext lea el localStorage nuevo
        // (O usamos window.location.href para ser drásticos y asegurar limpieza)
        window.location.href = '/feed';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        setGlobalError(error.message);
        console.error('Registration error: ', error.message);
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream dark:bg-brand-dark transition-colors duration-300 p-4 py-10">
      
      {/* Fondo Decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-brick/20 rounded-full blur-3xl pointer-events-none" />
      
      {/* Botón Regresar */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-brand-dark dark:text-brand-cream"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Tarjeta Principal */}
      <div className="w-full max-w-2xl bg-white/80 dark:bg-brand-warmGray/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-brand-warmGray p-8 relative z-10 animate-fade-in-up">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-brick text-white mb-3 shadow-lg">
            <ChefHat className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-brand-dark dark:text-brand-cream">
            Crea tu cuenta
          </h1>
          <p className="text-sm text-brand-dark/60 dark:text-brand-cream/60 mt-1">
            Únete a la comunidad de Cook & Connect
          </p>
        </div>

        {globalError && (
          <div className="mb-6 p-3 bg-red-100 border border-red-200 text-red-600 rounded-lg text-center text-sm font-medium">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. FOTO DE PERFIL (Centrada) */}
            <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                    <div className="w-28 h-28 rounded-full bg-brand-brick/10 dark:bg-brand-amber/10 overflow-hidden border-2 border-dashed border-brand-brick/30 flex items-center justify-center cursor-pointer hover:bg-brand-brick/5 transition-colors" onClick={() => fileInputRef.current?.click()}>
                        {previewUrl ? (
                            <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-2">
                                <Camera className="w-8 h-8 mx-auto text-brand-brick/50 mb-1" />
                                <span className="text-[10px] text-brand-dark/50 uppercase font-bold">Subir Foto</span>
                            </div>
                        )}
                    </div>
                    {previewUrl && (
                        <button type="button" onClick={handleRemovePhoto} className="absolute bottom-0 right-0 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            {/* 2. DATOS PERSONALES (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nombre" placeholder="Juan" value={firstname} onChange={e => setFirstname(e.target.value)} required />
                <Input label="Apellido" placeholder="Pérez" value={lastname} onChange={e => setLastname(e.target.value)} required />
            </div>

            {/* 3. USUARIO Y EMAIL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username con validación */}
                <div className="relative">
                    <Input 
                        label="Usuario" 
                        placeholder="chef_juan" 
                        value={username} 
                        onChange={e => setUsername(e.target.value.trim())} 
                        required 
                        error={usernameError ? " " : undefined}
                    />
                    <div className="absolute right-0 top-8 mr-3 pointer-events-none">
                        {isCheckingUsername && <Loader2 className="w-4 h-4 animate-spin text-brand-brick" />}
                        {!isCheckingUsername && !usernameError && username.length >= 3 && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {!isCheckingUsername && usernameError && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    {usernameError && <p className="text-xs text-red-500 mt-1 ml-1">{usernameError}</p>}
                </div>

                <Input label="Correo Electrónico" type="email" placeholder="juan@mail.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {/* 4. CONTRASEÑAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <div className="relative">
                    <Input 
                        label="Confirmar Contraseña" 
                        type="password" 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        required 
                        error={confirmPassword && password !== confirmPassword ? "No coinciden" : undefined}
                    />
                </div>
            </div>

            <Button type="submit" className="w-full shadow-lg mt-4" size="lg" disabled={isLoading || (usernameError !== undefined)}>
                {isLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Creando cuenta...</span>
                ) : 'Registrarse'}
            </Button>

            <div className="text-center pt-4 border-t border-gray-200 dark:border-white/10">
                <p className="text-sm text-brand-dark/70 dark:text-brand-cream/70">
                    ¿Ya tienes cuenta?{' '}
                    <button type="button" onClick={() => navigate('/login')} className="text-brand-brick font-bold hover:underline">Inicia Sesión</button>
                </p>
            </div>

        </form>
      </div>
    </div>
  );
};

export default RegisterPage;