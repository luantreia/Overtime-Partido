# Análisis y Mejoras: Gestión Partido

## 📊 Estado Actual
- **Avance**: En desarrollo activo.
- **Complejidad**: Alta, debido a la sincronización en tiempo real requerida.

## 🛑 Funcionalidades Faltantes
1.  **Soporte Offline**: Capacidad de seguir operando si se cae internet y sincronizar al volver.
2.  **Integración Ranked**: Adaptar la captura de stats para usar los equipos efímeros (Rojo/Azul) en lugar de los clubes tradicionales.
3.  **Undo/Redo**: Sistema robusto para corregir errores de mesa (ej. gol mal asignado) sin romper el historial de stats.

## 💡 Plan de Mejoras
1.  **Service Workers**: Implementar PWA real para soporte offline.
2.  **Modo Ranked**: Switch automático de interfaz cuando el partido es `isRanked`.
3.  **WebSockets**: Reemplazar polling para que el Overlay se actualice instantáneamente (sub-second latency).

## 🔗 Integración
- Crítico: Debe enviar datos fiables a la API. Si la mesa falla, las estadísticas de todo el torneo se corrompen.
