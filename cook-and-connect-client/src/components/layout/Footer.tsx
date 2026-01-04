import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 border-t border-brand-peach dark:border-brand-warmGray bg-brand-cream dark:bg-brand-dark transition-colors duration-300">
      <div className="container mx-auto px-4 text-center">
        {/* Texto principal del Copyright */}
        <p className="text-sm text-brand-dark/70 dark:text-brand-cream/70 font-sans">
          © {new Date().getFullYear()} Cook & Connect. Todos los derechos reservados.
        </p>
        
        {/* Texto secundario "Hecho con..." */}
        <p className="text-xs mt-2 text-brand-dark/50 dark:text-brand-cream/50 font-sans">
        </p>
      </div>
    </footer>
  );
};

export default Footer;