import { Circuit, Component, ComponentType } from './circuitEngine';

// Data structure to hold simulation results
export interface SimulationResult {
  time: number[];
  signals: {
    [nodeId: string]: number[];
  };
}

// Number of data points to simulate
const SIMULATION_POINTS = 1000;
// Simulation time in seconds
const SIMULATION_TIME = 0.1;

/**
 * Run a circuit simulation and return the time-domain signals at each node
 */
export function simulateCircuit(circuit: Circuit): SimulationResult {
  // Create time points from 0 to SIMULATION_TIME
  const timePoints: number[] = Array.from(
    { length: SIMULATION_POINTS }, 
    (_, i) => (i * SIMULATION_TIME) / SIMULATION_POINTS
  );
  
  // Maps node IDs to their voltage values over time
  const signals: { [nodeId: string]: number[] } = {};
  
  // Initialize signal arrays for each component
  circuit.components.forEach(component => {
    signals[component.id] = Array(SIMULATION_POINTS).fill(0);
  });
  
  // Simple simulation algorithm
  timePoints.forEach((time, index) => {
    // Process each component and generate its output signals
    circuit.components.forEach(component => {
      signals[component.id][index] = calculateSignal(component, time);
    });
    
    // In a real simulator, we would solve for all node voltages here
    // using methods like nodal analysis or modified nodal analysis
  });
  
  return {
    time: timePoints,
    signals
  };
}

/**
 * Calculate signal value for a component at a specific time point
 */
function calculateSignal(component: Component, time: number): number {
  switch (component.type) {
    case 'battery':
    case 'voltageSource':
      // DC voltage source has constant value
      return component.value;
      
    case 'dcCurrentSource':
      // DC current source has constant value
      return component.value;
      
    case 'acVoltageSource':
      // Default to 60Hz sine wave if frequency property not set
      const freqACV = component.properties.frequency as number || 60;
      // Sine wave: V(t) = amplitude * sin(2π * frequency * time)
      return component.value * Math.sin(2 * Math.PI * freqACV * time);
      
    case 'acCurrentSource':
      // Default to 60Hz sine wave if frequency property not set
      const freqACI = component.properties.frequency as number || 60;
      // Sine wave: I(t) = amplitude * sin(2π * frequency * time)
      return component.value * Math.sin(2 * Math.PI * freqACI * time);
      
    case 'squareWaveSource':
      // Square wave generator (clock)
      const freq = component.value; // Frequency in Hz
      const period = 1 / freq;
      const dutyCycle = component.properties.dutyCycle as number || 0.5; // Default 50% duty cycle
      
      // Check if in the high part of the cycle
      const normalizedTime = (time % period) / period;
      return normalizedTime < dutyCycle ? component.value : 0;
      
    case 'ground':
      // Ground is always 0V
      return 0;
      
    case 'resistor':
    case 'capacitor':
    case 'inductor':
    case 'diode':
    case 'transistor':
    default:
      // For passive components, just return 0 in this simple simulation
      // In a real simulator, these would be calculated based on circuit topology
      return 0;
  }
}

/**
 * Get a list of nodes that can be probed in the oscilloscope
 */
export function getProbeableNodes(circuit: Circuit): Array<{id: string, label: string}> {
  return circuit.components
    .filter(component => {
      // Only show components that produce signals
      const signalSources: ComponentType[] = [
        'voltageSource', 'currentSource', 'battery', 
        'dcCurrentSource', 'acVoltageSource', 'acCurrentSource', 
        'squareWaveSource'
      ];
      return signalSources.includes(component.type);
    })
    .map(component => ({
      id: component.id,
      label: `${component.type} (${component.value}${getUnitForComponent(component.type)})`
    }));
}

/**
 * Get the appropriate unit for a component type
 */
function getUnitForComponent(componentType: ComponentType): string {
  switch (componentType) {
    case 'resistor':
      return 'Ω';
    case 'capacitor':
      return 'F';
    case 'inductor':
      return 'H';
    case 'voltageSource':
    case 'battery':
    case 'acVoltageSource':
      return 'V';
    case 'currentSource':
    case 'dcCurrentSource':
    case 'acCurrentSource':
      return 'A';
    case 'squareWaveSource':
      return 'Hz';
    default:
      return '';
  }
} 