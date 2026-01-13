import React from 'react';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'success';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  confirmVariant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Dialog panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden border border-[rgba(228,228,231,1)] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-bold leading-6 text-gray-900 mb-4">
                {title}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {message}
              </p>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
                <Button
                  type="button"
                  variant={confirmVariant}
                  onClick={handleConfirm}
                  isLoading={isLoading}
                >
                  {confirmLabel}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {cancelLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

