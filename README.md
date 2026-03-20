# Dev Teams

![Status](https://img.shields.io/badge/status-alpha-0fa855?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-static_app-e34f26?style=for-the-badge&logo=html5&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D_workspace-111111?style=for-the-badge&logo=threedotjs&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-live_panels-ff6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-real_time_ai-f55036?style=for-the-badge)

Dev Teams es una oficina 3D interactiva con agentes, paneles operativos, chat y acciones coordinadas para mostrar una experiencia de AI Operations en una sola interfaz.

![Caratula del repositorio](docs/screenshots/portada-repo.png)

## Vista General

La app combina:

- escena 3D con agentes y movimientos
- panel lateral con eventos, chat y actividad
- reuniones y tareas coordinadas
- integracion con Groq para respuestas reales
- modo demo cuando no hay API key cargada

## Capturas

### Vision general

![Vision general del sistema](docs/screenshots/vision-general.png)

## Funciones principales

- Oficina 3D con equipo virtual y actividad en tiempo real
- Chat con un agente o con todo el equipo
- Reuniones en la mesa central
- Asignacion de tareas a agentes
- Paneles de estado, eventos y metricas
- Integracion directa con Groq desde la interfaz

## Como ejecutar

Opcion recomendada:

```bash
python -m http.server 5500
```

Luego abre:

```text
http://localhost:5500
```

Tambien puedes usar Live Server o cualquier servidor estatico local.

## Configurar la llave de Groq

Si quieres usar respuestas reales en vez de `demo mode`, esta es la configuracion correcta.

### Paso 1. Crear la llave en Groq

1. Entra a [console.groq.com](https://console.groq.com).
2. Crea una API key nueva.
3. Copia la llave. Normalmente empieza por `gsk_...`.

### Paso 2. Abrir el modal dentro de la app

1. Ejecuta la app en tu navegador.
2. En la barra superior, haz clic en el boton `API`.
3. Se abrira el modal `Groq API Key`.

### Paso 3. Pegar la llave y guardar

Dentro del modal vas a ver:

- `Modelo`
- `API Key`
- botones `Guardar` y `Limpiar`

Haz esto:

1. Selecciona el modelo que quieres usar.
2. Pega tu llave en el campo `API Key`.
3. Pulsa `Guardar`.

### Paso 4. Confirmar que quedo conectada

Si todo salio bien, la interfaz cambia asi:

1. el badge superior deja de decir `demo mode`
2. aparece el estado de conexion de Groq
3. el nombre del modelo queda visible en la barra
4. el chat ya puede responder con IA real

### Paso 5. Hacer una prueba rapida

1. Abre el panel de chat.
2. Selecciona un agente, por ejemplo `Ana`, `Sofia` o `Yared`.
3. Escribe un mensaje corto.
4. Si la llave esta bien, el agente responde usando Groq.

## Como guarda la app esta configuracion

Segun el comportamiento actual del codigo:

- La `API Key` se guarda en la sesion actual del navegador.
- El modelo seleccionado se guarda localmente en el navegador.
- Si cierras la sesion o abres una ventana nueva, puede que necesites pegar la llave otra vez.

## Cambiar o borrar la llave

1. Vuelve a abrir el boton `API`.
2. Para cambiarla, pega una nueva y pulsa `Guardar`.
3. Para borrarla, pulsa `Limpiar`.

## Solucion de problemas de Groq

### Sigue apareciendo `demo mode`

- Confirma que pulsaste `Guardar`.
- Reabre `API` y revisa que el campo no este vacio.
- Si hace falta, pulsa `Limpiar`, pega la llave otra vez y vuelve a guardar.

### El chat no responde con IA real

- Revisa que la llave de Groq sea valida.
- Confirma que tengas conexion a internet.
- Asegurate de abrir la app desde un servidor local y no solo como archivo suelto.

### La llave desaparece al recargar

Eso puede pasar porque la llave no se guarda como una credencial permanente del proyecto, sino en la sesion actual del navegador.

## Nota de seguridad

Esta version usa la API key desde el navegador. Eso es util para demo y pruebas, pero no es la arquitectura recomendada para produccion.

Si vas a publicar una version mas seria:

- mueve las llamadas a Groq a un backend
- no expongas claves reales en el cliente
- no subas llaves al repositorio

## Stack

- HTML
- CSS
- JavaScript
- three.js
- Chart.js
- Groq API

## Estado actual

Proyecto en fase `alpha`, orientado a demo visual, validacion de concepto y evolucion del flujo operativo.
