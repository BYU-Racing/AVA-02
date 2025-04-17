import React, { createContext, ReactNode, useState, useContext, useMemo } from "react";
import { Sensor } from "../../types/sensor";

interface SensorContextType {
  Sensors: Sensor[];
  updateSensor: (updatedSensor: Sensor) => void;
  selectedSensors: Number[];
  setSelectedSensors: React.Dispatch<React.SetStateAction<Number[]>>;
  handleRemoveSelectedSensor: (id: Number) => void;
  getSensorById: (id: number) => Sensor | undefined;
  getSensorByName: (name: string) => Sensor | undefined;
  dashboardSensors: Number[];
  setDashboardSensors: React.Dispatch<React.SetStateAction<Number[]>>;
  handleRemoveFromDashboard: (id: Number) => void;
  availableSensors: Sensor[];
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export const SensorProvider = ({ children }: { children: ReactNode }) => {
  const [selectedSensors, setSelectedSensors] = useState<Number[]>([]);
  const [dashboardSensors, setDashboardSensors] = useState<Number[]>([]);


  // Initialize the sensors with default values
  const [Sensors, setSensors] = useState<Sensor[]>([
    { id: 0, name: "startSwitch", data: false },
    { id: 1, name: "throttle1", data: [0, 0, 0, 0, 0] },
    { id: 2, name: "throttle2", data: [0, 0, 0, 0, 0] },
    { id: 3, name: "brakePressure", data: [0, 0, 0, 0, 0] },
    { id: 4, name: "accelerometer", data: [0, 0, 0, 0, 0] }, 
    // Accelerometer  buf[0]  // buf[1-4] float accleration/rotation m/s^2/degrees
    // 0: X-Acceleration |
    // 1: Y-Acceleration |
    // 2: Z-Acceleration |
    // 3: X-Rotation (Roll) |
    // 4: Y-Rotation (Pitch) |
    // 5: Z-Rotation (Yaw)]
    { id: 5, name: "TireRPM", data: 0 },
    // buf[0] | buf[1] float speed RPM
    // uint8_t subID: [
    // 0: FrontLeft |
    // 1: FrontRight |
    // 2: RearLeft |
    // 3: RearRight]
    { id: 6, name: "tireTemp", data: 0 }, //buf[1-6] float temp C
    // buf[0] | buf[1-2] InnerTemp | buf[3-4] OuterTemp | buf[5-6] CoreTemp 
    // uint8_t subID: [
    // 0: FrontLeft |
    // 1: FrontRight |
    // 2: RearLeft |
    // 3: RearRight]
    { id: 9, name: "gps", data: [0, 0] }, //[0-3] lat | [4-7] long
    { id: 20, name: "mc_coolantTemp", data: [0, 0, 0, 0, 0] },
    { id: 21, name: "mc_motorTemp", data: [0, 0, 0, 0, 0] },
    { id: 22, name: "mc_ignition", data: false },
    { id: 23, name: "mc_start", data: false },
    { id: 24, name: "vsm_state", data: [0, 0, 0, 0, 0] },
    { id: 25, name: "healthCheck", data: [0, 0, 0, 0, 0] },
    { id: 7, name: "bsm_batteryPerc", data: [0, 0, 0, 0, 0] },
    { id: 8, name: "bsm_batteryTemp", data: [0, 0, 0, 0, 0] },
    { id: 28, name: "bsm_current", data: [0, 0, 0, 0, 0] },
    { id: 29, name: "bsm_voltage", data: [0, 0, 0, 0, 0] },
    { id: 30, name: "command", data: [0, 0, 0, 0, 0] },
    { id: 31, name: "fault", data: 0 },
    { id: 32, name: "driveState", data: false },
    { id: 33, name: "driveMode", data: 0 },
    { id: 34, name: "faultCode", data: 0 },
    { id: 35, name: "tractive", data: false },
    { id: 36, name: "range", data: [0, 0, 0, 0, 0] },
    { id: 37, name: "torque", data: [0, 0, 0, 0, 0] },
    { id: 38, name: "speed", data: 0 },
  ]);

  // Update the sensor data
  const updateSensor = (updatedSensor: Sensor) => {
    setSensors((prevSensors) =>
      prevSensors.map((sensor) =>
        sensor.id === updatedSensor.id ? updatedSensor : sensor
      )
    );
  };


  // Handle sensor removal from dashboard and sidebar
  const handleRemoveSelectedSensor = (id: Number) => {
    console.log("removing sensor:" + id);
    // Remove the sensor from selectedSensors (sidebar)
    setSelectedSensors((prevSelected) =>
      prevSelected.filter((s) => s !== id)
    );
  };

  // Get a sensor by ID
  const getSensorById = (id: number): Sensor | undefined => {
    return Sensors.find((sensor) => sensor.id === id);
  };

  // Get a sensor by name
  const getSensorByName = (name: string): Sensor | undefined => {
    return Sensors.find((sensor) => sensor.name === name);
  };

  const handleRemoveFromDashboard = (id) => {
    // Remove the sensor from dashboardSensors (dashboard)
    setDashboardSensors((prevDisplayed) =>
      prevDisplayed.filter((s) => s !== id)
    );
    // Remove the sensor from the Sidebar (selectedSensors)
    handleRemoveSelectedSensor(id);
  };

  const availableSensors = useMemo(() => {
    return Sensors.filter((sensor) => {
      // Check if not already in selectedSensors
      const notSelected = !selectedSensors.includes(sensor.id);

      // Check if not already in dashboardSensors
      const notInDashboard = !dashboardSensors.includes(sensor.id);

      return notSelected && notInDashboard;
    });
  }, [Sensors, selectedSensors, dashboardSensors]);


  return (
    <SensorContext.Provider
      value={{
        Sensors,
        updateSensor,
        selectedSensors,
        setSelectedSensors,
        dashboardSensors,
        setDashboardSensors,
        handleRemoveSelectedSensor,
        getSensorById,
        getSensorByName,
        handleRemoveFromDashboard,
        availableSensors,
      }}
    >
      {children}
    </SensorContext.Provider>
  );
};

export const useSensors = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error("useSensorContext must be used within a SensorProvider");
  }
  return context;
};

export default SensorContext;
