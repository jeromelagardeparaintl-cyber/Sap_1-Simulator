// Demo program: 25H + 05H - 23H = 07H

export const SAMPLE_DESCRIPTION = 'Sample program loaded: LDA 9H, ADD AH, SUB BH, OUT, HLT';

// address -> byte
export const SAMPLE_PROGRAM = Object.freeze({
    0x0: 0x09,  // LDA 9H
    0x1: 0x1A,  // ADD AH
    0x2: 0x2B,  // SUB BH
    0x3: 0xEF,  // OUT
    0x4: 0xFF,  // HLT
    0x9: 0x25,  // data
    0xA: 0x05,  // data
    0xB: 0x23,  // data
});
