# 🍽️ Menú Digital Administrable con Netlify Functions + Netlify Blobs

Aplicación web profesional full-stack diseñada para restaurantes, cafeterías, bares y taquerías. Proporciona una interfaz pública optimizada para dispositivos móviles (accesible mediante código QR) y un panel de administración privado y seguro que permite gestionar platillos, fotografías, categorías, precios y datos del restaurante en tiempo real **sin bases de datos externas ni necesidad de redesplegar el sitio**.

---

## 🚀 Características Principales

### 📱 Para los Clientes (Menú Público)
- **Diseño Mobile-First ultrarrápido:** Adaptable a celulares, tabletas y computadoras.
- **Acceso por Código QR:** Carga instantánea con caché perimetral (Edge Cache) inteligente.
- **Identidad del Restaurante:** Logotipo, fotografía de portada, horario, dirección y estado en vivo (*Abierto* / *Cerrado*).
- **Botón directo de WhatsApp:** Permite a los comensales iniciar un pedido con un solo toque y mensaje prellenado.
- **Buscador en tiempo real:** Filtra por nombre de platillo o ingredientes.
- **Pestañas de Categorías:** Barra de navegación horizontal deslizable con contador de platillos.
- **Tarjetas de Platillos:** Fotografías nítidas, descripción, distintivos (*Promoción*, *Favorito*, *Más vendido*, *Nuevo*, *Agotado*) y precios en formato **Pesos Mexicanos (MXN)**.
- **Modal de Detalle:** Vista ampliada de ingredientes y botón de pedido específico para ese platillo.

### 🔐 Para el Administrador (Panel Privado)
- **Acceso protegido por PIN/Contraseña:** Validación en servidor con protección contra ataques de fuerza bruta (*Rate Limiting*) y comparación en tiempo constante (*Timing-Safe*).
- **Dashboard con KPIs en vivo:** Métricas de platillos totales, categorías, productos disponibles, agotados y fecha de última modificación.
- **Gestión completa de Productos (CRUD):** Crear, editar, cambiar precios, descripción, categoría, disponibilidad y orden de visualización.
- **Gestión de Fotografías con Netlify Blobs:**
  - Selector de archivos y captura directa con la cámara del celular (`capture="environment"`).
  - Compresión y redimensionamiento automático en el navegador a **WebP** antes de la subida.
  - Validación de tipo MIME y *Magic Bytes* en backend (solo imágenes auténticas JPEG, PNG, WebP).
  - Almacenamiento binario persistente en store `menu_images` de Netlify Blobs.
  - Eliminación segura de fotos huérfanas sin borrar imágenes utilizadas por otros productos.
- **Gestión de Categorías:** Creación, edición, activación/desactivación y eliminación protegida (impide borrar categorías que contengan platillos asignados).
- **Configuración del Restaurante:** Nombre comercial, logotipo, portada, número de WhatsApp, horarios, mensaje de negocio cerrado y color de acento del menú.
- **Actualización Inmediata:** Los cambios guardados se reflejan inmediatamente en la vista pública de los comensales sin redesplegar.

---

## 🛠️ Arquitectura Tecnológica

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons.
- **Backend Serverless:** Netlify Functions (Node.js ES Modules).
- **Persistencia de Datos y Archivos:** Netlify Blobs (`@netlify/blobs`).
- **Seguridad:** Tokens firmados con HMAC SHA-256, Cookies `HttpOnly`, `SameSite=Lax`, Rate Limiter por IP.
- **Sin dependencias externas:** 0 Firebase, 0 Supabase, 0 MongoDB, 0 AWS S3. Todo dentro del ecosistema de Netlify.

---

## 📂 Estructura del Proyecto

```text
menu-digital-netlify/
├── netlify/
│   └── functions/
│       ├── menu.js              # GET: Menú público con caché edge
│       ├── menu-image.js        # GET: Entrega de imágenes binarias persistidas
│       ├── admin-auth.js        # POST: Login con rate limiting / GET: validación
│       ├── admin-logout.js      # POST: Invalida cookies de sesión
│       ├── admin-products.js    # GET, POST, PUT, DELETE: Gestión de platillos
│       ├── admin-categories.js  # GET, POST, PUT, DELETE: Gestión de categorías
│       ├── admin-images.js      # POST, DELETE: Carga y depuración de fotos
│       ├── admin-settings.js    # GET, PUT: Configuración general
│       └── utils/
│           ├── auth.js          # Helpers de seguridad, JWT HMAC, rate limit
│           ├── blobStore.js     # Capa unificada Netlify Blobs + fallback local
│           └── seedData.js      # Datos iniciales auténticos para restaurantes
├── src/
│   ├── components/
│   │   ├── menu/                # Componentes vista cliente (Header, Card, Nav, Footer)
│   │   ├── admin/               # Componentes panel (Navbar, Modales)
│   │   └── shared/              # Badge, Modal genérico, ConfirmDialog
│   ├── pages/
│   │   ├── PublicMenu.jsx       # Menú público principal
│   │   ├── AdminLogin.jsx       # Acceso seguro
│   │   ├── AdminDashboard.jsx   # Resumen de KPIs
│   │   ├── ProductsManager.jsx  # Administración de platillos
│   │   ├── CategoriesManager.jsx# Administración de categorías
│   │   └── RestaurantSettings.jsx# Datos y redes del restaurante
│   ├── services/
│   │   ├── menuService.js       # Consumo del menú público
│   │   ├── adminService.js      # Consumo de endpoints administrativos
│   │   └── imageService.js      # Compresión canvas y subida a Blobs
│   ├── styles/
│   │   └── index.css            # Tailwind base y utilidades
│   ├── utils/
│   │   └── formatters.js        # Moneda MXN ($129.00 MXN) y fechas
│   ├── App.jsx                  # Enrutador principal y sincronización reactiva
│   └── main.jsx                 # Entrada React
├── netlify.toml                 # Configuración de build, funciones y redirecciones
├── tailwind.config.js
├── vite.config.js               # Middleware integrado para emular functions en 'npm run dev'
├── package.json
└── README.md
```

---

## ⚙️ Variables de Entorno

Configura estas variables en tu archivo `.env` local o en el panel de Netlify (**Site configuration > Environment variables**):

| Variable | Descripción | Valor por Defecto / Ejemplo |
| :--- | :--- | :--- |
| `ADMIN_PASSWORD` | Contraseña o PIN de acceso al panel administrativo | `MiRestauranteSeguro2026!` |
| `ADMIN_JWT_SECRET` | Clave secreta para firmar tokens HMAC SHA-256 | `super_secreto_para_firma_de_sesiones_admin_987654321` |
| `SESSION_DURATION_SECONDS` | Tiempo de vida de la sesión de administrador | `86400` (24 horas) |

---

## 💻 Instalación y Desarrollo Local

### 1. Clonar o abrir el directorio del proyecto
```powershell
cd C:\Users\antonio.castro\.gemini\antigravity\scratch\menu-digital-netlify
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Ejecutar en modo desarrollo
El proyecto incluye un middleware en `vite.config.js` que ejecuta las Netlify Functions localmente sin necesidad de configurar servidores adicionales:
```bash
npm run dev
```
Abre en tu navegador: [http://localhost:5173](http://localhost:5173)

*(Opcional: Si cuentas con Netlify CLI instalado, también puedes ejecutar `npx netlify dev` para usar el emulador nativo).*

### 4. Ejecutar Suite de Pruebas de Integración
El proyecto incluye una suite automatizada que valida los 8 endpoints, subida de imágenes, protección contra fuerza bruta y validaciones de integridad relacional:
```bash
node test-e2e.js
```

---

## 🚢 Guía de Despliegue en Netlify

### Opción A: Despliegue con Netlify CLI
1. Asegúrate de haber iniciado sesión:
   ```bash
   npx netlify login
   ```
2. Inicializa y vincula el sitio:
   ```bash
   npx netlify init
   ```
3. Configura tus variables de entorno (`ADMIN_PASSWORD`, etc.) en el panel de Netlify.
4. Despliega a producción:
   ```bash
   npx netlify deploy --prod
   ```

### Opción B: Despliegue continuo mediante Git (GitHub / GitLab)
1. Sube tu código a un repositorio Git.
2. En el panel de [Netlify](https://app.netlify.com), pulsa **Add new site** > **Import an existing project**.
3. Selecciona tu repositorio.
4. Netlify detectará automáticamente el archivo `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
5. En **Site Settings** > **Environment Variables**, añade:
   - `ADMIN_PASSWORD` = `TuClaveSegura2026!`
   - `ADMIN_JWT_SECRET` = `clave_aleatoria_larga_de_al_menos_32_caracteres`
6. ¡Listo! Netlify Blobs se activa automáticamente en tu sitio sin configuraciones adicionales.

---

## 🔒 Consideraciones de Seguridad

1. **Sin contraseñas en texto plano:** La contraseña de administración solo reside en las variables de entorno de Netlify Functions y nunca se expone al cliente React.
2. **Timing-Safe Comparison:** Las contraseñas se comparan mediante hashes SHA-256 usando `crypto.timingSafeEqual` para prevenir ataques de canal lateral por análisis de tiempo.
3. **Protección contra Fuerza Bruta:** Se bloquea temporalmente la dirección IP tras 5 intentos fallidos consecutivos durante una ventana de 15 minutos.
4. **Validación de Archivos:** Las imágenes subidas son analizadas byte a byte (cabeceras mágicas) en el backend para descartar scripts maliciosos, ejecutables o archivos no permitidos.
5. **Control de Concurrencia:** Los identificadores de platillos e imágenes son inmutables y generados mediante sellos de tiempo y entropía criptográfica (`crypto.randomBytes`).
