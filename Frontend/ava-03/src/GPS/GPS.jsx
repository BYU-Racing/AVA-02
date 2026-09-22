import React from "react";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import { TestProvider, useTestContext } from "../Provider/TestContext";







//Note: An implementation of the GPS component will be changed over to Leaflet in the future.  Current implementation is just a placeholder
function GPS() {
    const msgContext = useTestContext();
    const [msg, setMsg] = useState("emptyMessage");
    useEffect(() => {
        console.log("msgContext changed:", msgContext);
        setMsg(msgContext);
}, [msgContext]);

    console.log("msg:", msgContext);
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

export default GPS;