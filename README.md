# TicketFlow

Plataforma web de boletería digital: explorar eventos, reservar entradas y gestionar toda la operación desde tres perfiles distintos (Cliente, Agente, Administrador).

**Proyecto Integrador — Programación en Ambiente Web I**

## Tecnologías

React 19 + TypeScript + Vite + Tailwind CSS

## Cómo correrlo

1. Instalar [Node.js](https://nodejs.org/) (versión LTS).
2. En la carpeta del proyecto:
   npm install
   npm run dev

3. Abrir la URL que muestra la terminal (normalmente `http://localhost:8443`).

## Cuentas de prueba

  | Rol  | Correo | Contraseña |
  |  ---  |   ---   |   ---   |
| Administrador | admin@ticketflow.com | admin123 |
| Cliente / Agente | Crear una cuenta desde "Registrarse", eligiendo el tipo |

## Importante

Los datos (usuarios, eventos, reservas) viven **solo en memoria del navegador** — al recargar la página se reinician. Todavía no hay conexión a una base de datos real.

## Estructura del proyecto

Organizado con un patrón inspirado en MVC:
src/
├── models/ → tipos de datos y datos de ejemplo
├── views/ → componentes reutilizables y layouts
├── controllers/ → páginas y navegación (App.tsx)
└── utils/ → funciones de ayuda (formato, colores)


## Historial de desarrollo

El proyecto se construyó en 6 ramas sucesivas,se pueden revisar en el historial de commits de `main` para ver la evolución paso a paso:

1. Login, registro y validaciones
2. Reorganización de estructura (MVC) + diseño responsive
3. Vista Cliente (reservas reales, perfil editable)
4. Vista Agente (registrar/editar/eliminar eventos)
5. Dashboard Administrador (reportes con datos reales)
6. Ajustes finales (cancelar reserva, validaciones de fecha/hora)
