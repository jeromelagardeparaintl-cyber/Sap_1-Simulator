// Converts between text and bytes: what the user types <-> what RAM holds.
// Parsing functions throw an Error with a helpful message on invalid input.

import { OPCODES, OPCODE_NAMES } from './constants.js';
import { toHex1, toHex2 } from './utils.js';

const ADDRESS = /^[0-9A-F]H?$/;        // one hex digit, optional H suffix

// Builds one instruction byte. OUT/HLT ignore their operand; 1111 matches the course reference table.
export function encode(mnemonic, operand = 0x0F) {
    return (OPCODES[mnemonic] << 4) | (operand & 0x0F);
}

// A value typed into the Load Program panel. base is 'hex' (25 or 25H) or 'dec' (37).
export function parseValue(text, base = 'hex') {
    const str = text.trim().toUpperCase();
    if (!str) throw new Error('enter a value');

    if (base === 'hex') {
        if (!/^[0-9A-F]{1,2}H?$/.test(str)) throw new Error(`"${text.trim()}" is not a hex byte (00-FF, e.g. 25 or 25H)`);
        return parseInt(str, 16);
    }
    if (!/^\d{1,3}$/.test(str)) throw new Error(`"${text.trim()}" is not a decimal number (0-255)`);
    const n = parseInt(str, 10);
    if (n > 255) throw new Error(`${n} is too big for 8 bits (max 255)`);
    return n;
}

// Raw data typed into a RAM cell: 25H | 00100101 | 37
function parseDataByte(text) {
    const str = text.trim().toUpperCase();
    if (/^[0-9A-F]{1,2}H$/.test(str)) return parseInt(str, 16);
    if (/^[01]{8}$/.test(str)) return parseInt(str, 2);
    if (/^\d{1,3}$/.test(str)) {
        const n = parseInt(str, 10);
        if (n > 255) throw new Error(`${n} is too big for 8 bits (max 255 / FFH)`);
        return n;
    }
    if (/^[0-9A-F]{1,2}$/.test(str)) throw new Error(`Write hex with an H suffix: ${str}H`);
    throw new Error(`Cannot read "${text.trim()}". Try LDA 9H, 25H, 00100101 or 37`);
}

// "LDA 9H" | "OUT" | "25H" | "00100101" | "37"  ->  byte (0-255)
export function assemble(text) {
    const str = text.replace(/\(.*?\)/g, '').trim().toUpperCase();   // ignore "(data)" labels
    if (!str || str === 'NOP') return 0x00;

    const [mnemonic, operand, ...extra] = str.split(/\s+/);
    if (!Object.hasOwn(OPCODES, mnemonic)) return parseDataByte(str);

    if (extra.length) throw new Error(`Too many operands for ${mnemonic}`);
    if (mnemonic === 'OUT' || mnemonic === 'HLT') {
        if (operand) throw new Error(`${mnemonic} takes no operand`);
        return encode(mnemonic);
    }
    if (!operand) throw new Error(`${mnemonic} needs an address, e.g. ${mnemonic} 9H`);
    if (!ADDRESS.test(operand)) {
        throw new Error(`Bad address "${operand}": use ONE hex digit 0-F, e.g. ${mnemonic} 9H`);
    }
    return encode(mnemonic, parseInt(operand, 16));
}

// byte -> "ADD AH" | "OUT" | "3FH (data)" | "00H (empty)"
export function disassemble(byte) {
    if (byte === 0) return '00H (empty)';
    const op = (byte >> 4) & 0x0F;
    const name = OPCODE_NAMES[op];
    if (!name) return `${toHex2(byte)} (data)`;
    if (op === OPCODES.OUT || op === OPCODES.HLT) return name;
    return `${name} ${toHex1(byte & 0x0F)}`;
}
