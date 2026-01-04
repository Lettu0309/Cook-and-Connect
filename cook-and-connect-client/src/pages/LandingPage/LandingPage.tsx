import React from 'react';

// 1. Importamos todos los componentes que creaste
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import CTASection from './components/CTASection';

const LandingPage: React.FC = () => {
  return (
    // Contenedor principal: Ocupa al menos el 100% de la altura de la pantalla (min-h-screen)
    // Usamos Flexbox vertical (flex-col) para ordenar los elementos uno debajo del otro
    <div className="min-h-screen flex flex-col bg-brand-cream dark:bg-brand-dark transition-colors duration-300">
      
      {/* 2. El Encabezado va fijo arriba */}
      <Header />

      {/* 3. El contenido principal ("main") crece para ocupar el espacio disponible */}
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>

      {/* 4. El Pie de página cierra la web */}
      <Footer />
      
    </div>
  );
};

export default LandingPage;