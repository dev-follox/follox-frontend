import React from 'react';

interface ToggleProps {
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}

const Toggle: React.FC<ToggleProps> = ({ options, selected, onChange }) => {
  const selectedIndex = options.findIndex(opt => opt.value === selected);
  const percentage = (selectedIndex / options.length) * 100;
  const width = 100 / options.length;

  return (
    <div className="relative flex bg-gray-200 rounded-full p-1">
      {/* Sliding background indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-full bg-danger transition-all duration-300 ease-in-out"
        style={{
          left: `${percentage}%`,
          width: `${width}%`,
        }}
      />
      
      {/* Option buttons */}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`relative z-10 flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors duration-300 ${
            selected === option.value
              ? 'text-white'
              : 'text-danger'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default Toggle;

