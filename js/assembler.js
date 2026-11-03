// Converts between text and bytes: what the user types <-> what RAM holds.
// assemble() throws an Error with a helpful message when the input is invalid.

import { OPCODES, OPCODE_NAMES } from './constants.js';
import { toHex1, toHex2 } from './utils.js';

const ADDRESS = /^[0-9A-F]H?$/;        // one hex digit, optional H suffix

// "LDA 9H" | "25H" | "00100101" | "37"  ->  byte (0-255)
export function assemble(text) {
    const str = text.replace(/\(.*?\)/g, '').trim().toUpperCase();   // ignore "(data)" labels
    if (!str || str === 'NOP') return 0x00;

    const [mnemonic, operand, ...extra] = str.split(/\s+/);

    // --- Instruction: MNEMONIC [address] ---
    if (Object.hasOwn(OPCODES, mnemonic)) {
        if (extra.length) throw new Error(`Too many operands for ${mnemonic}`);
        const opBits = OPCODES[mnemonic] << 4;

        if (mnemonic === 'OUT' || mnemonic === 'HLT') {
            if (operand) throw new Error(`${mnemonic} takes no operand`);
            return opBits;
        }
        if (!operand) throw new Error(`${mnemonic} needs an address, e.g. ${mnemonic} 9H`);
        if (!ADDRESS.test(operand)) {
            throw new Error(`Bad address "${operand}": use ONE hex digit 0-F, e.g. ${mnemonic} 9H`);
        }
        return opBits | parseInt(operand, 16);
    }

    // --- Raw data ---
    if (/^[0-9A-F]{1,2}H$/.test(str)) return parseInt(str, 16);          // 25H
    if (/^[01]{8}$/.test(str)) return parseInt(str, 2);                  // 00100101
    if (/^\d{1,3}$/.test(str)) {                                         // 37
        const n = parseInt(str, 10);
        if (n > 255) throw new Error(`${n} is too big for 8 bits (max 255 / FFH)`);
        return n;
    }
    if (/^[0-9A-F]{1,2}$/.test(str)) throw new Error(`Write hex with an H suffix: ${str}H`);

    throw new Error(`Cannot read "${text.trim()}". Try LDA 9H, 25H, 00100101 or 37`);
}

// byte -> "ADD AH" | "OUT" | "3FH (data)"
export function disassemble(byte) {
    const op = (byte >> 4) & 0x0F;
    const name = OPCODE_NAMES[op];
    if (!name) return `${toHex2(byte)} (data)`;
    if (op === OPCODES.OUT || op === OPCODES.HLT) {
        // OUT/HLT ignore their operand; if it is non-zero, show the raw byte so no data is lost
        return (byte & 0x0F) === 0 ? name : `${toHex2(byte)} (data)`;
    }
    return `${name} ${toHex1(byte & 0x0F)}`;
}
