// ============================================================
// SEALHOME GPS TRACKER CONFIGURATION
// ============================================================

const CONFIG = {

    // ThingSpeak GPS channel
    THINGSPEAK_CHANNEL_ID: "3457035",

    // Number of historical GPS points to display
    TRAIL_POINTS: 100,

    // Refresh interval
    REFRESH_INTERVAL: 15000,

    // --------------------------------------------------------
    // DEFAULT GEOFENCE
    // --------------------------------------------------------
    //
    // These match the default values currently in your ESP32.
    //
    // Later we will connect these automatically to your private
    // ThingSpeak geofence channel through a secure backend.
    //

    GEOFENCE: {

        latitude: 0.341859,

        longitude: 32.645000,

        radius: 100

    }

};
