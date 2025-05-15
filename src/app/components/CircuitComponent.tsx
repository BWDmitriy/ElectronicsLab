'use client';

import { Component, ComponentType } from '../lib/circuitEngine';
import { useState, useEffect, useCallback } from 'react';

interface CircuitComponentProps {
  component: Component;
  selected: boolean;
  onClick: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  isConnected?: boolean;
}

export default function CircuitComponent({ 
  component, 
  selected, 
  onClick, 
  onMove,
  isConnected = false
}: CircuitComponentProps) {
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getComponentSymbol = (type: ComponentType) => {
    // Helper function to format values with appropriate units
    const formatValue = (value: number, type: ComponentType): string => {
      switch (type) {
        case 'resistor':
          return value >= 1000000 ? `${(value/1000000).toFixed(1)}MΩ` :
                 value >= 1000 ? `${(value/1000).toFixed(1)}kΩ` :
                 `${value.toFixed(1)}Ω`;
        case 'capacitor':
          return value >= 0.000001 ? `${(value*1000000).toFixed(1)}µF` :
                 value >= 0.000000001 ? `${(value*1000000000).toFixed(1)}nF` :
                 `${(value*1000000000000).toFixed(1)}pF`;
        case 'inductor':
          return value >= 1 ? `${value.toFixed(1)}H` :
                 value >= 0.001 ? `${(value*1000).toFixed(1)}mH` :
                 `${(value*1000000).toFixed(1)}µH`;
        case 'voltageSource':
        case 'battery':
        case 'acVoltageSource':
          return `${value.toFixed(1)}V`;
        case 'currentSource':
        case 'dcCurrentSource':
        case 'acCurrentSource':
          return value >= 1 ? `${value.toFixed(1)}A` :
                 value >= 0.001 ? `${(value*1000).toFixed(1)}mA` :
                 `${(value*1000000).toFixed(1)}µA`;
        case 'squareWaveSource':
          return value >= 1000000 ? `${(value/1000000).toFixed(1)}MHz` :
                 value >= 1000 ? `${(value/1000).toFixed(1)}kHz` :
                 `${value.toFixed(1)}Hz`;
        default:
          return `${value}`;
      }
    };

    switch (type) {
      case 'resistor':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <rect x={component.position.x - 20} y={component.position.y - 10} width="40" height="20" fill="white" stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y + 5} textAnchor="middle" fontSize="12">{formatValue(component.value, 'resistor')}</text>
          </g>
        );
      case 'capacitor':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 10} y2={component.position.y} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 10} y1={component.position.y - 15} x2={component.position.x - 10} y2={component.position.y + 15} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 10} y1={component.position.y - 15} x2={component.position.x + 10} y2={component.position.y + 15} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 10} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 20} textAnchor="middle" fontSize="12">{formatValue(component.value, 'capacitor')}</text>
          </g>
        );
      case 'inductor':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <path d={`M${component.position.x - 20},${component.position.y} 
                      A5,5 0 0 1 ${component.position.x - 10},${component.position.y} 
                      A5,5 0 0 1 ${component.position.x},${component.position.y} 
                      A5,5 0 0 1 ${component.position.x + 10},${component.position.y} 
                      A5,5 0 0 1 ${component.position.x + 20},${component.position.y}`} 
                  fill="none" stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 15} textAnchor="middle" fontSize="12">{formatValue(component.value, 'inductor')}</text>
          </g>
        );
      case 'voltageSource':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <circle cx={component.position.x} cy={component.position.y} r="20" fill="white" stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 10} y1={component.position.y} x2={component.position.x + 10} y2={component.position.y} stroke="black" strokeWidth="2" />
            <line x1={component.position.x} y1={component.position.y - 10} x2={component.position.x} y2={component.position.y + 10} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'voltageSource')}</text>
          </g>
        );
      case 'ground':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x} y1={component.position.y - 20} x2={component.position.x} y2={component.position.y + 10} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 15} y1={component.position.y + 10} x2={component.position.x + 15} y2={component.position.y + 10} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 10} y1={component.position.y + 15} x2={component.position.x + 10} y2={component.position.y + 15} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 5} y1={component.position.y + 20} x2={component.position.x + 5} y2={component.position.y + 20} stroke="black" strokeWidth="2" />
          </g>
        );
      case 'battery':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 10} y2={component.position.y} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 10} y1={component.position.y - 15} x2={component.position.x - 10} y2={component.position.y + 15} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 5} y1={component.position.y - 7} x2={component.position.x - 5} y2={component.position.y + 7} stroke="black" strokeWidth="3" />
            <line x1={component.position.x + 5} y1={component.position.y - 15} x2={component.position.x + 5} y2={component.position.y + 15} stroke="black" strokeWidth="1" />
            <line x1={component.position.x + 5} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'battery')}</text>
          </g>
        );
      case 'dcCurrentSource':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <circle cx={component.position.x} cy={component.position.y} r="20" fill="white" stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 10} y1={component.position.y} x2={component.position.x + 10} y2={component.position.y} stroke="black" strokeWidth="2" />
            <polygon points={`${component.position.x},${component.position.y - 10} ${component.position.x + 10},${component.position.y} ${component.position.x},${component.position.y + 10}`} fill="black" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'dcCurrentSource')}</text>
          </g>
        );
      case 'acVoltageSource':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <circle cx={component.position.x} cy={component.position.y} r="20" fill="white" stroke="black" strokeWidth="2" />
            <path d={`M${component.position.x - 10},${component.position.y} 
                      Q${component.position.x - 5},${component.position.y - 10} ${component.position.x},${component.position.y}
                      Q${component.position.x + 5},${component.position.y + 10} ${component.position.x + 10},${component.position.y}`} 
                  fill="none" stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'acVoltageSource')}</text>
          </g>
        );
      case 'acCurrentSource':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <circle cx={component.position.x} cy={component.position.y} r="20" fill="white" stroke="black" strokeWidth="2" />
            <path d={`M${component.position.x - 10},${component.position.y} 
                      Q${component.position.x - 5},${component.position.y - 10} ${component.position.x},${component.position.y}
                      Q${component.position.x + 5},${component.position.y + 10} ${component.position.x + 10},${component.position.y}`} 
                  fill="none" stroke="black" strokeWidth="2" />
            <polygon points={`${component.position.x + 5},${component.position.y - 10} ${component.position.x + 15},${component.position.y} ${component.position.x + 5},${component.position.y + 10}`} fill="black" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'acCurrentSource')}</text>
          </g>
        );
      case 'squareWaveSource':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <circle cx={component.position.x} cy={component.position.y} r="20" fill="white" stroke="black" strokeWidth="2" />
            <path d={`M${component.position.x - 10},${component.position.y - 5} 
                      L${component.position.x - 10},${component.position.y - 10} 
                      L${component.position.x},${component.position.y - 10} 
                      L${component.position.x},${component.position.y + 10} 
                      L${component.position.x + 10},${component.position.y + 10} 
                      L${component.position.x + 10},${component.position.y + 5}`} 
                  fill="none" stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'squareWaveSource')}</text>
          </g>
        );
      case 'diode':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 15} y2={component.position.y} stroke="black" strokeWidth="2" />
            <polygon points={`${component.position.x - 15},${component.position.y - 10} ${component.position.x - 15},${component.position.y + 10} ${component.position.x + 15},${component.position.y}`} 
                     fill="white" stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 15} y1={component.position.y - 10} x2={component.position.x + 15} y2={component.position.y + 10} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 15} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
          </g>
        );
      default:
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <rect x={component.position.x - 20} y={component.position.y - 20} width="40" height="40" fill="white" stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y + 5} textAnchor="middle" fontSize="12">{component.type}</text>
          </g>
        );
    }
  };

  // Handle component selection - use useCallback to prevent recreating function
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(component.id);
    
    // Only start dragging if component is selected
    if (selected) {
      setDragging(true);
      setDragOffset({
        x: e.clientX - component.position.x,
        y: e.clientY - component.position.y
      });
    }
  }, [component.id, component.position.x, component.position.y, onClick, selected]);

  // Move component while dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragging) {
      onMove(
        component.id,
        e.clientX - dragOffset.x,
        e.clientY - dragOffset.y
      );
    }
  }, [component.id, dragOffset.x, dragOffset.y, dragging, onMove]);

  // End dragging
  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Add and remove event listeners with proper cleanup
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      // Cleanup function to remove event listeners
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Draw terminal connection points
  const renderTerminals = () => {
    return component.terminals.map((terminal, index) => (
      <circle
        key={`terminal-${index}`}
        cx={terminal.x}
        cy={terminal.y}
        r={5}
        fill={isConnected ? "#4CAF50" : "#999"}
        stroke="black"
        strokeWidth={1}
      />
    ));
  };

  return (
    <g 
      className={`circuit-component ${selected ? 'selected' : ''} ${isConnected ? 'connected' : 'disconnected'}`} 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={handleMouseDown}
      style={{ cursor: selected ? 'move' : 'pointer', opacity: isConnected ? 1 : 0.7 }}
    >
      {getComponentSymbol(component.type)}
      {renderTerminals()}
      {selected && (
        <rect 
          x={component.position.x - 45} 
          y={component.position.y - 45} 
          width="90" 
          height="90" 
          fill="none" 
          stroke="blue" 
          strokeWidth="2" 
          strokeDasharray="5,5" 
        />
      )}
    </g>
  );
}