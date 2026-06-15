import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión Velsat | Agregar GPS Traccar',
};

import AgregarGPSTraccarClient from "./AgregarGPSTraccarClient";

export default function AgregarGPSTraccarPage() {
  return <AgregarGPSTraccarClient />;
}
