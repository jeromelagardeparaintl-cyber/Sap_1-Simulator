// The control unit. Each T-state is a small "micro-operation" function that
// sets control signals, moves data over the W-bus, and returns a description.
// No DOM code lives here, so it can be tested on its own.

import { OPCODES, OPCODE_NAMES, T_STATE_COUNT } from './constants.js';
import { registers, ram, signals, clock, resetSignals } from './state.js';
import { toBin4, toHex1, toHex2 } from './utils.js';

const opcodeOf  = () => (registers.IR >> 4) & 0x0F;
const operandOf = () => registers.IR & 0x0F;

// ---------- Reusable micro-operations ----------

// T4: IR operand -> W-bus -> MAR
const irOperandToMar = (name) => () => {
    const operand = operandOf();
    signals.Ei = 0; signals.Lm = 0;
    registers.W_BUS = operand;
    registers.MAR = operand;
    return `T4 (${name}): IR Operand (${toHex1(operand)}) -> W-Bus -> MAR`;
};

// T5: RAM[MAR] -> W-bus -> target register (ACC or B)
const ramToRegister = (name, reg, loadSignal, label) => () => {
    signals.CE = 0; signals[loadSignal] = 0;
    registers.W_BUS = ram[registers.MAR];
    registers[reg] = registers.W_BUS;
    return `T5 (${name}): RAM[${toHex1(registers.MAR)}] (${toHex2(registers.W_BUS)}) -> W-Bus -> ${label}`;
};

// T6: ALU result -> W-bus -> ACC
const aluToAcc = (name, subtract) => () => {
    signals.Eu = 1; signals.La = 0; signals.Su = subtract ? 1 : 0;
    const result = (subtract ? registers.ACC - registers.B : registers.ACC + registers.B) & 0xFF;
    registers.W_BUS = result;
    registers.ACC = result;
    return `T6 (${name}): ALU ${subtract ? 'Sub' : 'Sum'} (${toHex2(result)}) -> W-Bus -> ACC`;
};

// ---------- Fetch cycle (same for every instruction) ----------

const FETCH = {
    1: () => {
        signals.Ep = 1; signals.Lm = 0;
        registers.W_BUS = registers.PC & 0x0F;
        registers.MAR = registers.W_BUS;
        return `T1 (Fetch): PC (${toHex1(registers.PC)}) -> W-Bus -> MAR`;
    },
    2: () => {
        signals.Cp = 1;
        registers.PC = (registers.PC + 1) & 0x0F;
        return `T2 (Fetch): Increment PC to ${toHex1(registers.PC)}`;
    },
    3: () => {
        signals.CE = 0; signals.Li = 0;
        registers.W_BUS = ram[registers.MAR];
        registers.IR = registers.W_BUS;
        const name = OPCODE_NAMES[opcodeOf()] || 'UNKNOWN';
        return `T3 (Fetch): RAM[${toHex1(registers.MAR)}] (${toHex2(registers.W_BUS)}) -> W-Bus -> IR (${name} ${toHex1(operandOf())})`;
    },
};

// ---------- Execute cycle: micro-program per instruction (T4-T6) ----------

const EXECUTE = {
    [OPCODES.LDA]: {
        4: irOperandToMar('LDA'),
        5: ramToRegister('LDA', 'ACC', 'La', 'ACC'),
        6: () => 'T6 (LDA): No Operation (NOP)',
    },
    [OPCODES.ADD]: {
        4: irOperandToMar('ADD'),
        5: ramToRegister('ADD', 'B', 'Lb', 'B Register'),
        6: aluToAcc('ADD', false),
    },
    [OPCODES.SUB]: {
        4: irOperandToMar('SUB'),
        5: ramToRegister('SUB', 'B', 'Lb', 'B Register'),
        6: aluToAcc('SUB', true),
    },
    [OPCODES.OUT]: {
        4: () => {
            signals.Ea = 1; signals.Lo = 0;
            registers.W_BUS = registers.ACC;
            registers.OUT = registers.W_BUS;
            return `T4 (OUT): ACC (${toHex2(registers.ACC)}) -> W-Bus -> Output Register`;
        },
    },
};

function execute(t) {
    const op = opcodeOf();

    if (op === OPCODES.HLT) {
        clock.halted = true;
        return `T${t} (HLT): Computer Halted execution.`;
    }

    const microProgram = EXECUTE[op];
    if (!microProgram) return `T${t}: Unknown Opcode ${toBin4(op)}`;

    const microOp = microProgram[t];
    return microOp ? microOp() : `T${t} (${OPCODE_NAMES[op]}): NOP`;
}

// ---------- Public API ----------

// Runs the current T-state. Returns { alreadyHalted } or { description, halted }.
export function step() {
    if (clock.halted) return { alreadyHalted: true };

    resetSignals();
    const t = clock.tState;
    const description = t <= 3 ? FETCH[t]() : execute(t);
    return { description, halted: clock.halted };
}

// Moves the ring counter T1 -> T2 -> ... -> T6 -> T1
export function advanceClock() {
    if (!clock.halted) clock.tState = (clock.tState % T_STATE_COUNT) + 1;
}
