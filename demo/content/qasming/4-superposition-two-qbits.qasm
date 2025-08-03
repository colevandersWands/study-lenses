OPENQASM 2.0;
include "qelib1.inc";

qreg q[2];
creg c[2];

h q[0];          // Put q[0] into superposition
h q[1];          // Put q[1] into superposition

measure q[0] -> c[0];
measure q[1] -> c[1];
