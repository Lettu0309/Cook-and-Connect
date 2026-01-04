import React from 'react';
import { Users, BookOpen, TrendingUp } from 'lucide-react'; // Iconos modernos

// Definimos la estructura de los datos para no repetir código HTML
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

// Sub-componente interno para cada tarjeta (Card)
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-white/40 dark:bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-brand-peach dark:border-brand-warmGray transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-brand-brick/30 dark:hover:border-brand-amber/30">
    
    {/* Contenedor del icono */}
    <div className="p-4 bg-brand-peach dark:bg-brand-warmGray rounded-xl inline-block mb-6 shadow-sm">
      <div className="text-brand-brick dark:text-brand-amber">
        {icon}
      </div>
    </div>
    
    {/* Título de la tarjeta */}
    <h3 className="text-xl font-bold mb-3 text-brand-dark dark:text-brand-cream font-serif">
      {title}
    </h3>
    
    {/* Descripción */}
    <p className="text-brand-dark/80 dark:text-brand-cream/80 font-sans leading-relaxed">
      {description}
    </p>
  </div>
);

const FeaturesSection: React.FC = () => {
  // Los datos de las 3 tarjetas
  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Comunidad Activa",
      description: "Conecta con miles de cocineros y amantes de la gastronomía de todo el país en un ambiente seguro."
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Recetas Exclusivas",
      description: "Accede a miles de recetas verificadas por la comunidad y comparte tus propias creaciones culinarias."
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Mejora tus Habilidades",
      description: "Aprende técnicas nuevas y perfecciona tu arte culinario con tutoriales, consejos y feedback real."
    }
  ];

  return (
    // Fondo ligeramente diferente para separar visualmente esta sección del Hero
    <section className="py-20 bg-brand-peach/20 dark:bg-black/20">
      <div className="container mx-auto px-4">
        
        {/* Encabezado de la sección */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-brand-dark dark:text-brand-cream">
            ¿Qué ofrece Cook & Connect?
          </h2>
          {/* Pequeña línea decorativa naranja */}
          <div className="h-1 w-20 bg-brand-brick dark:bg-brand-amber mx-auto rounded-full"></div>
        </div>
        
        {/* Rejilla (Grid) de 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;