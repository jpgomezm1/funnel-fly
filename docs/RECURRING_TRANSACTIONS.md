# Sistema de Transacciones Recurrentes

Este documento describe el sistema automatizado para procesar transacciones recurrentes en el módulo de Finance.

## Resumen

El sistema procesa automáticamente las transacciones recurrentes (gastos e ingresos) que no tienen fecha de fin, generando las transacciones correspondientes para cada período.

## Componentes

### 1. Función SQL: `process_recurring_transactions`

**Ubicación:** `supabase/migrations/20251202_process_recurring_transactions.sql`

Esta función:
- Busca todas las transacciones marcadas como recurrentes (`is_recurring = true`)
- Verifica si ya existe una transacción para el mes objetivo
- Si no existe, crea una nueva transacción vinculada al padre

**Uso:**
```sql
-- Procesar mes actual
SELECT * FROM process_recurring_transactions();

-- Procesar un mes específico
SELECT * FROM process_recurring_transactions(2025, 12);
```

**Retorna:**
- `transactions_created`: Número de transacciones creadas
- `transactions_processed`: Número de transacciones recurrentes revisadas
- `details`: JSON con detalles de las transacciones creadas

### 2. Edge Function: `process-recurring-transactions`

**Ubicación:** `supabase/functions/process-recurring-transactions/index.ts`

Endpoint HTTP para ejecutar el procesamiento, útil para:
- Llamadas desde cron externos (GitHub Actions, cron-job.org)
- Ejecución manual vía API

**Endpoints:**
```bash
# POST con body opcional
POST /functions/v1/process-recurring-transactions

# Body opcional:
{
  "year": 2025,
  "month": 12,
  "triggered_by": "manual"
}
```

**Headers requeridos:**
- `Authorization: Bearer <CRON_SECRET>` o token de Supabase

### 3. Configuración pg_cron (Supabase Pro)

**Ubicación:** `supabase/migrations/20251202_setup_recurring_cron.sql`

Si tienes Supabase Pro, los cron jobs se ejecutan automáticamente:

| Job | Horario | Descripción |
|-----|---------|-------------|
| `process-recurring-mid-month` | Día 15, 6:00 UTC | Procesamiento a mitad de mes |
| `process-recurring-end-month` | Día 28, 6:00 UTC | Procesamiento a fin de mes |
| `process-recurring-start-month` | Día 1, 6:00 UTC | Catch-up del mes anterior |

### 4. GitHub Actions (Alternativa gratuita)

**Ubicación:** `.github/workflows/process-recurring-transactions.yml`

Si NO tienes Supabase Pro, usa GitHub Actions:

**Configuración requerida (Repository Secrets):**
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `CRON_SECRET`: Token secreto para autenticación

**Horarios:**
- Día 15 de cada mes a las 6:00 UTC
- Día 28 de cada mes a las 6:00 UTC
- Día 1 de cada mes a las 6:00 UTC (catch-up)

### 5. Botón Manual en Dashboard

En el Finance Dashboard hay un botón "Procesar Recurrentes" que permite:
- Ejecutar el procesamiento manualmente
- Procesar el mes/año seleccionado en los filtros
- Ver resultados inmediatos

## Tabla de Log

Todas las ejecuciones se registran en `recurring_transactions_log`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único |
| `executed_at` | TIMESTAMPTZ | Fecha/hora de ejecución |
| `target_year` | INT | Año procesado |
| `target_month` | INT | Mes procesado |
| `transactions_created` | INT | Transacciones creadas |
| `transactions_processed` | INT | Transacciones revisadas |
| `details` | JSONB | Detalles de creación |
| `triggered_by` | TEXT | Origen (manual_ui, pg_cron, github_actions) |

## Instalación

### Paso 1: Ejecutar migraciones

```bash
npx supabase db push
```

O aplicar manualmente los scripts SQL en el orden:
1. `20251202_process_recurring_transactions.sql`
2. `20251202_setup_recurring_cron.sql` (solo si tienes Pro)

### Paso 2: Desplegar Edge Function

```bash
npx supabase functions deploy process-recurring-transactions
```

### Paso 3: Configurar secretos

```bash
# Crear un secreto para autenticación
npx supabase secrets set CRON_SECRET=tu_secreto_seguro
```

### Paso 4 (Opcional): Configurar GitHub Actions

Si usas GitHub Actions:
1. Ve a Settings > Secrets and variables > Actions
2. Agrega:
   - `SUPABASE_URL`: `https://tu-proyecto.supabase.co`
   - `CRON_SECRET`: El mismo secreto del paso 3

## Flujo de Datos

```
┌─────────────────────┐
│  Transacción        │
│  Recurrente Padre   │
│  (is_recurring=true)│
│  (sin end_date)     │
└─────────┬───────────┘
          │
          │ Cron (15/28/1 de cada mes)
          ▼
┌─────────────────────┐
│ process_recurring   │
│ _transactions()     │
└─────────┬───────────┘
          │
          │ ¿Existe para este mes?
          ▼
    ┌─────┴─────┐
    │    NO     │──────────────┐
    └───────────┘              │
                               ▼
                    ┌─────────────────────┐
                    │  Nueva Transacción  │
                    │  (parent_id = padre)│
                    │  (created_by=cron)  │
                    └─────────────────────┘
```

## Troubleshooting

### Las transacciones no se crean

1. Verifica que la transacción padre tenga:
   - `is_recurring = true`
   - `recurring_day` configurado (1-28)
   - `parent_transaction_id = NULL` (es padre, no hija)

2. Revisa el log:
```sql
SELECT * FROM recurring_transactions_log
ORDER BY executed_at DESC
LIMIT 10;
```

### Error de permisos en pg_cron

pg_cron requiere Supabase Pro. Si tienes Free tier, usa GitHub Actions.

### La Edge Function falla

Verifica:
1. Que el secreto `CRON_SECRET` esté configurado
2. Que la función esté desplegada: `npx supabase functions list`
