// The orchestrator: connects the CPU, the runner and the UI.
// Every user action (step, run, reset, load sample, edit RAM) goes through here.

import { ram, clock, resetMachine } from './state.js';
import { step, advanceClock } from './cpu.js';
import { assemble } from './assembler.js';
import { SAMPLE_PROGRAM, SAMPLE_DESCRIPTION } from './sample.js';
import { createRunner } from './runner.js';
import * as ui from './ui.js';

// One clock tick = run the current T-state, show it, then move to the next one
export function tick() {
    const result = step();

    if (result.alreadyHalted) {
        ui.log('Execution Halted. Press Reset to start over.', 'text-amber-400');
        runner.stop();
        return;
    }

    ui.log(result.description);
    ui.setMicroOp(result.description);

    if (result.halted) {
        ui.log('>>> HLT Instruction Encountered. Execution Stopped. <<<', 'text-emerald-400 font-bold');
        runner.stop();
    }

    ui.render();
    advanceClock();
}

const runner = createRunner(tick, ui.setRunButton);

export const toggleRun = () => runner.toggle();

export function reset() {
    runner.stop();
    resetMachine();
    ui.render();
    ui.log('Simulator Reset to Initial T1 State.', 'text-rose-400');
}

export function loadSample() {
    reset();
    ram.fill(0);
    Object.entries(SAMPLE_PROGRAM).forEach(([addr, byte]) => { ram[addr] = byte; });
    ui.refreshRam();
    ui.log(SAMPLE_DESCRIPTION, 'text-indigo-400');
}

export function editRam(addr, text) {
    ram[addr] = assemble(text);
    ui.updateRamRow(addr);
}

export function setSpeed(ms) {
    runner.setDelay(ms);
    ui.setSpeedLabel(ms);
}

export const isHalted = () => clock.halted;
