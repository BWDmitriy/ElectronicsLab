import { Component, Wire, Circuit, Point } from './circuitEngine';

// Represents a node in the circuit (a connection point)
export interface CircuitNode {
  id: string;
  components: Array<{
    componentId: string;
    terminalIndex: number;
  }>;
}

// Represents the analyzed circuit with nodes and connections
export interface AnalyzedCircuit {
  nodes: CircuitNode[];
  components: Component[];
  groundNodeId: string | null;
}

// Distance threshold for considering terminals connected
const CONNECTION_THRESHOLD = 20;

/**
 * Analyze a circuit to find connected components and build a nodal representation
 */
export function analyzeCircuit(circuit: Circuit): AnalyzedCircuit {
  const { components, wires } = circuit;
  
  // Step 1: Find direct connections via wires
  const wireConnections = findWireConnections(components, wires);
  
  // Step 2: Find terminal connections by proximity when no wires
  const terminalConnections = findTerminalConnections(components);
  
  // Step 3: Merge the two connection sets
  const allConnections = [...wireConnections, ...terminalConnections];
  
  // Step 4: Build nodes from the connections (using union-find algorithm)
  const nodes = buildNodesFromConnections(components, allConnections);
  
  // Step 5: Find ground node (if any)
  const groundNodeId = findGroundNode(components, nodes);
  
  return {
    nodes,
    components,
    groundNodeId
  };
}

/**
 * Find connections between components via wires
 */
function findWireConnections(components: Component[], wires: Wire[]): Array<[string, number, string, number]> {
  const connections: Array<[string, number, string, number]> = [];
  
  // Helper function to find closest terminal to a point
  const findClosestTerminal = (componentId: string, point: Point): [number, number] => {
    const component = components.find(c => c.id === componentId);
    if (!component) return [-1, Infinity];
    
    let closestIndex = -1;
    let closestDistance = Infinity;
    
    component.terminals.forEach((terminal, index) => {
      const distance = Math.sqrt(
        Math.pow(terminal.x - point.x, 2) + 
        Math.pow(terminal.y - point.y, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    return [closestIndex, closestDistance];
  };
  
  // Process each wire to find connections
  wires.forEach(wire => {
    if (wire.points.length < 2) return;
    
    // Parse from/to connections (format: componentId:terminalIndex)
    const fromParts = wire.from.split(':');
    const toParts = wire.to.split(':');
    
    if (fromParts.length === 2 && toParts.length === 2) {
      const fromComponentId = fromParts[0];
      const fromTerminalIndex = parseInt(fromParts[1], 10);
      const toComponentId = toParts[0];
      const toTerminalIndex = parseInt(toParts[1], 10);
      
      connections.push([
        fromComponentId, fromTerminalIndex, 
        toComponentId, toTerminalIndex
      ]);
    } else {
      // For wires without explicit connections, infer from endpoints
      const startPoint = wire.points[0];
      const endPoint = wire.points[wire.points.length - 1];
      
      // Find components with terminals close to wire endpoints
      for (const c1 of components) {
        const [t1Index, t1Distance] = findClosestTerminal(c1.id, startPoint);
        
        if (t1Index >= 0 && t1Distance < CONNECTION_THRESHOLD) {
          for (const c2 of components) {
            if (c1.id === c2.id) continue; // Skip self-connections
            
            const [t2Index, t2Distance] = findClosestTerminal(c2.id, endPoint);
            
            if (t2Index >= 0 && t2Distance < CONNECTION_THRESHOLD) {
              connections.push([c1.id, t1Index, c2.id, t2Index]);
              break;
            }
          }
        }
      }
    }
  });
  
  return connections;
}

/**
 * Find connections between terminals by proximity (when no wires connect them)
 */
function findTerminalConnections(components: Component[]): Array<[string, number, string, number]> {
  const connections: Array<[string, number, string, number]> = [];
  
  // Find terminals that are close to each other
  for (let i = 0; i < components.length; i++) {
    const c1 = components[i];
    
    for (let t1Index = 0; t1Index < c1.terminals.length; t1Index++) {
      const t1 = c1.terminals[t1Index];
      
      for (let j = i + 1; j < components.length; j++) {
        const c2 = components[j];
        
        for (let t2Index = 0; t2Index < c2.terminals.length; t2Index++) {
          const t2 = c2.terminals[t2Index];
          
          // Calculate distance between terminals
          const distance = Math.sqrt(
            Math.pow(t1.x - t2.x, 2) + 
            Math.pow(t1.y - t2.y, 2)
          );
          
          // If terminals are close enough, consider them connected
          if (distance < CONNECTION_THRESHOLD) {
            connections.push([c1.id, t1Index, c2.id, t2Index]);
          }
        }
      }
    }
  }
  
  return connections;
}

/**
 * Build nodes from component connections using union-find algorithm
 */
function buildNodesFromConnections(
  components: Component[],
  connections: Array<[string, number, string, number]>
): CircuitNode[] {
  // Create a map of terminal identifiers to node ids
  const terminalToNodeMap = new Map<string, string>();
  const nodes = new Map<string, CircuitNode>();
  
  // Helper function to get terminal identifier
  const getTerminalId = (componentId: string, terminalIndex: number) => 
    `${componentId}:${terminalIndex}`;
  
  // Initialize each terminal as its own node
  components.forEach(component => {
    component.terminals.forEach((_, index) => {
      const terminalId = getTerminalId(component.id, index);
      const nodeId = `node_${terminalId}`;
      
      terminalToNodeMap.set(terminalId, nodeId);
      nodes.set(nodeId, {
        id: nodeId,
        components: [{
          componentId: component.id,
          terminalIndex: index
        }]
      });
    });
  });
  
  // Function to find the node id for a terminal (with path compression)
  const findNodeId = (terminalId: string): string => {
    const nodeId = terminalToNodeMap.get(terminalId);
    if (!nodeId) return ''; // Should never happen if initialized properly
    return nodeId;
  };
  
  // Function to merge two nodes
  const mergeNodes = (nodeId1: string, nodeId2: string) => {
    if (nodeId1 === nodeId2) return;
    
    const node1 = nodes.get(nodeId1);
    const node2 = nodes.get(nodeId2);
    
    if (!node1 || !node2) return;
    
    // Create a new merged node
    const mergedNodeId = Math.random() < 0.5 ? nodeId1 : nodeId2; // Arbitrarily choose one ID
    const mergedNode: CircuitNode = {
      id: mergedNodeId,
      components: [...node1.components, ...node2.components]
    };
    
    // Update the node map
    nodes.delete(nodeId1);
    nodes.delete(nodeId2);
    nodes.set(mergedNodeId, mergedNode);
    
    // Update terminal to node mappings
    mergedNode.components.forEach(({ componentId, terminalIndex }) => {
      const terminalId = getTerminalId(componentId, terminalIndex);
      terminalToNodeMap.set(terminalId, mergedNodeId);
    });
  };
  
  // Process connections to merge nodes
  connections.forEach(([comp1Id, term1Idx, comp2Id, term2Idx]) => {
    const term1Id = getTerminalId(comp1Id, term1Idx);
    const term2Id = getTerminalId(comp2Id, term2Idx);
    
    const nodeId1 = findNodeId(term1Id);
    const nodeId2 = findNodeId(term2Id);
    
    if (nodeId1 && nodeId2) {
      mergeNodes(nodeId1, nodeId2);
    }
  });
  
  // Return the final list of nodes
  return Array.from(nodes.values());
}

/**
 * Find the ground node in the circuit (if any)
 */
function findGroundNode(components: Component[], nodes: CircuitNode[]): string | null {
  // Find ground components
  const groundComponents = components.filter(c => c.type === 'ground');
  
  if (groundComponents.length === 0) {
    return null;
  }
  
  // Find the node containing a ground component
  for (const node of nodes) {
    for (const { componentId } of node.components) {
      if (groundComponents.some(gc => gc.id === componentId)) {
        return node.id;
      }
    }
  }
  
  return null;
}

/**
 * Simple resistive circuit solver
 * This is a very basic implementation that handles voltage dividers and series resistors
 */
export function solveResistiveCircuit(analyzedCircuit: AnalyzedCircuit): Map<string, number> {
  const { nodes, components, groundNodeId } = analyzedCircuit;
  
  // Map to store voltage at each node
  const nodeVoltages = new Map<string, number>();
  
  // Set ground node to 0V
  if (groundNodeId) {
    nodeVoltages.set(groundNodeId, 0);
  } else if (nodes.length > 0) {
    // If no ground, select the first node as reference (0V)
    nodeVoltages.set(nodes[0].id, 0);
  }
  
  // Find voltage sources
  const voltageSources = components.filter(c => 
    c.type === 'voltageSource' || 
    c.type === 'battery' || 
    c.type === 'acVoltageSource' ||
    c.type === 'squareWaveSource'
  );
  
  // Apply voltage source values to nodes
  voltageSources.forEach(source => {
    // Find the nodes connected to this source's terminals
    const terminal0Node = nodes.find(node => 
      node.components.some(comp => 
        comp.componentId === source.id && comp.terminalIndex === 0
      )
    );
    
    const terminal1Node = nodes.find(node => 
      node.components.some(comp => 
        comp.componentId === source.id && comp.terminalIndex === 1
      )
    );
    
    if (terminal0Node && terminal1Node) {
      // For simplicity, we'll set terminal0 to 0V and terminal1 to the source value
      nodeVoltages.set(terminal0Node.id, 0);
      
      // For DC sources, use the value directly
      if (source.type === 'voltageSource' || source.type === 'battery') {
        nodeVoltages.set(terminal1Node.id, source.value);
      }
      // For AC sources, take the amplitude (peak value)
      else if (source.type === 'acVoltageSource') {
        nodeVoltages.set(terminal1Node.id, source.value);
      }
      // For square waves, use the high value (amplitude or default to source value)
      else if (source.type === 'squareWaveSource') {
        const amplitude = source.properties.amplitude as number || source.value;
        nodeVoltages.set(terminal1Node.id, amplitude);
      }
    }
  });
  
  // Find resistors
  const resistors = components.filter(c => c.type === 'resistor');
  
  // Simple voltage divider calculations for series resistors
  if (resistors.length >= 2 && voltageSources.length === 1) {
    // Find if we have a simple resistor chain
    // This is a very simplified approach that works for basic cases
    
    // Calculate total resistance
    const totalResistance = resistors.reduce((sum, r) => sum + r.value, 0);
    
    // Sort resistors by their position to try to determine the order
    // This is a heuristic and will only work for simple layouts
    const sortedResistors = [...resistors].sort((a, b) => a.position.y - b.position.y);
    
    // Assuming the voltage source is across the entire chain
    const sourceVoltage = voltageSources[0].value;
    
    // Calculate voltage at each point in the divider
    let accumulatedResistance = 0;
    let accumulatedVoltage = 0;
    
    sortedResistors.forEach(resistor => {
      accumulatedResistance += resistor.value;
      accumulatedVoltage = (accumulatedResistance / totalResistance) * sourceVoltage;
      
      // Find the node connected to the output of this resistor
      const outputNode = nodes.find(node => 
        node.components.some(comp => 
          comp.componentId === resistor.id && comp.terminalIndex === 1
        )
      );
      
      if (outputNode) {
        nodeVoltages.set(outputNode.id, accumulatedVoltage);
      }
    });
  }
  
  return nodeVoltages;
}

/**
 * Determine if two components are connected
 */
export function areComponentsConnected(comp1Id: string, comp2Id: string, analyzedCircuit: AnalyzedCircuit): boolean {
  const { nodes } = analyzedCircuit;
  
  // Look for a node that contains both components
  return nodes.some(node => {
    const hasComp1 = node.components.some(c => c.componentId === comp1Id);
    const hasComp2 = node.components.some(c => c.componentId === comp2Id);
    return hasComp1 && hasComp2;
  });
} 