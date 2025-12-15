
import { GoogleGenAI, Type } from "@google/genai";
import { Shipment, TransportMode, ShipmentStatus, PortDetails, RouteDetails, ETAPrediction } from "../types";
import { RouteDB } from "./routeStorage";

// Initialize Gemini Client
// CRITICAL: process.env.API_KEY is handled by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a Senior Supply Chain Expert and Logistics Risk Analyst with 20 years of experience in cross-border e-commerce logistics (Air, Sea, Land).
Your job is to analyze shipment data and provide concise, actionable insights.
Focus on:
1. Potential delays (weather, port congestion, customs strikes).
2. Route optimization suggestions.
3. Risk assessment based on current geopolitical or seasonal factors.
Keep responses professional, data-driven, and concise.
`;

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
    console.error("Gemini Analysis Failed:", error);
    return {
      riskLevel: "UNKNOWN",
      analysis: "AI Service temporarily unavailable. Please check manual logs.",
      action: "Monitor manually.",
    };
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
    return "Unable to fetch market updates.";
  }
}

// --- NEW FEATURES ---

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
        console.error("Port Fetch Failed", error);
        throw new Error("Could not fetch port details.");
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
        console.error("Congestion Check Failed", error);
        throw new Error("Could not fetch live congestion data.");
    }
}

export const calculateRouteDetails = async (origin: string, destination: string): Promise<RouteDetails> => {
    
    // 1. CHECK "BACKEND" OVERRIDES FIRST
    const override = RouteDB.get(origin, destination);
    
    // 2. IF OVERRIDE EXISTS, USE IT AND MOCK THE REST
    if (override) {
        console.log("Using backend route override for:", origin, destination);
        try {
            // We fetch the AI data to get coordinates + descriptions + waypoints
            const aiData = await fetchRouteFromGemini(origin, destination);
            
            // Overwrite numeric values with Admin settings
            return {
                ...aiData,
                ocean: {
                    ...aiData.ocean,
                    distanceNm: override.oceanDistance,
                    transitTimeDays: override.oceanTime,
                    routeDescription: `(ADMIN OVERRIDE) ${aiData.ocean.routeDescription}`
                },
                air: {
                    ...aiData.air,
                    distanceKm: override.airDistance,
                    transitTimeHours: override.airTime,
                    routeDescription: `(ADMIN OVERRIDE) ${aiData.air.routeDescription}`
                }
            };
        } catch (e) {
            // Fallback if AI fails but we have override data (return 0,0 coords)
             return {
                origin, destination,
                originCoordinates: { lat: 0, lng: 0 },
                destinationCoordinates: { lat: 0, lng: 0 },
                ocean: { distanceNm: override.oceanDistance, transitTimeDays: override.oceanTime, routeDescription: "Manual Route", keyWaypoints: [], waypoints: [] },
                air: { distanceKm: override.airDistance, transitTimeHours: override.airTime, routeDescription: "Manual Route", waypoints: [] }
            };
        }
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
       - e.g., If Shanghai to Rotterdam: include coordinates for South China Sea, Malacca Strait, Indian Ocean, Bab el-Mandeb, Suez Canal, Mediterranean, Gibraltar, English Channel.
       - Do NOT just give a straight line. Give me 6-10 points that roughly form the curve around continents.
    3. For AIR: Provide 5-6 points representing a Great Circle path (arcing towards poles if applicable).

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
        console.error("Route Calc Failed", error);
        throw new Error("Could not calculate route.");
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

    Logic:
    - If status is 'CUSTOMS_HOLD' or 'EXCEPTION', add 3-7 days to the Scheduled ETA.
    - If status is 'IN_TRANSIT' or 'BOOKED', use the Scheduled ETA or adjust slightly based on typical lane delays.
    - Provide a confidence score based on the stability of the status (e.g., 'DELIVERED' is 100%, 'EXCEPTION' is low confidence).

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
        console.error("ETA Prediction Failed", error);
         return {
            predictedEta: shipment.eta,
            confidenceScore: 50,
            reasoning: "AI analysis unavailable, using scheduled date."
        };
    }
}
