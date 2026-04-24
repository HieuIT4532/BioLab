/* ============================================================
   BioLab X — Remote Lab (Simulation Mode)
   🌍 Mô phỏng điều khiển phòng thí nghiệm thực tế từ xa
   ============================================================ */

const BioLabRemote = (() => {

  let connectionStatus = 'disconnected'; // disconnected, connecting, connected
  let sensorDataInterval = null;

  // Trạng thái thiết bị mô phỏng
  const deviceState = {
    temperature: 25.0,
    lightIntensity: 500,
    pumpActive: false,
    cameraAngle: 0
  };

  function connectToLab(labId) {
    return new Promise((resolve) => {
      connectionStatus = 'connecting';
      // Simulate network connection latency
      setTimeout(() => {
        connectionStatus = 'connected';
        _startSensorSimulation();
        resolve({ success: true, labId });
      }, 2000);
    });
  }

  function disconnect() {
    connectionStatus = 'disconnected';
    if (sensorDataInterval) {
      clearInterval(sensorDataInterval);
      sensorDataInterval = null;
    }
  }

  function _startSensorSimulation() {
    if (sensorDataInterval) clearInterval(sensorDataInterval);
    sensorDataInterval = setInterval(() => {
      // Simulate slight fluctuations in sensor data
      deviceState.temperature += (Math.random() - 0.5) * 0.5;
      deviceState.lightIntensity += (Math.random() - 0.5) * 20;

      // Ensure values stay within realistic bounds
      if (deviceState.temperature > 40) deviceState.temperature = 40;
      if (deviceState.temperature < 15) deviceState.temperature = 15;
      if (deviceState.lightIntensity > 2000) deviceState.lightIntensity = 2000;
      if (deviceState.lightIntensity < 0) deviceState.lightIntensity = 0;

      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('biolab:remote_sensor_update', {
        detail: { ...deviceState }
      }));
    }, 1000);
  }

  // Lệnh điều khiển gửi đến phần cứng mô phỏng
  function sendCommand(command, value) {
    if (connectionStatus !== 'connected') {
      console.warn('Cannot send command. Not connected to lab.');
      return false;
    }

    console.log(`Sending command to remote lab: ${command}=${value}`);

    if (command === 'SET_TEMP') {
      deviceState.temperature = parseFloat(value);
    } else if (command === 'SET_LIGHT') {
      deviceState.lightIntensity = parseFloat(value);
    } else if (command === 'TOGGLE_PUMP') {
      deviceState.pumpActive = value;
    } else if (command === 'PAN_CAMERA') {
      deviceState.cameraAngle = parseFloat(value);
    }

    // Trigger immediate update
    window.dispatchEvent(new CustomEvent('biolab:remote_sensor_update', {
      detail: { ...deviceState }
    }));
    return true;
  }

  return {
    connectToLab,
    disconnect,
    sendCommand,
    getState: () => ({ ...deviceState }),
    getStatus: () => connectionStatus
  };
})();

if (typeof window !== 'undefined') {
  window.BioLabRemote = BioLabRemote;
}
