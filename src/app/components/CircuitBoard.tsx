'use client';

import { useState, useRef, useEffect } from 'react';
import { Circuit, Point, createComponent, ComponentType } from '../lib/circuitEngine';
import CircuitComponent from './CircuitComponent';
import WireComponent from './WireComponent';
import PropertiesPanel from './PropertiesPanel';
import Oscilloscope from './Oscilloscope';
import { simulateOscilloscopeCircuit, getOscilloscopeProbes } from '../lib/oscilloscopeSimulator';
import { SimulationResult } from '../lib/circuitSimulator';
import { analyzeCircuit, solveCircuit, updateComponentMeasurements } from '../lib/circuitAnalysis';

interface CircuitBoardProps {
  initialCircuit?: Circuit;
  onCircuitChange?: (circuit: Circuit) => void;
}

export default function CircuitBoard({ initialCircuit, onCircuitChange }: CircuitBoardProps) {
  const [circuit, setCircuit] = useState<Circuit>(initialCircuit || { components: [], wires: [] });
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<ComponentType | 'select' | 'wire'>('select');
  const [wireStartTerminal, setWireStartTerminal] = useState<{componentId: string, terminalIndex: number} | null>(null);
  const [oscilloscopeResult, setOscilloscopeResult] = useState<SimulationResult | null>(null);
  const [oscilloscopeProbes, setOscilloscopeProbes] = useState<Array<{id: string, label: string, terminalIndex: number}>>([]);
  const [showOscilloscope, setShowOscilloscope] = useState(false);
  const [wireUpdateStatus, setWireUpdateStatus] = useState<string | null>(null);
  const boardRef = useRef<SVGSVGElement>(null);
  const gridSize = 20;
  
  // Get the selected component (if any)
  const selectedComponent = selectedComponentId 
    ? circuit.components.find(comp => comp.id === selectedComponentId) || null
    : null;
  
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
  
  // Handle terminal clicks for wire creation
  const handleTerminalClick = (componentId: string, terminalIndex: number) => {
    console.log(`Terminal clicked: ${componentId}:${terminalIndex}, current tool: ${currentTool}`);
    
    if (currentTool === 'wire') {
      if (!wireStartTerminal) {
        // Start a new wire
        console.log(`Starting wire from ${componentId}:${terminalIndex}`);
        setWireStartTerminal({ componentId, terminalIndex });
      } else {
        // Complete the wire
        if (wireStartTerminal.componentId !== componentId) {
          // Find the terminal positions
          const startComponent = circuit.components.find(c => c.id === wireStartTerminal.componentId);
          const endComponent = circuit.components.find(c => c.id === componentId);
          
          if (startComponent && endComponent) {
            const startTerminal = startComponent.terminals[wireStartTerminal.terminalIndex];
            const endTerminal = endComponent.terminals[terminalIndex];
            
            console.log(`Creating wire from ${wireStartTerminal.componentId}:${wireStartTerminal.terminalIndex} to ${componentId}:${terminalIndex}`);
            console.log(`Start terminal position:`, startTerminal);
            console.log(`End terminal position:`, endTerminal);
            
            // Create wire between the two terminals with proper points
            const newWire = {
              id: Math.random().toString(36).substring(2, 9),
              from: `${wireStartTerminal.componentId}:${wireStartTerminal.terminalIndex}`,
              to: `${componentId}:${terminalIndex}`,
              points: [
                { x: startTerminal.x, y: startTerminal.y },
                { x: endTerminal.x, y: endTerminal.y }
              ]
            };
            
            console.log(`Created wire:`, newWire);
            
            setCircuit(prev => ({
              ...prev,
              wires: [...prev.wires, newWire]
            }));
          }
        } else {
          console.log(`Cannot connect terminal to itself`);
        }
        
        // Reset wire creation
        console.log(`Resetting wire creation`);
        setWireStartTerminal(null);
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
      'squareWaveSource': 60, // 60Hz
      'oscilloscope': 0,
      'ammeter': 0, // Current reading (calculated)
      'voltmeter': 0 // Voltage reading (calculated)
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
    
    console.log(`Moving component ${id} to (${newX}, ${newY})`);
    
    setCircuit(prev => {
      const updatedComponents = prev.components.map(comp => {
        if (comp.id === id) {
          // Calculate how much the component moved
          const deltaX = newX - comp.position.x;
          const deltaY = newY - comp.position.y;
          
          console.log(`Component ${id} moved by delta (${deltaX}, ${deltaY})`);
          
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
      
      // Update wires connected to the moved component
      const updatedWires = prev.wires.map(wire => {
        let needsUpdate = false;
        const updatedPoints = [...wire.points];
        
        // Check if this wire is connected to the moved component
        const fromConnection = wire.from.split(':');
        const toConnection = wire.to.split(':');
        const fromComponentId = fromConnection[0];
        const toComponentId = toConnection[0];
        
        if (fromComponentId === id) {
          // Update the 'from' endpoint
          const terminalIndex = parseInt(fromConnection[1]);
          const movedComponent = updatedComponents.find(comp => comp.id === id);
          if (movedComponent && movedComponent.terminals[terminalIndex]) {
            console.log(`Updating wire ${wire.id} 'from' endpoint for component ${id}`);
            updatedPoints[0] = {
              x: movedComponent.terminals[terminalIndex].x,
              y: movedComponent.terminals[terminalIndex].y
            };
            needsUpdate = true;
          }
        }
        
        if (toComponentId === id) {
          // Update the 'to' endpoint
          const terminalIndex = parseInt(toConnection[1]);
          const movedComponent = updatedComponents.find(comp => comp.id === id);
          if (movedComponent && movedComponent.terminals[terminalIndex]) {
            console.log(`Updating wire ${wire.id} 'to' endpoint for component ${id}`);
            updatedPoints[updatedPoints.length - 1] = {
              x: movedComponent.terminals[terminalIndex].x,
              y: movedComponent.terminals[terminalIndex].y
            };
            needsUpdate = true;
          }
        }
        
        return needsUpdate ? { ...wire, points: updatedPoints } : wire;
      });
      
      console.log(`Updated ${updatedWires.filter((wire, index) => wire !== prev.wires[index]).length} wires`);
      
      const updatedWireCount = updatedWires.filter((wire, index) => wire !== prev.wires[index]).length;
      if (updatedWireCount > 0) {
        setWireUpdateStatus(`Updated ${updatedWireCount} wire${updatedWireCount > 1 ? 's' : ''}`);
        setTimeout(() => setWireUpdateStatus(null), 2000); // Clear status after 2 seconds
      }
      
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
      setWireStartTerminal(null); // Reset wire creation state
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
      
      // Rotate selected component (except ground and oscilloscope)
      if (e.key === 'r' && selectedComponentId) {
        setCircuit(prev => {
          const selectedComponent = prev.components.find(comp => comp.id === selectedComponentId);
          // Don't rotate ground or oscilloscope components
          if (selectedComponent && (selectedComponent.type === 'ground' || selectedComponent.type === 'oscilloscope')) {
            return prev;
          }
          
          const updatedComponents = prev.components.map(comp => {
            if (comp.id === selectedComponentId) {
              // Calculate the new rotation angle
              const newRotation = (comp.rotation + 90) % 360;
              
              // Rotate terminals around the component center
              const rotatedTerminals = comp.terminals.map(terminal => {
                // Calculate terminal position relative to component center
                const relX = terminal.x - comp.position.x;
                const relY = terminal.y - comp.position.y;
                
                // Rotate 90 degrees (x' = -y, y' = x)
                const rotatedX = -relY + comp.position.x;
                const rotatedY = relX + comp.position.y;
                
                return { x: rotatedX, y: rotatedY };
              });
              
              return {
                ...comp,
                rotation: newRotation,
                terminals: rotatedTerminals
              };
            }
            return comp;
          });
          
          // Update wires connected to the rotated component
          const updatedWires = prev.wires.map(wire => {
            let needsUpdate = false;
            const updatedPoints = [...wire.points];
            
            // Check if this wire is connected to the rotated component
            const fromConnection = wire.from.split(':');
            const toConnection = wire.to.split(':');
            const fromComponentId = fromConnection[0];
            const toComponentId = toConnection[0];
            
            if (fromComponentId === selectedComponentId) {
              // Update the 'from' endpoint
              const terminalIndex = parseInt(fromConnection[1]);
              const rotatedComponent = updatedComponents.find(comp => comp.id === selectedComponentId);
              if (rotatedComponent && rotatedComponent.terminals[terminalIndex]) {
                updatedPoints[0] = {
                  x: rotatedComponent.terminals[terminalIndex].x,
                  y: rotatedComponent.terminals[terminalIndex].y
                };
                needsUpdate = true;
              }
            }
            
            if (toComponentId === selectedComponentId) {
              // Update the 'to' endpoint
              const terminalIndex = parseInt(toConnection[1]);
              const rotatedComponent = updatedComponents.find(comp => comp.id === selectedComponentId);
              if (rotatedComponent && rotatedComponent.terminals[terminalIndex]) {
                updatedPoints[updatedPoints.length - 1] = {
                  x: rotatedComponent.terminals[terminalIndex].x,
                  y: rotatedComponent.terminals[terminalIndex].y
                };
                needsUpdate = true;
              }
            }
            
            return needsUpdate ? { ...wire, points: updatedPoints } : wire;
          });
          
          return {
            ...prev,
            components: updatedComponents,
            wires: updatedWires
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
  
  // Update a component's primary value
  const handleComponentValueChange = (id: string, newValue: number) => {
    console.log(`Updating component ${id} value to ${newValue}`);
    
    // Special handling for zero values - we don't want to remove components anymore
    // Instead, enforce a minimum value appropriate for the component type
    setCircuit(prev => {
      const updatedComponents = prev.components.map(comp => {
        if (comp.id === id) {
          // Find minimum allowed value based on component type
          let finalValue = newValue;
          if (newValue <= 0) {
            switch (comp.type) {
              case 'resistor':
                finalValue = 0.1; // 0.1 ohm minimum
                break;
              case 'capacitor':
                finalValue = 1e-12; // 1pF minimum
                break;
              case 'inductor':
                finalValue = 1e-9; // 1nH minimum
                break;
              case 'voltageSource':
              case 'battery':
              case 'acVoltageSource':
                finalValue = 0.1; // 0.1V minimum
                break;
              case 'currentSource':
              case 'dcCurrentSource':
              case 'acCurrentSource':
                finalValue = 1e-6; // 1µA minimum
                break;
              case 'squareWaveSource':
                finalValue = 0.1; // 0.1Hz minimum
                break;
              default:
                finalValue = 0.1; // Default minimum
            }
            console.log(`Value too low, using minimum: ${finalValue}`);
          }
          
          return {
            ...comp,
            value: finalValue
          };
        }
        return comp;
      });
      
      return {
        ...prev,
        components: updatedComponents
      };
    });
  };
  
  // Update a component's property
  const handleComponentPropertyChange = (id: string, propertyName: string, value: number | string | boolean) => {
    setCircuit(prev => {
      const updatedComponents = prev.components.map(comp => {
        if (comp.id === id) {
          return {
            ...comp,
            properties: {
              ...comp.properties,
              [propertyName]: value
            }
          };
        }
        return comp;
      });
      
      return {
        ...prev,
        components: updatedComponents
      };
    });
  };
  
  // Auto-run oscilloscope simulation when circuit changes
  useEffect(() => {
    // Find all oscilloscopes in the circuit
    const oscilloscopes = circuit.components.filter(comp => comp.type === 'oscilloscope');
    
    if (oscilloscopes.length > 0 && showOscilloscope) {
      // Use the first oscilloscope for auto-simulation
      const oscilloscope = oscilloscopes[0];
      const result = simulateOscilloscopeCircuit(circuit, oscilloscope.id);
      const probes = getOscilloscopeProbes(circuit, oscilloscope.id);
      
      if (result && probes.length > 0) {
        setOscilloscopeResult(result);
        setOscilloscopeProbes(probes);
        console.log('Auto-simulation completed for oscilloscope:', oscilloscope.id);
      }
    }
  }, [circuit, showOscilloscope]);
  
  // Auto-analyze circuit and update meter readings
  useEffect(() => {
    // Only analyze if we have components and at least one meter
    const hasMeters = circuit.components.some(comp => comp.type === 'ammeter' || comp.type === 'voltmeter');
    
    if (circuit.components.length > 0 && hasMeters) {
      try {
        // Analyze the circuit structure
        const analyzedCircuit = analyzeCircuit(circuit);
        
        // Solve for voltages and currents
        const analysisResult = solveCircuit(analyzedCircuit);
        
        // Update meter readings
        const updatedCircuit = updateComponentMeasurements(circuit, analysisResult.componentMeasurements);
        
        // Only update if measurements actually changed significantly
        const measurementsChanged = updatedCircuit.components.some((comp, index) => {
          const originalComp = circuit.components[index];
          if (!originalComp) return true;
          
          // Only consider significant changes (more than 1% difference)
          const percentChange = Math.abs((comp.value - originalComp.value) / (originalComp.value || 1));
          return percentChange > 0.01;
        });
        
        if (measurementsChanged) {
          console.log('Circuit analysis completed, updating meter readings');
          setCircuit(updatedCircuit);
        }
      } catch (error) {
        console.warn('Circuit analysis failed:', error);
      }
    }
  }, [
    // Only depend on structural changes, not meter values
    circuit.components.map(c => `${c.type}-${c.id}-${c.type === 'ammeter' || c.type === 'voltmeter' ? 'meter' : c.value}`).join(','),
    circuit.wires.map(w => `${w.from}-${w.to}`).join(',')
  ]);
  
  // Handle oscilloscope simulation (manual trigger)
  const handleOscilloscopeSimulation = (oscilloscopeId: string) => {
    const result = simulateOscilloscopeCircuit(circuit, oscilloscopeId);
    const probes = getOscilloscopeProbes(circuit, oscilloscopeId);
    
    if (!result) {
      alert('No components connected to this oscilloscope. Connect some components first.');
      return;
    }
    
    if (probes.length === 0) {
      alert('No probe connections found. Connect wires to the oscilloscope terminals.');
      return;
    }
    
    // Set the simulation results and show the oscilloscope
    setOscilloscopeResult(result);
    setOscilloscopeProbes(probes);
    setShowOscilloscope(true);
    
    console.log('Manual oscilloscope simulation completed:', result);
    console.log('Probe connections:', probes);
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded">
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'select' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('select');
            setWireStartTerminal(null);
          }}
        >
          Select
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'wire' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('wire');
            setWireStartTerminal(null); // Reset any ongoing wire creation
          }}
        >
          Wire
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'resistor' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('resistor');
            setWireStartTerminal(null);
          }}
        >
          Resistor
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'capacitor' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('capacitor');
            setWireStartTerminal(null);
          }}
        >
          Capacitor
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'inductor' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('inductor');
            setWireStartTerminal(null);
          }}
        >
          Inductor
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'diode' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('diode');
            setWireStartTerminal(null);
          }}
        >
          Diode
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'ground' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('ground');
            setWireStartTerminal(null);
          }}
        >
          Ground
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'battery' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('battery');
            setWireStartTerminal(null);
          }}
        >
          Battery
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'dcCurrentSource' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('dcCurrentSource');
            setWireStartTerminal(null);
          }}
        >
          DC Source
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'acVoltageSource' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('acVoltageSource');
            setWireStartTerminal(null);
          }}
        >
          AC Voltage
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'acCurrentSource' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('acCurrentSource');
            setWireStartTerminal(null);
          }}
        >
          AC Current
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'squareWaveSource' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('squareWaveSource');
            setWireStartTerminal(null);
          }}
        >
          Clock
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'oscilloscope' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('oscilloscope');
            setWireStartTerminal(null);
          }}
        >
          Oscilloscope
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'ammeter' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('ammeter');
            setWireStartTerminal(null);
          }}
        >
          Ammeter
        </button>
        <button 
          className={`px-3 py-1 rounded ${currentTool === 'voltmeter' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => {
            setCurrentTool('voltmeter');
            setWireStartTerminal(null);
          }}
        >
          Voltmeter
        </button>
      </div>
      
      {/* Wire creation status */}
      {currentTool === 'wire' && (
        <div className="p-2 bg-yellow-100 rounded text-sm">
          {wireStartTerminal 
            ? 'Click on another terminal to complete the wire connection'
            : 'Click on a terminal to start creating a wire'
          }
        </div>
      )}
      
      {/* Wire update status */}
      {wireUpdateStatus && (
        <div className="p-2 bg-green-100 border border-green-300 rounded text-sm text-green-700">
          ✓ {wireUpdateStatus}
        </div>
      )}
      
      <div className="relative">
        <div className="w-full border border-gray-300 rounded overflow-hidden">
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
                onTerminalClick={handleTerminalClick}
                isConnected={false}
                wireMode={currentTool === 'wire'}
                wireStartTerminal={wireStartTerminal}
              />
            ))}
          </svg>
        </div>
        
        {selectedComponent && (
          <div className="absolute top-0 right-0 w-80 m-2 z-10">
            <PropertiesPanel
              component={selectedComponent}
              onValueChange={handleComponentValueChange}
              onPropertyChange={handleComponentPropertyChange}
            />
            
            {/* Rotation button - don't show for ground or oscilloscope components */}
            {selectedComponent.type !== 'ground' && selectedComponent.type !== 'oscilloscope' && (
              <button 
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded w-full"
                onClick={() => {
                  setCircuit(prev => {
                    const updatedComponents = prev.components.map(comp => {
                      if (comp.id === selectedComponent.id) {
                        // Calculate the new rotation angle
                        const newRotation = (comp.rotation + 90) % 360;
                        
                        // Rotate terminals around the component center
                        const rotatedTerminals = comp.terminals.map(terminal => {
                          // Calculate terminal position relative to component center
                          const relX = terminal.x - comp.position.x;
                          const relY = terminal.y - comp.position.y;
                          
                          // Rotate 90 degrees (x' = -y, y' = x)
                          const rotatedX = -relY + comp.position.x;
                          const rotatedY = relX + comp.position.y;
                          
                          return { x: rotatedX, y: rotatedY };
                        });
                        
                        return {
                          ...comp,
                          rotation: newRotation,
                          terminals: rotatedTerminals
                        };
                      }
                      return comp;
                    });
                    
                    // Update wires connected to the rotated component
                    const updatedWires = prev.wires.map(wire => {
                      let needsUpdate = false;
                      const updatedPoints = [...wire.points];
                      
                      // Check if this wire is connected to the rotated component
                      const fromConnection = wire.from.split(':');
                      const toConnection = wire.to.split(':');
                      const fromComponentId = fromConnection[0];
                      const toComponentId = toConnection[0];
                      
                      if (fromComponentId === selectedComponent.id) {
                        // Update the 'from' endpoint
                        const terminalIndex = parseInt(fromConnection[1]);
                        const rotatedComponent = updatedComponents.find(comp => comp.id === selectedComponent.id);
                        if (rotatedComponent && rotatedComponent.terminals[terminalIndex]) {
                          updatedPoints[0] = {
                            x: rotatedComponent.terminals[terminalIndex].x,
                            y: rotatedComponent.terminals[terminalIndex].y
                          };
                          needsUpdate = true;
                        }
                      }
                      
                      if (toComponentId === selectedComponent.id) {
                        // Update the 'to' endpoint
                        const terminalIndex = parseInt(toConnection[1]);
                        const rotatedComponent = updatedComponents.find(comp => comp.id === selectedComponent.id);
                        if (rotatedComponent && rotatedComponent.terminals[terminalIndex]) {
                          updatedPoints[updatedPoints.length - 1] = {
                            x: rotatedComponent.terminals[terminalIndex].x,
                            y: rotatedComponent.terminals[terminalIndex].y
                          };
                          needsUpdate = true;
                        }
                      }
                      
                      return needsUpdate ? { ...wire, points: updatedPoints } : wire;
                    });
                    
                    return {
                      ...prev,
                      components: updatedComponents,
                      wires: updatedWires
                    };
                  });
                }}
              >
                Rotate 90° (or press &apos;r&apos;)
              </button>
            )}
            
            {/* Show simulation button for oscilloscope components */}
            {selectedComponent.type === 'oscilloscope' && (
              <button 
                className="mt-2 px-3 py-1 bg-green-500 text-white rounded w-full"
                onClick={() => handleOscilloscopeSimulation(selectedComponent.id)}
              >
                Run Simulation
              </button>
            )}
          </div>
        )}
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
          onClick={() => setShowOscilloscope(true)}
        >
          Show Oscilloscope
        </button>
      </div>
      
      {/* Oscilloscope Display */}
      {showOscilloscope && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl max-h-[90vh] overflow-auto m-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold text-gray-800">Digital Oscilloscope</h3>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => {
                    // Find the first oscilloscope and run simulation
                    const oscilloscope = circuit.components.find(comp => comp.type === 'oscilloscope');
                    if (oscilloscope) {
                      handleOscilloscopeSimulation(oscilloscope.id);
                    }
                  }}
                >
                  Run Simulation
                </button>
                <button 
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  onClick={() => setShowOscilloscope(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4">
              {!oscilloscopeResult && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-bold text-blue-800 mb-2">How to use the Oscilloscope:</h4>
                  <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                    <li>Place an oscilloscope component on the circuit board</li>
                    <li>Add signal sources (AC/DC voltage, current sources, or square wave generators)</li>
                    <li>Use the Wire tool to connect components to the oscilloscope terminals:
                      <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                        <li><strong>Ground (Black)</strong>: Circuit ground reference</li>
                        <li><strong>Channel A (Red)</strong>: First signal to measure</li>
                        <li><strong>Channel B (Blue)</strong>: Second signal to measure</li>
                        <li><strong>Input (Green)</strong>: Signal input source</li>
                      </ul>
                    </li>
                    <li>Click &quot;Run Simulation&quot; to see the waveforms</li>
                  </ol>
                  <p className="text-xs text-blue-600 mt-2">
                    <strong>Tip:</strong> The oscilloscope has a professional layout with the graph on the left and terminals on the right, just like Electronics Workbench.
                  </p>
                </div>
              )}
              
              <Oscilloscope
                simulationResult={oscilloscopeResult}
                nodeIds={oscilloscopeProbes.map(probe => probe.id)}
                availableProbes={oscilloscopeProbes.map(probe => ({ id: probe.id, label: probe.label }))}
                width={900}
                height={500}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 