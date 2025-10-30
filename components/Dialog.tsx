import React from 'react';
import Button from './Button';

type ActionVariant = 'primary' | 'secondary' | 'danger' | 'success';

interface DialogAction {
  label: string;
  variant?: ActionVariant;
  color?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit';
}

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  actions?: DialogAction[];
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, onSubmit, actions }) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Dialog panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-bold leading-6 text-gray-900 mb-4">
                {title}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {children}
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
                  {actions && actions.length > 0 ? (
                    actions.map((action, idx) => (
                      <Button
                        key={idx}
                        type={action.type ?? 'button'}
                        variant={action.variant}
                        onClick={action.onClick}
                        className={action.color ? action.color : ''}
                      >
                        {action.label}
                      </Button>
                    ))
                  ) : (
                    <>
                      <Button type="submit">
                        Сохранить
                      </Button>
                      <Button type="button" variant="secondary" onClick={onClose}>
                        Отмена
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
