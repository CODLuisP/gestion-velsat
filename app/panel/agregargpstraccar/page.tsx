import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión Velsat | Traccar',
};

import AgregarGPSTraccarClient from "./AgregarGPSTraccarClient";

export default function AgregarGPSTraccarPage() {
  return <AgregarGPSTraccarClient />;
}
