/**
 * Puente al kit. La implementación vive en `overtime-kit` y este archivo existe sólo para que
 * las pantallas que ya importaban desde acá no tengan que cambiar el import.
 *
 * Al pasar al kit, esta app hereda arreglos que antes sólo tenía otra copia: apilado de z-index
 * para modales anidados (venía de Overtime-Public) y, de dodgeballmanager, Escape que sólo
 * atiende la capa de arriba, scroll del body que se libera recién al cerrar la última capa,
 * pantalla completa en mobile respetando el área segura y botón de cerrar de 44px.
 */
export { Modal as default } from 'overtime-kit';
export type { ModalProps, ModalSize } from 'overtime-kit';
