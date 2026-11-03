// Converts between text and bytes: what the user types <-> what RAM holds.

import { OPCODES, OPCODE_NAMES } from './constants.js';
import { toHex1, toHex2 } from './utils.js';

// "LDA 9H" | "25H" | "00100101" | "37"  ->  byte
export function assemble(text) {
    let str = text.trim().toUpperCase();
    str = str.replace(/\(.*?\)/g, '').trim();   // ignore labels like "(data)"
    if (!str || str === 'NOP') return 0x00;

    const [mnemonic, operandText] = str.split(/\s+/);

    if (Object.hasOwn(OPCODES, mnemonic)) {
        let operand = 0;
        if (operandText) {
            operand = parseInt(operandText.replace('H', ''), 16)
                   || parseInt(operandText, 10)
                   || 0;
        }
        return ((OPCODES[mnemonic] & 0x0F) << 4) | (operand & 0x0F);
    }

    if (str.endsWith('H')) {
        const hex = parseInt(str.replace('H', ''), 16);
        if (!Number.isNaN(hex)) return hex & 0xFF;
    }

    if (/^[01]{8}$/.test(str)) return parseInt(str, 2) & 0xFF;

    const dec = parseInt(str, 10);
    return Number.isNaN(dec) ? 0x00 : dec & 0xFF;
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
