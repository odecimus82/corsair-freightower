
export enum TransportMode {
  AIR = 'AIR',
  OCEAN = 'OCEAN',
  TRUCK = 'TRUCK',
  RAIL = 'RAIL'
}

export enum ShipmentStatus {
  BOOKED = 'BOOKED',
  IN_TRANSIT = 'IN_TRANSIT',
  CUSTOMS_HOLD = 'CUSTOMS_HOLD',
  DELIVERED = 'DELIVERED',
  EXCEPTION = 'EXCEPTION',
  ARRIVED_PORT = 'ARRIVED_PORT'
}

export interface Location {
  code: string;
  name: string;
  country: string;
}

export interface Shipment {
  id: string;
  reference: string;
  mode: TransportMode;
  status: ShipmentStatus;
  origin: Location;
  destination: Location;
  etd: string;
  eta: string;
  carrier: string;
  weight: number; // kg
  volume: number; // cbm
  lastUpdate: string;
  description: string;
}

export interface AIAnalysisResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  analysis: string;
  action: string;
}

export interface PortDetails {
  name: string;
  code: string; // UN/LOCODE
  country: string;
  coordinates: string;
  type: string; // Seaport, River Port, etc.
  description: string;
  infrastructure: string[]; // e.g. "Deep Water Berths", "Cranes"
}

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface RouteOverride {
    id: string; // combined key origin-dest
    origin: string;
    destination: string;
    oceanDistance: number;
    oceanTime: string;
    airDistance: number;
    airTime: string;
}

export interface RouteDetails {
  origin: string;
  destination: string;
  originCoordinates: Coordinates;
  destinationCoordinates: Coordinates;
  ocean: {
      distanceNm: number;
      transitTimeDays: string;
      routeDescription: string;
      keyWaypoints: string[];
      waypoints: Coordinates[]; // Array of lat/lng for map plotting
  };
  air: {
      distanceKm: number;
      transitTimeHours: string;
      routeDescription: string;
      waypoints: Coordinates[]; // Array of lat/lng for map plotting
  };
}

export interface ETAPrediction {
  predictedEta: string;
  confidenceScore: number; // 0-100
  reasoning: string;
}

export interface TerminalOption {
    label: string;
    value: string;
    type: 'OCEAN' | 'AIR';
    country: string;
    code?: string; // Optional code for custom ports
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    type: 'ROUTE' | 'PORT';
}

export interface LogisticsNewsItem {
    id: string;
    timestamp: string; // e.g., "10:45 AM"
    category: 'PORT' | 'AIRPORT' | 'WEATHER' | 'CUSTOMS';
    location: string;
    headline: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
}
