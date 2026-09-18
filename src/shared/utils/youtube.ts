/**
 * Extrae el ID de un video de YouTube desde cualquiera de las formas en que la gente
 * copia un link: watch?v=, youtu.be/, /shorts/, /embed/, /live/ o el ID pelado.
 *
 * Copia de la misma función en Overtime-Public (`src/shared/utils/youtube.ts`), que es
 * donde el video efectivamente se reproduce. Acá sólo se usa para validar el link antes
 * de guardarlo: si cambia el parseo, hay que cambiarlo en todas las copias.
 */
export const extraerYoutubeId = (input?: string | null): string | null => {
  if (!input) return null;
  const texto = input.trim();
  if (!texto) return null;

  if (/^[\w-]{11}$/.test(texto)) return texto;

  let url: URL;
  try {
    url = new URL(texto.startsWith('http') ? texto : `https://${texto}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return /^[\w-]{11}$/.test(id) ? id : null;
  }

  if (!/(^|\.)youtube(-nocookie)?\.com$/.test(host)) return null;

  const v = url.searchParams.get('v');
  if (v && /^[\w-]{11}$/.test(v)) return v;

  const match = url.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/);
  return match ? match[1] : null;
};
