# Documentación: Timers Drift-Free y Mesa de Control

## 1. Objetivo General
Unificar y estabilizar la gestión de tiempos del partido y de los sets evitando el "drift" (deriva) típico de incrementar/decrementar variables en intervalos, reducir emisiones socket redundantes y centralizar la lógica en un hook reutilizable (`useDriftFreeTimers`). La mesa de control opera estos estados mediante botones claramente definidos que disparan acciones del hook y persistencias en backend.

## 2. Componentes Clave
- Hook `useDriftFreeTimers` (`src/shared/hooks/useDriftFreeTimers.ts`)
- Página `ControlPage` (`src/features/control/ControlPage.tsx`)
- Página `OverlayPage` (modo overlay pasivo)
- `OverlayScoreboard` (UI unificada para marcador + timers)
- Servicios:
  - `setService.ts` (CRUD y persistencia de timers por set)
  - `overlayService.ts` (mostrar/ocultar overlays tipados)
- Utilidad `confirmPeriodChange` (confirmación de cambio de periodo)

## 3. Modelo de Estado del Hook
`DriftTimersState`:
```
matchTime: number          // segundos restantes de partido
setTimer: number           // segundos restantes del set en juego
suddenDeathTime: number    // segundos transcurridos en muerte súbita (acumula)
period: number             // periodo / tiempo actual (1,2...)
isMatchRunning: boolean
isSetRunning: boolean
isSuddenDeathActive: boolean
suddenDeathMode: boolean   // habilita la posibilidad de muerte súbita (Foam)
// Metadatos de sincronización drift-free
timerStartTimestamp?: number
initialValues?: { match: number; set: number; sd: number }
```

### Cálculo Drift-Free
Se guarda:
- `startRef` = timestamp (ms) al iniciar/reanudar
- `initialValuesRef` = valores existentes al momento de iniciar
Cada tick (1s) se calcula `elapsed = floor((Date.now() - startRef)/1000)` y se derivan:
- `matchTime = max(0, initial.match - elapsed)` si partido/alguna fase corre
- `setTimer = max(0, initial.set - elapsed)` si el set corre
- `suddenDeathTime = initial.sd + elapsed` si muerte súbita activa
No se usa `setInterval` para mutar estado directo por decrementos acumulativos.

## 4. Emisión de Estado al Socket
El hook sólo emite (`timer:update`) cuando cambia:
- Alguno de los segundos (`matchTime`, `setTimer`, `suddenDeathTime`)
- O una bandera estructural (`period`, `isMatchRunning`, `isSetRunning`, `isSuddenDeathActive`, `suddenDeathMode`)
Esto evita spam y reemplaza emisiones manuales en `ControlPage`.

## 5. Acciones del Hook (Controller)
```
startOrResume()
pauseAll()
setMatchTimeManual(seconds)
setSetTimeManual(seconds)
changePeriod(p)
setSuddenDeathMode(enabled)
startSuddenDeath()
stopSuddenDeath()
startSetIfNeeded()          // Arranca el cronómetro de set si hay tiempo > 0
resetAll()                  // Reinicia a valores iniciales
```
Overlay usa `overlayActions.applySocketTimerUpdate` para actualizar estado pasivamente con payloads entrantes.

## 6. Flujo de Mesa de Control (Botones / Acciones)
| Botón / Interacción | Acción Interna | Persistencia | Emisión Automática |
|---------------------|----------------|--------------|--------------------|
| Play / Pausa Partido | `startOrResume` / `pauseAll` | PUT partido (timer base) | Sí (hook) |
| Cambiar Periodo (1T/2T) | `confirmPeriodChange` → `changePeriod` | PUT partido (period + match timer reset) | Sí |
| Editar tiempo partido | prompt → `setMatchTimeManual` | PUT partido (timerMatchValue) | Sí |
| Editar tiempo set | prompt → `setSetTimeManual` | PUT set (timerSetValue) | Sí |
| Iniciar Set nuevo | `createSet` + `setSetTimeManual` + opcional `startSetIfNeeded` | POST set + PUT set timer inicial | Sí |
| Finalizar Set (Local/Visita/Empate) | `pauseAll` + `finishSetApi` | PUT set (estado finalizado + ganador) | Sí |
| Reabrir Set | `reopenSetApi` | PUT set | Sí (period no cambia, solo flags) |
| Eliminar Set | `deleteSetApi` | DELETE set | n/a |
| Cambiar ganador Set (historial) | `changeWinnerApi` | PUT set (ganadorSet) | n/a (sólo marcador global recalculado) |
| Time Out Local/Visita | `pauseAll` + `showOverlay('TIMEOUT')` | PUT partido + set timers (pausa) | Sí |
| Revisión Arbitral | `pauseAll` + `showOverlay('REVIEW')` | PUT partido + set timers (pausa) | Sí |
| Toggle Muerte Súbita | `setSuddenDeathMode` + lógica condicional start/pause | PUT set (flags y timers) | Sí |
| Iniciar Tiempo de Set (botón azul pulsante) | `startSetIfNeeded` | PUT set (running=true) | Sí |
| Reiniciar Partido | `resetAll` + borrar sets | PUT partido + DELETE sets previos | Sí |

## 7. Persistencia de Timers
Función `saveTimerState` en `ControlPage`:
- Actualiza partido (`timerMatchValue`, `timerMatchRunning`, `timerMatchLastUpdate`, `period`).
- Actualiza set en juego (timers de set y muerte súbita, flags, modo). Ya no emite `timer:update` manual (hook se encarga).

## 8. Servicios
### Set Service (`setService.ts`)
Encapsula todas las operaciones CRUD y de persistencia de timer por set:
```
listSets(matchId)
createSet(matchId, numeroSet)
finishSetApi(setId, ganador)
reopenSetApi(setId)
deleteSetApi(setId)
changeWinnerApi(setId, ganador)
saveSetTimerState(setId, { timerSetValue, ... })
```
Permite que la página mantenga semántica clara y testable.

### Overlay Service (`overlayService.ts`)
```
showOverlay(socket, matchId, type, payload?)
hideOverlay(socket, matchId, type?)
overlayAutoHide(socket, matchId, type, payload, ms)
```
Reemplaza `socket.emit('overlay:trigger', ...)` manual y aporta tipo `OverlayType`.

## 9. Ejemplo de Uso del Hook (Controller)
```tsx
const { state, controllerActions } = useDriftFreeTimers({
  mode: 'controller',
  matchId,
  socket,
  initialMatchTime: 20 * 60,
  initialSetTime: 3 * 60,
  initialPeriod: 1
});

// Iniciar partido
controllerActions.startOrResume();

// Editar tiempo partido a 15 minutos
controllerActions.setMatchTimeManual(15 * 60);

// Cambiar a segundo periodo con confirmación externa
controllerActions.changePeriod(2);

// Activar muerte súbita
controllerActions.setSuddenDeathMode(true);
controllerActions.startSuddenDeath();
```

## 10. Ejemplo de Uso del Hook (Overlay)
```tsx
const { state, overlayActions } = useDriftFreeTimers({
  mode: 'overlay',
  matchId,
  socket
});

useEffect(() => {
  socket.on('timer:update', payload => overlayActions?.applySocketTimerUpdate(payload));
  return () => socket.off('timer:update');
}, [socket, overlayActions]);

// Render con state.matchTime, state.setTimer, etc.
```

## 11. Sincronización Manual (Request Sync)
El overlay o espectadores pueden emitir `timer:request_sync`; `ControlPage` responde con el estado completo (incluyendo metadatos `timerStartTimestamp` e `initialValues`). Esto permite que un nuevo cliente reconstruya los tiempos derivándolos de timestamp y valores iniciales sin pérdida.

## 12. Modo Foam y Muerte Súbita
- Cuando `suddenDeathMode` activo y el set llega a 0 en Foam, se dispara automáticamente `startSuddenDeath()`.
- `suddenDeathTime` se incrementa de forma acumulativa (elapsed + valor inicial).

## 13. Razones del Diseño
- Drift-free: evita acumulación de error (cada segundo se recalcula por diferencia de timestamps).
- Emisión inteligente: minimiza tráfico y re-render en consumidores.
- Separación de responsabilidades: UI (botones) solo orquesta acciones y servicios persisten.
- Reutilización: Overlay consume el mismo estado sin duplicar lógica de intervalos.

## 14. Extensión / Futuras Mejoras
- Añadir métricas: contar latencia promedio entre emisor y consumidor para ajustar tolerancias.
- Persistir `timerStartTimestamp` en backend para reconstrucciones post reinicio del servidor.
- Code splitting: cargar scoreboard y panel histórico de sets de forma diferida.

## 15. Checklist Rápido para Nuevos Desarrollos
1. ¿Necesitas modificar tiempos? Usa acciones del hook, nunca setState directo.
2. ¿Agregar nuevo overlay? Añade tipo en `OverlayType` y usa `showOverlay`/`hideOverlay`.
3. ¿Nuevo evento de sincronización? Considerar si debe cambiar flags; hook emitirá automáticamente.
4. ¿Persistencia extra por set? Extiende `saveSetTimerState` en el servicio, no en la página.

## 16. Preguntas Frecuentes
- "¿Por qué el timer no se decrementa visualmente si pauso?" Porque al pausar se limpia `startRef`; el estado queda congelado.
- "¿Qué pasa si edito manual mientras corre?" Se recalculan referencias para que el tiempo restante se derive desde el nuevo valor.
- "¿Cómo probar ausencia de drift?" Ejecutar partido largo, comparar tiempo real transcurrido vs `matchTime` decrecido: diferencia debería ser <= 1 segundo.

---
Última actualización: (auto) por integración final hook/control.
