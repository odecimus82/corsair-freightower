
import { RouteOverride, TerminalOption, AppNotification } from '../types';

const ROUTE_STORAGE_KEY = 'freightflow_route_db';
const PORT_STORAGE_KEY = 'freightflow_port_db';
const NOTIFICATION_STORAGE_KEY = 'freightflow_notifications';

// Helper to safely parse JSON from localStorage
// Updated to handle SecurityErrors (if storage is disabled) without crashing
const safeParse = <T>(key: string, fallback: T): T => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return fallback;
        const data = window.localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        console.warn(`Storage access failed for ${key}`, e);
        try {
            // Attempt to clear if possible, but ignore if this also fails (e.g. SecurityError)
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key);
            }
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
        return fallback;
    }
};

// Notification System Service
export const NotificationDB = {
    getAll: (): AppNotification[] => {
        return safeParse<AppNotification[]>(NOTIFICATION_STORAGE_KEY, []);
    },

    add: (note: AppNotification) => {
        try {
            const list = NotificationDB.getAll();
            list.unshift(note); // Add to top
            // Keep max 50 notifications
            if (list.length > 50) list.pop();
            localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
            console.warn("Failed to save notification", e);
        }
    },

    markAllRead: () => {
        try {
            const list = NotificationDB.getAll();
            const updated = list.map(n => ({...n, read: true}));
            localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.warn("Failed to update notifications", e);
        }
    },

    clear: () => {
        try {
            localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
        } catch (e) {
             console.warn("Failed to clear notifications", e);
        }
    }
};

// Simulate a backend database connection for Routes
export const RouteDB = {
    getAll: (): RouteOverride[] => {
        return safeParse<RouteOverride[]>(ROUTE_STORAGE_KEY, []);
    },

    get: (origin: string, destination: string): RouteOverride | undefined => {
        const routes = RouteDB.getAll();
        // Create a unique key for the route
        const id = `${origin}-${destination}`;
        return routes.find(r => r.id === id);
    },

    save: (route: RouteOverride) => {
        try {
            const routes = RouteDB.getAll();
            const existingIndex = routes.findIndex(r => r.id === route.id);
            
            let isUpdate = false;
            if (existingIndex >= 0) {
                routes[existingIndex] = route;
                isUpdate = true;
            } else {
                routes.push(route);
            }
            
            localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(routes));

            // Generate Notification
            NotificationDB.add({
                id: Date.now().toString(),
                title: isUpdate ? 'Route Updated' : 'New Route Added',
                message: `${route.origin} → ${route.destination}`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'ROUTE'
            });
            
            // Dispatch event so App.tsx can update the Bell icon immediately
            window.dispatchEvent(new Event('freightflow:update'));
        } catch (e) {
            console.warn("Failed to save route", e);
        }
    },

    delete: (id: string) => {
        try {
            const routes = RouteDB.getAll();
            const newRoutes = routes.filter(r => r.id !== id);
            localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(newRoutes));
            window.dispatchEvent(new Event('freightflow:update'));
        } catch (e) {
            console.warn("Failed to delete route", e);
        }
    }
};

// Simulate a backend database connection for Custom Ports
export const PortDB = {
    getAll: (): TerminalOption[] => {
        return safeParse<TerminalOption[]>(PORT_STORAGE_KEY, []);
    },

    save: (port: TerminalOption) => {
        try {
            const ports = PortDB.getAll();
            // Check duplicates by value (name)
            const existingIndex = ports.findIndex(p => p.value === port.value);
            
            if (existingIndex >= 0) {
                ports[existingIndex] = port;
            } else {
                ports.push(port);
            }
            
            localStorage.setItem(PORT_STORAGE_KEY, JSON.stringify(ports));

            // Generate Notification
            NotificationDB.add({
                id: Date.now().toString(),
                title: 'Custom Hub Added',
                message: port.label.split(' - ')[0],
                timestamp: new Date().toISOString(),
                read: false,
                type: 'PORT'
            });
            
            // Dispatch event so App.tsx can update the Bell icon immediately
            window.dispatchEvent(new Event('freightflow:update'));
        } catch (e) {
             console.warn("Failed to save port", e);
        }
    },

    delete: (value: string) => {
        try {
            const ports = PortDB.getAll();
            const newPorts = ports.filter(p => p.value !== value);
            localStorage.setItem(PORT_STORAGE_KEY, JSON.stringify(newPorts));
            window.dispatchEvent(new Event('freightflow:update'));
        } catch (e) {
             console.warn("Failed to delete port", e);
        }
    }
};
