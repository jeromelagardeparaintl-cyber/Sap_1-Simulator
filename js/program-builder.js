// Turns the user's formula (e.g. A + B - C and three typed values) into a
// SAP-1 machine-language program. Nothing here is hard-coded: every data
// value comes from what the user entered.
//
// Layout (same as the course reference program):
//   0H  LDA 9H      <- first value
//   1H  ADD/SUB AH  <- second value
//   2H  ADD/SUB BH  <- third value
//   3H  OUT
//   4H  HLT
//   9H, AH, BH      <- the user's data values

import { encode, parseValue, disassemble } from './assembler.js';
import { toHex1, toHex2 } from './utils.js';

export const DATA_START = 0x9;
const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// terms: [{ op: null, text: '25' }, { op: 'ADD', text: '05' }, { op: 'SUB', text: '23' }]
// Returns { memory: {address: byte}, expected, listing }. Throws if any value is invalid.
export function buildFormulaProgram(terms, base = 'hex') {
    if (terms.length < 1 || terms.length + 2 > DATA_START) {
        throw new Error('Unsupported number of values');
    }

    const values = terms.map((term, i) => {
        try { return parseValue(term.text, base); }
        catch (err) { throw new Error(`Value ${LABELS[i]}: ${err.message}`); }
    });

    const code = terms.map((term, i) => {
        if (i === 0) return encode('LDA', DATA_START);
        if (term.op !== 'ADD' && term.op !== 'SUB') throw new Error(`Choose + or - before value ${LABELS[i]}`);
        return encode(term.op, DATA_START + i);
    });
    code.push(encode('OUT'), encode('HLT'));

    const memory = {};
    code.forEach((byte, addr) => { memory[addr] = byte; });
    values.forEach((value, i) => { memory[DATA_START + i] = value; });

    let expected = values[0];
    terms.forEach((term, i) => {
        if (i > 0) expected = (term.op === 'ADD' ? expected + values[i] : expected - values[i]) & 0xFF;
    });

    const data = values.map((v, i) => `${toHex1(DATA_START + i)}=${toHex2(v)}`).join(', ');
    const listing = `${code.map(disassemble).join(', ')} | data ${data}`;
    return { memory, expected, listing };
}
