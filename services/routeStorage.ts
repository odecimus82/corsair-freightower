
import { RouteOverride, TerminalOption, AppNotification } from '../types';

const ROUTE_STORAGE_KEY = 'freightflow_route_db';
const PORT_STORAGE_KEY = 'freightflow_port_db';
const NOTIFICATION_STORAGE_KEY = 'freightflow_notifications';

// Notification System Service
export const NotificationDB = {
    getAll: (): AppNotification[] => {
        const data = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    add: (note: AppNotification) => {
        const list = NotificationDB.getAll();
        list.unshift(note); // Add to top
        // Keep max 50 notifications
        if (list.length > 50) list.pop();
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(list));
    },

    markAllRead: () => {
        const list = NotificationDB.getAll();
        const updated = list.map(n => ({...n, read: true}));
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
    },

    clear: () => {
         localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    }
};

// Simulate a backend database connection for Routes
export const RouteDB = {
    getAll: (): RouteOverride[] => {
        const data = localStorage.getItem(ROUTE_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    get: (origin: string, destination: string): RouteOverride | undefined => {
        const routes = RouteDB.getAll();
        // Create a unique key for the route
        const id = `${origin}-${destination}`;
        return routes.find(r => r.id === id);
    },

    save: (route: RouteOverride) => {
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
    },

    delete: (id: string) => {
        const routes = RouteDB.getAll();
        const newRoutes = routes.filter(r => r.id !== id);
        localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(newRoutes));
        window.dispatchEvent(new Event('freightflow:update'));
    }
};

// Simulate a backend database connection for Custom Ports
export const PortDB = {
    getAll: (): TerminalOption[] => {
        const data = localStorage.getItem(PORT_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    save: (port: TerminalOption) => {
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
    },

    delete: (value: string) => {
        const ports = PortDB.getAll();
        const newPorts = ports.filter(p => p.value !== value);
        localStorage.setItem(PORT_STORAGE_KEY, JSON.stringify(newPorts));
        window.dispatchEvent(new Event('freightflow:update'));
    }
};
