
import { TerminalOption } from '../types';
import { PortDB } from './routeStorage';

// Curated list of top global logistics hubs by volume
export const GLOBAL_TERMINALS: TerminalOption[] = [
    // === ASIA PACIFIC (OCEAN) ===
    { label: "Shanghai, CN (CNSHA) - World's Busiest", value: "Shanghai Port", type: "OCEAN", country: "CN" },
    { label: "Singapore, SG (SGSIN)", value: "Singapore Port", type: "OCEAN", country: "SG" },
    { label: "Ningbo-Zhoushan, CN (CNNBG)", value: "Ningbo-Zhoushan Port", type: "OCEAN", country: "CN" },
    { label: "Shenzhen, CN (CNSZX)", value: "Shenzhen Port", type: "OCEAN", country: "CN" },
    { label: "Guangzhou, CN (CNCAN)", value: "Guangzhou Port", type: "OCEAN", country: "CN" },
    { label: "Busan, KR (KRPUS)", value: "Busan Port", type: "OCEAN", country: "KR" },
    { label: "Qingdao, CN (CNQDA)", value: "Qingdao Port", type: "OCEAN", country: "CN" },
    { label: "Hong Kong, HK (HKHKG)", value: "Hong Kong Port", type: "OCEAN", country: "HK" },
    { label: "Tianjin, CN (CNTSN)", value: "Tianjin Port", type: "OCEAN", country: "CN" },
    { label: "Port Klang, MY (MYPKG)", value: "Port Klang", type: "OCEAN", country: "MY" },
    { label: "Kaohsiung, TW (TWKHH)", value: "Kaohsiung Port", type: "OCEAN", country: "TW" },
    { label: "Tokyo, JP (JPTYO)", value: "Tokyo Port", type: "OCEAN", country: "JP" },
    { label: "Laem Chabang, TH (THLCH)", value: "Laem Chabang Port", type: "OCEAN", country: "TH" },
    { label: "Ho Chi Minh / Cat Lai, VN (VNSGN)", value: "Cat Lai Port", type: "OCEAN", country: "VN" },
    { label: "Nhava Sheva (Mumbai), IN (INNSA)", value: "Jawaharlal Nehru Port", type: "OCEAN", country: "IN" },
    { label: "Colombo, LK (LKCMB)", value: "Port of Colombo", type: "OCEAN", country: "LK" },

    // === EUROPE (OCEAN) ===
    { label: "Rotterdam, NL (NLRTM)", value: "Rotterdam Port", type: "OCEAN", country: "NL" },
    { label: "Antwerp, BE (BEANR)", value: "Antwerp Port", type: "OCEAN", country: "BE" },
    { label: "Hamburg, DE (DEHAM)", value: "Hamburg Port", type: "OCEAN", country: "DE" },
    { label: "Bremerhaven, DE (DEBRV)", value: "Bremerhaven Port", type: "OCEAN", country: "DE" },
    { label: "Valencia, ES (ESVLC)", value: "Port of Valencia", type: "OCEAN", country: "ES" },
    { label: "Piraeus, GR (GRPIR)", value: "Piraeus Port", type: "OCEAN", country: "GR" },
    { label: "Felixstowe, UK (GBFXT)", value: "Port of Felixstowe", type: "OCEAN", country: "UK" },
    { label: "Le Havre, FR (FRLEH)", value: "Port of Le Havre", type: "OCEAN", country: "FR" },
    { label: "Algeciras, ES (ESALG)", value: "Port of Algeciras", type: "OCEAN", country: "ES" },
    
    // === NORTH AMERICA (OCEAN) ===
    { label: "Los Angeles, US (USLAX)", value: "Port of Los Angeles", type: "OCEAN", country: "US" },
    { label: "Long Beach, US (USLGB)", value: "Port of Long Beach", type: "OCEAN", country: "US" },
    { label: "New York/NJ, US (USNYC)", value: "Port of New York and New Jersey", type: "OCEAN", country: "US" },
    { label: "Savannah, US (USSAV)", value: "Port of Savannah", type: "OCEAN", country: "US" },
    { label: "Vancouver, CA (CAVAN)", value: "Port of Vancouver", type: "OCEAN", country: "CA" },
    { label: "Houston, US (USHOU)", value: "Port of Houston", type: "OCEAN", country: "US" },
    { label: "Seattle-Tacoma, US (USSEA)", value: "Port of Seattle", type: "OCEAN", country: "US" },
    { label: "Oakland, US (USOAK)", value: "Port of Oakland", type: "OCEAN", country: "US" },
    { label: "Manzanillo, MX (MXZLO)", value: "Port of Manzanillo", type: "OCEAN", country: "MX" },

    // === MIDDLE EAST (OCEAN) ===
    { label: "Jebel Ali, AE (AEJEA)", value: "Jebel Ali Port", type: "OCEAN", country: "AE" },
    { label: "Jeddah, SA (SAJED)", value: "Jeddah Islamic Port", type: "OCEAN", country: "SA" },
    { label: "Salalah, OM (OMSLL)", value: "Port of Salalah", type: "OCEAN", country: "OM" },

    // === GLOBAL AIR HUBS (AIR) ===
    { label: "Hong Kong Int'l (HKG)", value: "Hong Kong International Airport", type: "AIR", country: "HK" },
    { label: "Memphis Int'l (MEM) - FedEx Hub", value: "Memphis International Airport", type: "AIR", country: "US" },
    { label: "Shanghai Pudong (PVG)", value: "Shanghai Pudong International Airport", type: "AIR", country: "CN" },
    { label: "Anchorage (ANC)", value: "Ted Stevens Anchorage International Airport", type: "AIR", country: "US" },
    { label: "Incheon (ICN)", value: "Incheon International Airport", type: "AIR", country: "KR" },
    { label: "Louisville (SDF) - UPS Hub", value: "Louisville Muhammad Ali International Airport", type: "AIR", country: "US" },
    { label: "Taipei (TPE)", value: "Taiwan Taoyuan International Airport", type: "AIR", country: "TW" },
    { label: "Tokyo Narita (NRT)", value: "Narita International Airport", type: "AIR", country: "JP" },
    { label: "Los Angeles (LAX)", value: "Los Angeles International Airport", type: "AIR", country: "US" },
    { label: "Doha (DOH)", value: "Hamad International Airport", type: "AIR", country: "QA" },
    { label: "Dubai Int'l (DXB)", value: "Dubai International Airport", type: "AIR", country: "AE" },
    { label: "Frankfurt (FRA)", value: "Frankfurt Airport", type: "AIR", country: "DE" },
    { label: "Paris Charles de Gaulle (CDG)", value: "Charles de Gaulle Airport", type: "AIR", country: "FR" },
    { label: "Miami (MIA)", value: "Miami International Airport", type: "AIR", country: "US" },
    { label: "Singapore Changi (SIN)", value: "Singapore Changi Airport", type: "AIR", country: "SG" },
    { label: "Chicago O'Hare (ORD)", value: "O'Hare International Airport", type: "AIR", country: "US" },
    { label: "Amsterdam Schiphol (AMS)", value: "Amsterdam Airport Schiphol", type: "AIR", country: "NL" },
    { label: "London Heathrow (LHR)", value: "Heathrow Airport", type: "AIR", country: "UK" },
    { label: "Guangzhou Baiyun (CAN)", value: "Guangzhou Baiyun International Airport", type: "AIR", country: "CN" }
];

export const getCombinedTerminals = (): TerminalOption[] => {
    // Merge static terminals with custom ports from LocalStorage
    const customPorts = PortDB.getAll();
    
    // Optional: Sort alphabetically or put custom ones first
    return [...customPorts, ...GLOBAL_TERMINALS];
};
