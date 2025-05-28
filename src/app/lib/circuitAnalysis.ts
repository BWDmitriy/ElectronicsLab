import { Circuit, Component } from './circuitEngine';

// Node in the circuit analysis
export interface CircuitNode {
  id: string;
  voltage: number;
  components: Array<{
    componentId: string;
    terminalIndex: number;
  }>;
}

// Branch in the circuit (between two nodes)
export interface CircuitBranch {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  component: Component;
  current: number; // Current flowing through this branch (positive = from -> to)
  voltage: number; // Voltage drop across this branch
}

// Complete analyzed circuit
export interface AnalyzedCircuit {
  nodes: CircuitNode[];
  branches: CircuitBranch[];
  components: Component[];
  groundNodeId: string | null;
}

// Circuit analysis results
export interface CircuitAnalysisResult {
  analyzedCircuit: AnalyzedCircuit;
  nodeVoltages: Map<string, number>;
  branchCurrents: Map<string, number>;
  componentMeasurements: Map<string, { voltage: number; current: number }>;
  hasConnectivity: boolean;
  connectedComponents: Set<string>;
}

/**
 * Analyze circuit connectivity and create nodes/branches
 */
export function analyzeCircuit(circuit: Circuit): AnalyzedCircuit {
  const nodes: CircuitNode[] = [];
  const branches: CircuitBranch[] = [];
  const nodeMap = new Map<string, string>(); // terminal -> nodeId mapping
  
  // Create nodes by grouping connected terminals
  let nodeCounter = 0;
  
  // First pass: create nodes for each unique connection point
  circuit.components.forEach(component => {
    component.terminals.forEach((terminal, terminalIndex) => {
      const terminalKey = `${component.id}:${terminalIndex}`;
      
      // Check if this terminal is already connected to a node via wires
      let assignedNodeId: string | null = null;
      
      circuit.wires.forEach(wire => {
        if (wire.from === terminalKey || wire.to === terminalKey) {
          const otherTerminal = wire.from === terminalKey ? wire.to : wire.from;
          if (nodeMap.has(otherTerminal)) {
            assignedNodeId = nodeMap.get(otherTerminal)!;
          }
        }
      });
      
      if (!assignedNodeId) {
        assignedNodeId = `node_${nodeCounter++}`;
        nodes.push({
          id: assignedNodeId,
          voltage: 0,
          components: []
        });
      }
      
      nodeMap.set(terminalKey, assignedNodeId);
      
      // Add component to node
      const node = nodes.find(n => n.id === assignedNodeId);
      if (node) {
        node.components.push({
          componentId: component.id,
          terminalIndex
        });
      }
    });
  });
  
  // Merge nodes connected by wires
  circuit.wires.forEach(wire => {
    const fromNodeId = nodeMap.get(wire.from);
    const toNodeId = nodeMap.get(wire.to);
    
    if (fromNodeId && toNodeId && fromNodeId !== toNodeId) {
      // Merge nodes
      const fromNode = nodes.find(n => n.id === fromNodeId);
      const toNode = nodes.find(n => n.id === toNodeId);
      
      if (fromNode && toNode) {
        // Move all components from toNode to fromNode
        fromNode.components.push(...toNode.components);
        
        // Update nodeMap for all terminals that pointed to toNode
        for (const [terminal, nodeId] of nodeMap.entries()) {
          if (nodeId === toNodeId) {
            nodeMap.set(terminal, fromNodeId);
          }
        }
        
        // Remove the merged node
        const toNodeIndex = nodes.findIndex(n => n.id === toNodeId);
        if (toNodeIndex >= 0) {
          nodes.splice(toNodeIndex, 1);
        }
      }
    }
  });
  
  // Create branches for components that connect different nodes
  circuit.components.forEach(component => {
    if (component.terminals.length >= 2) {
      const fromTerminal = `${component.id}:0`;
      const toTerminal = `${component.id}:1`;
      const fromNodeId = nodeMap.get(fromTerminal);
      const toNodeId = nodeMap.get(toTerminal);
      
      if (fromNodeId && toNodeId && fromNodeId !== toNodeId) {
        branches.push({
          id: `branch_${component.id}`,
          fromNodeId,
          toNodeId,
          component,
          current: 0,
          voltage: 0
        });
      }
    }
  });
  
  // Find ground node (node connected to ground component)
  let groundNodeId: string | null = null;
  const groundComponent = circuit.components.find(comp => comp.type === 'ground');
  if (groundComponent) {
    const groundTerminal = `${groundComponent.id}:0`;
    groundNodeId = nodeMap.get(groundTerminal) || null;
  }
  
  return {
    nodes,
    branches,
    components: circuit.components,
    groundNodeId
  };
}

/**
 * Solve circuit using nodal analysis and Ohm's law
 */
export function solveCircuit(analyzedCircuit: AnalyzedCircuit): CircuitAnalysisResult {
  const { nodes, branches, groundNodeId } = analyzedCircuit;
  const nodeVoltages = new Map<string, number>();
  const branchCurrents = new Map<string, number>();
  const componentMeasurements = new Map<string, { voltage: number; current: number }>();
  
  // Set ground voltage to 0V
  if (groundNodeId) {
    nodeVoltages.set(groundNodeId, 0);
  }
  
  // Initialize all node voltages
  nodes.forEach(node => {
    if (node.id !== groundNodeId) {
      nodeVoltages.set(node.id, 0);
    }
  });
  
  // Find voltage sources and calculate total circuit resistance for series circuits
  let totalVoltage = 0;
  let totalResistance = 0;
  let hasVoltageSource = false;
  
  // First pass: identify voltage sources and calculate total resistance
  branches.forEach(branch => {
    const { component } = branch;
    
    if (component.type === 'voltageSource' || component.type === 'battery' || component.type === 'acVoltageSource') {
      totalVoltage += component.value;
      hasVoltageSource = true;
    } else if (component.type === 'resistor') {
      totalResistance += component.value;
    } else if (component.type === 'ammeter') {
      totalResistance += 0.001; // 1mΩ internal resistance
    } else if (component.type === 'voltmeter') {
      // Voltmeter in parallel doesn't add to series resistance
      // We'll handle this separately
    } else if (component.type === 'inductor') {
      totalResistance += 0.001; // Very small resistance for DC
    }
    // Capacitors block DC current, so they don't contribute to DC resistance
  });
  
  // Calculate total circuit current using Ohm's law (I = V_total / R_total)
  const totalCurrent = hasVoltageSource && totalResistance > 0 ? totalVoltage / totalResistance : 0;
  
  console.log(`Circuit Analysis: V_total=${totalVoltage}V, R_total=${totalResistance}Ω, I_total=${totalCurrent}A`);
  
  // Second pass: set node voltages and calculate individual component values
  
  branches.forEach(branch => {
    const { component, fromNodeId, toNodeId } = branch;
    
    // For series circuits, current is the same through all components
    let current = totalCurrent;
    let voltage = 0;
    
    switch (component.type) {
      case 'voltageSource':
      case 'battery':
      case 'acVoltageSource':
        // Voltage source maintains its voltage
        voltage = component.value;
        current = totalCurrent;
        
        // Set node voltages for voltage sources
        if (fromNodeId === groundNodeId) {
          nodeVoltages.set(toNodeId, component.value);
        } else if (toNodeId === groundNodeId) {
          nodeVoltages.set(fromNodeId, component.value);
        }
        break;
        
      case 'resistor':
        // Voltage drop across resistor: V = I * R
        voltage = totalCurrent * component.value;
        current = totalCurrent;
        break;
        
      case 'ammeter':
        // Ammeter measures the circuit current
        voltage = totalCurrent * 0.001; // Small voltage drop due to internal resistance
        current = totalCurrent;
        break;
        
      case 'voltmeter':
        // Voltmeter measures voltage across its terminals
        // For now, assume it measures the voltage of the node it's connected to
        const fromVoltage = nodeVoltages.get(fromNodeId) || 0;
        const toVoltage = nodeVoltages.get(toNodeId) || 0;
        voltage = Math.abs(fromVoltage - toVoltage);
        current = voltage / 1000000; // Very small current through high resistance
        break;
        
      case 'currentSource':
      case 'dcCurrentSource':
      case 'acCurrentSource':
        current = component.value;
        voltage = current * totalResistance; // Voltage depends on circuit resistance
        break;
        
      case 'capacitor':
        // For DC analysis, capacitor blocks current
        current = 0;
        voltage = 0;
        break;
        
      case 'inductor':
        // For DC analysis, inductor acts like small resistor
        voltage = totalCurrent * 0.001;
        current = totalCurrent;
        break;
        
      case 'diode':
        // Simplified diode model
        if (totalCurrent > 0) {
          voltage = 0.7; // Forward voltage drop
          current = totalCurrent;
        } else {
          voltage = 0;
          current = 0;
        }
        break;
        
      case 'ground':
        voltage = 0;
        current = 0;
        break;
        
      default:
        current = 0;
        voltage = 0;
    }
    
    branch.current = current;
    branch.voltage = voltage;
    branchCurrents.set(branch.id, current);
    
    // Store measurements for the component
    componentMeasurements.set(component.id, { 
      voltage: Math.abs(voltage), 
      current: Math.abs(current) 
    });
    
    console.log(`Component ${component.type} (${component.id}): V=${voltage.toFixed(4)}V, I=${(current * 1000).toFixed(2)}mA`);
  });
  
  // Update node voltages based on voltage drops
  if (hasVoltageSource && groundNodeId) {
    let runningVoltage = totalVoltage;
    
    branches.forEach(branch => {
      const { component, fromNodeId, toNodeId } = branch;
      
      // Skip voltage sources as they set the initial voltage
      if (component.type === 'voltageSource' || component.type === 'battery' || component.type === 'acVoltageSource') {
        return;
      }
      
      // For other components, subtract their voltage drop
      if (component.type === 'resistor' || component.type === 'ammeter' || component.type === 'inductor') {
        runningVoltage -= branch.voltage;
        
        // Set the voltage at the "to" node
        if (fromNodeId !== groundNodeId && toNodeId !== groundNodeId) {
          nodeVoltages.set(toNodeId, runningVoltage);
        }
      }
    });
  }
  
  // Determine connectivity
  const connectedComponents = new Set<string>();
  const hasConnectivity = branches.length > 0 && hasVoltageSource;
  
  if (hasConnectivity) {
    branches.forEach(branch => {
      connectedComponents.add(branch.component.id);
    });
  }
  
  return {
    analyzedCircuit,
    nodeVoltages,
    branchCurrents,
    componentMeasurements,
    hasConnectivity,
    connectedComponents
  };
}

/**
 * Check if two components are electrically connected
 */
export function areComponentsConnected(componentId1: string, componentId2: string, analyzedCircuit: AnalyzedCircuit): boolean {
  // Find nodes that contain these components
  const component1Nodes = analyzedCircuit.nodes.filter(node => 
    node.components.some(comp => comp.componentId === componentId1)
  );
  const component2Nodes = analyzedCircuit.nodes.filter(node => 
    node.components.some(comp => comp.componentId === componentId2)
  );
  
  // Check if they share any nodes
  return component1Nodes.some(node1 => 
    component2Nodes.some(node2 => node1.id === node2.id)
  );
}

/**
 * Update component values with calculated measurements
 */
export function updateComponentMeasurements(circuit: Circuit, measurements: Map<string, { voltage: number; current: number }>): Circuit {
  const updatedComponents = circuit.components.map(component => {
    const measurement = measurements.get(component.id);
    if (measurement) {
      let newValue = component.value;
      
      // Update meter readings
      if (component.type === 'ammeter') {
        newValue = measurement.current;
      } else if (component.type === 'voltmeter') {
        newValue = measurement.voltage;
      }
      
      return {
        ...component,
        value: newValue
      };
    }
    return component;
  });
  
  return {
    ...circuit,
    components: updatedComponents
  };
} 