-- ════════════════════════════════════════════════════════════════════════════
--  TicketFlow · Sistema de gestión y reserva de eventos y espectáculos
--  Estructura de la base de datos (DDL) — PostgreSQL
--  Se basa en el Modelo Entidad–Relación del equipo y en el enunciado
--  del Proyecto Integrador 2026-2.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Ubicación geográfica ──────────────────────────────────────────────────
-- País 1:N Departamento 1:N Ciudad

CREATE TABLE pais (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE departamento (
    id       SERIAL PRIMARY KEY,
    nombre   VARCHAR(80) NOT NULL,
    pais_id  INTEGER NOT NULL REFERENCES pais (id),
    UNIQUE (pais_id, nombre)
);

CREATE TABLE ciudad (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(80) NOT NULL,
    departamento_id  INTEGER NOT NULL REFERENCES departamento (id),
    UNIQUE (departamento_id, nombre)
);

-- ── 2. Catálogos de estados ──────────────────────────────────────────────────

CREATE TABLE estado_evento (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE estado_reserva (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(30) NOT NULL UNIQUE

);

-- ── 3. Personas y sus especializaciones (ES UNA) ─────────────────────────────
-- Persona se especializa en Cliente, Agente o Administrador. Cada tabla hija
-- usa como llave primaria la misma identificación de la persona.

CREATE TABLE persona (
    identificacion   VARCHAR(20)  PRIMARY KEY,           -- cédula o pasaporte
    nombre_completo  VARCHAR(120) NOT NULL,
    correo           VARCHAR(120) NOT NULL UNIQUE,
    contrasena       VARCHAR(255) NOT NULL,              -- se guarda cifrada (hash)
    direccion        VARCHAR(160),
    ciudad_id        INTEGER NOT NULL REFERENCES ciudad (id)   -- "Vive"
);

-- Atributo multivalorado: una persona puede tener varios teléfonos
CREATE TABLE telefono_persona (
    id          SERIAL PRIMARY KEY,
    persona_id  VARCHAR(20) NOT NULL REFERENCES persona (identificacion) ON DELETE CASCADE,
    telefono    VARCHAR(25) NOT NULL,
    UNIQUE (persona_id, telefono)
);

CREATE TABLE cliente (
    persona_id  VARCHAR(20) PRIMARY KEY REFERENCES persona (identificacion) ON DELETE CASCADE,
    puntos      INTEGER NOT NULL DEFAULT 0 CHECK (puntos >= 0),
    publicidad  BOOLEAN NOT NULL DEFAULT TRUE            -- visualiza publicidad
);

CREATE TABLE agente (
    persona_id   VARCHAR(20) PRIMARY KEY REFERENCES persona (identificacion) ON DELETE CASCADE,
    comision     NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (comision BETWEEN 0 AND 100),  -- porcentaje
    experiencia  INTEGER NOT NULL DEFAULT 0 CHECK (experiencia >= 0)                   -- años
);

CREATE TABLE administrador (
    persona_id  VARCHAR(20) PRIMARY KEY REFERENCES persona (identificacion) ON DELETE CASCADE,
    salario     NUMERIC(12, 2) NOT NULL CHECK (salario >= 0),
    horario     VARCHAR(60)
);

-- ── 4. Eventos ───────────────────────────────────────────────────────────────
-- Un agente CREA muchos eventos; un evento está UBICADO en una ciudad y TIENE
-- un estado.

CREATE TABLE evento (
    id                 SERIAL PRIMARY KEY,
    codigo             VARCHAR(20)  NOT NULL UNIQUE,        -- código único de evento (EVT-001)
    nombre             VARCHAR(150) NOT NULL,
    descripcion        TEXT,
    teatro             VARCHAR(120) NOT NULL,
    capacidad          INTEGER NOT NULL CHECK (capacidad > 0),
    precio_base        NUMERIC(12, 2) NOT NULL CHECK (precio_base >= 0),
    fecha_hora_inicio  TIMESTAMP NOT NULL,
    fecha_hora_fin     TIMESTAMP NOT NULL,
    observacion        TEXT,
    imagen             TEXT,                               -- id de foto o imagen subida (base64)
    ciudad_id          INTEGER NOT NULL REFERENCES ciudad (id),            -- "Ubicado"
    estado_evento_id   INTEGER NOT NULL REFERENCES estado_evento (id),     -- "Tiene"
    agente_id          VARCHAR(20) NOT NULL REFERENCES agente (persona_id),  -- "Crea"
    CHECK (fecha_hora_fin > fecha_hora_inicio)
);

-- ── 5. Reservas ──────────────────────────────────────────────────────────────
-- Un cliente REALIZA muchas reservas; cada reserva está ASOCIADA a un evento
-- y POSEE un estado.

CREATE TABLE reserva (
    id                 SERIAL PRIMARY KEY,
    fecha_hora         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    num_entradas       INTEGER NOT NULL CHECK (num_entradas > 0),
    total              NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    observacion        TEXT,
    cliente_id         VARCHAR(20) NOT NULL REFERENCES cliente (persona_id),   -- "Realiza"
    evento_id          INTEGER NOT NULL REFERENCES evento (id),                -- "Asociado"
    estado_reserva_id  INTEGER NOT NULL REFERENCES estado_reserva (id),        -- "Posee"
    stripe_session_id  TEXT,                                                   -- pago en Stripe (Checkout)
    fecha_pago         TIMESTAMP                                               -- cuándo se confirmó el pago
);

-- ── 6. Índices para las consultas más frecuentes ─────────────────────────────

CREATE INDEX idx_persona_ciudad   ON persona (ciudad_id);
CREATE INDEX idx_evento_ciudad    ON evento (ciudad_id);
CREATE INDEX idx_evento_agente    ON evento (agente_id);
CREATE INDEX idx_evento_estado    ON evento (estado_evento_id);
CREATE INDEX idx_reserva_cliente  ON reserva (cliente_id);
CREATE INDEX idx_reserva_evento   ON reserva (evento_id);
CREATE INDEX idx_reserva_stripe   ON reserva (stripe_session_id);
CREATE INDEX idx_reserva_estado   ON reserva (estado_reserva_id);

-- ── 7. Datos de referencia (catálogos) ───────────────────────────────────────

INSERT INTO estado_evento (nombre) VALUES
    ('Programado'), ('En Boletería'), ('En Vivo'), ('Finalizado'), ('Cancelado');

INSERT INTO estado_reserva (nombre) VALUES
    ('Reservada'), ('Confirmada'), ('Cancelada');

INSERT INTO pais (nombre) VALUES ('Colombia');

INSERT INTO departamento (nombre, pais_id)
    SELECT d.nombre, p.id FROM pais p,
    (SELECT 'Cundinamarca' AS nombre UNION ALL SELECT 'Antioquia' UNION ALL SELECT 'Valle del Cauca') d
    WHERE p.nombre = 'Colombia';

INSERT INTO ciudad (nombre, departamento_id)
    SELECT c.nombre, dep.id FROM departamento dep
    JOIN (SELECT 'Bogotá' AS nombre, 'Cundinamarca' AS departamento
          UNION ALL SELECT 'Medellín', 'Antioquia'
          UNION ALL SELECT 'Cali', 'Valle del Cauca') c
      ON c.departamento = dep.nombre;