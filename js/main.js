// Entry point: builds the UI, wires the buttons, loads the sample.

import * as sim from './simulator.js';
import * as ui from './ui.js';
import { registerServiceWorker } from './pwa.js';

const on = (id, event, handler) => document.getElementById(id).addEventListener(event, handler);

ui.initUI(sim.editRam);

on('btn-sample',    'click',  sim.loadSample);
on('btn-step',      'click',  sim.tick);
on('btn-run',       'click',  sim.toggleRun);
on('btn-reset',     'click',  sim.reset);
on('btn-clear-log', 'click',  ui.clearLog);
on('speed-slider',  'input',  (e) => sim.setSpeed(parseInt(e.target.value, 10)));

sim.loadSample();
registerServiceWorker();
