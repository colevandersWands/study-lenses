OPENQASM 2.0;
include "qelib1.inc";

qreg q[1];
creg c[1];

h q[0];      // Apply Hadamard gate
measure q[0] -> c[0];  // Measure result into classical bit