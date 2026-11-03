// The orchestrator: connects the CPU, the runner and the UI.
// Every user action (step, run, reset, load sample, edit RAM) goes through here.

import { ram, clock, resetMachine } from './state.js';
import { T_STATE_COUNT } from './constants.js';
import { step, advanceClock } from './cpu.js';
import { assemble } from './assembler.js';
import { buildFormulaProgram } from './program-builder.js';
import { createRunner } from './runner.js';
import { toHex1, toHex2 } from './utils.js';
import * as ui from './ui.js';

// One clock tick = run the current T-state, show it, then move to the next one
export function tick() {
    const result = step();

    if (result.alreadyHalted) {
        ui.log('Execution Halted. Press Reset to start over.', 'text-amber-400');
        runner.stop();
        return result;
    }

    ui.log(result.description);
    ui.setMicroOp(result.description);

    if (result.halted) {
        ui.log('>>> Execution Stopped (HLT or invalid opcode). Press Reset to start over. <<<', 'text-emerald-400 font-bold');
        runner.stop();
    }

    if (result.wrapped) {
        ui.log('WARNING: PC wrapped from FH back to 0H without reaching HLT. Paused. Add an HLT after your last instruction.', 'text-amber-400 font-bold');
        runner.stop();
    }

    ui.render();
    advanceClock();
    return result;
}

// Runs one whole instruction (every remaining T-state until the sequencer is back at T1)
export function stepInstruction() {
    for (let i = 0; i < T_STATE_COUNT; i++) {
        const result = tick();
        if (result.alreadyHalted || result.halted || clock.tState === 1) return;
    }
}

const runner = createRunner(tick, ui.setRunButton);

export const toggleRun = () => runner.toggle();

export function reset() {
    runner.stop();
    resetMachine();
    ui.render();
    ui.log('Simulator Reset to Initial T1 State.', 'text-rose-400');
}

// Builds a program from the user's typed values and puts it in RAM.
// Throws (RAM untouched) if a value is invalid. Returns { expected, listing }.
export function loadFormula(terms, base) {
    const program = buildFormulaProgram(terms, base);
    reset();
    ram.fill(0);
    Object.entries(program.memory).forEach(([addr, byte]) => { ram[addr] = byte; });
    ui.refreshRam();
    ui.log(`Program loaded: ${program.listing}`, 'text-indigo-400');
    return program;
}

export function clearRam() {
    reset();
    ram.fill(0);
    ui.refreshRam();
    ui.log('RAM cleared.', 'text-rose-400');
}

export function editRam(addr, text) {
    try {
        ram[addr] = assemble(text);
    } catch (err) {
        ui.log(`RAM ${toHex1(addr)}: ${err.message} (kept ${toHex2(ram[addr])})`, 'text-rose-400');
    }
    ui.updateRamRow(addr);   // redraws the cell: new value, or the old one after an error
}

export function setSpeed(ms) {
    runner.setDelay(ms);
    ui.setSpeedLabel(ms);
}

export const isHalted = () => clock.halted;
