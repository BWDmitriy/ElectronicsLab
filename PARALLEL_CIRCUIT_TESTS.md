# Parallel Circuit Tests

These tests verify that the new circuit analysis correctly handles parallel circuits and current distribution.

## Test 1: Simple Parallel Resistors

### Circuit Setup:

```
Battery (12V) → Node A → R1 (1000Ω) → Node B → Ground
                     → R2 (2000Ω) → Node B
```

### Steps:

1. Place Battery (12V), two Resistors (1000Ω, 2000Ω), Ground
2. Connect Battery(+) to a junction point (Node A)
3. From Node A, connect to both resistors in parallel
4. Connect both resistor outputs to another junction (Node B)
5. Connect Node B to Ground
6. Connect Ground to Battery(-)

### Expected Calculations:

- **Parallel Resistance**: 1/Rp = 1/1000 + 1/2000 = 0.0015, so Rp = 667Ω
- **Total Current**: I_total = 12V / 667Ω = 0.018A = 18mA
- **Current through R1**: I1 = 12V / 1000Ω = 12mA
- **Current through R2**: I2 = 12V / 2000Ω = 6mA
- **Verification**: I_total = I1 + I2 = 12mA + 6mA = 18mA ✓

## Test 2: Parallel Circuit with Ammeters

### Circuit Setup:

```
Battery (12V) → Ammeter_main → Node A → R1 (1000Ω) + Ammeter_1 → Node B → Ground
                                    → R2 (2000Ω) + Ammeter_2 → Node B
```

### Steps:

1. Place Battery (12V), 2 Resistors, 3 Ammeters, Ground
2. Connect: Battery(+) → Ammeter_main → Node A
3. From Node A: → Ammeter_1 → R1 → Node B
4. From Node A: → Ammeter_2 → R2 → Node B
5. Connect Node B → Ground → Battery(-)

### Expected Results:

- **Ammeter_main**: 18mA (total current)
- **Ammeter_1**: 12mA (current through R1 branch)
- **Ammeter_2**: 6mA (current through R2 branch)

### Key Learning:

- Current divides in parallel branches
- Sum of branch currents equals total current
- Ammeters work anywhere in the circuit, not just next to source

## Test 3: Mixed Series-Parallel Circuit

### Circuit Setup:

```
Battery (12V) → R_series (500Ω) → Node A → R1 (1000Ω) → Node B → Ground
                                        → R2 (2000Ω) → Node B
```

### Steps:

1. Place Battery (12V), 3 Resistors (500Ω, 1000Ω, 2000Ω), Ground
2. Connect: Battery(+) → R_series → Node A
3. From Node A: → R1 → Node B and → R2 → Node B (parallel)
4. Connect Node B → Ground → Battery(-)

### Expected Calculations:

- **Parallel section**: Rp = (1000 × 2000)/(1000 + 2000) = 667Ω
- **Total resistance**: R_total = 500Ω + 667Ω = 1167Ω
- **Total current**: I_total = 12V / 1167Ω = 10.3mA
- **Voltage across series resistor**: V_series = 10.3mA × 500Ω = 5.15V
- **Voltage across parallel section**: V_parallel = 12V - 5.15V = 6.85V
- **Current through R1**: I1 = 6.85V / 1000Ω = 6.85mA
- **Current through R2**: I2 = 6.85V / 2000Ω = 3.43mA
- **Verification**: I1 + I2 = 6.85 + 3.43 = 10.28mA ≈ I_total ✓

## Test 4: Voltmeter in Parallel Circuit

### Circuit Setup:

```
Battery (12V) → Node A → R1 (1000Ω) → Node B → Ground
                     → R2 (2000Ω) → Node B

Voltmeter across R1 (Node A to Node B)
```

### Steps:

1. Use the parallel circuit from Test 1
2. Add a Voltmeter connected across R1 (parallel to R1)
3. Connect Voltmeter terminals: one to Node A, one to Node B

### Expected Results:

- **Voltmeter reading**: 12V (voltage across the parallel combination)
- **Note**: Both R1 and R2 have the same voltage across them in parallel
- **Voltmeter current**: Very small (~12µA due to 1MΩ internal resistance)

## Test 5: Ammeter Position Independence

### Circuit Setup:

Test the same parallel circuit with ammeter in different positions:

#### Position A: After Battery

```
Battery → Ammeter → Node A → R1 → Node B → Ground
                          → R2 → Node B
```

#### Position B: In R1 Branch

```
Battery → Node A → Ammeter → R1 → Node B → Ground
                → R2 → Node B
```

#### Position C: Before Ground

```
Battery → Node A → R1 → Node B → Ammeter → Ground
                → R2 → Node B
```

### Expected Results:

- **Position A**: Shows total current (18mA)
- **Position B**: Shows R1 branch current (12mA)
- **Position C**: Shows total current (18mA)

### Key Learning:

- Ammeter measures current through the branch it's placed in
- Position determines what current is measured
- Circuit analysis works regardless of ammeter position

## Test 6: Complex Parallel Network

### Circuit Setup:

```
Battery (12V) → Node A → R1 (1000Ω) → Node B → R3 (500Ω) → Node C → Ground
                     → R2 (2000Ω) → Node B → R4 (1000Ω) → Node C
```

### Steps:

1. Create a ladder network with two parallel sections
2. Place ammeters in different branches to verify current distribution
3. Use voltmeters to verify voltage at different nodes

### Expected Behavior:

- Current divides at each parallel junction
- Voltage drops progressively through the network
- All calculations follow Ohm's law and Kirchhoff's laws

## Debugging Tips

### Console Output to Look For:

```
Circuit Analysis Complete: 1 voltage sources, 6 branches, 4 nodes
Node voltages: node_0: 12.00V, node_1: 0.00V, node_2: 12.00V, node_3: 0.00V
Component resistor (r1): V=12.0000V, I=12.00mA, Node voltages: 12.00V -> 0.00V
Component resistor (r2): V=12.0000V, I=6.00mA, Node voltages: 12.00V -> 0.00V
```

### What to Verify:

1. **Node voltages are correct** - should show voltage distribution
2. **Current distribution follows Ohm's law** - I = V/R for each branch
3. **Current conservation** - sum of currents into a node equals sum out
4. **Voltage consistency** - parallel branches have same voltage

### Common Issues:

- **All currents show 0**: Check ground connection
- **Wrong current distribution**: Verify wire connections at junctions
- **Voltages don't add up**: Check for missing connections or short circuits

## Success Criteria

✅ **The implementation is working correctly if**:

1. Parallel resistors show different currents based on their resistance
2. Total current equals sum of branch currents
3. Ammeters work in any position in the circuit
4. Voltmeters show correct voltage across components
5. Current distribution follows I = V/R for each branch
6. Circuit analysis works without requiring ammeter next to source

This comprehensive testing ensures the circuit analysis handles real-world circuit topologies correctly!
