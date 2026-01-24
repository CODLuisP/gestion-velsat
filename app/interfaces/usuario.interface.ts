export interface Usuario {
  description: string;
  ruc: string;
  accountID: string;
  password: string;
  contactEmail: string;
  contactPhone: string;
  creationTime: number;
  isActive: boolean;
}

export interface SubUsuario {
  id: number;
  userId: string;
  deviceName: string;
  status: string;
  deviceID: string;
}
