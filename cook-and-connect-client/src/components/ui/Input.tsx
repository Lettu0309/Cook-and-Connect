import React, { useId } from 'react'; // 1. Importamos useId

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '', 
  id,
  ...props 
}) => {
  // 2. Generamos un ID estable y único usando el hook oficial de React
  const generatedId = useId();
  
  // Usamos el ID que nos pasan o el generado automáticamente
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label 
        htmlFor={inputId} 
        className="text-sm font-semibold text-brand-dark/80 dark:text-brand-cream/90"
      >
        {label}
      </label>
      
      <input
        id={inputId}
        className={`
          w-full px-4 py-2 rounded-lg border bg-white dark:bg-white/5 
          text-brand-dark dark:text-brand-cream placeholder-gray-400
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-brick dark:focus:ring-brand-amber
          ${error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
            : 'border-gray-300 dark:border-brand-warmGray hover:border-brand-brick/50'
          }
          ${className}
        `}
        {...props}
      />
      
      {error && (
        <span className="text-xs text-red-500 font-medium animate-pulse">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;