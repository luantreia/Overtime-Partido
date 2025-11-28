import type { FC, ReactNode } from 'react';
import ModalBase from '../ModalBase/ModalBase';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

type ConfirmModalProps = {
  isOpen: boolean;
  title?: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: 'danger' | 'primary' | 'default';
  showCancel?: boolean;
  showConfirm?: boolean;
  size?: ModalSize;
};

const ConfirmModal: FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Confirmar',
  message = '¿Desea continuar?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default',
  showCancel = true,
  showConfirm = true,
  size = 'sm',
}) => {
  const confirmClasses =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700'
      : variant === 'primary'
      ? 'bg-blue-600 hover:bg-blue-700'
      : 'bg-slate-600 hover:bg-slate-700';

  return (
    <ModalBase isOpen={isOpen} onClose={onCancel} title={title} size={size}>
      <div className="p-4">
        <div className="text-sm text-slate-700">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          {showCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              {cancelLabel}
            </button>
          ) : null}
          {showConfirm ? (
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${confirmClasses}`}
            >
              {confirmLabel}
            </button>
          ) : null}
        </div>
      </div>
    </ModalBase>
  );
};

export default ConfirmModal;
