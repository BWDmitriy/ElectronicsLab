// Types for electronic components
export type ComponentType = 'resistor' | 'capacitor' | 'inductor' | 'diode' | 'transistor' | 'voltageSource' | 'currentSource' | 'wire';

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
  
  // Set default terminals (left and right for most components)
  terminals.push({ x: position.x - 40, y: position.y });
  terminals.push({ x: position.x + 40, y: position.y });
  
  // Additional terminals for specific components
  if (type === 'transistor') {
    terminals.push({ x: position.x, y: position.y + 40 });
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
        results[component.id] = component.value; // Voltage in volts
        break;
      default:
        results[component.id] = 0;
    }
  });
  
  return results;
} 