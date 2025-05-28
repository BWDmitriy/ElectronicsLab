# Electronics Lab - Circuit Simulation Workbench

A comprehensive electronics workbench application similar to Electronics Workbench, built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Circuit Design

- **Component Library**: Resistors, capacitors, inductors, diodes, voltage/current sources, ground, and more
- **Drag & Drop**: Place components on a grid-based circuit board
- **Wire Connections**: Connect components using the wire tool with visual terminal indicators
- **Wire Following**: Wires automatically follow components when moved or rotated
- **Component Properties**: Edit component values and properties in real-time
- **Rotation**: Rotate components using the 'R' key or rotation button

### Digital Oscilloscope

- **Visual Waveform Display**: Real-time oscilloscope with grid, multiple channels, and color-coded traces
- **Modal Interface**: Full-screen oscilloscope display that opens like a separate instrument
- **Probe Connections**: Connect up to 4 probes (red, blue, green, orange) to oscilloscope terminals
- **Interactive Controls**: Time scale, voltage scale, and position controls
- **Auto-Simulation**: Automatic waveform updates when circuit changes
- **Manual Simulation**: Run simulation button for precise control

### Signal Sources

- **DC Sources**: Battery, DC voltage source, DC current source
- **AC Sources**: AC voltage source, AC current source with configurable frequency
- **Square Wave Generator**: Clock source with adjustable frequency, duty cycle, and amplitude
- **Ground Reference**: Standard ground symbol for circuit reference

### Circuit Analysis

- **Connectivity Analysis**: Automatic detection of connected components
- **Node Voltage Calculation**: DC operating point analysis
- **Time-Domain Simulation**: 1000-point simulation over configurable time periods
- **Component-Specific Signals**: Accurate signal generation for each component type

## How to Use the Oscilloscope

1. **Place Components**: Add an oscilloscope and signal sources to the circuit board
2. **Connect Wires**: Use the Wire tool to connect components to the oscilloscope's colored probe terminals
3. **Open Oscilloscope**: Click "Show Oscilloscope" to open the digital oscilloscope display
4. **Run Simulation**: Click "Run Simulation" to see waveforms, or enable auto-simulation for real-time updates
5. **Adjust Controls**: Use time scale, voltage scale, and position controls to optimize the display

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Circuit Engine**: Custom circuit analysis and simulation engine
- **Visualization**: HTML5 Canvas for oscilloscope display, SVG for circuit components

## Circuit Simulation Engine

The application includes a sophisticated circuit simulation engine that:

- Analyzes circuit connectivity and topology
- Solves resistive circuits using nodal analysis
- Generates time-domain signals for AC/DC sources
- Provides accurate component modeling for passive elements
- Supports complex waveforms including sine waves and square waves

## Component Library

### Passive Components

- **Resistor**: Configurable resistance value with automatic unit formatting
- **Capacitor**: Configurable capacitance with µF/nF/pF units
- **Inductor**: Configurable inductance with H/mH/µH units
- **Diode**: Basic diode symbol

### Active Sources

- **Battery**: DC voltage source with configurable voltage
- **AC Voltage Source**: Sine wave voltage with configurable amplitude and frequency
- **AC Current Source**: Sine wave current with configurable amplitude and frequency
- **Square Wave Source**: Clock generator with duty cycle and amplitude control

### Measurement Tools

- **Oscilloscope**: 4-channel digital oscilloscope with professional controls
- **Ground**: Circuit reference point

## Future Enhancements

- Additional measurement instruments (multimeter, function generator)
- More component types (transistors, op-amps, logic gates)
- Circuit saving/loading functionality
- Export capabilities for waveforms and circuits
- Advanced analysis tools (FFT, Bode plots)

## License

MIT License - see LICENSE file for details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
