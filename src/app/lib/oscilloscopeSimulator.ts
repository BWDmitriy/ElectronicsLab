import { Circuit, Component } from './circuitEngine';
import { simulateCircuit, SimulationResult } from './circuitSimulator';

// Find all components connected to a specific oscilloscope
export function findConnectedComponents(circuit: Circuit, oscilloscopeId: string): Component[] {
  const oscilloscope = circuit.components.find(comp => comp.id === oscilloscopeId);
  if (!oscilloscope || oscilloscope.type !== 'oscilloscope') {
    return [];
  }

  const connectedComponents: Component[] = [];
  const visited = new Set<string>();
  
  // Find wires connected to oscilloscope terminals
  const oscilloscopeWires = circuit.wires.filter(wire => 
    wire.from.includes(oscilloscopeId) || wire.to.includes(oscilloscopeId)
  );

  // Recursively find all connected components
  function findConnected(componentId: string) {
    if (visited.has(componentId)) return;
    visited.add(componentId);

    const component = circuit.components.find(comp => comp.id === componentId);
    if (component && component.id !== oscilloscopeId) {
      connectedComponents.push(component);
    }

    // Find wires connected to this component
    const connectedWires = circuit.wires.filter(wire => 
      wire.from.includes(componentId) || wire.to.includes(componentId)
    );

    // Follow the wires to find more connected components
    connectedWires.forEach(wire => {
      const fromComponentId = wire.from.split(':')[0];
      const toComponentId = wire.to.split(':')[0];
      
      if (fromComponentId !== componentId) {
        findConnected(fromComponentId);
      }
      if (toComponentId !== componentId) {
        findConnected(toComponentId);
      }
    });
  }

  // Start the search from components connected to oscilloscope wires
  oscilloscopeWires.forEach(wire => {
    const fromComponentId = wire.from.split(':')[0];
    const toComponentId = wire.to.split(':')[0];
    
    if (fromComponentId !== oscilloscopeId) {
      findConnected(fromComponentId);
    }
    if (toComponentId !== oscilloscopeId) {
      findConnected(toComponentId);
    }
  });

  return connectedComponents;
}

// Create a sub-circuit containing only components connected to the oscilloscope
export function createConnectedSubCircuit(circuit: Circuit, oscilloscopeId: string): Circuit {
  const connectedComponents = findConnectedComponents(circuit, oscilloscopeId);
  const connectedComponentIds = new Set(connectedComponents.map(comp => comp.id));
  
  // Include the oscilloscope itself
  const oscilloscope = circuit.components.find(comp => comp.id === oscilloscopeId);
  if (oscilloscope) {
    connectedComponents.push(oscilloscope);
    connectedComponentIds.add(oscilloscopeId);
  }

  // Filter wires to only include those connecting the connected components
  const connectedWires = circuit.wires.filter(wire => {
    const fromComponentId = wire.from.split(':')[0];
    const toComponentId = wire.to.split(':')[0];
    return connectedComponentIds.has(fromComponentId) && connectedComponentIds.has(toComponentId);
  });

  return {
    components: connectedComponents,
    wires: connectedWires
  };
}

// Run simulation for oscilloscope-specific circuit
export function simulateOscilloscopeCircuit(circuit: Circuit, oscilloscopeId: string): SimulationResult | null {
  const subCircuit = createConnectedSubCircuit(circuit, oscilloscopeId);
  
  // Only simulate if there are components connected to the oscilloscope
  if (subCircuit.components.length <= 1) { // Only oscilloscope itself
    return null;
  }

  return simulateCircuit(subCircuit);
}

// Get probe nodes for the oscilloscope
export function getOscilloscopeProbes(circuit: Circuit, oscilloscopeId: string): Array<{id: string, label: string, terminalIndex: number}> {
  const probes: Array<{id: string, label: string, terminalIndex: number}> = [];

  // Find which oscilloscope terminals are connected
  const oscilloscopeWires = circuit.wires.filter(wire => 
    wire.from.includes(oscilloscopeId) || wire.to.includes(oscilloscopeId)
  );

  oscilloscopeWires.forEach(wire => {
    let terminalIndex: number;
    let connectedComponentId: string;

    if (wire.from.includes(oscilloscopeId)) {
      terminalIndex = parseInt(wire.from.split(':')[1]);
      connectedComponentId = wire.to.split(':')[0];
    } else {
      terminalIndex = parseInt(wire.to.split(':')[1]);
      connectedComponentId = wire.from.split(':')[0];
    }

    const connectedComponent = circuit.components.find(comp => comp.id === connectedComponentId);
    if (connectedComponent) {
      // Updated probe labels for Electronics Workbench layout:
      // Terminal 0: Ground, 1: Channel A, 2: Channel B, 3: Input
      const terminalNames = ['Ground', 'Channel A', 'Channel B', 'Input'];
      const terminalColors = ['Black', 'Red', 'Blue', 'Green'];
      const terminalName = terminalNames[terminalIndex] || `Terminal ${terminalIndex + 1}`;
      const terminalColor = terminalColors[terminalIndex] || 'Gray';
      
      const probeLabel = `${terminalName} (${terminalColor}): ${connectedComponent.type} (${connectedComponent.value})`;
      
      probes.push({
        id: connectedComponentId,
        label: probeLabel,
        terminalIndex
      });
    }
  });

  return probes;
} 