import { Circuit, Component, ComponentType } from './circuitEngine';
import { analyzeCircuit, solveCircuit, areComponentsConnected, AnalyzedCircuit } from './circuitAnalysis';

// Data structure to hold simulation results
export interface SimulationResult {
  time: number[];
  signals: {
    [nodeId: string]: number[];
  };
  nodeVoltages: Map<string, number>;
  analysisResults: {
    analyzedCircuit: AnalyzedCircuit;
    hasConnectivity: boolean;
    connectedComponents: Set<string>;
  };
}

// Number of data points to simulate
const SIMULATION_POINTS = 10000;
// Simulation time in seconds - adjusted for high frequency
const SIMULATION_TIME = 0.0001; // 100 microseconds, better for high frequency signals

/**
 * Run a circuit simulation and return the time-domain signals at each node
 */
export function simulateCircuit(circuit: Circuit): SimulationResult {
  // Create time points from 0 to SIMULATION_TIME
  const timePoints: number[] = Array.from(
    { length: SIMULATION_POINTS }, 
    (_, i) => (i * SIMULATION_TIME) / SIMULATION_POINTS
  );
  
  // Analyze circuit connectivity
  const analyzedCircuit = analyzeCircuit(circuit);
  
  // Identify which components are connected to at least one source
  const connectedComponents = findConnectedComponents(analyzedCircuit);
  
  // Solve the resistive circuit (this gives us DC operating point)
  const analysisResult = solveCircuit(analyzedCircuit);
  const nodeVoltages = analysisResult.nodeVoltages;
  
  // Maps node IDs to their voltage values over time
  const signals: { [nodeId: string]: number[] } = {};
  
  // Initialize signal arrays for each component
  circuit.components.forEach(component => {
    signals[component.id] = Array(SIMULATION_POINTS).fill(0);
  });
  
  // Simple simulation algorithm with connectivity awareness
  timePoints.forEach((time, index) => {
    // Process each component and generate its output signals
    circuit.components.forEach(component => {
      // Only simulate connected components
      const isConnected = connectedComponents.has(component.id);
      const signalValue = isConnected ? 
        calculateSignal(component, time, analyzedCircuit, nodeVoltages) : 0;
        
      signals[component.id][index] = signalValue;
    });
  });
  
  return {
    time: timePoints,
    signals,
    nodeVoltages,
    analysisResults: {
      analyzedCircuit,
      hasConnectivity: connectedComponents.size > 0,
      connectedComponents
    }
  };
}

/**
 * Find components that are connected to voltage or current sources
 */
function findConnectedComponents(analyzedCircuit: AnalyzedCircuit): Set<string> {
  const { components } = analyzedCircuit;
  const connectedComponents = new Set<string>();
  
  // Find source components
  const sourceComponents = components.filter(c => 
    c.type === 'voltageSource' || c.type === 'battery' || 
    c.type === 'acVoltageSource' || c.type === 'acCurrentSource' || 
    c.type === 'dcCurrentSource' || c.type === 'squareWaveSource'
  );
  
  // Add source components themselves
  sourceComponents.forEach(source => {
    connectedComponents.add(source.id);
  });
  
  // Find components connected to sources
  components.forEach(component => {
    for (const source of sourceComponents) {
      if (areComponentsConnected(component.id, source.id, analyzedCircuit)) {
        connectedComponents.add(component.id);
        break;
      }
    }
  });
  
  return connectedComponents;
}

/**
 * Calculate signal value for a component at a specific time point
 */
function calculateSignal(
  component: Component, 
  time: number, 
  analyzedCircuit: AnalyzedCircuit,
  nodeVoltages: Map<string, number>
): number {
  const { nodes } = analyzedCircuit;
  
  // Find the nodes connected to this component's terminals
  const terminalNodes = component.terminals.map((_, idx) => {
    return nodes.find(node => 
      node.components.some(comp => 
        comp.componentId === component.id && comp.terminalIndex === idx
      )
    );
  }).filter(Boolean);
  
  // Get the voltage values at these nodes
  const terminalVoltages = terminalNodes.map(node => 
    node ? nodeVoltages.get(node.id) || 0 : 0
  );
  
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
      const amplitude = component.properties.amplitude as number || 5; // Default 5V amplitude
      
      // Check if in the high part of the cycle
      const normalizedTime = (time % period) / period;
      return normalizedTime < dutyCycle ? amplitude : 0;
      
    case 'ground':
      // Ground is always 0V
      return 0;
      
    case 'resistor':
      // For a resistor, we calculate the current through it
      if (terminalVoltages.length === 2) {
        const voltageDrop = Math.abs(terminalVoltages[1] - terminalVoltages[0]);
        const current = voltageDrop / component.value; // I = V/R
        return current; // Return current for resistors
      }
      return 0;
      
    case 'capacitor':
      // Basic approximation for capacitor
      if (terminalVoltages.length === 2) {
        return terminalVoltages[1] - terminalVoltages[0]; // Return voltage across capacitor
      }
      return 0;
      
    case 'inductor':
    case 'diode':
    case 'transistor':
    default:
      // For passive components, just return voltage at terminal 1
      return terminalVoltages[1] || 0;
  }
}

/**
 * Get a list of nodes that can be probed in the oscilloscope
 */
export function getProbeableNodes(circuit: Circuit): Array<{id: string, label: string}> {
  // Analyze the circuit to get connectivity
  const analyzedCircuit = analyzeCircuit(circuit);
  const connectedComponents = findConnectedComponents(analyzedCircuit);
  
  return circuit.components
    .filter(component => {
      // Only show components that produce signals and are connected
      const signalSources: ComponentType[] = [
        'voltageSource', 'currentSource', 'battery', 
        'dcCurrentSource', 'acVoltageSource', 'acCurrentSource', 
        'squareWaveSource', 'resistor', 'capacitor'
      ];
      return signalSources.includes(component.type) && 
             connectedComponents.has(component.id);
    })
    .map(component => {
      let label = `${component.type}`;
      
      // Add connection status
      const isConnected = connectedComponents.has(component.id);
      
      // Add specific details based on component type
      switch(component.type) {
        case 'acVoltageSource':
        case 'acCurrentSource':
          const freq = component.properties.frequency as number || 60;
          label += ` (${component.value}${getUnitForComponent(component.type)}, ${freq}Hz)`;
          break;
        case 'squareWaveSource':
          const dutyCycle = component.properties.dutyCycle as number || 0.5;
          const amplitude = component.properties.amplitude as number || 5;
          label += ` (${component.value}Hz, ${amplitude}V, ${(dutyCycle * 100).toFixed(0)}%)`;
          break;
        case 'resistor': 
          label += ` (${component.value}${getUnitForComponent(component.type)})`;
          break;
        default:
          label += ` (${component.value}${getUnitForComponent(component.type)})`;
      }
      
      // Add connection status indicator
      label += isConnected ? ' [Connected]' : ' [Not Connected]';
      
      return {
        id: component.id,
        label
      };
    });
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