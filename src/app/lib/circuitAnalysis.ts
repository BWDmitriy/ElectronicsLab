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
  
  // Find all voltage sources
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
      nodeVoltages.set(fromNodeId, sourceVoltage);
      nodeVoltages.set(toNodeId, 0);
    }
  });
  
  // Simple iterative solution for node voltages
  const maxIterations = 20;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let voltagesChanged = false;
    
    nodes.forEach(node => {
      if (node.id === groundNodeId) return;
      
      // Skip voltage source nodes
      const isVoltageSourceNode = voltageSources.some(branch => 
        branch.fromNodeId === node.id || branch.toNodeId === node.id
      );
      if (isVoltageSourceNode) return;
      
      // Find connected branches
      const connectedBranches = branches.filter(branch => 
        branch.fromNodeId === node.id || branch.toNodeId === node.id
      );
      
      if (connectedBranches.length === 0) return;
      
      // Calculate voltage based on connected components
      let totalConductance = 0;
      let weightedVoltageSum = 0;
      
      connectedBranches.forEach(branch => {
        const { component, fromNodeId, toNodeId } = branch;
        const otherNodeId = fromNodeId === node.id ? toNodeId : fromNodeId;
        const otherVoltage = nodeVoltages.get(otherNodeId) || 0;
        
        let conductance = 0;
        switch (component.type) {
          case 'resistor':
            conductance = component.value > 0 ? 1 / component.value : 0;
            break;
          case 'ammeter':
            conductance = 1 / 0.001;
            break;
          case 'inductor':
            conductance = 1 / 0.001;
            break;
          case 'voltmeter':
            conductance = 1 / 1000000;
            break;
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
    
    if (!voltagesChanged) break;
  }
  
  // Calculate currents for each branch
  branches.forEach(branch => {
    const { component, fromNodeId, toNodeId } = branch;
    const fromVoltage = nodeVoltages.get(fromNodeId) || 0;
    const toVoltage = nodeVoltages.get(toNodeId) || 0;
    const voltageDrop = fromVoltage - toVoltage;
    
    let current = 0;
    let voltage = Math.abs(voltageDrop);
    
    switch (component.type) {
      case 'resistor':
      case 'ammeter':
      case 'inductor':
        // Use Ohm's law: I = V / R
        let resistance = 0;
        if (component.type === 'resistor') {
          resistance = component.value;
        } else if (component.type === 'ammeter') {
          resistance = 0.001; // 1mΩ
        } else if (component.type === 'inductor') {
          resistance = 0.001; // Very small for DC
        }
        
        current = resistance > 0 ? voltageDrop / resistance : 0;
        voltage = Math.abs(voltageDrop);
        break;
        
      case 'voltmeter':
        current = voltageDrop / 1000000; // 1MΩ internal resistance
        voltage = Math.abs(voltageDrop);
        break;
        
      case 'voltageSource':
      case 'battery':
      case 'acVoltageSource':
        voltage = component.value;
        
        // Calculate total circuit current by finding equivalent resistance
        // For simple circuits, sum all resistances in the current path
        let totalResistance = 0;
        
        // Find all resistive components in the circuit (excluding this voltage source)
        branches.forEach(otherBranch => {
          if (otherBranch.id !== branch.id) {
            const comp = otherBranch.component;
            switch (comp.type) {
              case 'resistor':
                totalResistance += comp.value;
                break;
              case 'ammeter':
                totalResistance += 0.001;
                break;
              case 'inductor':
                totalResistance += 0.001;
                break;
            }
          }
        });
        
        // For parallel circuits, we need to calculate equivalent resistance
        // This is a simplified approach - for complex circuits, we'd need matrix methods
        if (totalResistance > 0) {
          current = component.value / totalResistance;
        } else {
          current = 0;
        }
        break;
        
      case 'currentSource':
      case 'dcCurrentSource':
      case 'acCurrentSource':
        current = component.value;
        voltage = Math.abs(voltageDrop);
        break;
        
      case 'capacitor':
        current = 0; // Blocks DC
        voltage = Math.abs(voltageDrop);
        break;
        
      case 'diode':
        if (voltageDrop > 0.7) {
          current = (voltageDrop - 0.7) / 100;
          voltage = 0.7;
        } else {
          current = 0;
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
    
    componentMeasurements.set(component.id, { 
      voltage: voltage, 
      current: Math.abs(current) 
    });
    
    console.log(`Component ${component.type} (${component.id}): V=${voltage.toFixed(4)}V, I=${(Math.abs(current) * 1000).toFixed(2)}mA, Nodes: ${fromVoltage.toFixed(2)}V -> ${toVoltage.toFixed(2)}V`);
  });
  
  // Ensure current conservation by propagating current through series connections
  // This ensures ammeters after resistors show the correct current
  const propagateCurrents = () => {
    let currentsPropagated = false;
    
    nodes.forEach(node => {
      if (node.id === groundNodeId) return;
      
      const connectedBranches = branches.filter(branch => 
        branch.fromNodeId === node.id || branch.toNodeId === node.id
      );
      
      // For nodes with exactly 2 connections (series), current must be the same
      if (connectedBranches.length === 2) {
        const branch1 = connectedBranches[0];
        const branch2 = connectedBranches[1];
        
        // Skip if one is a voltage source
        if (branch1.component.type === 'voltageSource' || branch1.component.type === 'battery' || 
            branch2.component.type === 'voltageSource' || branch2.component.type === 'battery') {
          return;
        }
        
        // Use the larger current (more reliable calculation)
        const current1 = Math.abs(branch1.current);
        const current2 = Math.abs(branch2.current);
        const maxCurrent = Math.max(current1, current2);
        
        if (Math.abs(current1 - current2) > 0.001) {
          // Propagate the larger current to both branches
          const direction1 = branch1.fromNodeId === node.id ? -1 : 1;
          const direction2 = branch2.fromNodeId === node.id ? -1 : 1;
          
          branch1.current = direction1 * maxCurrent;
          branch2.current = direction2 * maxCurrent;
          
          branchCurrents.set(branch1.id, branch1.current);
          branchCurrents.set(branch2.id, branch2.current);
          
          componentMeasurements.set(branch1.component.id, {
            voltage: branch1.voltage,
            current: maxCurrent
          });
          componentMeasurements.set(branch2.component.id, {
            voltage: branch2.voltage,
            current: maxCurrent
          });
          
          currentsPropagated = true;
        }
      }
    });
    
    return currentsPropagated;
  };
  
  // Propagate currents multiple times to ensure consistency
  for (let i = 0; i < 5; i++) {
    if (!propagateCurrents()) break;
  }
  
  // Determine connectivity
  const connectedComponents = new Set<string>();
  const hasVoltageSource = voltageSources.length > 0;
  const hasConnectivity = hasVoltageSource && groundNodeId !== null;
  
  if (hasConnectivity) {
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