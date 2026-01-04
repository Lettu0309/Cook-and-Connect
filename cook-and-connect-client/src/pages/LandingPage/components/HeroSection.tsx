import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button'; // Importamos el botón que creamos primero

const HeroSection: React.FC = () => {
    const navigate = useNavigate(); // Hook para navegación
  return (
    <section className="py-20 md:py-32 text-center relative overflow-hidden">
      
      {/* --- DECORACIÓN DE FONDO --- */}
      {/* Círculos borrosos de color para dar ambiente sin molestar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-brand-brick rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-brand-amber rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 flex flex-col items-center relative z-10">
        
        {/* TÍTULO PRINCIPAL */}
        <h1 className="text-4xl md:text-6xl font-black mb-6 max-w-4xl leading-tight text-brand-dark dark:text-brand-cream animate-fade-in-up">
          Conecta con amantes de la <span className="text-brand-brick dark:text-brand-amber">gastronomía</span>
        </h1>
        
        {/* SUBTÍTULO / DESCRIPCIÓN */}
        <p className="text-lg md:text-xl text-brand-dark/80 dark:text-brand-cream/80 max-w-2xl mb-10 font-sans leading-relaxed">
          Comparte recetas, descubre nuevos sabores y forma parte de una comunidad apasionada por la cocina.
        </p>
        
        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Botón Registro (Lleva a la página de registro) */}
          <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate('/register')}>
            Comenzar ahora
          </Button>
          {/* Botón Explorar (Lleva al Feed en modo invitado) */}
          <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/feed')}>
            Explorar
          </Button>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;