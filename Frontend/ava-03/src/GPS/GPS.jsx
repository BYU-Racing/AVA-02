import React from "react";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from 'react-leaflet'

//Note: An implementation of the GPS component will be changed over to Leaflet in the future.  Current implementation is just a placeholder
function GPS() {
    return (
        <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={true} style={{height:"100vh", width:"100vw"}}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* <Marker position={[51.505, -0.09]}>
                <Popup>
                    A pretty CSS3 popup. <br /> Easily customizable.
                </Popup>
            </Marker> */}
        </MapContainer>

    );
}

export default GPS;