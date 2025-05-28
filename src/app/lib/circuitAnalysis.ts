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
  
  // Initialize all node voltages to 0
  nodes.forEach(node => {
    nodeVoltages.set(node.id, 0);
  });
  
  // Set ground voltage to 0V (reference point)
  if (groundNodeId) {
    nodeVoltages.set(groundNodeId, 0);
  }
  
  // Find all voltage sources and set their node voltages
  const voltageSources = branches.filter(branch => 
    branch.component.type === 'voltageSource' || 
    branch.component.type === 'battery' || 
    branch.component.type === 'acVoltageSource'
  );
  
  // Set voltages for voltage sources
  voltageSources.forEach(branch => {
    const { component, fromNodeId, toNodeId } = branch;
    const sourceVoltage = component.value;
    
    if (fromNodeId === groundNodeId) {
      nodeVoltages.set(toNodeId, sourceVoltage);
    } else if (toNodeId === groundNodeId) {
      nodeVoltages.set(fromNodeId, sourceVoltage);
    } else {
      // If neither terminal is ground, assume positive terminal is at source voltage
      // and negative terminal is at 0V (this is a simplification)
      nodeVoltages.set(fromNodeId, sourceVoltage);
      nodeVoltages.set(toNodeId, 0);
    }
  });
  
  // Iterative solution for node voltages (simplified nodal analysis)
  // In a full implementation, we'd use matrix methods, but this handles most cases
  const maxIterations = 10;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let voltagesChanged = false;
    
    // For each non-ground, non-source node, calculate voltage based on connected branches
    nodes.forEach(node => {
      if (node.id === groundNodeId) return;
      
      // Skip nodes that are directly connected to voltage sources
      const isVoltageSourceNode = voltageSources.some(branch => 
        branch.fromNodeId === node.id || branch.toNodeId === node.id
      );
      if (isVoltageSourceNode) return;
      
      // Find all branches connected to this node
      const connectedBranches = branches.filter(branch => 
        branch.fromNodeId === node.id || branch.toNodeId === node.id
      );
      
      if (connectedBranches.length === 0) return;
      
      // Calculate weighted average voltage based on conductances
      let totalConductance = 0;
      let weightedVoltageSum = 0;
      
      connectedBranches.forEach(branch => {
        const { component, fromNodeId, toNodeId } = branch;
        const otherNodeId = fromNodeId === node.id ? toNodeId : fromNodeId;
        const otherVoltage = nodeVoltages.get(otherNodeId) || 0;
        
        // Get conductance (1/resistance) for this component
        let conductance = 0;
        switch (component.type) {
          case 'resistor':
            conductance = component.value > 0 ? 1 / component.value : 0;
            break;
          case 'ammeter':
            conductance = 1 / 0.001; // 1mΩ internal resistance
            break;
          case 'inductor':
            conductance = 1 / 0.001; // Very small resistance for DC
            break;
          case 'voltmeter':
            conductance = 1 / 1000000; // 1MΩ internal resistance
            break;
          default:
            conductance = 0;
        }
        
        if (conductance > 0) {
          totalConductance += conductance;
          weightedVoltageSum += otherVoltage * conductance;
        }
      });
      
      if (totalConductance > 0) {
        const newVoltage = weightedVoltageSum / totalConductance;
        const oldVoltage = nodeVoltages.get(node.id) || 0;
        
        if (Math.abs(newVoltage - oldVoltage) > 0.001) {
          voltagesChanged = true;
          nodeVoltages.set(node.id, newVoltage);
        }
      }
    });
    
    // If voltages have converged, stop iterating
    if (!voltagesChanged) break;
  }
  
  // Calculate currents for each branch using Ohm's law
  branches.forEach(branch => {
    const { component, fromNodeId, toNodeId } = branch;
    const fromVoltage = nodeVoltages.get(fromNodeId) || 0;
    const toVoltage = nodeVoltages.get(toNodeId) || 0;
    const voltageDrop = fromVoltage - toVoltage;
    
    let current = 0;
    let voltage = Math.abs(voltageDrop);
    
    switch (component.type) {
      case 'resistor':
        // Ohm's law: I = V / R
        current = component.value > 0 ? voltageDrop / component.value : 0;
        voltage = Math.abs(voltageDrop);
        break;
        
      case 'ammeter':
        // Ammeter measures current through it
        current = voltageDrop / 0.001; // 1mΩ internal resistance
        voltage = Math.abs(voltageDrop);
        break;
        
      case 'voltmeter':
        // Voltmeter measures voltage across it
        current = voltageDrop / 1000000; // 1MΩ internal resistance
        voltage = Math.abs(voltageDrop);
        break;
        
      case 'voltageSource':
      case 'battery':
      case 'acVoltageSource':
        // For voltage sources, calculate current based on connected load
        voltage = component.value;
        
        // Find total conductance of connected branches (excluding this source)
        let totalLoadConductance = 0;
        const connectedBranches = branches.filter(b => 
          b.id !== branch.id && 
          (b.fromNodeId === fromNodeId || b.toNodeId === fromNodeId ||
           b.fromNodeId === toNodeId || b.toNodeId === toNodeId)
        );
        
        connectedBranches.forEach(connectedBranch => {
          const comp = connectedBranch.component;
          switch (comp.type) {
            case 'resistor':
              totalLoadConductance += comp.value > 0 ? 1 / comp.value : 0;
              break;
            case 'ammeter':
              totalLoadConductance += 1 / 0.001;
              break;
            case 'inductor':
              totalLoadConductance += 1 / 0.001;
              break;
          }
        });
        
        current = component.value * totalLoadConductance;
        break;
        
      case 'currentSource':
      case 'dcCurrentSource':
      case 'acCurrentSource':
        current = component.value;
        voltage = Math.abs(voltageDrop);
        break;
        
      case 'inductor':
        // For DC analysis, inductor acts like small resistor
        current = voltageDrop / 0.001;
        voltage = Math.abs(voltageDrop);
        break;
        
      case 'capacitor':
        // For DC analysis, capacitor blocks current
        current = 0;
        voltage = Math.abs(voltageDrop);
        break;
        
      case 'diode':
        // Simplified diode model
        if (voltageDrop > 0.7) {
          current = (voltageDrop - 0.7) / 100; // Forward biased with 100Ω resistance
          voltage = 0.7;
        } else {
          current = 0; // Reverse biased
          voltage = Math.abs(voltageDrop);
        }
        break;
        
      case 'ground':
        current = 0;
        voltage = 0;
        break;
        
      default:
        current = 0;
        voltage = Math.abs(voltageDrop);
    }
    
    branch.current = current;
    branch.voltage = voltage;
    branchCurrents.set(branch.id, current);
    
    // Store measurements for the component
    componentMeasurements.set(component.id, { 
      voltage: voltage, 
      current: Math.abs(current) 
    });
    
    console.log(`Component ${component.type} (${component.id}): V=${voltage.toFixed(4)}V, I=${(Math.abs(current) * 1000).toFixed(2)}mA, Node voltages: ${fromVoltage.toFixed(2)}V -> ${toVoltage.toFixed(2)}V`);
  });
  
  // Determine connectivity - check if there's a path from any voltage source to ground
  const connectedComponents = new Set<string>();
  const hasVoltageSource = voltageSources.length > 0;
  const hasConnectivity = hasVoltageSource && groundNodeId !== null;
  
  if (hasConnectivity) {
    // Mark all components that are in branches as connected
    branches.forEach(branch => {
      connectedComponents.add(branch.component.id);
    });
  }
  
  console.log(`Circuit Analysis Complete: ${voltageSources.length} voltage sources, ${branches.length} branches, ${nodes.length} nodes`);
  console.log(`Node voltages:`, Array.from(nodeVoltages.entries()).map(([id, v]) => `${id}: ${v.toFixed(2)}V`).join(', '));
  
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