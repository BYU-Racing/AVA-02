import React, { useState, useMemo, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";

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

const polylineOptions = {
  strokeColor: "#FF0000",
  strokeOpacity: 1.0,
  strokeWeight: 4,
};

const GPSMap = React.memo(
  ({ dataSets, right, left, globalZoomBounds, globalZoom }) => {
    const { isLoaded, loadError } = useJsApiLoader({
      id: "google-map-script",
      googleMapsApiKey: "",
    });

    const [map, setMap] = useState(null);

    const createMarkers = useCallback(() => {
      return dataSets[0].data
        .filter(
          (point) =>
            point.value.lat != null &&
            point.value.long != null &&
            !isNaN(Number(point.value.lat)) &&
            !isNaN(Number(point.value.long)) &&
            Number(point.value.long) !== 0 &&
            Number(point.value.lat) !== 0
        )
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((point, index) => ({
          position: {
            lat: Number(point.value.lat),
            lng: Number(point.value.long),
          },
          key: `marker-${index}`,
        }));
    }, [dataSets]);

    const markers = useMemo(() => createMarkers(), [createMarkers]);

    const path = useMemo(
      () => markers.map((marker) => marker.position),
      [markers]
    );

    const bounds = useMemo(() => {
      if (markers.length === 0) return null;
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach((marker) => bounds.extend(marker.position));
      return bounds;
    }, [markers]);

    const onLoad = useCallback(
      (map) => {
        setMap(map);
        if (bounds) {
          map.fitBounds(bounds);
          console.log("Bounds set:", bounds.toString());
        }
      },
      [bounds]
    );

    const onUnmount = useCallback(() => {
      setMap(null);
    }, []);

    if (loadError) {
      return <div>Error loading maps</div>;
    }

    return isLoaded ? (
      <GoogleMap
        mapContainerStyle={containerStyle}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        <Polyline path={path} options={polylineOptions} />
      </GoogleMap>
    ) : (
      <></>
    );
  }
);

export default GPSMap;
