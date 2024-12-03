import React, { useMemo } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  MarkerClusterer,
} from "@react-google-maps/api";
import { v4 as uuidv4 } from "uuid";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

function GPSMap({ dataSets, right, left }) {
  //TODO: This will work once the markers are recalculated onChange of globalBounds... just use a use effect
  const maxTimestamp = Math.max(
    ...dataSets[0].data.map((marker) => marker.timestamp)
  );

  const markers = dataSets[0].data
    .filter(
      (marker) =>
        marker.value.lat != null &&
        marker.value.long != null &&
        !isNaN(Number(marker.value.lat)) &&
        !isNaN(Number(marker.value.long)) &&
        Number(marker.value.long) !== 0 &&
        Number(marker.value.lat) !== 0
      // marker.timestamp <= (right === "dataMax" ? maxTimestamp : right) &&
      // marker.timestamp >= (left === "dataMin" ? 0 : left)
    )
    .map((marker) => ({
      position: {
        lat: Number(marker.value.lat),
        lng: Number(marker.value.long),
      },
      key: marker.timestamp, // Use a stable key
      timestamp: marker.timestamp,
    }));

  // Calculate center based on first marker or default
  const center =
    markers.length > 0 ? markers[0].position : { lat: 40.2518, lng: -111.6493 };

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <LoadScript googleMapsApiKey="">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
          options={mapOptions}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.key}
              position={marker.position}
              title={`Time: ${marker.timestamp}`}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

export default GPSMap;
