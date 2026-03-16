![Task collector-banner](./assets/github-banner.png)
![DevelETSII banner](./assets/develetsii-banner.png)


## Descripción

**Task Collector** es una aplicación móvil y web gamificada de gestión de tareas. Al completar tareas, los usuarios obtienen **ítems** cuya rareza depende del esfuerzo y la recurrencia de la tarea. Estos ítems pueden añadirse a **colecciones** para completarlas o venderse por **gemas**. Con las gemas se pueden comprar nuevas colecciones, y al completar una colección con todos sus ítems el jugador gana la **insignia** correspondiente.

## Propósito

El proyecto busca resolver el problema de la falta de motivación a la hora de completar tareas cotidianas. Al incorporar mecánicas de juego (recompensas, colecciones, rareza de ítems y sonidos) convierte la gestión de tareas en una experiencia entretenida y adictiva.

---

## Características principales

- ✅ Creación y gestión de tareas con recurrencia (diaria, semanal, mensual, etc.)
- 🎁 Sistema de recompensas: las tareas completadas otorgan **ítems** según el esfuerzo y la recurrencia
- 💎 Los ítems pueden añadirse a colecciones o **venderse por gemas**
- 🛒 Tienda de colecciones: compra nuevas colecciones con las gemas acumuladas
- 🏅 Insignias: completa una colección con todos sus ítems para ganar su insignia
- 📦 Inventario: gestiona los ítems adquiridos
- ✨ Sistema de rareza y probabilidad de ítems especiales (_shiny_)
- 🔊 Efectos de sonido integrados mediante `@capacitor-community/native-audio`
- 💾 Persistencia local mediante SQLite (nativa y web)
- 📱 Compatible con Android y web (PWA-ready)
- 🏷️ Categorías de tareas personalizables

---

## Tecnologías utilizadas

| Tecnología                          | Versión  | Uso                                          |
| ----------------------------------- | -------- | -------------------------------------------- |
| Angular                             | ^20.0.0  | Framework principal (standalone components)  |
| Ionic Framework                     | ^8.0.0   | Componentes UI y navegación por tabs         |
| Capacitor                           | 8.1.0    | Puente nativo para Android/iOS               |
| TypeScript                          | ~5.9.0   | Lenguaje principal                           |
| RxJS                                | ~7.8.0   | Programación reactiva                        |
| @capacitor-community/sqlite         | ^7.0.1   | Persistencia local SQLite (nativa)           |
| jeep-sqlite                         | ^2.8.0   | Persistencia SQLite en navegador web         |
| sql.js                              | 1.11.0   | Motor SQLite compilado a WebAssembly         |
| @capacitor-community/native-audio   | ^8.0.0   | Reproducción de audio nativo                 |
| @capacitor/splash-screen            | ^8.0.1   | Pantalla de carga                            |
| @capacitor/status-bar               | 8.0.1    | Control de barra de estado                   |
| @capacitor/haptics                  | 8.0.0    | Retroalimentación háptica                    |
| ESLint                              | ^9.16.0  | Linting de código                            |
| Prettier                            | (vía ESLint) | Formateo de código                       |
| Angular ESLint                      | ^20.0.0  | Reglas ESLint específicas de Angular         |

---

## Requisitos previos

| Herramienta        | Versión mínima recomendada | Notas                                  |
| ------------------ | -------------------------- | -------------------------------------- |
| Node.js            | 20.x LTS                   | Necesario para Angular CLI y npm       |
| npm                | 9+                         | Gestor de paquetes                     |
| Angular CLI        | 20.x                       | `npm install -g @angular/cli`          |
| Ionic CLI          | 7+                         | `npm install -g @ionic/cli`            |
| Android Studio     | Última estable             | Necesario para compilar para Android   |
| Java JDK           | 17+                        | Requerido por Android Studio / Gradle  |

---

## Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone https://github.com/DavidPerez-2357/task-collector.git
cd task-collector
npm install
```

---

## Ejecutar en desarrollo

```bash
npm run start
```

Inicia el servidor de desarrollo de Angular en `http://localhost:4200`. La aplicación se recarga automáticamente al detectar cambios en los archivos fuente.

> También puedes usar `ionic serve` si tienes Ionic CLI instalado globalmente.

---

## Build del proyecto

```bash
npm run build
```

Genera los archivos optimizados para producción en la carpeta `www/`. Este directorio es utilizado por Capacitor como `webDir` para empaquetar la app nativa.

---

## Ejecutar en dispositivo móvil

### Android

```bash
# Añadir la plataforma Android (solo la primera vez)
npx cap add android

# Compilar y sincronizar los assets web
npm run build
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

O directamente con Ionic CLI:

```bash
ionic capacitor run android
```

### iOS

> ⚠️ El soporte iOS no ha sido configurado explícitamente en este proyecto. El directorio `ios/` no existe. Para añadirlo:

```bash
npx cap add ios
ionic capacitor run ios
```

Requiere macOS y Xcode instalado.

---

## Scripts disponibles

| Script          | Comando             | Descripción                                                    |
| --------------- | ------------------- | -------------------------------------------------------------- |
| `start`         | `npm run start`     | Inicia el servidor de desarrollo Angular en localhost:4200     |
| `build`         | `npm run build`     | Genera el build de producción en `www/`                        |
| `watch`         | `npm run watch`     | Build en modo watch (desarrollo, reconstruye al cambiar)       |
| `lint`          | `npm run lint`      | Ejecuta ESLint en todo el proyecto                             |
| `format`        | `npm run format`    | Formatea todos los archivos con Prettier                       |

---

## Plugins de Capacitor

| Plugin                                | Versión  | Propósito                                             |
| ------------------------------------- | -------- | ----------------------------------------------------- |
| `@capacitor/core`                     | 8.1.0    | Núcleo de Capacitor                                   |
| `@capacitor/android`                  | 8.1.0    | Soporte de plataforma Android                         |
| `@capacitor/app`                      | 8.0.1    | Eventos del ciclo de vida de la aplicación            |
| `@capacitor/haptics`                  | 8.0.0    | Retroalimentación háptica / vibración                 |
| `@capacitor/keyboard`                 | 8.0.0    | Control del teclado virtual                           |
| `@capacitor/splash-screen`            | ^8.0.1   | Pantalla de splash al iniciar                         |
| `@capacitor/status-bar`               | 8.0.1    | Personalización de la barra de estado                 |
| `@capacitor-community/sqlite`         | ^7.0.1   | Base de datos SQLite local en Android/iOS             |
| `@capacitor-community/native-audio`   | ^8.0.0   | Reproducción de audio nativo (efectos de sonido)      |

---

## Estructura del proyecto

```
task-collector/
├── android/                        # Proyecto Android nativo (Capacitor)
├── src/
│   ├── app/
│   │   ├── core/                   # Lógica de negocio central
│   │   │   ├── consts/             # Constantes de configuración (rareza, shiny)
│   │   │   ├── models/             # Interfaces y tipos de datos (task, item, collection...)
│   │   │   ├── repositories/       # Acceso a datos mediante SQL
│   │   │   ├── services/           # Servicios de lógica de negocio
│   │   │   ├── types/              # Tipos TypeScript compartidos
│   │   │   └── utils/              # Funciones utilitarias (fechas, recompensas, shiny)
│   │   ├── features/               # Páginas/pestañas de la aplicación (lazy-loaded)
│   │   │   ├── home-tab/           # Pestaña principal: lista y gestión de tareas
│   │   │   ├── collection-tab/     # Pestaña de colecciones
│   │   │   ├── inventory-tab/      # Pestaña de inventario
│   │   │   ├── shop-tab/           # Pestaña de la tienda
│   │   │   └── tabs/               # Shell de navegación con tabs
│   │   ├── shared/
│   │   │   └── components/         # Componentes UI reutilizables
│   │   ├── app.component.ts        # Componente raíz (inicializa la BD)
│   │   └── app.routes.ts           # Rutas principales (lazy-load de tabs)
│   ├── assets/
│   │   ├── db/
│   │   │   └── migrations/         # Migraciones SQL numeradas (001_*.sql ...)
│   │   ├── fonts/                  # Fuente personalizada (Jersey 20)
│   │   ├── sounds/                 # Efectos de sonido
│   │   ├── item-images/            # Imágenes de los ítems
│   │   ├── icons/                  # Iconos de la aplicación
│   │   └── backgrounds/            # Fondos de pantalla
│   ├── theme/
│   │   └── variables.scss          # Variables de Ionic y tokens de color personalizados
│   ├── global.scss
│   ├── index.html
│   ├── main.ts
│   └── polyfills.ts
├── capacitor.config.ts             # Configuración de Capacitor
├── ionic.config.json               # Configuración de Ionic CLI
├── angular.json                    # Configuración del workspace Angular
├── tsconfig.json                   # Configuración de TypeScript
└── package.json                    # Dependencias y scripts
```

---

## Arquitectura

### Componentes standalone de Angular

Todos los componentes son **standalone** (no usan NgModules). La inyección de dependencias se realiza mediante la función `inject()`.

### Routing

Las rutas están **lazy-loaded**. La ruta raíz carga `tabs.routes.ts`, que define las rutas hijas para cada pestaña:

- `/home` → `HomeTabComponent`
- `/collection` → `CollectionTabComponent`
- `/inventory` → `InventoryTabComponent`
- `/shop` → `ShopTabComponent`

### Capas de la arquitectura

```
Models -> Repositories -> Services -> Features (Pages)
                                          ^
                                     Shared Components
```

| Capa           | Ubicación              | Responsabilidad                               |
| -------------- | ---------------------- | --------------------------------------------- |
| Models         | `core/models/`         | Interfaces TypeScript puras, enums, constantes |
| Repositories   | `core/repositories/`   | Consultas SQL vía `DatabaseService`           |
| Services       | `core/services/`       | Lógica de negocio; inyectan repositorios      |
| Features       | `features/`            | Componentes de página; inyectan servicios     |
| Shared         | `shared/components/`   | Componentes UI reutilizables sin servicios    |

### Base de datos (SQLite)

- **`DatabaseService`** gestiona la conexión SQLite, migraciones, bloqueo concurrente y auto-persistencia en web.
- Las migraciones se almacenan en `src/assets/db/migrations/` como archivos `.sql` numerados.
- Para añadir una migración: crear el siguiente archivo numerado e incrementar `dbVersion` en `database.service.ts`.

### Integración con Capacitor

- La app web compilada se empaqueta como app nativa mediante Capacitor.
- `DatabaseService` usa `jeep-sqlite` en el navegador y el plugin nativo en Android/iOS.
- Los plugins nativos (`native-audio`, `haptics`, `status-bar`) se inicializan en `AppComponent`.

### Componentes Ionic

Se utilizan componentes Ionic estándar (`IonTabs`, `IonModal`, `IonCard`, `IonButton`, `IonToast`, etc.) junto con componentes personalizados para mantener la identidad visual del juego.

---

## Calidad de código

| Herramienta       | Configuración          | Uso                                              |
| ----------------- | ---------------------- | ------------------------------------------------ |
| **ESLint**        | `.eslintrc.json`       | Análisis estático del código TypeScript y HTML   |
| **Prettier**      | (vía `eslint-config-prettier`) | Formateo automático de código            |
| **Angular ESLint**| `@angular-eslint/*`    | Reglas específicas para Angular y plantillas     |

Ejecutar el linter:

```bash
npm run lint
```

Formatear el código:

```bash
npm run format
```

---

## Convenciones de ramas

Usa un prefijo que refleje el tipo de trabajo, seguido de un nombre conciso en kebab-case.

| Prefijo       | Uso                                  |
| ------------- | ------------------------------------ |
| `feature/`    | Nueva funcionalidad                  |
| `bugfix/`     | Corrección de errores                |
| `hotfix/`     | Corrección urgente en producción     |
| `refactor/`   | Refactorización de código            |
| `docs/`       | Actualizaciones de documentación     |
| `test/`       | Tests y mejoras de testing           |
| `chore/`      | Mantenimiento y tareas generales     |

**Formato:** `<prefijo>/<nombre-conciso>`

**Ejemplos:**

```
feature/add-shop-items
bugfix/coin-reset
hotfix/db-crash-on-startup
refactor/task-service-optimization
docs/readme-update
```

---

## Convenciones de commits

Los mensajes de commit siguen el estilo **[gitmoji](https://gitmoji.dev/)**: un emoji relevante seguido de una descripción corta en imperativo.

**Formato:** `<gitmoji> <Descripción breve en imperativo>`

| Emoji | Uso                                        |
| ----- | ------------------------------------------ |
| ✨    | Nueva funcionalidad                        |
| 🐛    | Corrección de bug                          |
| 🚑️    | Hotfix crítico                             |
| ♻️    | Refactorización                            |
| 🎨    | Mejora de estructura o formateo            |
| 💄    | Cambios de UI o estilos                    |
| 🗃️    | Cambios en base de datos                   |
| 📝    | Documentación                              |
| 🔧    | Configuración                              |
| 📦️    | Build o paquetes                           |
| ✏️    | Corrección de typos                        |
| 🔥    | Eliminar código o archivos                 |
| ⬆️    | Actualizar dependencias                    |
| ⬇️    | Degradar dependencias                      |
| ➕    | Añadir dependencia                         |
| ➖    | Eliminar dependencia                       |
| 🚚    | Mover o renombrar archivos                 |
| 💥    | Cambios que rompen compatibilidad          |
| 🥅    | Captura de errores                         |
| 💫    | Animaciones y transiciones                 |
| 🦺    | Validación                                 |
| ✈️    | Soporte offline                            |
| 🔒️    | Seguridad                                  |
| 🧑‍💻    | Experiencia de desarrollador               |

**Ejemplos:**

```
✨ Implement player state repository and service for coin management
🐛 Fix unique constraint in weekly recurrence
💄 Implement custom tab bar styling with new background images and icons
🗃️ Add initial SQL schema
🔧 Configure Angular schematics to skip test generation
```

---

## Contribución

1. Haz un fork del repositorio.
2. Crea una rama con el prefijo adecuado (ver [Convenciones de ramas](#convenciones-de-ramas)):
   ```bash
   git checkout -b feature/mi-nueva-funcionalidad
   ```
3. Realiza tus cambios siguiendo las convenciones del proyecto (componentes standalone, `inject()`, rutas lazy-loaded).
4. Asegúrate de que el linter no reporta errores:
   ```bash
   npm run lint
   ```
5. Formatea el código antes de hacer commit:
   ```bash
   npm run format
   ```
6. Escribe el mensaje de commit siguiendo las [Convenciones de commits](#convenciones-de-commits).
7. Abre un Pull Request describiendo los cambios.

---

## Contribuidores

| Contribuidor    | Perfil                                                    |
| --------------- | --------------------------------------------------------- |
| David Pérez     | [DavidPerez-2357](https://github.com/DavidPerez-2357)     |
| Pepe Escalera   | [pescalerag](https://github.com/pescalerag)               |

---

## Licencia

Este proyecto está licenciado bajo la **GNU General Public License v3.0**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
