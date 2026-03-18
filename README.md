# Dev Teams

![Status](https://img.shields.io/badge/status-alpha-0fa855?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-static_app-e34f26?style=for-the-badge&logo=html5&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D_office-111111?style=for-the-badge&logo=threedotjs&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-live_metrics-ff6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLM_ready-f55036?style=for-the-badge)
![Multi-Agent](https://img.shields.io/badge/Multi--Agent-simulation-5b9bd5?style=for-the-badge)

Demo interactiva de una oficina 3D con agentes IA, panel operativo, reuniones, tareas, chat y visuales tipo command center.

## Vista General

`Dev Teams` es una experiencia web estática en un solo archivo que mezcla:

- Simulación 3D de una oficina con agentes y zonas de trabajo
- Paneles operativos y métricas visuales
- Chat con agentes usando Groq
- Reuniones de equipo, tareas y eventos en escena
- Interacciones como delivery, ping pong, café, rack, board y consola

El proyecto está pensado como demo visual, showcase técnico y base para evolucionar hacia una arquitectura más organizada.

## Lo Más Interesante

- Oficina 3D isométrica construida con `three.js`
- Agentes con estados, rutas y comportamiento visual
- Command Center con actividad, estatus y flujo
- Reuniones automáticas del equipo y 1:1
- Chat multi-agente y respuestas con modelo LLM
- Métricas y gráficos con `Chart.js`
- UI estilo terminal / AI operations

## Stack Actual

- `HTML5`
- `CSS3`
- `JavaScript` vanilla
- `three.js`
- `Chart.js`
- `Groq API`
- `Web Worker` para pathfinding

## Cómo Ejecutarlo

### Opción rápida

Abre [index.html](./index.html) directamente en el navegador.

### Opción recomendada

Levanta un servidor estático local:

```bash
python -m http.server 5500
```

Luego abre:

```text
http://localhost:5500
```

## Configuración

Para activar respuestas reales con IA:

1. Abre la app
2. Configura tu API key de `Groq`
3. Selecciona el modelo

Si no configuras la key, parte de la experiencia funciona en modo demo.

## Controles Rápidos

- `Reunión`: inicia una reunión de equipo
- `Demo`: dispara el recorrido guiado
- `Tarea`: abre el panel para asignar trabajo a agentes
- `Chat`: conversa con un agente o con todos
- `M`: inicia reunión desde teclado
- `P`: cambia modo presentación

## Estado Actual Del Proyecto

Hoy el repo está concentrado en un único archivo:

```text
index.html
```

Eso acelera el prototipado, pero hace más difícil mantener, probar y versionar cambios grandes.

## Organización Recomendada Antes De Subir A Git

La siguiente estructura te deja el proyecto mucho más limpio sin complicarlo demasiado:

```text
Devops/
├─ README.md
├─ .gitignore
├─ LICENSE
├─ index.html
├─ docs/
│  ├─ screenshots/
│  │  └─ cover.png
│  └─ notes.md
├─ src/
│  ├─ css/
│  │  └─ main.css
│  ├─ js/
│  │  ├─ app.js
│  │  ├─ scene.js
│  │  ├─ agents.js
│  │  ├─ meetings.js
│  │  ├─ delivery.js
│  │  ├─ ui.js
│  │  └─ path-worker.js
│  └─ data/
│     └─ config.js
└─ assets/
   ├─ images/
   └─ icons/
```

## Archivos Que Sí Te Recomiendo Crear Ya

- `README.md`
- `.gitignore`
- `LICENSE`
- `docs/screenshots/cover.png`
- `docs/notes.md`

## Nombres Recomendados

- `README.md`: presentación del proyecto
- `.gitignore`: exclusiones básicas para Git
- `LICENSE`: licencia del repo
- `docs/notes.md`: decisiones, pendientes y cambios rápidos
- `docs/screenshots/cover.png`: imagen para el repo
- `src/js/meetings.js`: lógica de reuniones
- `src/js/delivery.js`: lógica del repartidor y la puerta
- `src/js/agents.js`: comportamiento de agentes
- `src/js/scene.js`: construcción 3D
- `src/js/path-worker.js`: pathfinding
- `src/css/main.css`: estilos extraídos del HTML

## Roadmap Sugerido

- Separar CSS del `index.html`
- Separar lógica por módulos JS
- Extraer pathfinding a archivo propio
- Crear carpeta `docs/` con capturas y notas
- Agregar `LICENSE`
- Agregar `CHANGELOG.md` cuando empieces a versionar releases

## Versión Inicial Sugerida

Si esta será la primera subida, un buen punto de partida es etiquetarlo como:

```text
v0.1.0-alpha
```

## Autoría

Proyecto visual / experimental para simular un equipo IA dentro de una oficina 3D operativa.
