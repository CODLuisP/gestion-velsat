interface UnixNormalProps {
  creationTime: number;
}

export default function UnixNormal({ creationTime }: UnixNormalProps) {
  const unixTimestamp = Number(creationTime);
  const date = new Date(unixTimestamp * 1000);

  // Obtenemos día, mes y año con ceros iniciales si es necesario
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() empieza en 0
  const year = date.getFullYear();

  const formattedDate = `${day}/${month}/${year}`;

  return <div>{formattedDate}</div>;
}
