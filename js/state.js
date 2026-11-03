// The single source of truth for the machine. Other modules import and
// mutate these objects; only this file knows how to reset them.

import { RAM_SIZE, DEFAULT_SIGNALS } from './constants.js';

export const registers = { PC: 0, MAR: 0, IR: 0, ACC: 0, B: 0, OUT: 0, W_BUS: 0 };
export const ram = new Uint8Array(RAM_SIZE);
export const signals = { ...DEFAULT_SIGNALS };
export const clock = { tState: 1, halted: false };

// Addresses the user filled with data values. RAM itself cannot tell data from
// instructions (both are just bytes), so we remember it only to label the table.
export const dataCells = new Set();

export function resetSignals() {
    Object.assign(signals, DEFAULT_SIGNALS);
}

// Clears registers, signals and the clock. RAM is intentionally kept.
export function resetMachine() {
    Object.keys(registers).forEach((key) => { registers[key] = 0; });
    clock.tState = 1;
    clock.halted = false;
    resetSignals();
}
