# Role Workflows

## Objetivo

AMP tiene que permitir que un estudio de arquitectura gestione una obra completa desde un solo sistema:

- estado real de obra
- avance, retrasos y adelantos
- costo, caja y cobranzas
- incidencias, clima y cambios
- reportes internos y portal cliente

La separación por rol no es solo visual. Cada rol debe tener:

- un espacio de trabajo propio
- datos editables limitados a su responsabilidad
- visibilidad suficiente para decidir sin depender de planillas paralelas

El perfil `operator` actúa como `Director`: puede ver y operar todos los flujos, además de usar vista simulada.

## Estado Actual

### Madurez general

- Núcleo operativo de obra: avanzado, pero pendiente de piloto real y UX móvil de campo.
- Control ejecutivo multiobra: funcional en tableros, pendiente de reportes exportables y alertas accionables.
- Finanzas por obra: avanzado en compras, mano de obra, certificados y caja, pendiente de conciliación, vencimientos y cuentas.
- Separación de roles y navegación: implementada en aplicación, pendiente de hardening completo de RLS en todos los módulos nuevos.
- Administración contractual: funcional en contratos, adendas y publicación al cliente, pendiente de documentos firmados y trazabilidad formal.

### Estado general del producto

AMP está en etapa pre-MVP avanzada. El objetivo inmediato es convertir los módulos existentes en un flujo usable de punta a punta para un estudio de arquitectura: alta de obra, baseline, ejecución diaria, control económico, reportes y portal cliente. La etapa no se considera cerrada hasta que pasen los chequeos técnicos, las políticas de seguridad estén endurecidas y al menos una obra piloto pueda operarse sin planillas paralelas.

## Roles

### Director / Operator

Responsabilidad:

- alta de obra
- asignación de PM y equipo
- visión consolidada multiobra
- control de riesgos, costos, caja y cobranzas
- auditoría de cambios
- administración de usuarios y roles
- control de publicación hacia cliente

Debe ver:

- todos los proyectos
- todos los reportes
- todos los costos e ingresos
- desviaciones por fase y por partida
- alertas de plazo, compras vencidas, cobranzas vencidas

Debe editar:

- proyecto
- equipo
- baseline
- presupuesto
- compras
- pagos
- certificados
- perfiles/roles

### PM / Jefe de Proyecto

Responsabilidad:

- estructurar la obra
- definir fases, hitos y partidas
- asignar equipo
- validar avance de campo
- controlar costo/plazo de su obra
- gestionar compras, certificados y cambios
- emitir reportes

Debe ver:

- solo sus proyectos asignados
- detalle completo de fases, partidas, hitos, incidencias, compras, MO, certificados

Debe editar:

- fases
- hitos
- partidas medibles
- avances validados
- compras
- pagos de proveedores
- certificados
- equipo del proyecto

No debería editar:

- usuarios globales
- configuración del sistema

### Inspector / Jefe de Obra

Responsabilidad:

- registrar ejecución real de campo
- parte diario
- clima
- incidencias
- avance medible
- recepción de compras
- movimientos de materiales
- carga de mano de obra en campo

Debe ver:

- solo obras asignadas
- fases, hitos, partidas y stock operativo

Debe editar:

- parte diario
- avance de campo
- estado de hitos de campo
- incidencias
- movimientos de materiales
- recepción de órdenes
- partes de mano de obra

No debería editar:

- baseline de proyecto
- presupuesto contractual
- pagos
- certificados
- usuarios

### Cliente

Responsabilidad:

- consultar estado publicado de su obra
- revisar hitos/reportes/certificados visibles
- aprobar o rechazar cambios externos

Debe ver:

- solo su obra
- solo información curada/publicada

Debe editar:

- aprobaciones de change orders

No debería ver:

- incidencias internas
- costos internos
- riesgos internos
- trabajo no validado

## Flujos de trabajo

### 1. Alta y baseline de obra

Participan:

- `operator`
- `pm`

Secuencia:

1. `operator` crea obra y asigna PM.
2. `pm` define fases.
3. `pm` define hitos por fase.
4. `pm` crea partidas medibles por fase con:
   - rubro
   - unidad
   - cantidad planificada
   - peso
   - costo unitario plan
   - horas plan por unidad
5. `pm` arma presupuesto y baseline económico.
6. `operator` revisa desvíos base, cashflow y estructura general.

Salida esperada:

- obra lista para ejecución real
- baseline de plazo
- baseline de costo
- baseline técnico por partida

### 2. Seguimiento diario de obra

Participan:

- `inspector`
- `pm`

Secuencia:

1. `inspector` registra `site_daily_log`.
2. `inspector` carga avance:
   - por `%` si la fase no tiene partidas
   - por cantidad ejecutada si la fase tiene `work_packages`
3. `inspector` carga incidencias y documentos.
4. `inspector` registra mano de obra con fase y, si aplica, partida.
5. `inspector` registra movimientos de materiales.

Salida esperada:

- dato operativo diario completo
- trazabilidad de campo
- acumulación de avance todavía no oficial

### 3. Validación y progreso oficial

Participan:

- `pm`
- `operator`

Secuencia:

1. `pm` revisa avances cargados.
2. valida entradas correctas.
3. el sistema recalcula:
   - avance de fase
   - avance de proyecto
   - estado de partidas
4. si corresponde, `pm` u `operator` publican al cliente.

Salida esperada:

- progreso oficial
- información interna separada de la visible al cliente

### 4. Compras y recepción

Participan:

- `pm`
- `inspector`
- `operator`

Secuencia:

1. `pm`/`operator` crea orden de compra.
2. asigna fase y opcionalmente partida.
3. `inspector` recepciona la orden.
4. sistema impacta stock.
5. `pm`/`operator` registra pagos parciales o totales.

Salida esperada:

- compra trazada por obra, fase y partida
- stock real
- pendiente vs pagado
- vencimientos controlados

### 5. Mano de obra y costo real

Participan:

- `inspector`
- `pm`
- `operator`

Secuencia:

1. `inspector` registra horas y tarifa por empleado.
2. asigna fase y, si aplica, partida.
3. `pm` aprueba lo que queda listo para liquidar.
4. `pm` arma lotes de liquidación.
5. `operator` registra el pago real del lote.
6. el sistema refleja costo, deuda aprobada y salida de caja.

Salida esperada:

- costo real de mano de obra
- horas reales por fase
- horas reales por partida cuando están asignadas
- liquidación administrativa trazada sin planillas paralelas

### 6. Certificación y cobranza

Participan:

- `pm`
- `operator`
- `client`

Secuencia:

1. `pm` emite certificado.
2. define visibilidad cliente.
3. registra cobros parciales/totales.
4. `operator` ve pendiente y vencido consolidado.
5. `client` ve certificados visibles y estado de cobro publicado.

Salida esperada:

- ingreso trazado por obra
- pendiente de cobro y vencidos
- caja neta real

### 7. Control ejecutivo del estudio

Participan:

- `operator`
- `pm` en su propia obra

Secuencia:

1. sistema consolida:
   - avance
   - EV
   - costo real
   - horas reales
   - clima
   - incidencias
   - compras
   - certificados
   - cobranzas
2. `operator` revisa matriz multiobra.
3. `pm` revisa desvío fino en su obra.

Salida esperada:

- tablero de decisiones del estudio

### 8. Centro de mando operativo por rol

Participan:

- `operator`
- `pm`
- `inspector`

Secuencia:

1. sistema consolida pendientes de:
   - validación
   - hitos vencidos
   - incidentes críticos/bloqueados
   - compras vencidas o por recibir
   - stock bajo
   - partes sin mano de obra asociada
   - costos en fases medibles sin partida
2. `inspector` trabaja su cola de campo.
3. `pm` trabaja su cola de validación y trazabilidad.
4. `operator` ve además su propia cola y el backlog consolidado de PM + Inspector.

Salida esperada:

- cada rol trabaja con una cola propia
- la obra deja de depender de seguimiento mental
- Dirección puede intervenir sin recorrer todas las pantallas

### 9. Gobierno contractual

Participan:

- `operator`
- `pm`

Secuencia:

1. se registra contrato base por obra
2. se cargan adendas con impacto económico y/o de plazo
3. las adendas se aprueban o rechazan con historial
4. el sistema recalcula:
   - monto contractual vigente
   - cobertura certificada
   - cobertura cobrada
   - margen proyectado
5. `operator` y `pm` cruzan contrato, forecast y caja real

Salida esperada:

- base contractual unificada con la operación
- control de adendas sin Excel paralelo
- lectura de margen contractual por obra

### 10. Liquidación administrativa de mano de obra

Participan:

- `inspector`
- `pm`
- `operator`

Secuencia:

1. `inspector` carga partes de mano de obra en estado pendiente.
2. `pm` aprueba entradas válidas y devuelve las observadas.
3. `pm` agrupa entradas aprobadas en un lote de liquidación.
4. `operator` registra el pago real del lote.
5. el sistema:
   - marca las entradas como pagadas
   - deja fecha efectiva de pago
   - refleja la salida de caja

Salida esperada:

- separación clara entre costo de campo, aprobación y pago
- trazabilidad administrativa de nómina por obra
- caja más consistente con la fecha real de egreso

### 11. Onboarding y gobierno de usuarios web

Participan:

- `operator`

Secuencia:

1. `operator` crea usuario web desde la app.
2. define rol, vínculo con empleado/cliente y estado.
3. si el rol es `pm` o `inspector`, asigna obras desde la misma pantalla.
4. el sistema crea el acceso real, completa `profiles` y sincroniza membresías de proyecto.
5. el panel de usuarios muestra desvíos administrativos:
   - internos sin empleado
   - clientes sin `client_id`
   - PM/Inspectores sin obras
   - usuarios inactivos

Salida esperada:

- alta de usuarios sin SQL manual
- trazabilidad administrativa central
- control de configuración incompleta antes de que impacte la operación

### 12. Publicación contractual al cliente

Participan:

- `pm`
- `operator`
- `client`

Secuencia:

1. `pm` crea contrato base y adendas internas.
2. `pm` envía adendas para revisión.
3. `operator` aprueba o rechaza.
4. `operator` decide qué contrato/adenda se publica al portal.
5. `client` ve solo lo publicado y aprobado.

Salida esperada:

- separación entre información contractual interna y externa
- aprobación multinivel en el carril contractual
- portal cliente sin ruido comercial no validado

## Separación de información por rol

### Director

- ve todo
- puede simular otros roles
- decide y audita

### PM

- ve y opera solo su cartera asignada
- trabaja sobre baseline, validación, control y finanzas de obra

### Inspector

- trabaja sobre ejecución, no sobre gobierno
- su información alimenta el sistema oficial, pero no la cierra por sí solo

### Cliente

- solo consume información curada
- participa en aprobaciones externas

## Mejoras futuras

Estas ya no son brechas del alcance MVP objetivo. Son ampliaciones posibles:

- certificación específica de subcontratos como dominio separado
- nómina global y costos indirectos no imputados a una sola obra
- forecast automático de fin de obra con alertas más agresivas
- automatizaciones cruzadas entre contrato, caja, productividad y riesgo
- tableros ejecutivos por unidad de negocio o cartera ampliada
