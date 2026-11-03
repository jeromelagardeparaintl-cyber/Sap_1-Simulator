// Fixed facts about the SAP-1 machine. Nothing here changes at runtime.

export const RAM_SIZE = 16;      // 16 addresses x 8 bits
export const T_STATE_COUNT = 6;  // T1-T3 fetch, T4-T6 execute

export const OPCODES = Object.freeze({
    LDA: 0b0000,
    ADD: 0b0001,
    SUB: 0b0010,
    OUT: 0b1110,
    HLT: 0b1111,
});

// Reverse lookup: 0b0001 -> 'ADD'
export const OPCODE_NAMES = Object.freeze(
    Object.fromEntries(Object.entries(OPCODES).map(([name, code]) => [code, name]))
);

// Control signals. activeHigh = true means "1 = asserted"; false means the
// signal is active-low (shown with an apostrophe, asserted when 0).
export const SIGNAL_DEFS = Object.freeze([
    { key: 'Cp', label: "Cp",  activeHigh: true,  title: 'Program Counter Increment' },
    { key: 'Ep', label: "Ep",  activeHigh: true,  title: 'Program Counter Enable to Bus' },
    { key: 'Lm', label: "Lm'", activeHigh: false, title: 'MAR Load from Bus' },
    { key: 'CE', label: "CE'", activeHigh: false, title: 'RAM Enable to Bus' },
    { key: 'Li', label: "Li'", activeHigh: false, title: 'Instruction Register Load' },
    { key: 'Ei', label: "Ei'", activeHigh: false, title: 'Instruction Register Enable to Bus' },
    { key: 'La', label: "La'", activeHigh: false, title: 'Accumulator Load' },
    { key: 'Ea', label: "Ea",  activeHigh: true,  title: 'Accumulator Enable to Bus' },
    { key: 'Su', label: "Su",  activeHigh: true,  title: 'ALU Subtract Mode' },
    { key: 'Eu', label: "Eu",  activeHigh: true,  title: 'ALU Enable to Bus' },
    { key: 'Lb', label: "Lb'", activeHigh: false, title: 'B-Register Load' },
    { key: 'Lo', label: "Lo'", activeHigh: false, title: 'Output Register Load' },
]);

// Every signal's idle (de-asserted) value
export const DEFAULT_SIGNALS = Object.freeze({
    Cp: 0, Ep: 0, Lm: 1, CE: 1, Li: 1, Ei: 1,
    La: 1, Ea: 0, Su: 0, Eu: 0, Lb: 1, Lo: 1,
});
