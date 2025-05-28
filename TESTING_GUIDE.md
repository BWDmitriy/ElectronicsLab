# Testing Guide for Ammeter and Voltmeter

This guide helps you test and verify that the ammeter and voltmeter calculations are working correctly.

## Test 1: Basic Current Measurement (Example 1 Fix)

### Setup:

1. **Clear the board** (click "Clear Board")
2. **Place components**:

   - Battery (12V) - click Battery button, then click on board
   - Resistor (1000Ω) - click Resistor button, then click on board
   - Ammeter - click Ammeter button, then click on board
   - Ground - click Ground button, then click on board

3. **Connect with wires**:
   - Click "Wire" button
   - Click on Battery positive terminal (right side)
   - Click on Ammeter left terminal
   - Click on Ammeter right terminal
   - Click on Resistor left terminal
   - Click on Resistor right terminal
   - Click on Ground terminal (top)
   - Click on Battery negative terminal (left side)

### Expected Results:

- **Calculation**: I = V/R = 12V / 1000Ω = 0.012A = 12mA
- **Ammeter should display**: 12.0mA (not 12000000mA!)

### Debugging:

- Open browser console (F12) to see circuit analysis logs
- Look for: `Circuit Analysis: V_total=12V, R_total=1001Ω, I_total=0.011988A`
- The total resistance should be 1001Ω (1000Ω resistor + 1Ω ammeter internal resistance)

## Test 2: Verify Resistance Changes Affect Current

### Setup:

- Use the same circuit from Test 1
- Click on the resistor to select it
- In the properties panel, change the resistance value

### Test Cases:

1. **Change to 2000Ω**:

   - Expected: I = 12V / 2001Ω ≈ 6mA
   - Ammeter should show ~6.0mA

2. **Change to 500Ω**:

   - Expected: I = 12V / 501Ω ≈ 24mA
   - Ammeter should show ~24.0mA

3. **Change to 100Ω**:
   - Expected: I = 12V / 101Ω ≈ 119mA
   - Ammeter should show ~119mA

## Test 3: Multiple Ammeters in Series

### Setup:

1. **Clear the board**
2. **Place components**:

   - Battery (12V)
   - Resistor (1000Ω)
   - Ammeter 1 (after battery)
   - Ammeter 2 (after resistor)
   - Ground

3. **Connect in series**:
   - Battery(+) → Ammeter1 → Resistor → Ammeter2 → Ground → Battery(-)

### Expected Results:

- **Both ammeters should show the same current**: ~12mA
- This verifies that current is the same throughout a series circuit

## Test 4: Voltage Source Changes

### Setup:

- Use the basic circuit from Test 1
- Click on the battery to select it
- Change the voltage value in properties panel

### Test Cases:

1. **Change to 6V**:

   - Expected: I = 6V / 1001Ω ≈ 6mA
   - Ammeter should show ~6.0mA

2. **Change to 24V**:
   - Expected: I = 24V / 1001Ω ≈ 24mA
   - Ammeter should show ~24.0mA

## Test 5: Voltmeter Measurement

### Setup:

1. **Clear the board**
2. **Place components**:

   - Battery (12V)
   - Resistor 1 (1000Ω)
   - Resistor 2 (2000Ω)
   - Voltmeter
   - Ground

3. **Connect series circuit**:

   - Battery(+) → R1 → R2 → Ground → Battery(-)

4. **Connect voltmeter in parallel across R2**:
   - Voltmeter left terminal → junction between R1 and R2
   - Voltmeter right terminal → junction between R2 and Ground

### Expected Results:

- **Total current**: I = 12V / 3000Ω = 4mA
- **Voltage across R2**: V = I × R2 = 0.004A × 2000Ω = 8V
- **Voltmeter should display**: 8.00V

## Troubleshooting Common Issues

### Issue: Ammeter shows 0mA

**Possible causes**:

1. Circuit not complete (missing ground connection)
2. No voltage source in circuit
3. Ammeter not in series with current path

**Solutions**:

1. Verify all components are connected with wires
2. Ensure ground is connected to complete the circuit
3. Check that ammeter is in the main current path

### Issue: Ammeter shows wrong value

**Possible causes**:

1. Incorrect resistance values
2. Multiple voltage sources adding up
3. Circuit analysis not updating

**Solutions**:

1. Check component values by clicking on them
2. Verify only one voltage source in simple circuits
3. Try changing a component value to trigger recalculation

### Issue: Values don't update when changing components

**Possible causes**:

1. Circuit analysis dependency issue
2. Component not properly selected

**Solutions**:

1. Try adding/removing a wire to trigger recalculation
2. Click directly on component to select it
3. Check browser console for error messages

## Console Debugging

Open browser console (F12) and look for these messages:

### Good Analysis:

```
Circuit Analysis: V_total=12V, R_total=1001Ω, I_total=0.011988A
Component battery: V=12.0000V, I=11.99mA
Component resistor: V=11.9880V, I=11.99mA
Component ammeter: V=0.0120V, I=11.99mA
```

### Problem Indicators:

- `R_total=0Ω` - No resistance found
- `I_total=0A` - No current calculated
- `V_total=0V` - No voltage source found

## Expected Behavior Summary

✅ **Correct Behavior**:

- Ammeter shows current in mA (e.g., 12.0mA, not 12000000mA)
- Current changes when resistance changes (Ohm's law)
- Current is same through all series components
- Voltmeter shows voltage across components
- Values update when component properties change

❌ **Incorrect Behavior**:

- Ammeter shows voltage instead of current
- Values don't change when resistance changes
- Multiple ammeters in series show different values
- Meters show 0 in complete circuits
- Values don't update when changing component properties

This testing guide should help verify that the circuit analysis is working correctly!
