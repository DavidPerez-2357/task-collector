# Task Collector

## Descripción

**Task Collector** es una aplicación móvil y web gamificada de gestión de tareas. Los usuarios crean tareas con frecuencias recurrentes, las completan para ganar monedas (gemas), y usan esas monedas para comprar ítems en la tienda, construir colecciones y gestionar su inventario.

## Propósito

El proyecto busca resolver el problema de la falta de motivación a la hora de completar tareas cotidianas. Al incorporar mecánicas de juego —recompensas, colecciones, rareza de ítems y sonidos— convierte la gestión de tareas en una experiencia entretenida y adictiva.

---

## Características principales

- ✅ Creación y gestión de tareas con recurrencia (diaria, semanal, mensual, etc.)
- 🎯 Sistema de recompensas: las tareas completadas otorgan gemas
- 🛒 Tienda de ítems: compra ítems con las gemas acumuladas
- 📦 Inventario: gestiona los ítems adquiridos
- 🃏 Colecciones: agrupa y visualiza ítems por categorías
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

## Scripts disponibles

| Script          | Comando             | Descripción                                                    |
| --------------- | ------------------- | -------------------------------------------------------------- |
| `start`         | `npm run start`     | Inicia el servidor de desarrollo Angular en localhost:4200     |
| `build`         | `npm run build`     | Genera el build de producción en `www/`                        |
| `watch`         | `npm run watch`     | Build en modo watch (desarrollo, reconstruye al cambiar)       |
| `lint`          | `npm run lint`      | Ejecuta ESLint en todo el proyecto                             |
| `format`        | `npm run format`    | Formatea todos los archivos con Prettier                       |

---

## Variables de entorno

Los archivos de entorno (`src/environments/`) están excluidos del repositorio (`.gitignore`). Si el proyecto requiere configuración específica por entorno, crea los siguientes archivos localmente:

| Archivo                              | Uso                          |
| ------------------------------------ | ---------------------------- |
| `src/environments/environment.ts`    | Configuración de desarrollo  |
| `src/environments/environment.prod.ts` | Configuración de producción |

> Actualmente no se han detectado variables de entorno obligatorias en el código fuente.

---

## Estructura del proyecto

```
task-collector/
├── android/                        # Proyecto Android nativo (Capacitor)
├── src/
│   ├── app/
│   │   ├── core/                   # Lógica de negocio central
│   │   │   ├── consts/             # Constantes de configuración (rareza, shiny)
│   │   │   ├── models/             # Interfaces y tipos de datos (task, item, collection…)
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
│   │   │   └── migrations/         # Migraciones SQL numeradas (001_*.sql …)
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
Models → Repositories → Services → Features (Pages)
                                        ↑
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

## Testing

> ⚠️ **No hay framework de testing configurado actualmente.** La generación de tests está deshabilitada en `angular.json` (`"skipTests": true`).

Si en el futuro se configura un framework de tests, el comando estándar sería:

```bash
npm run test
```

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

## Checklist de verificación

- [x] Dependencias instaladas (`npm install`)
- [x] Proyecto inicia con `npm run start` / `ionic serve`
- [ ] Variables de entorno configuradas (si aplica)
- [x] Build generado correctamente (`npm run build`)
- [x] Sin errores de lint (`npm run lint`)
- [ ] Aplicación ejecuta en dispositivo Android (`npx cap run android`)

---

## Contribuidores

| Contribuidor                  | Commits | Perfil                                              |
| ----------------------------- | ------- | --------------------------------------------------- |
| David Pérez                   | 1       | [DavidPerez-2357](https://github.com/DavidPerez-2357) |
| copilot-swe-agent[bot]        | 1       | GitHub Copilot SWE Agent                            |

---

## Roadmap

- [ ] Soporte offline completo (sincronización diferida)
- [ ] Tests unitarios e2e (configuración de Karma/Jest)
- [ ] Soporte para plataforma iOS
- [ ] Publicación en Google Play Store
- [ ] Notificaciones push para recordar tareas
- [ ] Sistema de logros y trofeos
- [ ] Optimización de rendimiento y animaciones
- [ ] Modo oscuro / temas personalizables
- [ ] Sincronización en la nube (backup de datos)

---

## Contribución

1. Haz un fork del repositorio.
2. Crea una rama con el prefijo adecuado:
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
6. Abre un Pull Request describiendo los cambios.

> Los mensajes de commit deben seguir el estilo **gitmoji**: `✨ Descripción breve en imperativo`.

---

## Licencia

No especificado. Consulta con el autor del repositorio para más información.
