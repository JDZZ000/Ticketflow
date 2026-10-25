# Pagos con Stripe — guía para el equipo

Esta guía explica cómo funciona el pago de reservas con Stripe en TicketFlow y cómo dejarlo andando en tu computador. Todo se usa en **modo de prueba**: no se mueve dinero real y las tarjetas son de mentira.

## 1. Qué hace

- En **Mis reservas**, cada reserva en estado «Reservada» muestra el botón **💳 Pagar ahora**.
- El botón lleva a la página de pago de Stripe (Stripe Checkout). Ahí se escribe la tarjeta; **TicketFlow nunca ve los datos de la tarjeta**.
- Al terminar, Stripe devuelve a la persona a **Mis reservas** y la reserva queda **«Confirmada»**.
- Los pagos son en **pesos colombianos (COP)**.

## 2. Cómo funciona por dentro

1. La página llama a `POST /api/pagos/checkout` mandando **solo el id de la reserva**. El monto lo calcula el servidor desde la base de datos; nunca se acepta uno que venga del navegador.
2. El servidor crea la sesión de pago en Stripe y devuelve su dirección; la página redirige a esa dirección.
3. Al pagar, Stripe devuelve a `/cliente/reservas?pago=exito&session_id=...`.
4. La página llama a `POST /api/pagos/confirmar`. El servidor **le pregunta a Stripe** si ese pago se hizo de verdad y, si es así, pasa la reserva a «Confirmada» y guarda `stripe_session_id` y `fecha_pago`.
5. En paralelo, Stripe avisa por su cuenta a `POST /api/pagos/webhook`. Hace lo mismo que el paso 4, por si la persona cierra la pestaña antes de volver. Los dos caminos se pueden repetir sin problema: el segundo no cambia nada.

Una reserva solo se confirma si se cumplen **todas** estas condiciones:

- Stripe confirma que el pago está hecho.
- La reserva está en «Reservada» (una cancelada no se reactiva).
- El monto cobrado coincide exactamente con el total actual de la reserva.

Si un pago no se puede asignar (por ejemplo, la reserva se canceló o se editó mientras se pagaba), el servidor escribe en su consola un aviso que empieza por `PAGO SIN CONFIRMAR`. Hay que revisarlo y, si corresponde, **reembolsar a mano** desde el Dashboard de Stripe.

### Reglas que conviene conocer

- Solo el **cliente dueño** de la reserva puede pagarla.
- No se puede pagar una reserva «Confirmada» o «Cancelada», ni la de un evento «Cancelado» o «Finalizado».
- Las **reservas gratuitas** (total 0, como el evento de precio 0 del seed) no pasan por Stripe, porque Stripe no cobra montos en cero. No muestran el botón; las confirma el agente como siempre.
- La página de pago queda abierta 35 minutos.
- Si alguien no tiene las claves de Stripe en su `.env`, **el resto de la API funciona igual**; solo los pagos responden «Los pagos no están configurados en el servidor».

## 3. Qué archivos se tocaron

| Archivo | Qué hace |
| --- | --- |
| `backend/src/routes/pagos.js` | **Nuevo.** Crea el pago, lo confirma y recibe el aviso de Stripe |
| `backend/src/index.js` | Registra `/api/pagos` y el webhook (el webhook va **antes** de `express.json()`) |
| `backend/database/schema.sql` | Lo mismo, para crear la base desde cero |
| `backend/env.example` | Nombres de las variables de Stripe |
| `frontend/src/models/api/pagos.ts` | **Nuevo.** Llamadas del frontend a los pagos |
| `frontend/src/controllers/App.tsx` | Conecta las funciones de pago con la pantalla |
| `frontend/src/controllers/pages/client/ClientReservations.tsx` | El botón, y los avisos al volver de Stripe |

## 4. Base de datos

La tabla `reserva` tiene dos columnas nuevas:

- `stripe_session_id`: el número del pago en Stripe.
- `fecha_pago`: cuándo se confirmó el pago.

**La base compartida de Neon ya tiene estas columnas, así que no hay que hacer nada.**

> No vuelvas a ejecutar `schema.sql` ni `npm run seed` en la base compartida: `schema.sql` crea todo desde cero y daría errores, y `seed` **borra** personas, eventos y reservas.

Solo si alguien crea una base nueva y vacía, usa `schema.sql`, que ya incluye las columnas.

Si alguien tuviera una base vieja sin ellas, puede ejecutar esto **una sola vez** en el SQL Editor de Neon (se puede repetir sin problema y no borra datos):

```sql
ALTER TABLE reserva
    ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
    ADD COLUMN IF NOT EXISTS fecha_pago        TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_reserva_stripe ON reserva (stripe_session_id);
```

## 5. Dejarlo andando en tu computador

### 5.1 Trae el código y instala

Desde la raíz del proyecto, en la rama donde vayas a trabajar:

```
git fetch origin
git merge origin/main
npm run instalar
```

Si tienes cambios sin guardar, haz antes `git stash` y después `git stash pop`.

### 5.2 Tus claves de Stripe

Cada integrante usa **sus propias** claves del modo de prueba. Nunca las subas a GitHub ni las pegues en un chat grupal (si necesitas las de otra persona, pídelas por mensaje privado).

Necesitas una cuenta de Stripe. Es gratis, y para usar el modo de prueba no hace falta activarla ni dar datos bancarios. Tienes dos opciones:

- Crear la tuya en [dashboard.stripe.com/register](https://dashboard.stripe.com/register) (lo más simple), o
- Pedirle a quien armó los pagos que te invite a su entorno de prueba.

Luego:

1. Entra al [Dashboard de Stripe](https://dashboard.stripe.com/test/apikeys) con el **modo de prueba** activado.
2. Copia la **Clave secreta** (`sk_test_...`).
3. Abre tu `backend/.env` (se crea copiando `env.example`) y agrega:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:8443
```

El `whsec_...` lo consigues en el paso siguiente. Sin comillas ni espacios alrededor del `=`.

### 5.3 Instala la Stripe CLI

La Stripe CLI le reenvía a tu computador los avisos de Stripe (el webhook).

En Windows:

```
winget install Stripe.StripeCli
```

Cierra y vuelve a abrir la terminal, y luego:

```
stripe --version
stripe login
```

`stripe login` abre el navegador: inicia sesión con la cuenta de Stripe de prueba y pulsa **Permitir acceso**. Si dice que ya iniciaste sesión, pulsa `Ctrl + C` y sigue.

### 5.4 Escucha los avisos y copia el secreto

En una terminal aparte, déjalo **corriendo mientras pruebas**:

```
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:4000/api/pagos/webhook
```

(Las versiones nuevas de la CLI exigen indicar los eventos. Si el comando anterior falla, usa `--all-snapshot` en lugar de `--events ...`.)

Imprime una línea como `Ready! Your webhook signing secret is whsec_...`. Copia ese valor en `STRIPE_WEBHOOK_SECRET` de tu `.env`.

### 5.5 Arranca el proyecto

En otra terminal, desde la raíz:

```
npm run dev
```

> **Importante:** el backend solo vigila la carpeta `src`. **Cada vez que cambies el `.env`, detén `npm run dev` (`Ctrl + C`) y vuelve a correrlo.**

### 5.6 Resumen: lo que corres cada vez que trabajas

Necesitas **dos terminales abiertas a la vez**. Ya con todo configurado (secciones 5.1 a 5.4), esto es lo único que haces cada día:

| Terminal | Dónde | Comando | Para qué |
| --- | --- | --- | --- |
| **1** | Cualquier carpeta | `stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:4000/api/pagos/webhook` | Recibir los avisos de Stripe. Déjala abierta. |
| **2** | La raíz del proyecto (`Ticketflow`) | `npm run dev` | Levantar el backend y el frontend. Déjala abierta. |

Para detener todo, pulsa `Ctrl + C` en cada terminal. Si cambias el `.env`, detén y vuelve a correr **solo la terminal 2**.

## 6. Cómo probar

1. Abre `http://localhost:8443` (siempre por esa dirección; la API solo acepta esa).
2. Entra como cliente, por ejemplo `maria@ejemplo.com` / `cliente123`.
3. Ve a **Mis reservas** y pulsa **💳 Pagar ahora** en una reserva «Reservada». Si no hay ninguna, crea una desde **Eventos → Reservar**.
4. En la página de Stripe usa estos datos de prueba:

| Qué probar | Tarjeta |
| --- | --- |
| Pago aprobado | `4242 4242 4242 4242` |
| Pago rechazado | `4000 0000 0000 0002` |

Con cualquier fecha futura (por ejemplo `12/30`), cualquier CVC (`123`) y cualquier nombre y correo.

**Resultado esperado:**

- Pago aprobado: vuelves a **Mis reservas** con el aviso verde «¡Pago recibido! Tu reserva quedó confirmada.» y la reserva aparece como «Confirmada».
- En la terminal de `stripe listen` aparece `checkout.session.completed` con `[200]`.
- Pago rechazado: Stripe muestra el error y, al cancelar y volver, la reserva sigue «Reservada».
- Puedes ver los pagos de prueba en el Dashboard de Stripe, en **Pagos**.

## 7. Problemas comunes

| Qué pasa | Qué hacer |
| --- | --- |
| `Port 8443 is already in use` | Quedó otro `npm run dev` abierto. Ciérralo con `Ctrl + C` en esa terminal. Si no la encuentras, en PowerShell: `Get-NetTCPConnection -LocalPort 8443 \| Select-Object OwningProcess` y luego `Stop-Process -Id NUMERO -Force`. No cambies el puerto: la API solo acepta el 8443. |
| «Los pagos no están configurados en el servidor» | Falta `STRIPE_SECRET_KEY` en `backend/.env`, o no reiniciaste el backend después de agregarla. |
| No aparece el botón «Pagar ahora» | Esa reserva no está en «Reservada», o su total es 0 (gratuita). |
| Pagaste pero la reserva sigue «Reservada» | Mira la terminal del backend: si aparece `PAGO SIN CONFIRMAR`, el monto o el estado no coincidían. Revisa también que `stripe listen` siga corriendo. |
| `stripe listen` falla con `must specify events` | Usa el comando de la sección 5.4, con `--events ...` o con `--all-snapshot`. |
| «Webhook no válido» en la consola del backend | `STRIPE_WEBHOOK_SECRET` no es el que imprimió tu `stripe listen`, o no reiniciaste el backend. |
| VS Code marca «No se encuentra el módulo react-router-dom» | Tu rama está vieja: haz `git fetch origin`, `git merge origin/main` y `npm run instalar`. Luego `Ctrl + Shift + P` → **TypeScript: Restart TS Server**. |
| Git abre un editor raro (Vim) al hacer `merge` | Pulsa `Esc`, escribe `:wq` y pulsa `Enter`. |
| `winget` pregunta por los términos de `msstore` | Escribe `Y` (solo envía el código de tu país), o usa `winget install Stripe.StripeCli --source winget`. |

> No uses `npm audit fix` para quitar los avisos de «vulnerabilities»: puede cambiar versiones y romper el proyecto.

## 8. Lo que todavía no hace (pendiente)

- **Reembolsos:** cancelar una reserva ya pagada **no devuelve el dinero** en Stripe. Hoy se reembolsa a mano desde el Dashboard. Conviene decidir si el cliente puede cancelar reservas pagadas o si debe hacerlo el agente.
- **Confirmación sin pago:** el agente todavía puede pasar una reserva a «Confirmada» sin que se haya pagado (ya podía antes de los pagos). Si «Confirmada» debe significar «pagada», hay que restringirlo.
- **Expiración:** una reserva «Reservada» sin pagar sigue ocupando cupo hasta que alguien la cancele.
- **Correo y boleta:** no se envía correo de confirmación ni se genera boleta o QR al pagar.
- **Puntos del cliente:** el pago no suma puntos.
- **Producción:** todo esto es modo de prueba. Para dinero real harían falta claves `sk_live_`, registrar el webhook en el Dashboard de Stripe con la dirección pública del servidor, y cambiar `FRONTEND_URL` y el CORS.

## 9. Seguridad

- Las claves `sk_...` y `whsec_...` solo van en `backend/.env`. El `.gitignore` ya ignora los archivos `.env`; antes de cada commit confirma con `git status` que el `.env` **no** aparezca.
- Nunca pongas una clave de Stripe en el frontend.
- El monto de un pago siempre sale del servidor.