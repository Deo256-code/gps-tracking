let map;
let trackerMarker;
let accuracyCircle;

let currentPosition = null;


/* ================================
   INITIALIZE MAP
================================ */

function initializeMap() {

    map = L.map("map").setView(
        [0.3476, 32.5825],
        13
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);
}


/* ================================
   GET LATEST THINGSPEAK DATA
================================ */

async function getLatestData() {

    const url =
        `https://api.thingspeak.com/channels/${CONFIG.GPS_CHANNEL}/feeds/last.json`;


    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("ThingSpeak request failed");
        }

        const data = await response.json();

        processGPSData(data);

    } catch (error) {

        console.error(error);

        document.getElementById(
            "connectionStatus"
        ).textContent = "Connection Error";

    }
}


/* ================================
   PROCESS GPS DATA
================================ */

function processGPSData(data) {

    if (!data) {
        return;
    }


    const latitude =
        parseFloat(
            data[`field${CONFIG.FIELDS.latitude}`]
        );


    const longitude =
        parseFloat(
            data[`field${CONFIG.FIELDS.longitude}`]
        );


    const speed =
        parseFloat(
            data[`field${CONFIG.FIELDS.speed}`]
        );


    const battery =
        parseFloat(
            data[`field${CONFIG.FIELDS.battery}`]
        );


    const gsm =
        data[`field${CONFIG.FIELDS.gsm}`];


    const status =
        data[`field${CONFIG.FIELDS.status}`];


    /*
       Make sure coordinates are valid
    */

    if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
    ) {

        console.warn(
            "Invalid GPS coordinates"
        );

        return;
    }


    currentPosition = [
        latitude,
        longitude
    ];


    updateDashboard(
        latitude,
        longitude,
        speed,
        battery,
        gsm,
        status,
        data.created_at
    );


    updateMap(
        latitude,
        longitude
    );
}


/* ================================
   UPDATE DASHBOARD
================================ */

function updateDashboard(
    latitude,
    longitude,
    speed,
    battery,
    gsm,
    status,
    timestamp
) {

    document.getElementById(
        "latitude"
    ).textContent =
        latitude.toFixed(6);


    document.getElementById(
        "longitude"
    ).textContent =
        longitude.toFixed(6);


    document.getElementById(
        "speed"
    ).textContent =
        Number.isNaN(speed)
            ? "--"
            : speed.toFixed(1);


    document.getElementById(
        "battery"
    ).textContent =
        Number.isNaN(battery)
            ? "--"
            : battery.toFixed(0);


    document.getElementById(
        "gsm"
    ).textContent =
        gsm || "--";


    document.getElementById(
        "gpsStatus"
    ).textContent =
        status || "UNKNOWN";


    document.getElementById(
        "trackerStatus"
    ).textContent =
        status || "GPS ONLINE";


    document.getElementById(
        "connectionStatus"
    ).textContent =
        "Tracker Online";


    if (timestamp) {

        const date =
            new Date(timestamp);

        document.getElementById(
            "lastUpdate"
        ).textContent =
            "Updated " +
            date.toLocaleTimeString();

    }


    updateDataAge(timestamp);
}


/* ================================
   MAP MARKER
================================ */

function updateMap(
    latitude,
    longitude
) {

    const position = [
        latitude,
        longitude
    ];


    if (!trackerMarker) {

        trackerMarker =
            L.marker(position)
                .addTo(map)
                .bindPopup(
                    "<b>SEALHOME GPS Tracker</b>"
                );

        map.setView(
            position,
            16
        );

    } else {

        trackerMarker.setLatLng(
            position
        );
    }
}


/* ================================
   CENTER MAP
================================ */

document
    .getElementById("centerButton")
    .addEventListener(
        "click",
        function () {

            if (currentPosition) {

                map.setView(
                    currentPosition,
                    17
                );

            }

        }
    );


/* ================================
   DATA AGE
================================ */

function updateDataAge(timestamp) {

    if (!timestamp) {
        return;
    }


    const updateTime =
        new Date(timestamp);


    function refreshAge() {

        const now =
            new Date();


        const seconds =
            Math.floor(
                (now - updateTime) / 1000
            );


        let text;


        if (seconds < 60) {

            text =
                `${seconds} seconds ago`;

        } else {

            const minutes =
                Math.floor(
                    seconds / 60
                );

            text =
                `${minutes} minutes ago`;
        }


        document.getElementById(
            "dataAge"
        ).textContent = text;
    }


    refreshAge();

    setInterval(
        refreshAge,
        1000
    );
}


/* ================================
   START APPLICATION
================================ */

initializeMap();

getLatestData();


setInterval(
    getLatestData,
    CONFIG.UPDATE_INTERVAL
);
