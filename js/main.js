// ==================== INICIALIZACIÓN (js/main.js) ====================
window.addEventListener('load', () => {
console.log("Dev Teams v2 - Iniciando sistema modular...");
// 1. Inicializar el motor 3D
if (typeof initThree === 'function') initThree();
// 2. Inicializar la consola de chat
if (typeof initConsole === 'function') initConsole();
// 3. Aplicar temas y modos guardados
if (typeof applyCleanMode === 'function') applyCleanMode();
if (typeof applyDirectorMode === 'function') applyDirectorMode();

// 4. Dibujar el minimapa estático
if (typeof drawMMStatic === 'function') drawMMStatic();

console.log("Sistema listo ✓");
});
