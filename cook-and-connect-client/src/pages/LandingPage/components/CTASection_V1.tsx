import React from 'react';
import Button from '../../../components/ui/Button'; // Reutilizamos nuestro botón

const CTASection: React.FC = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        
        {/* --- TARJETA PRINCIPAL --- */}
        {/* Usamos un degradado sutil para que el naranja se vea más moderno y profundo */}
        <div className="bg-gradient-to-r from-brand-brick to-orange-600 dark:from-brand-warmGray dark:to-brand-dark rounded-3xl p-10 md:p-20 text-center text-white shadow-2xl relative overflow-hidden border border-brand-peach/20">
          
          {/* --- CÍRCULOS DECORATIVOS DE FONDO --- */}
          {/* Estos círculos semitransparentes le dan ese toque "Glassmorphism" sutil */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>

          {/* --- CONTENIDO --- */}
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-white dark:text-brand-amber">
              ¿Listo para unirte a la comunidad?
            </h2>
            
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto font-sans text-orange-50 dark:text-brand-cream/90">
              Crea tu cuenta gratis y comienza a compartir tu pasión por la cocina hoy mismo.
            </p>
            
            {/* Botón blanco para que resalte sobre el fondo naranja */}
            <Button 
              size="lg" 
              className="bg-white text-brand-brick hover:bg-orange-50 dark:bg-brand-amber dark:text-brand-dark dark:hover:bg-orange-400 font-bold px-8 shadow-xl transform hover:scale-105 transition-all"
              onClick={() => console.log('Registro desde CTA')}
            >
              Registrarse gratis
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CTASection;