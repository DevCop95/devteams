# Dev Teams

![Status](https://img.shields.io/badge/status-alpha-0fa855?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-static_app-e34f26?style=for-the-badge&logo=html5&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D_workspace-111111?style=for-the-badge&logo=threedotjs&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-live_panels-ff6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-live_or_demo-f55036?style=for-the-badge)

Dev Teams es una oficina 3D interactiva construida como una app estatica en una sola interfaz. Mezcla simulacion visual, chat multiagente, herramientas locales del navegador y respuestas reales con Groq cuando hay una API key valida.

![Portada](docs/screenshots/portada-repo.png)

## Que es esta app

La app funciona como una oficina virtual de Dev Teams:

- una escena 3D con agentes y eventos
- un panel lateral con arbol, flujo, consola, estado y dashboard
- un chat con agentes individuales o modo broadcast
- tools del navegador para leer y buscar archivos locales
- integracion opcional con Groq para respuestas reales

La mayor parte de la logica vive en [`index.html`](/C:/Users/POWER/Desktop/vscode/Devops/index.html).

## Funciones principales

- Oficina 3D con agentes, estados y movimientos en tiempo real
- Chat con un agente o con el equipo en modo broadcast inteligente
- Routing automatico del chat segun el tema
- Planner interno para consultas complejas
- Delegacion entre agentes por rol
- Reuniones de equipo y reuniones 1:1
- Asignacion de tareas con historial y resumen operativo
- Tools locales del navegador para explorar archivos
- Modo `demo` y modo `groq conectado`
- Eventos ambientados como delivery, pausas y visitante psicologa

## Captura

![Vista general](docs/screenshots/vision-general.png)

## Como ejecutar

Usa cualquier servidor estatico local.

Ejemplo:

```bash
python -m http.server 5500
```

Luego abre:

```text
http://localhost:5500
```

Tambien puedes usar Live Server o cualquier servidor estatico equivalente.

## Como conectar Groq

1. Abre la app en el navegador.
2. Pulsa el boton `API`.
3. Selecciona el modelo.
4. Pega tu API key de Groq.
5. Pulsa `Guardar`.

Si la key es valida:

- el badge deja de decir `demo mode`
- pasa a `groq conectado`
- el chat usa Groq
- se activan comportamientos live del equipo
- Paula puede intervenir ante prompts inadecuados

Si la key no es valida:

- la app vuelve a `demo mode`
- no mantiene un estado de conexion falso

## Comandos del chat

Estos comandos funcionan desde la consola:

```text
/carpeta
/indexar
/archivos
/leer ruta/del/archivo
/buscar texto
/analizar ruta/del/archivo
/exportar
```

### Que hace cada comando

- `/carpeta`: abre el selector de carpeta local
- `/indexar`: reconstruye el indice del workspace
- `/archivos`: lista los archivos detectados
- `/leer ruta`: lee un archivo local
- `/buscar texto`: busca coincidencias dentro del workspace
- `/analizar ruta`: analiza un archivo con Groq segun el rol activo
- `/exportar`: descarga el chat actual en `.txt`

## Como funciona el chat

### Chat individual

La app puede redirigir automaticamente la conversacion al agente mas adecuado segun el tema.

### Broadcast

El modo `Todos` no dispara a los ocho agentes siempre. El sistema intenta escoger a los roles mas relevantes para cada pregunta.

### Planner y delegacion

En preguntas complejas la app puede:

- generar un microplan interno
- pedir aportes a otros roles
- responder con una salida mas estructurada

## Eventos especiales

### Delivery

Un repartidor puede entrar a la oficina, cruzar la puerta, entregar un paquete y salir.

### Psicologa Paula

Con Groq activo, Paula puede aparecer cuando detecta mensajes ofensivos, agresivos o inadecuados.

Comportamiento esperado:

- entra a la oficina
- el equipo se gira para escucharla
- da una intervencion breve
- un miembro del equipo puede reaccionar

Nota: el flujo de visitantes y puerta sigue en iteracion y puede requerir ajustes finos.

## Estructura del proyecto

```text
.
├─ index.html
├─ README.md
└─ docs/
   └─ screenshots/
```

## Stack

- HTML
- CSS
- JavaScript
- Three.js
- Chart.js
- Groq API
- File System Access API

## Persistencia actual

- La API key se guarda en la sesion del navegador
- El modelo seleccionado se guarda localmente
- Parte del historial y estado se guarda en `localStorage`
- El acceso a carpetas depende del permiso del navegador

## Requisitos practicos

- Navegador moderno
- Para `/carpeta` y tools locales, conviene usar Chromium o compatible con `showDirectoryPicker`
- Servidor local o `localhost`
- Conexion a internet si quieres usar Groq

## Limitaciones actuales

- Es una app cliente puro, sin backend
- La API key vive en el navegador
- La logica principal esta concentrada en un solo archivo
- Algunos flujos visuales y eventos siguen en fase experimental

## Seguridad

Esta version esta pensada para demo y pruebas locales.

Para una version mas seria o publica:

- mueve las llamadas a Groq a un backend
- protege credenciales fuera del cliente
- no publiques llaves reales en el front

## Estado del proyecto

Proyecto en fase `alpha`, orientado a:

- demo visual
- simulacion multiagente
- tools locales del navegador
- integracion con Groq
- exploracion de flujos operativos en una sola pagina
