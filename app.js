// ============================================================
// SEALHOME GPS TRACKER
// LIVE DASHBOARD + CUSTOM GEOFENCE
// ============================================================

let map;
let trackerMarker;
let trailLine;
let geofenceCircle;

let trailPoints = [];
let latestPosition = null;

let currentGeofence = {
    latitude: 0.341950,
    longitude: 32.644957,
    radius: 100
};

let pickingGeofence = false;


// ============================================================
// MAP INITIALIZATION
// ============================================================

function initializeMap() {

    const fence = currentGeofence;

    map = L.map("map", {
        zoomControl: true,
        attributionControl: true
    });


    // OpenStreetMap

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    // Initial map position

    map.setView(
        [
            fence.latitude,
            fence.longitude
        ],
        15
    );


    // Geofence

    geofenceCircle = L.circle(
        [
            fence.latitude,
            fence.longitude
        ],
        {
            radius: fence.radius,

            color: "#7c3aed",

            fillColor: "#a855f7",

            fillOpacity: 0.12,

            weight: 2
        }
    ).addTo(map);


    updateGeofencePopup();


    // Tracking trail

    trailLine = L.polyline(
        [],
        {
            color: "#2563eb",
            weight: 4,
            opacity: 0.75
        }
    ).addTo(map);


    // Map click for geofence selection

    map.on("click", function (event) {

        if (!pickingGeofence) {
            return;
        }

        const lat = event.latlng.lat;
        const lng = event.latlng.lng;

        setGeofenceCenter(lat, lng);

        pickingGeofence = false;

        const overlay =
            document.getElementById("mapPickOverlay");

        if (overlay) {
            overlay.style.display = "none";
        }

        const button =
            document.getElementById("pickGeofenceButton");

        if (button) {
            button.textContent = "⊙ Pick Center on Map";
        }

        showGeofenceMessage(
            "Geofence center selected.",
            "success"
        );
    });

}


// ============================================================
// GEOFENCE POPUP
// ============================================================

function updateGeofencePopup() {

    if (!geofenceCircle) {
        return;
    }

    geofenceCircle.bindPopup(
        "<strong>SEALHOME Geofence</strong><br>" +
        "Radius: " +
        Math.round(currentGeofence.radius) +
        " m<br>" +
        "Latitude: " +
        currentGeofence.latitude.toFixed(6) +
        "<br>" +
        "Longitude: " +
        currentGeofence.longitude.toFixed(6)
    );
}


// ============================================================
// TRACKER ICON
// ============================================================

function createTrackerIcon() {

    return L.divIcon({

        className: "tracker-marker",

        html: `
            <div style="
                width:24px;
                height:24px;
                background:#2563eb;
                border:4px solid white;
                border-radius:50%;
                box-shadow:0 2px 12px rgba(0,0,0,.35);
                position:relative;
            ">
                <div style="
                    position:absolute;
                    width:40px;
                    height:40px;
                    border-radius:50%;
                    border:2px solid #2563eb;
                    opacity:.25;
                    left:-12px;
                    top:-12px;
                "></div>
            </div>
        `,

        iconSize: [24, 24],

        iconAnchor: [12, 12]
    });

}


// ============================================================
// FETCH THINGSPEAK GPS DATA
// ============================================================

async function fetchTrackerData() {

    const channel =
        CONFIG.THINGSPEAK_CHANNEL_ID;

    const url =
        `https://api.thingspeak.com/channels/${channel}/feeds.json` +
        `?results=${CONFIG.TRAIL_POINTS}`;

    try {

        const response =
            await fetch(url, {
                cache: "no-store"
            });

        if (!response.ok) {

            throw new Error(
                "ThingSpeak HTTP " +
                response.status
            );

        }

        const data =
            await response.json();

        if (
            !data.feeds ||
            data.feeds.length === 0
        ) {

            throw new Error(
                "No GPS data available"
            );

        }

        processThingSpeakData(
            data.feeds
        );

        setConnection(true);

    } catch (error) {

        console.error(
            "Tracker error:",
            error
        );

        setConnection(false);
    }

}


// ============================================================
// PROCESS THINGSPEAK DATA
// ============================================================

function processThingSpeakData(feeds) {

    const validPoints = [];

    feeds.forEach(feed => {

        const lat =
            parseFloat(feed.field1);

        const lng =
            parseFloat(feed.field2);

        if (
            !isNaN(lat) &&
            !isNaN(lng)
        ) {

            validPoints.push({

                lat: lat,

                lng: lng,

                speed:
                    parseFloat(
                        feed.field3
                    ) || 0,

                battery:
                    parseFloat(
                        feed.field4
                    ),

                gsm:
                    parseInt(
                        feed.field5
                    ),

                status:
                    parseInt(
                        feed.field6
                    ),

                time:
                    new Date(
                        feed.created_at
                    )
            });
        }

    });


    if (
        validPoints.length === 0
    ) {
        return;
    }


    trailPoints =
        validPoints;


    const latest =
        validPoints[
            validPoints.length - 1
        ];


    latestPosition =
        latest;


    updateTrackerMarker(latest);

    updateTrail(validPoints);

    updateDashboard(latest);

    updateGeofence(latest);

}


// ============================================================
// UPDATE TRACKER MARKER
// ============================================================

function updateTrackerMarker(position) {

    const lat = position.lat;
    const lng = position.lng;

    if (!trackerMarker) {

        trackerMarker =
            L.marker(
                [
                    lat,
                    lng
                ],
                {
                    icon:
                        createTrackerIcon(),

                    zIndexOffset:
                        1000
                }
            ).addTo(map);


        trackerMarker.bindPopup(
            "<strong>SEALHOME GPS TRACKER</strong>"
        );

    } else {

        trackerMarker.setLatLng(
            [
                lat,
                lng
            ]
        );

    }

}


// ============================================================
// UPDATE TRAIL
// ============================================================

function updateTrail(points) {

    const coordinates =
        points.map(
            point => [
                point.lat,
                point.lng
            ]
        );

    trailLine.setLatLngs(
        coordinates
    );


    document.getElementById(
        "trackPoints"
    ).textContent =
        points.length;

}


// ============================================================
// UPDATE DASHBOARD
// ============================================================

function updateDashboard(data) {

    // SPEED

    document.getElementById(
        "speed"
    ).textContent =
        formatNumber(
            data.speed,
            1
        ) +
        " km/h";


    // BATTERY

    const batteryElement =
        document.getElementById(
            "battery"
        );

    if (
        isNaN(data.battery) ||
        data.battery < 0
    ) {

        batteryElement.textContent =
            "N/A";

    } else {

        batteryElement.textContent =
            Math.round(
                data.battery
            ) +
            "%";
    }


    // GSM

    updateGsm(
        data.gsm
    );


    // GPS STATUS

    const gpsElement =
        document.getElementById(
            "gpsStatus"
        );

    if (
        data.status === 1
    ) {

        gpsElement.textContent =
            "FIXED";

        gpsElement.className =
            "status-good";

    } else {

        gpsElement.textContent =
            "SEARCHING";

        gpsElement.className =
            "";
    }


    // LOCATION

    document.getElementById(
        "latitude"
    ).textContent =
        data.lat.toFixed(6);


    document.getElementById(
        "longitude"
    ).textContent =
        data.lng.toFixed(6);


    // TIME

    const localTime =
        data.time.toLocaleTimeString();


    document.getElementById(
        "updateTime"
    ).textContent =
        localTime;


    document.getElementById(
        "lastUpdate"
    ).textContent =
        "Last update: " +
        localTime;


    document.getElementById(
        "mapStatus"
    ).textContent =
        "GPS FIX • " +
        localTime;

}


// ============================================================
// GSM DISPLAY
// ============================================================

function updateGsm(signal) {

    const gsmElement =
        document.getElementById(
            "gsm"
        );

    const fill =
        document.getElementById(
            "signalFill"
        );


    if (
        isNaN(signal) ||
        signal === 99
    ) {

        gsmElement.textContent =
            "UNKNOWN";

        fill.style.width =
            "0%";

        return;
    }


    const percentage =
        Math.max(
            0,
            Math.min(
                100,
                (signal / 31) * 100
            )
        );


    gsmElement.textContent =
        signal +
        " / 31";


    fill.style.width =
        percentage +
        "%";
}


// ============================================================
// GEOFENCE DISPLAY
// ============================================================

function updateGeofence(position) {

    const distance =
        calculateDistance(
            position.lat,
            position.lng,
            currentGeofence.latitude,
            currentGeofence.longitude
        );


    document.getElementById(
        "geofenceRadius"
    ).textContent =
        Math.round(
            currentGeofence.radius
        ) +
        " m";


    document.getElementById(
        "geofenceDistance"
    ).textContent =
        formatDistance(
            distance
        );


    const badge =
        document.getElementById(
            "geofenceBadge"
        );


    if (
        distance <= currentGeofence.radius
    ) {

        badge.textContent =
            "INSIDE";

        badge.style.background =
            "#dcfce7";

        badge.style.color =
            "#166534";

    } else {

        badge.textContent =
            "OUTSIDE";

        badge.style.background =
            "#fee2e2";

        badge.style.color =
            "#991b1b";
    }

}


// ============================================================
// HAVERSINE DISTANCE
// ============================================================

function calculateDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const R =
        6371000;


    const dLat =
        (lat2 - lat1) *
        Math.PI /
        180;


    const dLng =
        (lng2 - lng1) *
        Math.PI /
        180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)

        +

        Math.cos(
            lat1 *
            Math.PI /
            180
        )

        *

        Math.cos(
            lat2 *
            Math.PI /
            180
        )

        *

        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


// ============================================================
// SET GEOFENCE CENTER
// ============================================================

function setGeofenceCenter(
    latitude,
    longitude
) {

    currentGeofence.latitude =
        parseFloat(latitude);

    currentGeofence.longitude =
        parseFloat(longitude);


    const latInput =
        document.getElementById(
            "geofenceLat"
        );

    const lngInput =
        document.getElementById(
            "geofenceLng"
        );


    if (latInput) {

        latInput.value =
            currentGeofence.latitude.toFixed(6);
    }


    if (lngInput) {

        lngInput.value =
            currentGeofence.longitude.toFixed(6);
    }


    updateGeofenceCircle();

}


// ============================================================
// UPDATE GEOFENCE CIRCLE
// ============================================================

function updateGeofenceCircle() {

    if (!geofenceCircle) {
        return;
    }


    geofenceCircle.setLatLng(
        [
            currentGeofence.latitude,
            currentGeofence.longitude
        ]
    );


    geofenceCircle.setRadius(
        currentGeofence.radius
    );


    updateGeofencePopup();


    if (latestPosition) {

        updateGeofence(
            latestPosition
        );
    }

}


// ============================================================
// LOAD GEOFENCE INTO UI
// ============================================================

function loadGeofenceInputs() {

    const latInput =
        document.getElementById(
            "geofenceLat"
        );

    const lngInput =
        document.getElementById(
            "geofenceLng"
        );

    const radiusInput =
        document.getElementById(
            "geofenceRadiusInput"
        );


    if (latInput) {

        latInput.value =
            currentGeofence.latitude.toFixed(6);
    }


    if (lngInput) {

        lngInput.value =
            currentGeofence.longitude.toFixed(6);
    }


    if (radiusInput) {

        radiusInput.value =
            Math.round(
                currentGeofence.radius
            );
    }

}


// ============================================================
// GET GEOFENCE FROM UI
// ============================================================

function readGeofenceInputs() {

    const lat =
        parseFloat(
            document.getElementById(
                "geofenceLat"
            ).value
        );


    const lng =
        parseFloat(
            document.getElementById(
                "geofenceLng"
            ).value
        );


    const radius =
        parseFloat(
            document.getElementById(
                "geofenceRadiusInput"
            ).value
        );


    if (
        isNaN(lat) ||
        isNaN(lng) ||
        isNaN(radius)
    ) {

        throw new Error(
            "Please enter valid geofence values."
        );
    }


    if (
        lat < -90 ||
        lat > 90
    ) {

        throw new Error(
            "Latitude must be between -90 and 90."
        );
    }


    if (
        lng < -180 ||
        lng > 180
    ) {

        throw new Error(
            "Longitude must be between -180 and 180."
        );
    }


    if (
        radius < 10 ||
        radius > 100000
    ) {

        throw new Error(
            "Radius must be between 10 m and 100 km."
        );
    }


    currentGeofence = {
        latitude: lat,
        longitude: lng,
        radius: radius
    };


    updateGeofenceCircle();

}


// ============================================================
// USE CURRENT TRACKER LOCATION
// ============================================================

function useTrackerLocation() {

    if (!latestPosition) {

        showGeofenceMessage(
            "Tracker location is not available yet.",
            "error"
        );

        return;
    }


    setGeofenceCenter(
        latestPosition.lat,
        latestPosition.lng
    );


    showGeofenceMessage(
        "Tracker location loaded as geofence center.",
        "success"
    );

}


// ============================================================
// PICK GEOFENCE CENTER ON MAP
// ============================================================

function startMapGeofencePicker() {

    if (pickingGeofence) {

        pickingGeofence = false;

        const overlay =
            document.getElementById(
                "mapPickOverlay"
            );

        if (overlay) {
            overlay.style.display =
                "none";
        }

        return;
    }


    pickingGeofence = true;


    const overlay =
        document.getElementById(
            "mapPickOverlay"
        );

    if (overlay) {

        overlay.style.display =
            "flex";
    }


    const button =
        document.getElementById(
            "pickGeofenceButton"
        );

    if (button) {

        button.textContent =
            "✕ Cancel Map Selection";
    }


    showGeofenceMessage(
        "Click anywhere on the map to select the geofence center.",
        "info"
    );

}


// ============================================================
// RADIUS MINUS
// ============================================================

function decreaseRadius() {

    const input =
        document.getElementById(
            "geofenceRadiusInput"
        );

    if (!input) {
        return;
    }


    let radius =
        parseFloat(input.value) || 100;


    radius -= 10;


    if (radius < 10) {
        radius = 10;
    }


    input.value =
        Math.round(radius);


    currentGeofence.radius =
        radius;


    updateGeofenceCircle();

}


// ============================================================
// RADIUS PLUS
// ============================================================

function increaseRadius() {

    const input =
        document.getElementById(
            "geofenceRadiusInput"
        );

    if (!input) {
        return;
    }


    let radius =
        parseFloat(input.value) || 100;


    radius += 10;


    if (radius > 100000) {
        radius = 100000;
    }


    input.value =
        Math.round(radius);


    currentGeofence.radius =
        radius;


    updateGeofenceCircle();

}


// ============================================================
// SAVE GEOFENCE TO THINGSPEAK
// ============================================================

async function saveGeofence() {

    try {

        readGeofenceInputs();

    } catch (error) {

        showGeofenceMessage(
            error.message,
            "error"
        );

        return;
    }


    const status =
        document.getElementById(
            "geofenceSaveStatus"
        );


    const message =
        document.getElementById(
            "geofenceMessage"
        );


    if (status) {
        status.textContent =
            "SAVING...";
    }


    if (message) {
        message.textContent =
            "Sending geofence configuration...";
    }


    /*
     * The CONFIG object must contain:
     *
     * GEOFENCE_CONFIG_CHANNEL_ID
     * GEOFENCE_CONFIG_WRITE_API_KEY
     *
     */


    const channel =
        CONFIG.GEOFENCE_CONFIG_CHANNEL_ID;


    const apiKey =
        CONFIG.GEOFENCE_CONFIG_WRITE_API_KEY;


    if (
        !channel ||
        !apiKey
    ) {

        showGeofenceMessage(
            "Geofence ThingSpeak configuration is missing in config.js.",
            "error"
        );

        if (status) {
            status.textContent =
                "CONFIG ERROR";
        }

        return;
    }


    const url =
        "https://api.thingspeak.com/update" +
        "?api_key=" +
        encodeURIComponent(apiKey) +
        "&field1=" +
        encodeURIComponent(
            currentGeofence.latitude
        ) +
        "&field2=" +
        encodeURIComponent(
            currentGeofence.longitude
        ) +
        "&field3=" +
        encodeURIComponent(
            currentGeofence.radius
        );


    try {

        const response =
            await fetch(url, {
                method: "GET",
                cache: "no-store"
            });


        const result =
            await response.text();


        console.log(
            "Geofence ThingSpeak response:",
            result
        );


        if (
            !response.ok ||
            result.trim() === "0"
        ) {

            throw new Error(
                "ThingSpeak rejected the geofence update."
            );
        }


        if (status) {

            status.textContent =
                "SAVED";
        }


        showGeofenceMessage(
            "Geofence saved successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Geofence save error:",
            error
        );


        if (status) {

            status.textContent =
                "FAILED";
        }


        showGeofenceMessage(
            "Could not save geofence: " +
            error.message,
            "error"
        );
    }

}


// ============================================================
// LOAD GEOFENCE FROM CONFIG CHANNEL
// ============================================================

async function loadGeofenceFromThingSpeak() {

    const channel =
        CONFIG.GEOFENCE_CONFIG_CHANNEL_ID;


    const readKey =
        CONFIG.GEOFENCE_CONFIG_READ_API_KEY;


    if (!channel) {

        console.warn(
            "No geofence config channel configured."
        );

        return;
    }


    let url =
        `https://api.thingspeak.com/channels/${channel}/feeds/last.json`;


    if (readKey) {

        url +=
            "?api_key=" +
            encodeURIComponent(
                readKey
            );
    }


    try {

        const response =
            await fetch(
                url,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        const lat =
            parseFloat(
                data.field1
            );


        const lng =
            parseFloat(
                data.field2
            );


        const radius =
            parseFloat(
                data.field3
            );


        if (
            isNaN(lat) ||
            isNaN(lng) ||
            isNaN(radius)
        ) {

            throw new Error(
                "Invalid geofence configuration."
            );
        }


        currentGeofence = {

            latitude: lat,

            longitude: lng,

            radius: radius

        };


        loadGeofenceInputs();

        updateGeofenceCircle();


        console.log(
            "Geofence loaded:",
            currentGeofence
        );


        showGeofenceMessage(
            "Geofence configuration loaded.",
            "success"
        );


    } catch (error) {

        console.error(
            "Geofence load error:",
            error
        );


        /*
         * Keep the local/default geofence
         * if the private channel cannot be read.
         */

        loadGeofenceInputs();
    }

}


// ============================================================
// SHOW GEOFENCE MESSAGE
// ============================================================

function showGeofenceMessage(
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            "geofenceMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "geofence-message " +
        type;

}


// ============================================================
// RESET GEOFENCE
// ============================================================

function resetGeofence() {

    if (
        !CONFIG.GEOFENCE
    ) {
        return;
    }


    currentGeofence = {

        latitude:
            CONFIG.GEOFENCE.latitude,

        longitude:
            CONFIG.GEOFENCE.longitude,

        radius:
            CONFIG.GEOFENCE.radius

    };


    loadGeofenceInputs();

    updateGeofenceCircle();


    showGeofenceMessage(
        "Geofence reset to default settings.",
        "info"
    );

}


// ============================================================
// CONNECTION STATUS
// ============================================================

function setConnection(
    connected
) {

    const text =
        document.getElementById(
            "connectionText"
        );


    const dot =
        document.querySelector(
            ".status-dot"
        );


    if (connected) {

        text.textContent =
            "ThingSpeak connected";

        dot.style.background =
            "#16a34a";


        document.getElementById(
            "mapStatus"
        ).textContent =
            "LIVE";

    } else {

        text.textContent =
            "Connection lost";

        dot.style.background =
            "#ef4444";


        document.getElementById(
            "mapStatus"
        ).textContent =
            "OFFLINE";
    }

}


// ============================================================
// NUMBER FORMAT
// ============================================================

function formatNumber(
    value,
    decimals
) {

    if (
        isNaN(value)
    ) {

        return "--";
    }


    return Number(
        value
    ).toFixed(
        decimals
    );

}


// ============================================================
// DISTANCE FORMAT
// ============================================================

function formatDistance(
    distance
) {

    if (
        distance < 1000
    ) {

        return (
            Math.round(
                distance
            ) +
            " m"
        );
    }


    return (
        (distance / 1000)
            .toFixed(2) +
        " km"
    );

}


// ============================================================
// CENTER MAP
// ============================================================

function centerTracker() {

    if (
        !latestPosition
    ) {

        return;
    }


    map.setView(

        [
            latestPosition.lat,
            latestPosition.lng
        ],

        17,

        {
            animate: true
        }

    );

}


// ============================================================
// REFRESH BUTTON
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeMap();

        loadGeofenceInputs();

        loadGeofenceFromThingSpeak();

        fetchTrackerData();


        // Refresh GPS data

        setInterval(
            fetchTrackerData,
            CONFIG.REFRESH_INTERVAL
        );


        // Refresh geofence configuration

        setInterval(
            loadGeofenceFromThingSpeak,
            60000
        );


        // Center tracker

        const centerButton =
            document.getElementById(
                "centerButton"
            );

        if (centerButton) {

            centerButton.addEventListener(
                "click",
                centerTracker
            );
        }


        // Refresh

        const refreshButton =
            document.getElementById(
                "refreshButton"
            );

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                fetchTrackerData
            );
        }


        // Use tracker location

        const useTrackerButton =
            document.getElementById(
                "useTrackerLocation"
            );

        if (useTrackerButton) {

            useTrackerButton.addEventListener(
                "click",
                useTrackerLocation
            );
        }


        // Pick on map

        const pickButton =
            document.getElementById(
                "pickGeofenceButton"
            );

        if (pickButton) {

            pickButton.addEventListener(
                "click",
                startMapGeofencePicker
            );
        }


        // Cancel map selection

        const cancelPick =
            document.getElementById(
                "cancelMapPick"
            );

        if (cancelPick) {

            cancelPick.addEventListener(
                "click",
                startMapGeofencePicker
            );
        }


        // Save geofence

        const saveButton =
            document.getElementById(
                "saveGeofenceButton"
            );

        if (saveButton) {

            saveButton.addEventListener(
                "click",
                saveGeofence
            );
        }


        // Reset geofence

        const resetButton =
            document.getElementById(
                "resetGeofenceButton"
            );

        if (resetButton) {

            resetButton.addEventListener(
                "click",
                resetGeofence
            );
        }


        // Radius minus

        const minusButton =
            document.getElementById(
                "radiusMinus"
            );

        if (minusButton) {

            minusButton.addEventListener(
                "click",
                decreaseRadius
            );
        }


        // Radius plus

        const plusButton =
            document.getElementById(
                "radiusPlus"
            );

        if (plusButton) {

            plusButton.addEventListener(
                "click",
                increaseRadius
            );
        }


        // Radius manual editing

        const radiusInput =
            document.getElementById(
                "geofenceRadiusInput"
            );

        if (radiusInput) {

            radiusInput.addEventListener(
                "input",
                function () {

                    const value =
                        parseFloat(
                            this.value
                        );

                    if (
                        !isNaN(value) &&
                        value >= 10 &&
                        value <= 100000
                    ) {

                        currentGeofence.radius =
                            value;

                        updateGeofenceCircle();
                    }

                }
            );
        }


        // Latitude manual editing

        const latInput =
            document.getElementById(
                "geofenceLat"
            );

        if (latInput) {

            latInput.addEventListener(
                "input",
                function () {

                    const value =
                        parseFloat(
                            this.value
                        );

                    if (!isNaN(value)) {

                        currentGeofence.latitude =
                            value;

                        updateGeofenceCircle();
                    }

                }
            );
        }


        // Longitude manual editing

        const lngInput =
            document.getElementById(
                "geofenceLng"
            );

        if (lngInput) {

            lngInput.addEventListener(
                "input",
                function () {

                    const value =
                        parseFloat(
                            this.value
                        );

                    if (!isNaN(value)) {

                        currentGeofence.longitude =
                            value;

                        updateGeofenceCircle();
                    }

                }
            );
        }


        // Initial configuration

        loadGeofenceInputs();

    }
);
