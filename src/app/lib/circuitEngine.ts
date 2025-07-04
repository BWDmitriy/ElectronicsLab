// Types for electronic components
export type ComponentType = 
  | 'resistor' 
  | 'capacitor' 
  | 'inductor' 
  | 'diode' 
  | 'transistor' 
  | 'voltageSource' 
  | 'currentSource' 
  | 'wire'
  | 'ground'
  | 'battery'
  | 'dcCurrentSource'
  | 'acVoltageSource'
  | 'acCurrentSource'
  | 'squareWaveSource'
  | 'oscilloscope'
  | 'ammeter'
  | 'voltmeter';

export interface Point {
  x: number;
  y: number;
}

export interface Component {
  id: string;
  type: ComponentType;
  position: Point;
  rotation: number;
  value: number;
  terminals: Point[];
  properties: Record<string, number | string | boolean>;
}

export interface Wire {
  id: string;
  from: string; // Component ID + terminal index
  to: string; // Component ID + terminal index
  points: Point[];
}

export interface Circuit {
  components: Component[];
  wires: Wire[];
}

// Generate a unique ID for components
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create a new component
export function createComponent(type: ComponentType, position: Point, value: number = 0): Component {
  const id = generateId();
  
  // Default terminals based on component type
  const terminals: Point[] = [];
  
  // Special case for ground - only one terminal at the top
  if (type === 'ground') {
    terminals.push({ x: position.x, y: position.y - 20 });
  } else if (type === 'oscilloscope') {
    // Oscilloscope terminals positioned like Electronics Workbench:
    // Terminal 0: Ground (top right)
    // Terminal 1: Channel A (bottom right, next to graph)
    // Terminal 2: Channel B (bottom right, below Channel A)
    // Terminal 3: Input (right side, middle)
    terminals.push({ x: position.x + 45, y: position.y - 25 }); // Ground (top right)
    terminals.push({ x: position.x + 45, y: position.y + 5 });  // Channel A (bottom right)
    terminals.push({ x: position.x + 45, y: position.y + 20 }); // Channel B (bottom right)
    terminals.push({ x: position.x + 60, y: position.y });      // Input (right side)
  } else if (type === 'ammeter' || type === 'voltmeter') {
    // Meters have two terminals for series (ammeter) or parallel (voltmeter) connection
    terminals.push({ x: position.x - 40, y: position.y });     // Left terminal
    terminals.push({ x: position.x + 40, y: position.y });     // Right terminal
  } else {
    // Set default terminals (left and right for most components)
    terminals.push({ x: position.x - 40, y: position.y });
    terminals.push({ x: position.x + 40, y: position.y });
    
    // Additional terminals for specific components
    if (type === 'transistor') {
      terminals.push({ x: position.x, y: position.y + 40 });
    }
  }
  
  return {
    id,
    type,
    position,
    rotation: 0,
    value,
    terminals,
    properties: {},
  };
}

// Create a wire connecting components
export function createWire(fromComponent: string, fromTerminal: number, toComponent: string, toTerminal: number): Wire {
  return {
    id: generateId(),
    from: `${fromComponent}:${fromTerminal}`,
    to: `${toComponent}:${toTerminal}`,
    points: [],
  };
}

// Basic simulation functions (placeholder)
export function runSimulation(circuit: Circuit): Record<string, number> {
  // This would be replaced with an actual circuit simulation algorithm
  // For now, we'll return placeholder values
  const results: Record<string, number> = {};
  
  circuit.components.forEach(component => {
    // Placeholder values based on component type
    switch (component.type) {
      case 'resistor':
        results[component.id] = component.value; // Resistance in ohms
        break;
      case 'voltageSource':
      case 'battery':
      case 'acVoltageSource':
        results[component.id] = component.value; // Voltage in volts
        break;
      case 'currentSource':
      case 'dcCurrentSource':
      case 'acCurrentSource':
        results[component.id] = component.value; // Current in amps
        break;
      case 'squareWaveSource':
        results[component.id] = component.value; // Frequency in Hz
        break;
      case 'ground':
        results[component.id] = 0; // 0V reference
        break;
      default:
        results[component.id] = 0;
    }
  });
  
  return results;
} 