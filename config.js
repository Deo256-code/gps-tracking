const CONFIG = {

    // Public GPS channel
    THINGSPEAK_CHANNEL_ID: "3457035",

    // Number of GPS trail points
    TRAIL_POINTS: 100,

    // Refresh dashboard every 15 seconds
    REFRESH_INTERVAL: 15000,

    // Private geofence configuration channel
    GEOFENCE_CONFIG_CHANNEL_ID: "3457059",

    // This will be our secure backend
    GEOFENCE_API_URL: "YOUR_BACKEND_URL",

    // Default geofence
    GEOFENCE: {
        latitude: 0.341859,
        longitude: 32.645000,
        radius: 100
    }

};
