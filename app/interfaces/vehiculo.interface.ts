export interface Vehiculo {
        deviceID: string,
        accountID: string,
        equipmentType: string,
        uniqueID: string,
        deviceCode: string,
        simPhoneNumber: string,
        imeiNumber: string,
        isActive: string,
        habilitada?: string
}

export interface VehiculoConDescon {
        deviceID: string,
        accountID: string,
        lastValidSpeed: number,
        lastGPSTimestamp: number,
        deviceCode: string,
        imeiNumber: string,
        lastValidLatitude: string
        lastValidLongitude: string
}