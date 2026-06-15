interface UnixNormalProps {
  creationTime: number;
  show?: 'date' | 'time' | 'both';
  diffWithStatus?: boolean; // 👈 AGREGADO
}

export default function UnixNormal({
  creationTime,
  show = 'date', // 👈 NO TOCADO
  diffWithStatus = false,  // 👈 AGREGADO
}: UnixNormalProps) {
  const unixTimestamp = Number(creationTime);
  const date = new Date(unixTimestamp * 1000);

  
  // Fecha
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  // Hora 
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;
  const formattedTimeSegundos = `${hours}:${minutes}:${seconds}`;

  // ---------- AGREGADO: diferencia con hora actual ----------
  const now = new Date();
  let diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) diffMs = 0;

  const TEN_MINUTES_MS = 10 * 60 * 1000;
  const isConnected = diffMs <= TEN_MINUTES_MS;

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hoursDiff = totalHours % 24;
  const minutesDiff = totalMinutes % 60;

  const diffFormatted = `${days}D ${hoursDiff}H ${minutesDiff}M`;
  // ---------- FIN AGREGADO ----------

  // ---------- NUEVO COMPORTAMIENTO (opcional) ----------
  if (diffWithStatus) {
    return (
      <span className={isConnected ? 'text-green-600 font-semibold' : ''}>
        {isConnected ? 'Conectado' : diffFormatted}
      </span>
    );
  }

  // ---------- COMPORTAMIENTO ORIGINAL (NO TOCADO) ----------
  if (show === 'time') return <span>{formattedTime}</span>;

  if (show === 'both') {
    return (
      <div className="flex flex-col">
        <span>{formattedDate}</span>
        <span className="text-sm text-gray-500">{formattedTime}</span>
      </div>
    );
  }

  return <span>{formattedDate}</span>;
}
