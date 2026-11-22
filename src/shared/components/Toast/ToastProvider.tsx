import type { FC, ReactNode } from 'react';
import { ToastProvider as KitToastProvider, ConfirmProvider } from 'overtime-kit';

/**
 * Los toasts y las confirmaciones viven en overtime-kit (v0.3.0+). Este archivo queda como
 * punto de montaje para no tocar los imports de toda la app: `useToast` y la API
 * `addToast/removeToast` son las mismas que la copia local que había acá.
 *
 * Suma `ConfirmProvider`, así cualquier pantalla puede hacer `await useConfirm()({...})` en vez
 * de manejar su propio `<ConfirmModal isOpen=…>`.
 */
export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => (
  <KitToastProvider>
    <ConfirmProvider>{children}</ConfirmProvider>
  </KitToastProvider>
);

export { useToast, useConfirm } from 'overtime-kit';
export type { Toast, ToastType } from 'overtime-kit';

export default ToastProvider;
