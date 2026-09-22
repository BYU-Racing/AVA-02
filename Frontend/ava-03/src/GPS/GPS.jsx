import React from "react";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import { TelemetryProvider, useTelemetryContext } from "../Provider/TelemetryProvider";







//Note: An implementation of the GPS component will be changed over to Leaflet in the future.  Current implementation is just a placeholder
function GPS() {
    const telemetryContext = useTelemetryContext();
    const [telemetryData, setTelemetryData] = useState({});
    useEffect(() => {
        console.log("telemetryContext:", telemetryContext);
        if(telemetryContext) {
            setTelemetryData(telemetryContext.telemetryData);
        }
    }, [telemetryContext]);

    return (
        <MapContainer center={[40.2488, -111.6495]} zoom={18} scrollWheelZoom={true} style={{height:"100vh", width:"100vw"}}>
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
}

export default GPS;