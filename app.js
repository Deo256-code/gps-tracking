// ============================================================
// SEALHOME GPS TRACKER
// LIVE DASHBOARD
// ============================================================


let map;

let trackerMarker;

let trailLine;

let geofenceCircle;

let trailPoints = [];

let latestPosition = null;


// ============================================================
// MAP INITIALIZATION
// ============================================================

function initializeMap() {

    const fence =
        CONFIG.GEOFENCE;


    map = L.map("map", {

        zoomControl: true,

        attributionControl: true

    });


    // OpenStreetMap

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom: 19,

            attribution:
                '&copy; OpenStreetMap contributors'

        }
    ).addTo(map);


    // --------------------------------------------------------
    // Initial map position
    // --------------------------------------------------------

    map.setView(
        [
            fence.latitude,
            fence.longitude
        ],
        15
    );


    // --------------------------------------------------------
    // Geofence
    // --------------------------------------------------------

    geofenceCircle =
        L.circle(

            [
                fence.latitude,
                fence.longitude
            ],

            {

                radius:
                    fence.radius,

                color:
                    "#7c3aed",

                fillColor:
                    "#a855f7",

                fillOpacity:
                    0.12,

                weight:
                    2

            }

        ).addTo(map);


    geofenceCircle.bindPopup(
        "SEALHOME Geofence<br>" +
        "Radius: " +
        fence.radius +
        " m"
    );


    // --------------------------------------------------------
    // Trail
    // --------------------------------------------------------

    trailLine =
        L.polyline(
            [],
            {

                color:
                    "#2563eb",

                weight:
                    4,

                opacity:
                    0.75

            }
        ).addTo(map);

}


// ============================================================
// TRACKER ICON
// ============================================================

function createTrackerIcon() {

    return L.divIcon({

        className:
            "tracker-marker",

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

        iconSize:
            [24, 24],

        iconAnchor:
            [12, 12]

    });

}


// ============================================================
// FETCH THINGSPEAK DATA
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


        setConnection(
            true
        );


    } catch (error) {

        console.error(
            "Tracker error:",
            error
        );


        setConnection(
            false
        );

    }

}


// ============================================================
// PROCESS THINGSPEAK DATA
// ============================================================

function processThingSpeakData(
    feeds
) {

    const validPoints = [];


    feeds.forEach(
        feed => {

            const lat =
                parseFloat(
                    feed.field1
                );


            const lng =
                parseFloat(
                    feed.field2
                );


            if (
                !isNaN(lat) &&
                !isNaN(lng)
            ) {

                validPoints.push({

                    lat:
                        lat,

                    lng:
                        lng,

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

        }
    );


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


    updateTrackerMarker(
        latest
    );


    updateTrail(
        validPoints
    );


    updateDashboard(
        latest
    );


    updateGeofence(
        latest
    );

}


// ============================================================
// UPDATE TRACKER MARKER
// ============================================================

function updateTrackerMarker(
    position
) {

    const lat =
        position.lat;

    const lng =
        position.lng;


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
            "SEALHOME GPS TRACKER"
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

function updateTrail(
    points
) {

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

function updateDashboard(
    data
) {

    // --------------------------------------------------------
    // SPEED
    // --------------------------------------------------------

    document.getElementById(
        "speed"
    ).textContent =
        formatNumber(
            data.speed,
            1
        ) +
        " km/h";


    // --------------------------------------------------------
    // BATTERY
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // GSM
    // --------------------------------------------------------

    updateGsm(
        data.gsm
    );


    // --------------------------------------------------------
    // GPS STATUS
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // LOCATION
    // --------------------------------------------------------

    document.getElementById(
        "latitude"
    ).textContent =
        data.lat.toFixed(6);


    document.getElementById(
        "longitude"
    ).textContent =
        data.lng.toFixed(6);


    // --------------------------------------------------------
    // TIME
    // --------------------------------------------------------

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

function updateGsm(
    signal
) {

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
// GEOFENCE
// ============================================================

function updateGeofence(
    position
) {

    const fence =
        CONFIG.GEOFENCE;


    const distance =
        calculateDistance(

            position.lat,

            position.lng,

            fence.latitude,

            fence.longitude

        );


    document.getElementById(
        "geofenceRadius"
    ).textContent =
        Math.round(
            fence.radius
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
        distance <= fence.radius
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
            animate:
                true
        }

    );

}


// ============================================================
// REFRESH BUTTON
// ============================================================

document
    .getElementById(
        "refreshButton"
    )
    .addEventListener(
        "click",
        fetchTrackerData
    );


document
    .getElementById(
        "centerButton"
    )
    .addEventListener(
        "click",
        centerTracker
    );


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeMap();

        fetchTrackerData();

        setInterval(
            fetchTrackerData,
            CONFIG.REFRESH_INTERVAL
        );

    }
);
