import React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Popup } from 'react-leaflet'
import { TelemetryProvider, useTelemetryContext } from "../Provider/TelemetryProvider";
import positionMarkerUrl from "../Assets/position-marker.svg";






let storedCoordinates = [];
//Note: An implementation of the GPS component will be changed over to Leaflet in the future.  Current implementation is just a placeholder
function GPSMap({ dataSets }) {
  const telemetryContext = useTelemetryContext();
  const [telemetryData, setTelemetryData] = useState({});
  const [gpsCoordinates, setGpsCoordinates] = useState([40.2488, -111.6495]); // Placeholder coordinates (HBLL)
  const [storedCoordinates, setStoredCoordinates] = useState([]);
  const [enableDrawLines, setEnableDrawLines] = useState(false);
  useEffect(() => {
    if (dataSets != null && dataSets.length > 0) {
      console.log("GPSMap dataSets:", dataSets);

      //Now, lets push all the coordinates from the dataSets into the storedCoordinates array.
      const newCoordinates = dataSets?.flatMap((dataSet) => {
        if (dataSet?.data != null && dataSet.data.length > 0) {
          return dataSet.data.map((item) => [item.value.lat, item.value.long]);
        }
        return [];
      });
      if (newCoordinates != null && newCoordinates.length > 0) {
        setStoredCoordinates(newCoordinates);
      }
    }
  }, [dataSets]);

  useEffect(() => {

  }, [dataSets]);

  useEffect(() => {
    if (telemetryContext !== null) {
      setTelemetryData(telemetryContext.telemetryData);
    }
  }, [telemetryContext]);


  return (
    <MapContainer center={gpsCoordinates} zoom={18} scrollWheelZoom={true} style={{ height: "100vh", width: "100vw" }} maxZoom={24}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxNativeZoom={19}
        maxZoom={24}
      />
      <MapComponent storedCoordinates={storedCoordinates} enableDrawLines={enableDrawLines} />
      <Marker position={gpsCoordinates} icon={createCustomIcon()}>
        <Popup>
          Current GPS Coordinates: {gpsCoordinates[1]}, {gpsCoordinates[0]}

        </Popup>
      </Marker>
    </MapContainer>

  );
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

function MapComponent({ storedCoordinates, enableDrawLines }) {
  const map = useMap();
  useEffect(() => {

    //Here, I will draw the polyline on the map.
    if (storedCoordinates != null && storedCoordinates.length > 1) {
      console.log("Drawing a polyline on the map with stored coordinates:", storedCoordinates);
      const polyLine = drawPolyLines(map, storedCoordinates);
    }
  }, [map, storedCoordinates]);

  let clickCoordinates = null;
  const mapEvents = useMapEvents({
    click: (e) => {
      clickCoordinates = [e.latlng.lat, e.latlng.lng];
      console.log("Map clicked at:", clickCoordinates);
      // L.marker(clickCoordinates).addTo(map).bindPopup(`Clicked at: ${clickCoordinates[0]}, ${clickCoordinates[1]}`).openPopup();
    },

  });
  if (map != null) {
    console.log("MapComponent rendered");

  }

}

function drawPolyLines(map, storedCoordinates) {
  if (map != null && storedCoordinates != null && storedCoordinates.length > 1) {
    return L.polyline(storedCoordinates, { color: 'blue' }).addTo(map);
  }
}


//testestest this is test programming oh man this monitor looks really good.  I am so happy with this monit

export default GPSMap;