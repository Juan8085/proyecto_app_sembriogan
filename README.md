# Proyecto Sembriogan

Bienvenido al monorepo del ecosistema Sembriogan. Este repositorio centraliza todos los servicios, aplicaciones y páginas relacionadas con la plataforma. Utilizamos **NPM Workspaces** para orquestar las dependencias e integraciones de todos los submódulos.

## Arquitectura de Módulos

El proyecto está dividido en las siguientes aplicaciones independientes:

- **`backend-api`**: Lógica de negocio central, API REST/GraphQL y conexión con la base de datos.
- **`frontend-sembriogan`**: Aplicación web principal para el usuario final.
- **`panel-administrativo`**: Dashboard interno para la gestión, control de usuarios y reportería.
- **`app-veterinario`**: Aplicación dedicada a los profesionales veterinarios.
- **`pagina-publica`**: Sitio web informativo y portal de entrada al sistema.
- **`landing-icomer`**: Landing page especializada para campañas comerciales / e-commerce.

## Requisitos Previos

- **Node.js** (v18 o superior recomendado)
- **NPM** (v8 o superior recomendado)

## Configuración Inicial

Para instalar todas las dependencias de todos los proyectos a la vez, desde la raíz ejecuta:

```bash
npm install
```

## Comandos Disponibles

Gracias a NPM Workspaces, puedes ejecutar scripts en todos los proyectos que lo soporten con un solo comando:

- `npm run dev`: Inicia los servidores de desarrollo de todas las aplicaciones.
- `npm run build`: Genera las versiones de producción.
- `npm run lint`: Ejecuta el linter en los submódulos.
- `npm run format`: Aplica el formato de Prettier a todo el código usando las reglas definidas en `.prettierrc`.

Si necesitas ejecutar un comando en un módulo específico:

```bash
npm run dev --workspace=backend-api
```

## Estándares de Código

- Usamos **Prettier** para formateo automático en la raíz del proyecto.
- Se recomienda configurar el editor de texto (VS Code) para formatear al guardar (_Format on Save_).
