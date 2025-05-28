# Circuit Examples for Electronics Lab

This document provides example circuits that demonstrate the ammeter and voltmeter functionality with real electrical calculations.

## Example 1: Basic Current Measurement

### Circuit Setup:

1. Place a **Battery** (12V) on the circuit board
2. Add a **Resistor** (1000Ω = 1kΩ)
3. Add an **Ammeter**
4. Add a **Ground** component
5. Connect with wires: Battery(+) → Ammeter → Resistor → Ground → Battery(-)

### Expected Results:

- **Current through ammeter**: I = V/R = 12V / 1000Ω = 0.012A = 12mA
- The ammeter should display: **12.0mA**

### Learning Objectives:

- Understand series connection of ammeter
- See Ohm's law in action (I = V/R)
- Observe current flow direction

## Example 2: Voltage Division Circuit

### Circuit Setup:

1. Place a **Battery** (12V)
2. Add two **Resistors**: R1 = 1000Ω, R2 = 2000Ω
3. Add a **Voltmeter**
4. Add a **Ground** component
5. Connect in series: Battery(+) → R1 → R2 → Ground → Battery(-)
6. Connect voltmeter in parallel across R2

### Expected Results:

- **Total resistance**: Rtotal = R1 + R2 = 1000Ω + 2000Ω = 3000Ω
- **Total current**: I = V/Rtotal = 12V / 3000Ω = 0.004A = 4mA
- **Voltage across R2**: V_R2 = I × R2 = 0.004A × 2000Ω = 8V
- The voltmeter should display: **8.00V**

### Learning Objectives:

- Understand voltage division principle
- See parallel connection of voltmeter
- Learn how voltage distributes in series circuits

## Example 3: Complex Circuit with Multiple Measurements

### Circuit Setup:

1. Place a **Battery** (9V)
2. Add three **Resistors**: R1 = 500Ω, R2 = 1000Ω, R3 = 1500Ω
3. Add one **Ammeter** and two **Voltmeters**
4. Add a **Ground** component
5. Connect: Battery(+) → Ammeter → R1 → Node A → R2 → Node B → R3 → Ground → Battery(-)
6. Connect Voltmeter 1 across R1 (Battery+ to Node A)
7. Connect Voltmeter 2 across R2 (Node A to Node B)

### Expected Results:

- **Total resistance**: Rtotal = 500Ω + 1000Ω + 1500Ω = 3000Ω
- **Total current**: I = 9V / 3000Ω = 0.003A = 3mA
- **Voltage across R1**: V_R1 = 0.003A × 500Ω = 1.5V
- **Voltage across R2**: V_R2 = 0.003A × 1000Ω = 3.0V
- **Voltage across R3**: V_R3 = 0.003A × 1500Ω = 4.5V

### Meter Readings:

- **Ammeter**: 3.0mA
- **Voltmeter 1**: 1.50V
- **Voltmeter 2**: 3.00V

### Learning Objectives:

- Multiple measurement points in one circuit
- Verify Kirchhoff's voltage law (V_R1 + V_R2 + V_R3 = V_source)
- Understand current is same throughout series circuit

## Example 4: Parallel Resistance Circuit

### Circuit Setup:

1. Place a **Battery** (6V)
2. Add two **Resistors**: R1 = 1000Ω, R2 = 2000Ω (in parallel)
3. Add three **Ammeters**: A1 (main), A2 (R1 branch), A3 (R2 branch)
4. Add a **Voltmeter** across the parallel combination
5. Add a **Ground** component

### Expected Results:

- **Parallel resistance**: 1/Rp = 1/R1 + 1/R2 = 1/1000 + 1/2000 = 0.0015, so Rp = 667Ω
- **Total current**: I_total = 6V / 667Ω = 0.009A = 9mA
- **Current through R1**: I1 = 6V / 1000Ω = 6mA
- **Current through R2**: I2 = 6V / 2000Ω = 3mA
- **Voltage across parallel combination**: 6V

### Meter Readings:

- **Ammeter A1 (main)**: 9.0mA
- **Ammeter A2 (R1)**: 6.0mA
- **Ammeter A3 (R2)**: 3.0mA
- **Voltmeter**: 6.00V

### Learning Objectives:

- Understand parallel circuits
- See current division (I_total = I1 + I2)
- Learn that voltage is same across parallel branches

## Tips for Using the Instruments

### Ammeter Best Practices:

- Always connect in **series** with the component you want to measure
- Current flows **through** the ammeter
- Ammeter has very low resistance (1mΩ) to minimize circuit impact
- Reading shows current in milliamps (mA)

### Voltmeter Best Practices:

- Always connect in **parallel** with the component you want to measure
- Voltage is measured **across** the component
- Voltmeter has very high resistance (1MΩ) to avoid loading the circuit
- Reading shows voltage in volts (V)

### Circuit Analysis Features:

- Meters update automatically when you change component values
- All calculations use proper electrical formulas (Ohm's law, Kirchhoff's laws)
- Current direction follows conventional flow (+ to -)
- Ground provides 0V reference point for all measurements

## Troubleshooting

### If meters show 0:

1. Check that circuit has a complete path from + to - through ground
2. Ensure all components are connected with wires
3. Verify that there's a voltage source (battery, voltage source) in the circuit
4. Make sure ground component is connected to complete the circuit

### If readings seem wrong:

1. Check component values (click on component to see/edit properties)
2. Verify wire connections are correct
3. Ensure ammeter is in series, voltmeter is in parallel
4. Check that ground is properly connected

This electronics lab provides a realistic simulation environment where you can learn fundamental electrical concepts through hands-on experimentation!
