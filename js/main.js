// Entry point: builds the UI, wires the buttons, starts with an empty machine.

import * as sim from './simulator.js';
import * as ui from './ui.js';
import { registerServiceWorker } from './pwa.js';
import { toHex2 } from './utils.js';

const $ = (id) => document.getElementById(id);
const on = (id, event, handler) => $(id).addEventListener(event, handler);

// What the user typed in the Load Program panel: [A] (+/-) [B] (+/-) [C]
const readTerms = () => [
    { op: null,            text: $('val-0').value },
    { op: $('op-1').value, text: $('val-1').value },
    { op: $('op-2').value, text: $('val-2').value },
];

function loadProgram() {
    try {
        const { expected } = sim.loadFormula(readTerms(), $('val-base').value);
        ui.setLoadMessage(`Loaded. Expected result: ${toHex2(expected)} (${expected}). Press Run or Step.`, 'ok');
    } catch (err) {
        ui.setLoadMessage(err.message, 'error');
    }
}

ui.initUI(sim.editRam);

on('btn-load',       'click',  loadProgram);
on('btn-clear-ram',  'click',  () => { sim.clearRam(); ui.setLoadMessage('RAM cleared. Enter new values and load.', 'info'); });
on('btn-step-instr', 'click',  sim.stepInstruction);
on('btn-step',       'click',  sim.tick);
on('btn-run',        'click',  sim.toggleRun);
on('btn-reset',      'click',  sim.reset);
on('btn-clear-log',  'click',  ui.clearLog);
on('speed-slider',   'input',  (e) => sim.setSpeed(parseInt(e.target.value, 10)));
['val-0', 'val-1', 'val-2'].forEach((id) =>
    on(id, 'keydown', (e) => { if (e.key === 'Enter') loadProgram(); }));

ui.refreshRam();
sim.reset();
registerServiceWorker();
