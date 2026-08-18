// ============================================================
// SEALHOME GPS TRACKER CONFIGURATION
// ============================================================

const CONFIG = {

    // ========================================================
    // GPS / TRACKING CHANNEL
    // ========================================================

    THINGSPEAK_CHANNEL_ID: "3457035",

    // Historical GPS points shown on map
    TRAIL_POINTS: 100,

    // Dashboard refresh interval
    REFRESH_INTERVAL: 15000,


    // ========================================================
    // PRIVATE GEOFENCE CONFIGURATION CHANNEL
    // ========================================================
    //
    // Channel 3457059:
    //
    // Field 1 = Geofence Latitude
    // Field 2 = Geofence Longitude
    // Field 3 = Geofence Radius
    //

    GEOFENCE_CONFIG_CHANNEL_ID: "3457059",

    // IMPORTANT:
    // Replace these with the API keys from ThingSpeak.
    //
    // Do NOT use the GPS channel Write API Key here.

    GEOFENCE_CONFIG_WRITE_API_KEY: "YOUR_GEOFENCE_WRITE_API_KEY",

    GEOFENCE_CONFIG_READ_API_KEY: "YOUR_GEOFENCE_READ_API_KEY",


    // ========================================================
    // DEFAULT GEOFENCE
    // ========================================================
    //
    // Used if the private ThingSpeak channel cannot be read.
    //

    GEOFENCE: {

        latitude: 0.341859,

        longitude: 32.645000,

        radius: 100

    }

};
