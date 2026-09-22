import React from "react";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import { TelemetryProvider, useTelemetryContext } from "../Provider/TelemetryProvider";







//Note: An implementation of the GPS component will be changed over to Leaflet in the future.  Current implementation is just a placeholder
function GPS() {
    const telemetryContext = useTelemetryContext();
    const [telemetryData, setTelemetryData] = useState({});
    const [gpsCoordinates, setGpsCoordinates] = useState([40.2488, -111.6495]); // Placeholder coordinates (HBLL)
    useEffect(() => {
        if(telemetryContext !== null) {
            setTelemetryData(telemetryContext.telemetryData);
            const newGpsCoordinates = interpretTelemetryData(telemetryContext.telemetryData);
            if(newGpsCoordinates !== null) {
                setGpsCoordinates(newGpsCoordinates);
            }
        }
    }, [telemetryContext]);

    return (
        <MapContainer center={gpsCoordinates} zoom={18} scrollWheelZoom={true} style={{height:"100vh", width:"100vw"}}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[40.2488, -111.6495]}>
                <Popup>
                    Here is the HBLL.
                </Popup>
            </Marker>
        </MapContainer>

    );
}

function interpretTelemetryData(telemetryData) {
    // Placeholder function to interpret telemetry data and extract GPS coordinates.
    //Step 1: Check if telemetryData is not null and if it it actually contains telemetry Data
    if(telemetryData !== null && telemetryData.type === "telemetry") {
        //For now, We will just log the data to the console and return a placeholder coordinate.
        console.log("Telemetry Data:", telemetryData);
        //Step 2: Extract GPS coordinates from telemetryData.  This will depend on the structure of the telemetryData.
        if(telemetryData.data !== null && telemetryData.id !== null) { //Making sure that a packet is not empty and that it actually contains data
            if(telemetryData.id === 9) { // 9 is the ID for GPS data from the CAN bus.
                // For now, we will just return a placeholder coordinate.
                console.log("GPS Data:", telemetryData.data);
            }
        }
        //For now, we will just return a placeholder coordinate.
        return [40.2488, -111.6495]; // Placeholder coordinates (HBLL)
    }
}

function decodeGpsData(data) {
    // Placeholder function to decode GPS data from telemetry data.
}

export default GPS;