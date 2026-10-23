import React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Popup } from 'react-leaflet'
import { TelemetryProvider, useTelemetryContext } from "../Provider/TelemetryProvider";
import positionMarkerUrl from "../Assets/position-marker.svg";






let storedCoordinates = [];
//Note: An implementation of the GPS component will be changed over to Leaflet in the future.  Current implementation is just a placeholder
function GPS() {
    const telemetryContext = useTelemetryContext();
    const [telemetryData, setTelemetryData] = useState({});
    const [gpsCoordinates, setGpsCoordinates] = useState([40.2488, -111.6495]); // Placeholder coordinates (HBLL)
    const [storedCoordinates, setStoredCoordinates] = useState([]);
    const [enableDrawLines, setEnableDrawLines] = useState(false);

    useEffect(() => {
        if(telemetryContext !== null) {
            setTelemetryData(telemetryContext.telemetryData);
            const newGpsCoordinates = interpretTelemetryData(telemetryContext.telemetryData);
            if(newGpsCoordinates != null) {
                setStoredCoordinates((previousCoordinates) => [...previousCoordinates, newGpsCoordinates]);
                setGpsCoordinates(newGpsCoordinates);
                console.log("Updated GPS Coordinates:", newGpsCoordinates);
            }
        }
    }, [telemetryContext]);


    return (
        <MapContainer center={gpsCoordinates} zoom={18} scrollWheelZoom={true} style={{height:"100vh", width:"100vw"}} maxZoom={24}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxNativeZoom={19}
                maxZoom={24}
            />
            <MapComponent storedCoordinates={storedCoordinates} enableDrawLines={enableDrawLines}/>
            <Marker position={gpsCoordinates} icon={createCustomIcon()}>
                <Popup>
                    Current GPS Coordinates: {gpsCoordinates[1]}, {gpsCoordinates[0]}
                    <button onClick={() => {
                        setEnableDrawLines(!enableDrawLines); 
                        console.log(`Draw Lines ${enableDrawLines ? 'Enabled' : 'Disabled'}`);
                        }}>

                        Draw Lines
                    </button>
                </Popup>
            </Marker>
        </MapContainer>

    );
}

function interpretTelemetryData(telemetryData) {
    // Placeholder function to interpret telemetry data and extract GPS coordinates.
    //Step 1: Check if telemetryData is not null and if it it actually contains telemetry Data
    if(telemetryData !== null && telemetryData.type === "telemetry") {
        //Step 2: Extract GPS coordinates from telemetryData.  This will depend on the structure of the telemetryData.
        if(telemetryData.data != null && telemetryData.id !== null) { //Making sure that a packet is not empty and that it actually contains data
            if(telemetryData.id === 9) { // 9 is the ID for GPS data from the CAN bus.
                // For now, we will just return a placeholder coordinate.
                if(Array.isArray(telemetryData.data) && telemetryData.data.length >= 2) {
                    const dataArray = telemetryData.data;
                    const latLong = [Number(dataArray[1] ?? 0n) / 1e7, Number(dataArray[0] ?? 0n) / 1e7];
                    storedCoordinates.push(latLong);
                    return latLong;

                }
            
            }
        }
    }
    return null;
}

function createCustomIcon() {
    const customIcon = new L.Icon({
        iconUrl: positionMarkerUrl,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
    });

    return customIcon;
}

function MapComponent(storedCoordinates, enableDrawLines) {
    const map = useMap();
    useEffect(() => {
        console.log("Stored Coordinates Updated:", storedCoordinates);
    }, [storedCoordinates, enableDrawLines]);

    let clickCoordinates = null;
    const mapEvents = useMapEvents({
        click: (e) => {
            clickCoordinates = [e.latlng.lat, e.latlng.lng];
            console.log("Map clicked at:", clickCoordinates);
            // L.marker(clickCoordinates).addTo(map).bindPopup(`Clicked at: ${clickCoordinates[0]}, ${clickCoordinates[1]}`).openPopup();
        },

    });
    if(map != null) {
        console.log("MapComponent rendered");

    }

}


//testestest this is test programming oh man this monitor looks really good.  I am so happy with this monit

export default GPS;