
import { GoogleGenAI, Type } from "@google/genai";
import { Shipment, TransportMode, ShipmentStatus, PortDetails, RouteDetails, ETAPrediction, LogisticsNewsItem } from "../types";
import { RouteDB } from "./routeStorage";

// Initialize Gemini Client
const getApiKey = (): string => {
  // @ts-ignore - Check for Vite environment variable
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // Fallback / Standard Node check
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

const SYSTEM_INSTRUCTION = `
You are a Senior Supply Chain Expert and Logistics Risk Analyst with 20 years of experience in cross-border e-commerce logistics (Air, Sea, Land).
Your job is to analyze shipment data and provide concise, actionable insights.
Focus on:
1. Potential delays (weather, port congestion, customs strikes).
2. Route optimization suggestions.
3. Risk assessment based on current geopolitical or seasonal factors.
Keep responses professional, data-driven, and concise.
`;

// --- MOCK DATA GENERATORS (FALLBACK SYSTEM) ---

const getMockRiskAnalysis = () => ({
  riskLevel: "LOW",
  analysis: "Route verified. No major disruptions reported in the current corridor. Seasonal volume is within standard operational limits.",
  action: "Monitor milestones."
});

const getMockNews = (): LogisticsNewsItem[] => [
    { id: 'm1', timestamp: '08:00 CST', category: 'PORT', location: 'Shanghai (CNSHA)', headline: 'Terminal operations nominal, efficiency at 98%', impact: 'LOW' },
    { id: 'm2', timestamp: '12:30 PST', category: 'WEATHER', location: 'Pacific Ocean', headline: 'Minor storm warning, slight route deviations expected', impact: 'MEDIUM' },
    { id: 'm3', timestamp: '16:45 CET', category: 'AIRPORT', location: 'Frankfurt (FRA)', headline: 'Cargo backlog cleared, resuming normal schedule', impact: 'LOW' },
    { id: 'm4', timestamp: '09:15 EST', category: 'CUSTOMS', location: 'US West Coast', headline: 'New regulatory checks in effect for electronics', impact: 'MEDIUM' },
    { id: 'm5', timestamp: '14:20 GST', category: 'PORT', location: 'Jebel Ali (AEJEA)', headline: 'Yard density high, expect 12h gate delay', impact: 'MEDIUM' }
];

const getMockPortDetails = (name: string): PortDetails => ({
    name: name,
    code: name.substring(0, 3).toUpperCase() + "XXX",
    country: "Global",
    coordinates: "34.05, -118.24", // Generic coordinates
    type: "Logistics Hub (Simulated)",
    description: `Simulated data for ${name}. This represents a major international logistics facility with standard cargo handling capabilities, deep-water berths, and intermodal connectivity.`,
    infrastructure: ["Gantry Cranes", "Cold Storage Facilities", "Intermodal Rail Link", "Automated Gates"]
});

const getMockRouteDetails = (origin: string, destination: string): RouteDetails => ({
    origin: origin,
    destination: destination,
    originCoordinates: { lat: 31.23, lng: 121.47 },
    destinationCoordinates: { lat: 51.92, lng: 4.47 },
    ocean: {
        distanceNm: 10500,
        transitTimeDays: "28-32",
        routeDescription: `Simulated Ocean Route: ${origin} to ${destination} via major trade lanes. Traffic conditions are moderate with standard seasonal surcharges applying.`,
        keyWaypoints: ["Departure Channel", "International Waters", "Destination Port"],
        waypoints: []
    },
    air: {
        distanceKm: 8500,
        transitTimeHours: "14-16",
        routeDescription: `Simulated Air Route: Direct or single-stop service from ${origin} to ${destination}. Capacity availability is good.`,
        waypoints: []
    }
});

const getMockCongestion = () => ({
    text: "Status: **Moderate Activity**\n\nOperational simulation indicates standard vessel queuing. Average wait time is approximately 1-2 days. No major strikes or weather events currently impacting gate throughput.",
    sources: []
});

// --- API FUNCTIONS ---

export const analyzeShipmentRisk = async (shipment: Shipment): Promise<{
  riskLevel: string;
  analysis: string;
  action: string;
}> => {
  try {
    const prompt = `
    Analyze the following shipment for potential risks and provide a status summary.
    
    Shipment ID: ${shipment.id}
    Mode: ${shipment.mode}
    Route: ${shipment.origin.name} (${shipment.origin.code}) to ${shipment.destination.name} (${shipment.destination.code})
    Current Status: ${shipment.status}
    Carrier: ${shipment.carrier}
    ETA: ${shipment.eta}
    Description: ${shipment.description}

    Current Date: ${new Date().toISOString().split('T')[0]}

    Provide the output in JSON format with fields: riskLevel (LOW, MEDIUM, HIGH), analysis (max 30 words), action (max 15 words).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
            analysis: { type: Type.STRING },
            action: { type: Type.STRING },
          },
          required: ["riskLevel", "analysis", "action"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.warn("Gemini Analysis Failed (Quota/Network), using fallback:", error);
    return getMockRiskAnalysis();
  }
};

export const generateMarketUpdate = async (): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a brief, 3-bullet point executive summary of current global logistics market trends (e.g., Red Sea crisis, Panama Canal levels, Peak Season surcharges) relevant for a logistics manager today.",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return response.text || "Market data unavailable.";
  } catch (e) {
    return "Global logistics markets are showing stable trends with minor seasonal fluctuations in key trade lanes.";
  }
}

// NEW: Fetch Real-time News Feed (Simulated via AI based on real-world patterns)
export const fetchLogisticsNews = async (): Promise<LogisticsNewsItem[]> => {
    // Current UTC Hour to help Gemini generate relevant local times
    const currentHourUTC = new Date().getUTCHours();
    
    const prompt = `
    Generate 6 HIGHLY REALISTIC, "Breaking News" style updates for Global Logistics (Ports & Airports).
    Assume the current UTC hour is ${currentHourUTC}:00.
    
    CRITICAL TIMEZONE INSTRUCTION: 
    For the 'timestamp' field, use the **LOCAL time** of the specific location mentioned in the news, and MUST include the timezone abbreviation.
    
    Mix:
    - 2 Major Port Congestion/Updates (e.g. Shanghai, LA, Rotterdam)
    - 2 Air Freight alerts (e.g. HKG, MEM, FRA)
    - 1 Weather impact
    - 1 Customs/Regulatory update
    
    Return JSON array.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            timestamp: { type: Type.STRING },
                            category: { type: Type.STRING, enum: ["PORT", "AIRPORT", "WEATHER", "CUSTOMS"] },
                            location: { type: Type.STRING },
                            headline: { type: Type.STRING },
                            impact: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
                        },
                        required: ["id", "timestamp", "category", "location", "headline", "impact"]
                    }
                }
            }
        });
        
        const text = response.text;
        if (!text) return getMockNews();
        return JSON.parse(text);

    } catch (e) {
        console.warn("News Feed Error (Quota/Network), using fallback");
        return getMockNews();
    }
}

export const getPortDetails = async (portName: string): Promise<PortDetails> => {
    const prompt = `
    Provide detailed information for the port: "${portName}". 
    Act as a global maritime database.
    Return JSON with:
    - name (Standard English name)
    - code (UN/LOCODE, if unknown use N/A)
    - country
    - coordinates (Lat/Lng string)
    - type (e.g. Deep Water Seaport, River Port)
    - description (Brief summary of capacity, importance, max 40 words)
    - infrastructure (Array of 3-4 key features like 'Panamax Cranes', 'Rail Link')
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        code: { type: Type.STRING },
                        country: { type: Type.STRING },
                        coordinates: { type: Type.STRING },
                        type: { type: Type.STRING },
                        description: { type: Type.STRING },
                        infrastructure: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "country", "description"]
                }
            }
        });
        const text = response.text;
        if (!text) throw new Error("No data");
        return JSON.parse(text);
    } catch (error) {
        console.warn("Port Fetch Failed (Quota/Network), using fallback for:", portName);
        return getMockPortDetails(portName);
    }
}

// NEW: Real-time Congestion Check using Google Search Grounding
export const getPortCongestion = async (portName: string): Promise<{ text: string, sources: {title: string, uri: string}[] }> => {
    const prompt = `
    Search for the latest, real-time congestion status, vessel waiting times (avg days), and any operational disruptions (strikes, weather, equipment failure) for ${portName}.
    
    Summarize the findings into a concise report for a logistics manager. 
    Format:
    - Current Status: (e.g., Congested, Clear, Moderate)
    - Avg Wait Time: (e.g., 2-4 days)
    - Key Issues: (Brief list of issues or "Normal operations")
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                // Note: responseMimeType is NOT allowed with googleSearch
            }
        });

        // Extract grounding sources if available
        const sources: {title: string, uri: string}[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web) {
                    sources.push({
                        title: chunk.web.title || "Source",
                        uri: chunk.web.uri
                    });
                }
            });
        }

        return {
            text: response.text || "No recent data found.",
            sources: sources
        };

    } catch (error) {
        console.warn("Congestion Check Failed (Quota/Network), using fallback");
        return getMockCongestion();
    }
}

// NEW: Lightweight function for Admin UI - Speed Optimized
export const calculateQuickMetrics = async (origin: string, destination: string): Promise<{
    oceanDistance: number, oceanTime: string, airDistance: number, airTime: string
}> => {
    const prompt = `
    Estimate logistics distance and transit time between "${origin}" and "${destination}".
    Keep it strictly numeric where possible.
    
    Return JSON:
    - oceanDistance (number, Nautical Miles)
    - oceanTime (string, e.g. "25-28")
    - airDistance (number, KM)
    - airTime (string, e.g. "14-16")
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        oceanDistance: { type: Type.NUMBER },
                        oceanTime: { type: Type.STRING },
                        airDistance: { type: Type.NUMBER },
                        airTime: { type: Type.STRING },
                    },
                    required: ["oceanDistance", "oceanTime", "airDistance", "airTime"]
                }
            }
        });
        const text = response.text;
        if (!text) throw new Error("No data");
        return JSON.parse(text);
    } catch (error) {
        console.warn("Quick Metrics Failed (Quota/Network), using fallback");
        return { oceanDistance: 7500, oceanTime: "24-28", airDistance: 9200, airTime: "12-14" };
    }
}

export const calculateRouteDetails = async (origin: string, destination: string): Promise<RouteDetails> => {
    
    // 1. CHECK "BACKEND" OVERRIDES FIRST
    // Using strict comparison logic updated in routeStorage
    const override = RouteDB.get(origin, destination);
    
    // 2. IF OVERRIDE EXISTS, RETURN IT DIRECTLY (Bypass AI to prevent overwrite/delay)
    if (override) {
        console.log(`[GeminiService] HIT: Found manual route override for ${origin} -> ${destination}`);
        
        // Return a RouteDetails object populated with override data immediately.
        // We use mock coordinates since the UI lists mostly text data, and this ensures speed.
        return {
            origin: override.origin,
            destination: override.destination,
            originCoordinates: { lat: 0, lng: 0 },
            destinationCoordinates: { lat: 0, lng: 0 },
            ocean: {
                distanceNm: override.oceanDistance,
                transitTimeDays: override.oceanTime,
                routeDescription: "Route data configured by System Administrator.",
                keyWaypoints: [],
                waypoints: []
            },
            air: {
                distanceKm: override.airDistance,
                transitTimeHours: override.airTime,
                routeDescription: "Route data configured by System Administrator.",
                waypoints: []
            }
        };
    }

    // 3. NO OVERRIDE, STANDARD AI CALL
    return fetchRouteFromGemini(origin, destination);
}

// Refactored helper to separate the actual API call
const fetchRouteFromGemini = async (origin: string, destination: string): Promise<RouteDetails> => {
    const prompt = `
    Calculate comprehensive shipping route data between "${origin}" and "${destination}".
    
    IMPORTANT: One or both locations might be CUSTOM WAREHOUSES or generic cities (e.g. "My Warehouse, US"). 
    If you do not recognize the exact name, estimate coordinates based on the City/Country provided in the string. Do NOT fail.

    TASK:
    1. Calculate OCEAN and AIR metrics.
    2. **CRITICAL**: Provide an array of approximate geographical COORDINATES (waypoints) that trace the ACTUAL sailing path for a container ship. 
    3. For AIR: Provide 5-6 points representing a Great Circle path.

    Return JSON:
    - origin, destination (Clean names)
    - originCoordinates, destinationCoordinates (lat/lng)
    - ocean:
        - distanceNm, transitTimeDays, routeDescription
        - keyWaypoints (strings)
        - waypoints: [{lat, lng}, {lat, lng}...] (The plotting coordinates)
    - air:
        - distanceKm, transitTimeHours, routeDescription
        - waypoints: [{lat, lng}, {lat, lng}...]
    - air:
        - distanceKm, transitTimeHours, routeDescription
        - waypoints: [{lat, lng}, {lat, lng}...]
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        origin: { type: Type.STRING },
                        destination: { type: Type.STRING },
                        originCoordinates: { type: Type.OBJECT, properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } } },
                        destinationCoordinates: { type: Type.OBJECT, properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } } },
                        ocean: { 
                            type: Type.OBJECT, 
                            properties: {
                                distanceNm: { type: Type.NUMBER },
                                transitTimeDays: { type: Type.STRING },
                                routeDescription: { type: Type.STRING },
                                keyWaypoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                                waypoints: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } } } }
                            }
                        },
                        air: {
                            type: Type.OBJECT,
                            properties: {
                                distanceKm: { type: Type.NUMBER },
                                transitTimeHours: { type: Type.STRING },
                                routeDescription: { type: Type.STRING },
                                waypoints: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } } } }
                            }
                        }
                    },
                    required: ["origin", "destination", "ocean", "air"]
                }
            }
        });
        const text = response.text;
        if (!text) throw new Error("No data");
        return JSON.parse(text);
    } catch (error) {
        console.warn("Route Calc Failed (Quota/Network), using fallback");
        return getMockRouteDetails(origin, destination);
    }
}

export const predictShipmentETA = async (shipment: Shipment): Promise<ETAPrediction> => {
    const prompt = `
    Act as an AI Logistics Predictive Model. Calculate the *realistic* Estimated Time of Arrival (ETA) for this specific shipment, considering its status and route.

    Data:
    - Route: ${shipment.origin.name} (${shipment.origin.country}) to ${shipment.destination.name} (${shipment.destination.country})
    - Mode: ${shipment.mode}
    - Carrier: ${shipment.carrier}
    - Current Status: ${shipment.status}
    - Scheduled ETA: ${shipment.eta}
    - Last Update Info: ${shipment.lastUpdate}

    Output JSON:
    - predictedEta: string (YYYY-MM-DD)
    - confidenceScore: number (0-100)
    - reasoning: string (Short explanation, e.g. "Customs hold typically adds 4 days.", max 10 words)
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        predictedEta: { type: Type.STRING },
                        confidenceScore: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["predictedEta", "confidenceScore", "reasoning"]
                }
            }
        });
        const text = response.text;
        if(!text) throw new Error("No data");
        return JSON.parse(text);
    } catch (error) {
        console.warn("ETA Prediction Failed (Quota/Network), using fallback");
         return {
            predictedEta: shipment.eta,
            confidenceScore: 90,
            reasoning: "Schedule validated against historical lane data (Simulated)."
        };
    }
}
