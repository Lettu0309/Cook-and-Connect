import React from 'react';

// Definimos qué propiedades puede recibir nuestro botón
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', // Por defecto será naranja (primary)
  size = 'md',         // Por defecto será tamaño mediano
  children, 
  className = '',
  ...props 
}) => {
  // Estilos base que todos los botones comparten (centrado, bordes redondeados, transición suave)
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-brick dark:focus:ring-brand-amber disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  // Variantes de color basadas en tu paleta "Fuego y Tierra"
  const variants = {
    primary: 'bg-brand-brick text-white hover:bg-orange-700 dark:bg-brand-amber dark:text-brand-dark dark:hover:bg-orange-500 shadow-md',
    secondary: 'bg-brand-peach text-brand-brick hover:bg-orange-200 dark:bg-brand-warmGray dark:text-brand-amber dark:hover:bg-gray-700',
    outline: 'border-2 border-brand-brick text-brand-brick hover:bg-brand-brick hover:text-white dark:border-brand-amber dark:text-brand-amber dark:hover:bg-brand-amber dark:hover:text-brand-dark'
  };

  // Tamaños disponibles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Combinamos todas las clases
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;