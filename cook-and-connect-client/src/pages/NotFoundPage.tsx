import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-dark transition-colors duration-300">
      <Header />
      
      <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        {/* Icono animado */}
        <div className="p-6 bg-brand-brick/10 dark:bg-brand-amber/10 rounded-full mb-6 animate-bounce">
            <FileQuestion className="w-20 h-20 text-brand-brick dark:text-brand-amber" />
        </div>
        
        {/* Título Grande */}
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-brand-dark dark:text-brand-cream mb-2 opacity-20">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-bold text-brand-dark dark:text-brand-cream mb-4">
          ¡Ups!
        </h2>
        
        <p className="text-lg text-brand-dark/70 dark:text-brand-cream/70 max-w-md mb-8">
          No podemos encontrar el <i>ingrediente</i> que buscas. Es posible que la dirección sea incorrecta o que la página haya sido eliminada del <i>menú</i>.
        </p>
        
        {/* Botón de regreso seguro */}
        <Button size="lg" onClick={() => navigate('/feed')}>
          <Home className="w-5 h-5 mr-2" />
          Volver a la cocina
        </Button>
      </main>
      <Footer />
    </div>
  );
};

export default NotFoundPage;