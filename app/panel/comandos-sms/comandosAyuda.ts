/**
 * Ayuda didáctica de los comandos SMS.
 *
 * El operador que manda el comando muchas veces no sabe qué significa la
 * respuesta del GPS. Por cada comando se explica: para qué sirve, qué devuelve
 * el equipo, un ejemplo de respuesta y cómo leer cada campo.
 *
 * Los ejemplos son respuestas típicas: el texto exacto cambia según el modelo
 * y la versión de firmware del GPS.
 */

export interface AyudaComando {
  paraQue: string;
  queResponde: string;
  ejemplo?: string;
  lectura?: { campo: string; significado: string }[];
  ojo?: string;
}

// ---------------------------------------------------------------------------
// TELTONIKA
// ---------------------------------------------------------------------------

const AYUDA_TELTONIKA: Record<string, AyudaComando> = {
  t_getinfo: {
    paraQue:
      "Es la radiografía del equipo: desde cuándo está prendido, cuántas veces se reinició, cuántas posiciones mandó y con cuánto voltaje trabaja. Es el primer comando para saber si una unidad está sana.",
    queResponde: "Una sola línea con varios campos separados por espacios.",
    ejemplo:
      "INI:2026/10/19 8:02 RTC:2026/10/19 14:35 RST:3 ERR:0 SR:1542 BR:0 CF:0 FG:0 FL:0 UT:0 P:12750 SMS:12 NOGPS:0:05 GPS:3 SAT:9 RS:5 MD:4",
    lectura: [
      { campo: "INI", significado: "Fecha y hora en que el equipo arrancó por última vez." },
      { campo: "RTC", significado: "Hora actual del GPS. Si está desfasada, reporta posiciones con hora equivocada." },
      { campo: "RST", significado: "Cuántas veces se reinició. Un número que sube solo = falso contacto o alimentación floja." },
      { campo: "SR", significado: "Registros enviados al servidor. Si no sube, no está reportando." },
      { campo: "BR / CF / FG", significado: "Registros dañados, conexiones fallidas y fallas de GPRS. Si crecen, el APN o la señal andan mal." },
      { campo: "P", significado: "Voltaje de alimentación en milivoltios: 12750 = 12.75 V." },
      { campo: "SAT", significado: "Satélites a la vista. Menos de 4 y no puede dar posición." },
      { campo: "GPS", significado: "Estado del GPS. 3 = navegando con posición buena." },
      { campo: "NOGPS", significado: "Cuánto tiempo lleva sin señal GPS (horas:minutos)." },
    ],
    ojo: "Los campos varían un poco según la versión de firmware.",
  },

  t_getver: {
    paraQue:
      "Saber qué firmware tiene el equipo y confirmar su IMEI. Útil antes de pedir soporte o cuando dudas de qué modelo está instalado.",
    queResponde: "Versión de firmware, modelo, IMEI y hora de inicio.",
    ejemplo: "Ver:03.27.07 Rev:30 GPS:AXN_5.1.6 Hw:FMB920 Mod:12 IMEI:352093085123456 Init:2026/10/19 8:02",
    lectura: [
      { campo: "Ver", significado: "Versión de firmware del equipo." },
      { campo: "Hw", significado: "Modelo físico: FMB920, FMB120, FMC920..." },
      { campo: "IMEI", significado: "Identificador único. Es el que debe estar registrado en Traccar." },
    ],
  },

  t_getstatus: {
    paraQue:
      "Saber si el equipo está conectado al servidor y con qué señal. Es el comando para cuando la unidad 'no reporta' y hay que ver dónde se cortó la cadena.",
    queResponde: "Estado del módem, del enlace de datos y de la SIM.",
    ejemplo:
      "Data Link: 1 GPRS: 1 Phone: 0 SIM: OK OP: 71610 Signal: 4 NewSMS: 0 Roaming: 0 SMSFull: 0 LAC: 12345 Cell ID: 6789",
    lectura: [
      { campo: "Data Link", significado: "1 = conectado al servidor. Si es 0, el equipo no está mandando posiciones." },
      { campo: "GPRS", significado: "1 = tiene datos. Si es 0, revisa APN o saldo de la SIM." },
      { campo: "SIM", significado: "OK = la SIM responde. Si dice otra cosa, el chip está mal puesto o bloqueado por PIN." },
      { campo: "OP", significado: "Código del operador: 71610 Claro, 71606 Movistar, 71617 Entel, 71615 Bitel." },
      { campo: "Signal", significado: "Señal de 0 a 5. Con 0 o 1 la unidad va a reportar entrecortado." },
    ],
  },

  t_getgps: {
    paraQue: "Pedir la posición actual en datos crudos: coordenadas, satélites, velocidad y rumbo.",
    queResponde: "Una línea con la última posición válida.",
    ejemplo: "GPS:1 Sat:9 Lat:-12.043180 Long:-77.028240 Alt:154 Speed:0 Dir:271 Date: 2026/10/19 Time: 14:35:02",
    lectura: [
      { campo: "GPS", significado: "1 = tiene posición válida. 0 = está sin fix y lo que manda es la última conocida." },
      { campo: "Sat", significado: "Satélites usados. Con menos de 4 la posición no es confiable." },
      { campo: "Lat / Long", significado: "Coordenadas. Negativas en Perú (sur y oeste)." },
      { campo: "Speed", significado: "Velocidad en km/h al momento de responder." },
      { campo: "Dir", significado: "Rumbo en grados: 0 norte, 90 este, 180 sur, 270 oeste." },
    ],
  },

  t_ggps: {
    paraQue: "Lo mismo que getgps pero fácil de leer: te manda un enlace para abrir la ubicación en Google Maps.",
    queResponde: "Un enlace de Google Maps con la posición, más fecha y hora.",
    ejemplo: "https://maps.google.com/?q=-12.043180,-77.028240 2026/10/19 14:35:02",
    ojo: "Si el GPS no tiene fix, el enlace apunta a la última posición conocida, no a donde está ahora.",
  },

  t_getio: {
    paraQue:
      "Ver de un golpe todas las entradas y salidas del equipo: ignición, corte, voltajes, alarmas. Sirve cuando no sabes qué IO revisar.",
    queResponde: "Una lista de IO habilitadas con su valor actual.",
    ejemplo: "DIN1:1 DIN2:0 DOUT1:0 AIN1:0 Ext Volt:12750 Batt Volt:4050 GSM Sign:4 Ignition:1 Movement:1",
    ojo: "Solo salen las IO que estén habilitadas en la configuración del equipo. Si falta la que buscas, hay que habilitarla por configurador.",
  },

  t_readio: {
    paraQue:
      "Leer una sola entrada o salida por su número de ID. Es lo más puntual: en vez de leer todo, preguntas exactamente por lo que te interesa.",
    queResponde: "El ID consultado y su valor actual.",
    ejemplo: "IO ID:66 Value:12750",
    ojo: "Elige el ID en los botones de abajo: cada uno mide una cosa distinta.",
  },

  t_getparam: {
    paraQue:
      "Preguntarle al equipo cómo está configurado un dato puntual (APN, IP del servidor, puerto). Sirve para confirmar antes y después de un cambio.",
    queResponde: "El ID consultado y el valor que tiene grabado.",
    ejemplo: "Param ID:2004 Value:164.92.70.28",
  },

  t_setparam: {
    paraQue: "Cambiar un parámetro de configuración del equipo escribiendo su ID y el nuevo valor.",
    queResponde: "Una confirmación corta de que el parámetro se grabó.",
    ejemplo: "Param ID:2004 New Value:164.92.70.28",
    ojo: "Después de cambiarlo, confirma con getparam del mismo ID. Si escribes un ID equivocado puedes dejar la unidad sin reportar.",
  },

  t_setdigout: {
    paraQue:
      "Activar o desactivar las salidas digitales. La salida 1 (DOUT1) es la que normalmente va al relé de corte de motor.",
    queResponde: "Confirmación del estado en que quedaron las salidas.",
    ejemplo: "DOUT1:1 DOUT2:0",
    lectura: [
      { campo: "Salida 1 en 1", significado: "Relé activado: el motor queda cortado." },
      { campo: "Salida 1 en 0", significado: "Relé liberado: el vehículo arranca normal." },
    ],
    ojo: "Nunca cortes con el vehículo en movimiento. Después de mandarlo, verifica con readio 179 que la salida quedó como esperabas.",
  },

  t_flush: {
    paraQue:
      "Forzar al equipo a vaciar su memoria mandando todos los registros guardados al servidor que le indiques. Se usa cuando la unidad estuvo sin cobertura y quedó data atrasada.",
    queResponde: "Un resumen de cuántos registros mandó.",
    ejemplo: "FLUSH: 128 records sent",
    ojo: "Los datos se mandan al servidor que escribas en el comando, no necesariamente al que tiene configurado.",
  },

  t_setserver: {
    paraQue:
      "Apuntar el equipo a un servidor Traccar: escribe la IP (2004), el puerto (2005) y deja el protocolo en TCP (2006:0).",
    queResponde: "Confirmación de los tres parámetros grabados.",
    ejemplo: "Param ID:2004 New Value:164.92.70.28 Param ID:2005 New Value:5027 Param ID:2006 New Value:0",
    ojo: "Si la IP o el puerto quedan mal, la unidad deja de reportar. Confirma con getparam 2004 y getparam 2005, y mira que en getstatus el Data Link vuelva a 1.",
  },

  t_countrecs: {
    paraQue:
      "Saber cuántos registros tiene guardados sin enviar. Muchos registros acumulados = la unidad estuvo sin señal o sin servidor.",
    queResponde: "La cantidad de registros en memoria.",
    ejemplo: "Count of records: 128",
  },

  t_battery: {
    paraQue: "Ver cómo está la alimentación: el voltaje que entra del vehículo y la batería interna de respaldo.",
    queResponde: "Voltaje externo, voltaje y porcentaje de la batería interna.",
    ejemplo: "Ext Volt:12750 Batt Volt:4050 Batt:92%",
    ojo: "Si el equipo no reconoce este comando, pide lo mismo con readio 66 (alimentación) y readio 67 (batería interna).",
  },

  t_getvin: {
    paraQue: "Leer el número de chasis (VIN) que el equipo obtiene del bus CAN del vehículo.",
    queResponde: "El VIN leído, o vacío si el vehículo no lo entrega.",
    ejemplo: "VIN: 8AJFR22G1J2512345",
    ojo: "Solo funciona en equipos conectados a CAN. En instalaciones normales de 12V responde vacío y no es una falla.",
  },

  t_deleterecords: {
    paraQue: "Borrar todos los registros guardados en la memoria del equipo.",
    queResponde: "Confirmación del borrado.",
    ejemplo: "Records deleted",
    ojo: "Lo que borres no se recupera: esa data nunca va a llegar a Traccar. Úsalo solo si la memoria quedó con basura.",
  },

  t_defaultcfg: {
    paraQue: "Devolver el equipo a la configuración de fábrica.",
    queResponde: "Confirmación y reinicio del equipo.",
    ejemplo: "Default configuration set",
    ojo: "Borra APN, servidor y puerto: la unidad deja de reportar hasta que la vuelvas a configurar. Ten lista la configuración antes de mandarlo.",
  },

  t_cpureset: {
    paraQue: "Reiniciar el equipo, como desconectarlo y volverlo a conectar. No borra nada.",
    queResponde: "Confirmación y unos segundos sin reportar mientras arranca.",
    ejemplo: "CPU reset",
    ojo: "Es el primer intento cuando la unidad está 'colgada'. Tarda entre 30 segundos y 2 minutos en volver.",
  },
};

// Ayuda por ID de entrada/salida (comando readio)
export const AYUDA_IO_TELTONIKA: Record<string, AyudaComando> = {
  "1": {
    paraQue: "ID 1 — Entrada digital 1 (DIN1). Normalmente es la ignición cableada o el botón de pánico, según cómo se instaló.",
    queResponde: "0 o 1.",
    ejemplo: "IO ID:1 Value:1",
    lectura: [
      { campo: "1", significado: "La entrada está activa: llave puesta o botón presionado." },
      { campo: "0", significado: "Entrada en reposo." },
    ],
  },
  "21": {
    paraQue: "ID 21 — Calidad de la señal GSM. Para saber si la unidad tiene cobertura donde está.",
    queResponde: "Un número del 0 al 5.",
    ejemplo: "IO ID:21 Value:4",
    lectura: [
      { campo: "4 o 5", significado: "Señal buena." },
      { campo: "2 o 3", significado: "Señal justa: puede reportar entrecortado." },
      { campo: "0 o 1", significado: "Prácticamente sin cobertura." },
    ],
  },
  "66": {
    paraQue: "ID 66 — Voltaje de alimentación externa, o sea lo que le entrega la batería del vehículo.",
    queResponde: "El voltaje en milivoltios.",
    ejemplo: "IO ID:66 Value:12750",
    lectura: [
      { campo: "12000 a 14500", significado: "Normal en un vehículo de 12V (14 V y pico = motor encendido cargando)." },
      { campo: "24000 a 28000", significado: "Normal en camión de 24V." },
      { campo: "Menos de 11500", significado: "Batería del vehículo baja o conexión floja: la unidad se va a apagar sola." },
      { campo: "0", significado: "El equipo está sin alimentación, trabajando con su batería interna." },
    ],
  },
  "67": {
    paraQue: "ID 67 — Voltaje de la batería interna del GPS, la que lo mantiene vivo si le cortan la corriente.",
    queResponde: "El voltaje en milivoltios.",
    ejemplo: "IO ID:67 Value:4050",
    lectura: [
      { campo: "3900 a 4200", significado: "Batería interna sana y cargada." },
      { campo: "3600 a 3900", significado: "A media carga: normal si el vehículo estuvo apagado un buen rato." },
      { campo: "Menos de 3500", significado: "Batería gastada: ante un corte de corriente el equipo se apaga de una. Toca cambiarla." },
    ],
  },
  "179": {
    paraQue: "ID 179 — Estado de la salida digital 1 (DOUT1), que es el relé de corte de motor.",
    queResponde: "0 o 1.",
    ejemplo: "IO ID:179 Value:0",
    lectura: [
      { campo: "1", significado: "Corte activo: el vehículo no arranca." },
      { campo: "0", significado: "Normal: el vehículo arranca." },
    ],
    ojo: "Es la forma de confirmar que un corte o una restauración realmente se aplicó.",
  },
  "180": {
    paraQue: "ID 180 — Estado de la salida digital 2 (DOUT2). Suele usarse para sirena, bloqueo de puertas u otro accesorio.",
    queResponde: "0 o 1.",
    ejemplo: "IO ID:180 Value:0",
  },
  "239": {
    paraQue: "ID 239 — Ignición tal como la interpreta el equipo (puede venir del cable, del voltaje o del movimiento).",
    queResponde: "0 o 1.",
    ejemplo: "IO ID:239 Value:1",
    lectura: [
      { campo: "1", significado: "Motor encendido." },
      { campo: "0", significado: "Motor apagado." },
    ],
  },
  "240": {
    paraQue: "ID 240 — Movimiento detectado por el acelerómetro.",
    queResponde: "0 o 1.",
    ejemplo: "IO ID:240 Value:0",
    lectura: [
      { campo: "1", significado: "El vehículo se está moviendo." },
      { campo: "0", significado: "Detenido." },
    ],
  },
};

// Ayuda por ID de parámetro (comandos getparam / setparam)
export const AYUDA_PARAM_TELTONIKA: Record<string, AyudaComando> = {
  "2001": {
    paraQue: "ID 2001 — Nombre del APN de la SIM. Sin el APN correcto el equipo no tiene internet y no reporta.",
    queResponde: "El APN grabado.",
    ejemplo: "Param ID:2001 Value:movistar.pe",
    lectura: [
      { campo: "Movistar", significado: "movistar.pe" },
      { campo: "Claro", significado: "claro.pe" },
      { campo: "Entel", significado: "entel.pe" },
      { campo: "Bitel", significado: "bitel.pe" },
    ],
  },
  "2002": {
    paraQue: "ID 2002 — Usuario del APN. En Perú casi siempre va vacío.",
    queResponde: "El usuario grabado, o vacío.",
    ejemplo: "Param ID:2002 Value:",
  },
  "2003": {
    paraQue: "ID 2003 — Contraseña del APN. En Perú casi siempre va vacía.",
    queResponde: "La contraseña grabada, o vacío.",
    ejemplo: "Param ID:2003 Value:",
  },
  "2004": {
    paraQue: "ID 2004 — IP o dominio del servidor al que reporta la unidad. Es lo primero que se revisa cuando no llega a Traccar.",
    queResponde: "La IP o dominio grabado.",
    ejemplo: "Param ID:2004 Value:164.92.70.28",
    ojo: "Debe coincidir con uno de los servidores Traccar: 164.92.70.28 o 165.227.9.191.",
  },
  "2005": {
    paraQue: "ID 2005 — Puerto del servidor. Para Teltonika en Traccar es el 5027.",
    queResponde: "El puerto grabado.",
    ejemplo: "Param ID:2005 Value:5027",
  },
  "2006": {
    paraQue: "ID 2006 — Protocolo de envío.",
    queResponde: "0 o 1.",
    ejemplo: "Param ID:2006 Value:0",
    lectura: [
      { campo: "0", significado: "TCP: es el que usamos, confirma la entrega de cada posición." },
      { campo: "1", significado: "UDP: más liviano pero sin confirmación." },
    ],
  },
};

// ---------------------------------------------------------------------------
// TK / COBAN
// ---------------------------------------------------------------------------

const AYUDA_TK: Record<string, AyudaComando> = {
  tk_check: {
    paraQue: "Es el chequeo general del equipo: te dice si tiene GPS, señal, datos, batería y cómo está el relé de corte.",
    queResponde: "Varias líneas con el estado de cada parte.",
    ejemplo: "GPS: OK\nGSM: 5\nGPRS: OK\nBattery: 90%\nRelay: OFF\nACC: ON",
    lectura: [
      { campo: "GPS", significado: "OK = tiene posición. NO FIX = no ve satélites." },
      { campo: "GPRS", significado: "OK = tiene datos y puede mandar al servidor." },
      { campo: "Battery", significado: "Carga de la batería interna del equipo." },
      { campo: "Relay", significado: "OFF = vehículo normal. ON = corte de motor activo." },
      { campo: "ACC", significado: "ON = motor encendido." },
    ],
  },
  tk_begin: {
    paraQue: "Deja el equipo en valores iniciales. Es el primer comando cuando configuras una unidad desde cero.",
    queResponde: "Una confirmación corta.",
    ejemplo: "begin ok",
    ojo: "Borra configuraciones previas. Después hay que mandarle APN, servidor y frecuencia de reporte.",
  },
  tk_admin: {
    paraQue: "Registra un celular como administrador: ese número queda autorizado para mandar comandos y recibir alarmas.",
    queResponde: "Confirmación del número registrado.",
    ejemplo: "admin ok",
    ojo: "Si no registras administrador, el equipo puede ignorar comandos de números desconocidos.",
  },
  tk_adminip: {
    paraQue: "Le dice al equipo a qué IP y puerto mandar las posiciones. Para TK en Traccar el puerto es 5001.",
    queResponde: "Confirmación de la IP grabada.",
    ejemplo: "adminip ok",
    ojo: "Después confirma con check: el GPRS debe seguir en OK.",
  },
  tk_apn: {
    paraQue: "Configura el APN del operador. Sin APN correcto el equipo no tiene internet, aunque la SIM tenga saldo.",
    queResponde: "Confirmación del APN grabado.",
    ejemplo: "apn ok",
  },
  tk_apn_auth: {
    paraQue: "Igual que el anterior, pero para SIM que piden usuario y contraseña de APN.",
    queResponde: "Confirmación del APN grabado.",
    ejemplo: "apn ok",
    ojo: "En Perú la mayoría de SIM no necesita usuario ni clave: usa el APN simple salvo que el operador te diga lo contrario.",
  },
  tk_gprs_tcp: {
    paraQue: "Enciende el envío de datos por GPRS en modo TCP, que es el que usa Traccar.",
    queResponde: "Confirmación corta.",
    ejemplo: "gprs ok",
  },
  tk_gprs_udp: {
    paraQue: "Enciende el envío de datos en modo UDP. Solo para casos donde TCP no funciona con ese operador.",
    queResponde: "Confirmación corta.",
    ejemplo: "gprs ok",
  },
  tk_timezone: {
    paraQue: "Ajusta el huso horario del equipo. En Perú es -5.",
    queResponde: "Confirmación corta.",
    ejemplo: "time ok",
    ojo: "Si queda mal, los reportes llegan con horas corridas aunque la posición sea correcta.",
  },
  tk_fix_interval: {
    paraQue:
      "Define cada cuánto reporta: un intervalo con el motor encendido y otro con el motor apagado. Así no gasta datos parado.",
    queResponde: "Confirmación corta.",
    ejemplo: "fix ok",
    lectura: [
      { campo: "010m", significado: "Con motor encendido reporta cada 10 minutos." },
      { campo: "030m", significado: "Con motor apagado reporta cada 30 minutos." },
    ],
  },
  tk_fix_continuous: {
    paraQue: "Hace que reporte siempre cada X minutos, sin importar si el motor está encendido o apagado.",
    queResponde: "Confirmación corta.",
    ejemplo: "fix ok",
    ojo: "Consume más datos y batería. Útil para seguimiento de un robo o una prueba, no para el día a día.",
  },
  tk_stop: {
    paraQue: "Corta el combustible o el encendido mediante el relé.",
    queResponde: "Confirmación de que el corte se aplicó.",
    ejemplo: "Stop engine Succeed",
    ojo: "Mándalo solo con el vehículo detenido o a baja velocidad. Confirma después con check que el relé figure en ON.",
  },
  tk_resume: {
    paraQue: "Libera el relé y devuelve el vehículo a su funcionamiento normal.",
    queResponde: "Confirmación de que se restableció.",
    ejemplo: "Resume engine Succeed",
    ojo: "Si el vehículo no arranca después, verifica con check que el relé figure en OFF.",
  },
  tk_monitor: {
    paraQue: "Pone el equipo en modo escucha: al llamarlo contesta y abre el micrófono en vez de rechazar la llamada.",
    queResponde: "Confirmación corta.",
    ejemplo: "monitor ok",
    ojo: "Grabar o escuchar sin consentimiento puede ser ilegal. Avisa al cliente antes de activarlo.",
  },
  tk_tracker: {
    paraQue: "Devuelve el equipo al modo rastreo normal y desactiva el modo escucha.",
    queResponde: "Confirmación corta.",
    ejemplo: "tracker ok",
  },
  tk_help: {
    paraQue: "Apaga la alarma SOS que se disparó por el botón de pánico.",
    queResponde: "Confirmación corta.",
    ejemplo: "help me ok",
  },
  tk_reset: {
    paraQue: "Reinicia el equipo. Es el primer intento cuando la unidad está colgada.",
    queResponde: "Confirmación y unos minutos sin reportar mientras arranca.",
    ejemplo: "reset ok",
    ojo: "En algunos modelos también devuelve valores de fábrica: ten a la mano el APN y la IP por si hay que reconfigurar.",
  },
};

// ---------------------------------------------------------------------------
// GT06 / CONCOX
// ---------------------------------------------------------------------------

const AYUDA_GT: Record<string, AyudaComando> = {
  gt_status: {
    paraQue: "Chequeo rápido del equipo: batería, señal, GPS y si el motor está encendido.",
    queResponde: "Una respuesta corta con el estado de cada parte.",
    ejemplo: "Battery:90%\nGSM:Good\nGPS:Fixed\nACC:ON\nGPRS:ON",
    lectura: [
      { campo: "GPS: Fixed", significado: "Tiene posición válida. 'No Fix' = no ve satélites." },
      { campo: "GSM", significado: "Calidad de señal del operador." },
      { campo: "ACC", significado: "ON = motor encendido (depende de que el cable ACC esté bien instalado)." },
      { campo: "Battery", significado: "Carga de la batería interna del GPS." },
    ],
  },
  gt_check: {
    paraQue:
      "Chequeo más completo que STATUS#: además te dice a qué servidor e IP está apuntando, qué APN tiene y cuántos satélites ve.",
    queResponde: "Varias líneas con red, servidor, APN y satélites.",
    ejemplo: "IMEI:868120200000000\nSERVER:164.92.70.28,5023\nAPN:movistar.pe\nGSM:22\nGPS:9 satellites\nSTATUS:OK",
    lectura: [
      { campo: "SERVER", significado: "IP y puerto a donde manda la data. Debe ser el de Traccar, puerto 5023." },
      { campo: "APN", significado: "APN del operador. Si está mal, no hay internet." },
      { campo: "GPS", significado: "Satélites a la vista. Con menos de 4 no da posición." },
    ],
    ojo: "Es el mejor comando para diagnosticar una unidad que no llega al sistema.",
  },
  gt_param: {
    paraQue: "Muestra la configuración grabada: servidor, APN, intervalos, zona horaria.",
    queResponde: "Un listado con cada parámetro y su valor.",
    ejemplo: "SERVER:164.92.70.28:5023\nAPN:movistar.pe\nTIMER:60\nGMT:W,5",
    ojo: "Úsalo después de cambiar algo para confirmar que quedó grabado.",
  },
  gt_where: {
    paraQue: "Pide la posición en coordenadas crudas, para copiarlas o cargarlas en otro sistema.",
    queResponde: "Latitud y longitud, fecha y hora.",
    ejemplo: "Lat:-12.043180 Lon:-77.028240 2026-10-19 14:35:02",
    ojo: "Si quieres verla en el mapa de una, usa URL# en vez de este.",
  },
  gt_url: {
    paraQue: "Lo mismo que WHERE# pero devuelve un enlace de Google Maps listo para abrir desde el celular.",
    queResponde: "Un enlace con la ubicación.",
    ejemplo: "http://maps.google.com/maps?q=-12.043180,-77.028240",
  },
  gt_version: {
    paraQue: "Saber el firmware y confirmar el IMEI del equipo.",
    queResponde: "Versión de firmware e IMEI.",
    ejemplo: "GT06N_V1.23 IMEI:868120200000000",
    ojo: "El IMEI es el que debe estar registrado en Traccar para que la unidad aparezca.",
  },
  gt_server_ip: {
    paraQue: "Apunta el equipo a un servidor por IP. Para GT06 en Traccar el puerto es 5023.",
    queResponde: "Confirmación corta.",
    ejemplo: "SERVER OK",
    ojo: "Confirma después con CHECK# que el SERVER quedó con la IP y puerto correctos.",
  },
  gt_server_domain: {
    paraQue: "Igual que el anterior pero usando dominio en vez de IP.",
    queResponde: "Confirmación corta.",
    ejemplo: "SERVER OK",
  },
  gt_apn: {
    paraQue: "Configura el APN del operador. Sin esto el equipo no tiene internet aunque la SIM tenga saldo.",
    queResponde: "Confirmación corta.",
    ejemplo: "APN OK",
  },
  gt_apn_auth: {
    paraQue: "APN con usuario y contraseña, para SIM que lo exigen.",
    queResponde: "Confirmación corta.",
    ejemplo: "APN OK",
    ojo: "En Perú la mayoría no lo necesita: usa el APN simple salvo indicación del operador.",
  },
  gt_timer: {
    paraQue: "Define cada cuántos segundos manda posición.",
    queResponde: "Confirmación corta.",
    ejemplo: "TIMER OK",
    lectura: [
      { campo: "30 a 60 s", significado: "Seguimiento fino, gasta más datos." },
      { campo: "120 a 300 s", significado: "Uso normal de flota." },
    ],
  },
  gt_timer_double: {
    paraQue: "Define dos intervalos: uno con el motor encendido y otro con el motor apagado.",
    queResponde: "Confirmación corta.",
    ejemplo: "TIMER OK",
    ojo: "Es lo recomendable: reporta seguido en movimiento y espacia los reportes cuando está parado.",
  },
  gt_gprson_1: {
    paraQue: "Enciende la transmisión de datos. Si está apagada, la unidad no manda nada aunque esté bien configurada.",
    queResponde: "Confirmación corta.",
    ejemplo: "GPRSON OK",
  },
  gt_gprson_0: {
    paraQue: "Apaga la transmisión de datos. La unidad deja de reportar al servidor.",
    queResponde: "Confirmación corta.",
    ejemplo: "GPRSON OK",
    ojo: "Solo para pruebas o para ahorrar datos a propósito. Si lo dejas apagado, la unidad figura como desconectada.",
  },
  gt_gmt: {
    paraQue: "Ajusta el huso horario del equipo. Para Perú es Oeste (W) con 5.",
    queResponde: "Confirmación corta.",
    ejemplo: "GMT OK",
    ojo: "Si queda mal, las posiciones llegan con la hora corrida.",
  },
  gt_sos: {
    paraQue: "Registra un celular como número SOS: recibe las alarmas del botón de pánico y puede mandar comandos.",
    queResponde: "Confirmación corta.",
    ejemplo: "SOS OK",
  },
  gt_speed: {
    paraQue: "Define a partir de qué velocidad el equipo avisa por exceso.",
    queResponde: "Confirmación corta.",
    ejemplo: "SPEED OK",
    ojo: "El aviso llega por SMS al número SOS registrado; si no hay número registrado, no avisa a nadie.",
  },
  gt_relay_1: {
    paraQue: "Corta el motor mediante el relé.",
    queResponde: "Confirmación del corte.",
    ejemplo: "RELAY ON",
    ojo: "Solo con el vehículo detenido. Varios GT06 esperan a que baje de 20 km/h antes de aplicar el corte. Confirma con STATUS#.",
  },
  gt_relay_0: {
    paraQue: "Libera el relé y devuelve el vehículo a su funcionamiento normal.",
    queResponde: "Confirmación de la restauración.",
    ejemplo: "RELAY OFF",
  },
  gt_reset: {
    paraQue: "Reinicia el equipo sin borrar la configuración. Primer intento cuando está colgado.",
    queResponde: "Confirmación y unos minutos sin reportar.",
    ejemplo: "RESET OK",
  },
  gt_factory: {
    paraQue: "Borra toda la configuración y deja el equipo como de fábrica.",
    queResponde: "Confirmación y reinicio.",
    ejemplo: "FACTORY OK",
    ojo: "Pierde servidor, APN y números SOS: la unidad deja de reportar hasta reconfigurarla por completo.",
  },
  gt_begin: {
    paraQue: "Inicializa el equipo con la contraseña de fábrica. Se usa al empezar a configurar una unidad nueva.",
    queResponde: "Confirmación corta.",
    ejemplo: "BEGIN OK",
  },
};

const AYUDA_POR_COMANDO: Record<string, AyudaComando> = {
  ...AYUDA_TELTONIKA,
  ...AYUDA_TK,
  ...AYUDA_GT,
};

/**
 * Devuelve la ayuda del comando. Para readio/getparam, la ayuda depende del ID
 * elegido, así que se combina la general con la específica de ese ID.
 */
export function obtenerAyuda(
  commandId?: string,
  paramValues?: Record<string, string>
): { general?: AyudaComando; especifica?: AyudaComando } {
  if (!commandId) return {};

  const general = AYUDA_POR_COMANDO[commandId];
  const idElegido = paramValues?.id;

  if (commandId === "t_readio" && idElegido) {
    return { general, especifica: AYUDA_IO_TELTONIKA[idElegido] };
  }
  if ((commandId === "t_getparam" || commandId === "t_setparam") && idElegido) {
    return { general, especifica: AYUDA_PARAM_TELTONIKA[idElegido] };
  }

  return { general };
}
