export const confirmPeriodChange = (currentPeriod: number, newPeriod: number): boolean => {
  if (currentPeriod === newPeriod) return false;
  return window.confirm(`¿Cambiar al ${newPeriod === 1 ? '1er' : '2do'} Tiempo? Esto reiniciará el reloj del partido.`);
};
