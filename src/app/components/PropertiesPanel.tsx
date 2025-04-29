'use client';

import { useState, useEffect } from 'react';
import { Component, ComponentType } from '../lib/circuitEngine';

interface PropertiesPanelProps {
  component: Component | null;
  onValueChange: (id: string, value: number) => void;
  onPropertyChange: (id: string, propertyName: string, value: number | string | boolean) => void;
}

export default function PropertiesPanel({ component, onValueChange, onPropertyChange }: PropertiesPanelProps) {
  const [valueInput, setValueInput] = useState<string>('');
  
  // Sync input value with component value whenever component changes
  useEffect(() => {
    if (component) {
      setValueInput(component.value.toString());
    }
  }, [component, component?.id, component?.value]);
  
  if (!component) {
    return null;
  }
  
  const handleValueChange = () => {
    const numValue = Number(valueInput);
    if (!isNaN(numValue)) {
      // Only update if the value has actually changed
      if (numValue !== component.value) {
        console.log(`Changing value from ${component.value} to ${numValue}`);
        onValueChange(component.id, numValue);
      }
    } else {
      // If invalid input, reset to current component value
      setValueInput(component.value.toString());
    }
  };
  
  const getUnitLabel = (type: ComponentType): string => {
    switch (type) {
      case 'resistor': return 'Ω';
      case 'capacitor': return 'F';
      case 'inductor': return 'H';
      case 'battery':
      case 'voltageSource':
      case 'acVoltageSource': return 'V';
      case 'currentSource':
      case 'dcCurrentSource':
      case 'acCurrentSource': return 'A';
      case 'squareWaveSource': return 'Hz';
      default: return '';
    }
  };
  
  const getAdditionalProperties = () => {
    switch (component.type) {
      case 'acVoltageSource':
      case 'acCurrentSource':
        return (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">Frequency (Hz)</label>
            <div className="mt-1 flex items-center">
              <input 
                type="number" 
                value={component.properties.frequency as number || 60}
                onChange={(e) => {
                  const freq = Number(e.target.value);
                  if (!isNaN(freq) && freq > 0) {
                    onPropertyChange(component.id, 'frequency', freq);
                  }
                }}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
              <span className="ml-2">Hz</span>
            </div>
          </div>
        );
        
      case 'squareWaveSource':
        return (
          <>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Duty Cycle</label>
              <div className="mt-1 flex items-center">
                <input 
                  type="range" 
                  min="0.1" 
                  max="0.9" 
                  step="0.1"
                  value={component.properties.dutyCycle as number || 0.5}
                  onChange={(e) => {
                    onPropertyChange(component.id, 'dutyCycle', Number(e.target.value));
                  }}
                  className="block w-full"
                />
                <span className="ml-2">{((component.properties.dutyCycle as number || 0.5) * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Amplitude</label>
              <div className="mt-1 flex items-center">
                <input 
                  type="number" 
                  value={component.properties.amplitude as number || 5}
                  onChange={(e) => {
                    const amp = Number(e.target.value);
                    if (!isNaN(amp) && amp > 0) {
                      onPropertyChange(component.id, 'amplitude', amp);
                    }
                  }}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
                <span className="ml-2">V</span>
              </div>
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
        {component.type.charAt(0).toUpperCase() + component.type.slice(1)} Properties
      </h3>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">
          Primary Value
        </label>
        <div className="mt-1 flex items-center">
          <input
            type="text"
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            onBlur={handleValueChange}
            onKeyDown={(e) => e.key === 'Enter' && handleValueChange()}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
          <span className="ml-2">{getUnitLabel(component.type)}</span>
        </div>
      </div>
      
      {getAdditionalProperties()}
      
      <div className="mt-4 text-sm text-gray-500">
        ID: {component.id}
      </div>
    </div>
  );
} 