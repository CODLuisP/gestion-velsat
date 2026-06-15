import type { Metadata } from 'next';
import WebsVelsatClient from "./WebsVelsatClient";

export const metadata: Metadata = {
  title: 'Gestión Velsat | Webs Velsat',
};

export default function WebsVelsatPage() {
  return <WebsVelsatClient />;
}
