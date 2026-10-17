# TicketFlow

Plataforma web de boletería digital: explorar eventos, reservar entradas y gestionar toda la operación desde tres perfiles distintos (Cliente, Agente, Administrador).

**Proyecto Integrador — Programación en Ambiente Web I**

## Tecnologías

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express (API REST)
- **Base de datos:** PostgreSQL, alojada en [Neon](https://neon.com)

## Estructura del repositorio

```
Ticketflow/
├── frontend/             → la página (React)
│   └── src/
│       ├── models/       → tipos de datos y datos de ejemplo
│       ├── views/        → componentes reutilizables y layouts
│       ├── controllers/  → páginas y navegación (App.tsx)
│       └── utils/        → funciones de ayuda (formato, colores, animaciones)
└── backend/              → la API
    ├── database/
    │   └── schema.sql    → estructura de la base de datos (DDL)
    ├── env.example       → plantilla de variables de entorno
    └── src/
        ├── index.js      → servidor Express
        ├── db.js         → conexión a PostgreSQL
        ├── seed.js       → carga de datos de ejemplo
        ├── middleware/   → sesión (token) y permisos por rol
        └── routes/       → auth, catalogos, eventos, reservas, reportes, perfil
```

El frontend sigue un patrón inspirado en MVC (models / views / controllers).

## Cómo correrlo

Requisito: instalar [Node.js](https://nodejs.org/) (versión LTS). El frontend y el backend se corren cada uno en su propia terminal.

### 1. Backend

1. Entrar a la carpeta e instalar las dependencias:

   ```
   cd backend
   npm install
   ```

2. Copiar la plantilla de variables de entorno:

   ```
   copy env.example .env
   ```

3. Abrir el archivo `.env` y completar los valores:
   - `DATABASE_URL`: la cadena de conexión de la base de datos en Neon. Se pide por mensaje privado a quien creó el proyecto. **El archivo `.env` no se sube a GitHub**, porque contiene claves privadas.
   - `JWT_SECRET`: cualquier texto largo y secreto, usado para firmar los tokens de sesión.
   - `PORT`: el puerto de la API (4000 por defecto).

4. Arrancar la API:

   ```
   npm run dev
   ```

5. Comprobar que funciona abriendo `http://localhost:4000/api/salud`. Debe responder que el servidor y la base de datos están bien.

> La base de datos de Neon se apaga cuando pasa un rato sin uso, y la primera petición puede fallar mientras se despierta. Si pasa, basta con recargar la página.

### 2. Datos de ejemplo

Con la base ya creada, el siguiente comando carga el administrador, un agente, tres clientes, seis eventos y cinco reservas:

```
cd backend
npm run seed
```

**Atención:** este comando **borra** las personas, eventos y reservas que haya en la base y los vuelve a cargar. La base es compartida por todo el equipo, así que conviene avisar antes de correrlo. No toca países, departamentos, ciudades ni estados.

### 3. Frontend

```
cd frontend
npm install
npm run dev
```

Abrir la URL que muestra la terminal (normalmente `http://localhost:8443`).

### Crear la base de datos desde cero (solo si hace falta)

La estructura completa está en `backend/database/schema.sql`. Para crearla en un proyecto nuevo de Neon, se pega el contenido de ese archivo en el **SQL Editor** de Neon y se ejecuta. Después se corre `npm run seed`.

## Cuentas de ejemplo

Después de correr `npm run seed`, estas cuentas sirven para iniciar sesión en la API. Son solo de demostración.

| Rol           | Correo                | Contraseña |
| ------------- | --------------------- | ---------- |
| Administrador | admin@ticketflow.com  | admin123   |
| Agente        | agente@ticketflow.com | agente123  |
| Cliente       | maria@ejemplo.com     | cliente123 |
| Cliente       | carlos@ejemplo.com    | cliente123 |
| Cliente       | ana@ejemplo.com       | cliente123 |

Los clientes y agentes nuevos se crean desde "Registrarse", eligiendo el tipo. El administrador no se registra desde la página.

> Mientras el frontend no esté conectado a la API, la página usa sus propios datos en memoria: solo existe el administrador `admin@ticketflow.com` / `admin123`, y los clientes y agentes se crean desde "Registrarse". Esos datos se pierden al recargar la página.

## La API

Todas las rutas responden en JSON. Las que no son públicas piden el token que se recibe al iniciar sesión, en el encabezado `Authorization: Bearer <token>`.

| Área     | Ruta                                        | Quién puede usarla                         |
| -------- | ------------------------------------------- | ------------------------------------------ |
| Sesión   | `POST /api/auth/registro`                   | Público                                    |
| Sesión   | `POST /api/auth/login`                      | Público                                    |
| Ciudades | `GET /api/ciudades`                         | Público                                    |
| Eventos  | `GET /api/eventos` y `GET /api/eventos/:id` | Público                                    |
| Eventos  | `POST`, `PUT` y `DELETE /api/eventos`       | Agente                                     |
| Reservas | `POST /api/reservas`                        | Cliente                                    |
| Reservas | `GET /api/reservas/mias`                    | Cliente                                    |
| Reservas | `GET /api/reservas`                         | Agente                                     |
| Reservas | `PATCH /api/reservas/:id/estado`            | Cliente (solo cancelar las suyas) y agente |
| Perfil   | `GET` y `PUT /api/perfil`                   | Cualquier persona con sesión               |
| Reportes | `GET /api/reportes/...` (9 reportes)        | Administrador                              |
| Estado   | `GET /api/salud`                            | Público                                    |

Reglas principales:

- **Cupo:** nunca se vende más de la capacidad de un evento. La validación se hace en el servidor, dentro de una transacción con el evento bloqueado, para que dos personas no compren a la vez la última entrada. Las reservas canceladas liberan su cupo.
- **Contraseñas:** se guardan cifradas (bcrypt), nunca en texto plano.
- **Totales:** el valor de una reserva lo calcula el servidor (precio por entradas), no el navegador.
- **Reportes:** los ingresos cuentan solo las reservas confirmadas, agrupadas por la fecha de la reserva.

## Base de datos

La base tiene 12 tablas, basadas en el modelo entidad-relación del equipo:

- **Ubicación:** `pais`, `departamento` y `ciudad`.
- **Estados:** `estado_evento` y `estado_reserva`.
- **Personas:** `persona`, con sus teléfonos en `telefono_persona`, y las tres especializaciones `cliente`, `agente` y `administrador`.
- **Negocio:** `evento` y `reserva`.

La estructura completa (DDL) está en `backend/database/schema.sql`.

## Importante

El **backend** guarda todo en PostgreSQL (Neon): usuarios, eventos y reservas sobreviven a reiniciar el servidor.

El **frontend todavía no está conectado a la API**: por ahora usa sus propios datos en memoria, que se reinician al recargar la página. Conectarlo es la siguiente tarea del proyecto.

## Historial de desarrollo

El proyecto se construyó en ramas sucesivas, que se pueden revisar en el historial de commits:

1. Login, registro y validaciones
2. Reorganización de la estructura (MVC) y diseño responsive
3. Vista Cliente (reservas reales, perfil editable)
4. Vista Agente (registrar, editar y eliminar eventos)
5. Dashboard Administrador (reportes con datos reales)
6. Ajustes finales (cancelar reserva, validaciones de fecha y hora)
7. Rediseño de la Landing Page (`Rediseno-landin-page`)
8. Validación de cupo de entradas (`Validacion-cupoboletas`)
9. Colores de las gráficas del administrador (`Colores-reportes-admindashboard`)
10. Reestructura en carpetas `frontend/` y `backend/` (`Reestructura-carpetas`)
11. Backend: base de datos en Neon y API (`Backend-api`)
