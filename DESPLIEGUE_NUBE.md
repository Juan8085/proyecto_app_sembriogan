# 🚀 Guía Oficial de Despliegue en la Nube - Sembriogan

Esta guía documenta los pasos exactos para publicar el proyecto **Sembriogan** en servidores de producción en la nube (Render, Railway, Vercel, VPS o Google Cloud) para las pruebas oficiales con **SEMBRIOGAN**.

---

## 🏗️ 1. Arquitectura del Proyecto

El sistema está compuesto por tres componentes principales:
1. **`backend-api`**: Servidor Node.js Express con MongoDB Mongoose, WebSockets, JWT, pasarela Wompi y Gemini AI.
2. **`frontend-sembriogan`**: Portal web público, catálogo/tienda en línea y panel administrativo en React 19 + Vite + TailwindCSS.
3. **`app-veterinario-mobile`**: Aplicación móvil para médicos veterinarios en Expo SDK 58 (React Native) con geolocalización satelital GPS y modo offline.

---

## 🗄️ 2. Base de Datos en la Nube (MongoDB Atlas)

1. Ingresa a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Asegúrate de que el clúster `Sembriogan` tenga habilitada la lista blanca de IPs:
   - En **Network Access**, agrega la IP `0.0.0.0/0` (Permitir acceso desde cualquier servicio en la nube).
3. Obtén la cadena de conexión URI:
   ```env
   mongodb+srv://<usuario>:<password>@sembriogan.9mpvmz4.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 🌐 3. Despliegue del Backend en la Nube (Ejemplo: Render o Railway)

### Opción A: Despliegue en Render (Recomendado)
1. Crea una cuenta en [Render.com](https://render.com/).
2. Haz clic en **New +** ➔ **Web Service**.
3. Conecta tu repositorio de GitHub: `Juan8085/proyecto_app_sembriogan`.
4. Configura los parámetros:
   - **Name**: `sembriogan-api`
   - **Root Directory**: `backend-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. En la sección **Environment Variables**, agrega las variables (ver `backend-api/.env.example`):
   - `PORT`: `3000` (Render asignará su propio puerto automáticamente).
   - `MONGODB_URI`: Tu enlace de MongoDB Atlas.
   - `JWT_SECRET`: `FirmaSecretaSembriogan2026` (o tu clave privada).
   - `GOOGLE_CLIENT_ID`: Tu cliente OAuth de Google.
   - `GEMINI_API_KEY`: Tu clave de Google AI Studio.
   - `VAPID_PUBLIC_KEY`: Clave pública VAPID.
   - `VAPID_PRIVATE_KEY`: Clave privada VAPID.
   - `VAPID_SUBJECT`: `mailto:contactenos.technoboys@gmail.com`
6. Haz clic en **Deploy Web Service**. Render te entregará una URL pública HTTPS como:
   `https://sembriogan-api.onrender.com`

---

## 💻 4. Despliegue del Frontend Web

### Opción A: Despliegue en Vercel (Recomendado por velocidad CDN)
1. Ingresa a [Vercel.com](https://vercel.com/) e inicia sesión con tu GitHub.
2. Haz clic en **Add New Project** y selecciona `proyecto_app_sembriogan`.
3. Configuración del proyecto:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend-sembriogan`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. En **Environment Variables**:
   - `VITE_API_URL`: La URL de tu backend en Render (ej: `https://sembriogan-api.onrender.com`).
   - `VITE_GOOGLE_CLIENT_ID`: Tu cliente OAuth de Google.
5. Haz clic en **Deploy**. Vercel te dará una URL HTTPS como:
   `https://sembriogan.vercel.app`

### Opción B: Despliegue Fullstack Unificado en el Backend
El backend ya está programado para servir automáticamente los archivos estáticos de `frontend-sembriogan/dist` si compilas antes de iniciar (`npm run build:frontend`). De este modo, ambos corren en el mismo dominio sin costo adicional.

---

## 📱 5. Compilación y Despliegue de la App Móvil (Expo EAS)

La app móvil está optimizada en **Expo SDK 58**.

### Probar en Campo con Expo Go:
1. Inicia Metro:
   ```bash
   cd app-veterinario-mobile
   npx expo start -c
   ```
2. Escanea el código QR desde el celular con la app **Expo Go** (Android o iOS).
3. Si estás fuera de la red local, en la pantalla de Login toca **"Cambiar Servidor"** y coloca la URL del backend en la nube (ej: `https://sembriogan-api.onrender.com`).

### Generar APK Instalable para Android (EAS Build):
1. Instala la herramienta de Expo Application Services:
   ```bash
   npm install -g eas-cli
   ```
2. Inicia sesión en Expo:
   ```bash
   eas login
   ```
3. Configura el proyecto móvil:
   ```bash
   cd app-veterinario-mobile
   eas build:configure
   ```
4. Genera el archivo APK directo para instalar en cualquier teléfono Android:
   ```bash
   eas build -p android --profile preview
   ```
5. Al terminar la compilación en la nube de Expo, te dará un enlace directo para descargar el instalador `.apk`.

---

## 💳 6. Pasarela de Pagos (Wompi) y Asistente IA (Gemini)

- **Wompi**: En el panel administrativo de Sembriogan (`/admin` ➔ pestaña Configuración), puedes ingresar las llaves de producción (`pub_prod_...`, `prv_prod_...`, `prod_integrity_...`) cuando la cuenta comercial de SEMBRIOGAN sea activada por Bancolombia.
- **Asistente IA**: En `backend-api/.env`, coloca la clave `GEMINI_API_KEY` generada gratuitamente en [Google AI Studio](https://aistudio.google.com/). El sistema ya cuenta con respuestas clínicas y comerciales automáticas en caso de operar sin conexión.

---

## ✅ Resumen de Pruebas Realizadas antes de Subir
- [x] Syntax check exitoso en todos los archivos del backend con `node --check`.
- [x] Compilación exitosa del bundle de producción de Vite en `frontend-sembriogan/dist`.
- [x] Corrección de ruta de modelo Gemini AI (`gemini-1.5-flash`).
- [x] Protección de claves VAPID y web-push ante variables ausentes.
- [x] Normalización de correos electrónicos (`toLowerCase()` y `trim()`) en login tradicional y Google.
- [x] Eliminación de puertos quemados (`:3000`) en llamadas de firmas de pago.
- [x] Emisión unificada de eventos WebSocket para actualización de fincas satelitales en tiempo real.
- [x] Sesiones de 30 días para App Móvil y Web, con persistencia offline ante pérdida de señal en fincas.
