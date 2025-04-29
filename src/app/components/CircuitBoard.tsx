'use client';

import { useState, useRef, useEffect } from 'react';
import { Circuit, Point, createComponent, ComponentType } from '../lib/circuitEngine';
import CircuitComponent from './CircuitComponent';
import WireComponent from './WireComponent';

interface CircuitBoardProps {
  initialCircuit?: Circuit;
  onCircuitChange?: (circuit: Circuit) => void;
}

export default function CircuitBoard({ initialCircuit, onCircuitChange }: CircuitBoardProps) {
  const [circuit, setCircuit] = useState<Circuit>(initialCircuit || { components: [], wires: [] });
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<ComponentType | 'select'>('select');
  const boardRef = useRef<SVGSVGElement>(null);
  const gridSize = 20;
  
  // Update parent component when circuit changes
  useEffect(() => {
    onCircuitChange?.(circuit);
  }, [circuit, onCircuitChange]);
  
  // Handle component selection
  const handleComponentClick = (id: string) => {
    if (currentTool === 'select') {
      if (selectedComponentId === id) {
        // If clicking the already selected component, deselect it
        setSelectedComponentId(null);
      } else {
        setSelectedComponentId(id);
        setSelectedWireId(null);
      }
    }
  };
  
  // Handle wire selection
  const handleWireClick = (id: string) => {
    if (currentTool === 'select') {
      if (selectedWireId === id) {
        // If clicking the already selected wire, deselect it
        setSelectedWireId(null);
      } else {
        setSelectedWireId(id);
        setSelectedComponentId(null);
      }
    }
  };
  
  // Add a new component
  const addComponent = (type: ComponentType, pos: Point) => {
    // Align to grid
    const position = {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize
    };
    
    const defaultValues: Record<ComponentType, number> = {
      'resistor': 1000, // 1k ohm
      'capacitor': 0.000001, // 1µF
      'inductor': 0.001, // 1mH
      'diode': 0,
      'transistor': 0,
      'voltageSource': 5, // 5V
      'currentSource': 0.1, // 100mA
      'wire': 0,
      'ground': 0,
      'battery': 12, // 12V
      'dcCurrentSource': 0.1, // 100mA
      'acVoltageSource': 120, // 120V
      'acCurrentSource': 1, // 1A
      'squareWaveSource': 60 // 60Hz
    };
    
    const component = createComponent(type, position, defaultValues[type]);
    
    setCircuit(prev => ({
      ...prev,
      components: [...prev.components, component]
    }));
    
    setSelectedComponentId(component.id);
    setSelectedWireId(null);
  };
  
  // Move a component
  const moveComponent = (id: string, x: number, y: number) => {
    // Align to grid
    const newX = Math.round(x / gridSize) * gridSize;
    const newY = Math.round(y / gridSize) * gridSize;
    
    setCircuit(prev => {
      const updatedComponents = prev.components.map(comp => {
        if (comp.id === id) {
          // Calculate how much the component moved
          const deltaX = newX - comp.position.x;
          const deltaY = newY - comp.position.y;
          
          // Update terminals based on the movement
          const updatedTerminals = comp.terminals.map(terminal => ({
            x: terminal.x + deltaX,
            y: terminal.y + deltaY
          }));
          
          return {
            ...comp,
            position: { x: newX, y: newY },
            terminals: updatedTerminals
          };
        }
        return comp;
      });
      
      // Also update any wires connected to this component
      const updatedWires = prev.wires.map(wire => {
        const points = [...wire.points];
        return { ...wire, points };
      });
      
      return {
        components: updatedComponents,
        wires: updatedWires
      };
    });
  };
  
  // Handle mouse down on the board
  const handleBoardMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only handle clicks directly on the SVG element or grid elements
    if (e.currentTarget !== e.target && 
        !(e.target as Element).classList.contains('grid') && 
        (e.target as Element).tagName !== 'line') {
      return;
    }
    
    if (!boardRef.current) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool !== 'select') {
      // Add a new component based on the current tool
      addComponent(currentTool as ComponentType, { x, y });
      setCurrentTool('select'); // Switch back to select tool after placing component
    } else {
      // Deselect current selections when clicking on empty board areas
      setSelectedComponentId(null);
      setSelectedWireId(null);
    }
  };
  
  // Handle key presses for shortcuts and deletions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected component or wire
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) {
          setCircuit(prev => ({
            ...prev,
            components: prev.components.filter(comp => comp.id !== selectedComponentId),
            // Also remove wires connected to this component
            wires: prev.wires.filter(wire => !wire.from.includes(selectedComponentId) && !wire.to.includes(selectedComponentId))
          }));
          setSelectedComponentId(null);
        } else if (selectedWireId) {
          setCircuit(prev => ({
            ...prev,
            wires: prev.wires.filter(wire => wire.id !== selectedWireId)
          }));
          setSelectedWireId(null);
        }
      }
      
      // Rotate selected component
      if (e.key === 'r' && selectedComponentId) {
        setCircuit(prev => {
          const updatedComponents = prev.components.map(comp => {
            if (comp.id === selectedComponentId) {
              return {
                ...comp,
                rotation: (comp.rotation + 90) % 360
              };
            }
            return comp;
          });
          
          return {
            ...prev,
            components: updatedComponents
          };
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedComponentId, selectedWireId]);
  
  // Draw grid lines
  const renderGrid = () => {
    const gridLines = [];
    const width = boardRef.current?.clientWidth || 1000;
    const height = boardRef.current?.clientHeight || 800;
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      gridLines.push(
        <line 
          key={`v-${x}`} 
          x1={x} 
          y1={0} 
          x2={x} 
          y2={height} 
          stroke="#e0e0e0" 
          strokeWidth="1" 
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      gridLines.push(
        <line 
          key={`h-${y}`} 
          x1={0} 
          y1={y} 
          x2={width} 
          y2={y} 
          stroke="#e0e0e0" 
          strokeWidth="1" 
        />
      );
    }
    
    return gridLines;
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded">
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'select' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setCurrentTool('select')}
        >
          Select
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'resistor' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setCurrentTool('resistor')}
        >
          Resistor
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'capacitor' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setCurrentTool('capacitor')}
        >
          Capacitor
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'inductor' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setCurrentTool('inductor')}
        >
          Inductor
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'diode' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setCurrentTool('diode')}
        >
          Diode
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'ground' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setCurrentTool('ground')}
        >
          Ground
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'battery' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setCurrentTool('battery')}
        >
          Battery
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'dcCurrentSource' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setCurrentTool('dcCurrentSource')}
        >
          DC Source
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'acVoltageSource' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setCurrentTool('acVoltageSource')}
        >
          AC Voltage
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'acCurrentSource' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setCurrentTool('acCurrentSource')}
        >
          AC Current
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'squareWaveSource' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setCurrentTool('squareWaveSource')}
        >
          Clock
        </button>
      </div>
      
      <div className="border border-gray-300 rounded overflow-hidden">
        <svg 
          ref={boardRef} 
          width="100%" 
          height="600px" 
          viewBox="0 0 1000 800"
          className="bg-white" 
          onMouseDown={handleBoardMouseDown}
        >
          {/* Grid */}
          <g className="grid">{renderGrid()}</g>
          
          {/* Wires */}
          {circuit.wires.map(wire => (
            <WireComponent 
              key={wire.id} 
              wire={wire} 
              selected={wire.id === selectedWireId} 
              onClick={handleWireClick} 
            />
          ))}
          
          {/* Components */}
          {circuit.components.map(component => (
            <CircuitComponent 
              key={component.id} 
              component={component} 
              selected={component.id === selectedComponentId} 
              onClick={handleComponentClick} 
              onMove={moveComponent} 
            />
          ))}
        </svg>
      </div>
      
      <div className="flex justify-between p-2 bg-gray-100 rounded">
        <button 
          className="px-3 py-1 bg-red-500 text-white rounded"
          onClick={() => {
            if (window.confirm('Clear the circuit board?')) {
              setCircuit({ components: [], wires: [] });
              setSelectedComponentId(null);
              setSelectedWireId(null);
            }
          }}
        >
          Clear Board
        </button>
        
        <button 
          className="px-3 py-1 bg-green-500 text-white rounded"
          onClick={() => {
            // This would typically trigger a simulation
            alert('Simulation feature will be implemented in the future');
          }}
        >
          Run Simulation
        </button>
      </div>
    </div>
  );
} 