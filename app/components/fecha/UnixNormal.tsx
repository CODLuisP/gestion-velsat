interface UnixNormalProps {
  creationTime: number;
  show?: "date" | "time" | "both";
  diffWithStatus?: boolean;
}

export default function UnixNormal({
  creationTime,
  show = "date",
  diffWithStatus = false,
}: UnixNormalProps) {
  const unixTimestamp = Number(creationTime);
  const date = new Date(unixTimestamp * 1000);

  // Fecha
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  // Hora
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const formattedTime = `${hours}:${minutes}`;
  const formattedTimeSegundos = `${hours}:${minutes}:${seconds}`;

  // Diferencia con hora actual
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

  if (diffWithStatus) {
    return (
      <span
        className={`font-mono text-[12.5px] ${
          isConnected ? "text-[#4ADE80] font-semibold" : "text-[#9B9CA1]"
        }`}
      >
        {isConnected ? "Conectado" : diffFormatted}
      </span>
    );
  }

  if (show === "time")
    return <span className="font-mono text-[12.5px] text-[#9B9CA1]">{formattedTime}</span>;

  if (show === "both") {
    return (
      <span className="font-mono text-[12.5px] text-[#9B9CA1] whitespace-nowrap">
        {formattedDate} {formattedTime}
      </span>
    );
  }

  return <span className="font-mono text-[12.5px] text-[#9B9CA1]">{formattedDate}</span>;
}
