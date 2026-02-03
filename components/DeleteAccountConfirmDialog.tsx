import React, { useState, useEffect } from 'react';
import Button from './Button';
import Input from './Input';

interface DeleteAccountConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmWord: string;
  confirmWordLabel: string;
  confirmButtonLabel: string;
  cancelLabel: string;
}

const DeleteAccountConfirmDialog: React.FC<DeleteAccountConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmWord,
  confirmWordLabel,
  confirmButtonLabel,
  cancelLabel,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setInputValue('');
  }, [isOpen]);

  const canConfirm = inputValue.trim().toLowerCase() === confirmWord.trim().toLowerCase();

  const handleConfirm = async () => {
    if (!canConfirm || isLoading) return;
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Caller may navigate away on success; close on error so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true" />
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden border border-gray-200 shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="w-full">
              <h3 className="text-lg font-bold leading-6 text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 mb-4">{message}</p>
              <Input
                id="delete-confirm-input"
                label={confirmWordLabel}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={confirmWord}
                className="mb-4"
                autoComplete="off"
              />
              <div className="flex flex-row-reverse gap-2">
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleConfirm}
                  disabled={!canConfirm || isLoading}
                  isLoading={isLoading}
                  className="!bg-red-600 hover:!bg-red-700 focus:ring-red-500 text-white"
                >
                  {confirmButtonLabel}
                </Button>
                <Button type="button" variant="primary" onClick={onClose} disabled={isLoading}>
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

export default DeleteAccountConfirmDialog;
