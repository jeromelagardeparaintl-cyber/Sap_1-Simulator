// All DOM work lives here. This module reads the machine state and draws it;
// it never changes the state itself.

import { SIGNAL_DEFS, OPCODE_NAMES, RAM_SIZE, T_STATE_COUNT } from './constants.js';
import { registers, ram, signals, clock, dataCells } from './state.js';
import { disassemble } from './assembler.js';
import { toBin4, toBin8Spaced, toHex1, toHex2 } from './utils.js';

const $ = (id) => document.getElementById(id);
const setText = (id, text) => { $(id).innerText = text; };

// ---------- Tailwind class strings ----------
const CLS = {
    badgeOn:  'px-1 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-600 text-white shadow',
    badgeOff: 'px-1 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-500',
    btnRun:   'px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded shadow transition flex items-center gap-1.5',
    btnPause: 'px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold rounded shadow transition flex items-center gap-1.5',
    sigChip:  'p-0.5 rounded bg-slate-950 border border-slate-800 text-slate-500 font-semibold',
    ledBase:  'w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-300',
    ledOn:    'border border-red-400 led-red-on',
    ledOff:   'bg-slate-900 border border-slate-800',
    rowIdle:  'hover:bg-slate-800/50 transition-colors',
    rowActive:'bg-blue-950/80 border-l-4 border-blue-500 font-bold transition-colors',
    indOn:    'text-emerald-400 font-bold',
    indOff:   'text-slate-600 font-bold',
};
const ICON_PLAY  = '<path d="M8 5v14l11-7z"/>';
const ICON_PAUSE = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';

// ======================================================
// Build (run once at startup)
// ======================================================

function buildTStateBadges() {
    const box = $('t-state-indicators');
    for (let i = 1; i <= T_STATE_COUNT; i++) {
        const badge = document.createElement('span');
        badge.id = `t${i}-badge`;
        badge.className = CLS.badgeOff;
        badge.textContent = `T${i}`;
        box.appendChild(badge);
    }
}

function buildSignalGrid() {
    const grid = $('signal-grid');
    SIGNAL_DEFS.forEach(({ key, label, title }) => {
        const chip = document.createElement('div');
        chip.id = `sig-${key}`;
        chip.className = CLS.sigChip;
        chip.title = title;
        chip.textContent = label;
        grid.appendChild(chip);
    });
}

function buildLedRow() {
    const row = $('led-row');
    for (let bit = 7; bit >= 0; bit--) {          // B7 on the left
        const cell = document.createElement('div');
        cell.className = 'flex flex-col items-center gap-1';
        cell.innerHTML = `
            <div id="led-${bit}" class="${CLS.ledBase} ${CLS.ledOff}"></div>
            <span class="text-[8px] font-mono text-slate-500">B${bit}</span>`;
        row.appendChild(cell);
    }
}

// onEdit(addr, text) is called when the user finishes editing a RAM cell
function buildRamTable(onEdit) {
    const body = $('ram-table-body');
    body.innerHTML = '';
    for (let i = 0; i < RAM_SIZE; i++) {
        const tr = document.createElement('tr');
        tr.id = `ram-row-${i}`;
        tr.className = CLS.rowIdle;
        tr.innerHTML = `
            <td class="p-1 font-bold text-slate-400 text-center">${toHex1(i)}</td>
            <td class="p-1">
                <input type="text" id="ram-input-${i}" value="NOP"
                    class="bg-transparent text-slate-200 border-b border-transparent focus:border-blue-500 focus:bg-slate-950 px-1 py-0.5 w-full outline-none text-[10px]">
            </td>
            <td class="p-1 text-slate-400 text-[10px]" id="ram-bin-${i}">0000 0000</td>
            <td class="p-1 font-bold text-blue-400 text-center text-[10px]" id="ram-hex-${i}">00H</td>`;
        const input = tr.querySelector('input');
        input.dataset.shown = input.value;
        // only re-parse when the user actually changed the text
        input.addEventListener('blur', () => {
            if (input.value !== input.dataset.shown) onEdit(i, input.value);
        });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
        body.appendChild(tr);
    }
}

export function initUI(onRamEdit) {
    buildTStateBadges();
    buildSignalGrid();
    buildLedRow();
    buildRamTable(onRamEdit);
}

// ======================================================
// Render (called after every change)
// ======================================================

const isAsserted = ({ key, activeHigh }) => (activeHigh ? signals[key] === 1 : signals[key] === 0);

function renderTStates() {
    for (let i = 1; i <= T_STATE_COUNT; i++) {
        $(`t${i}-badge`).className = i === clock.tState ? CLS.badgeOn : CLS.badgeOff;
    }
}

function renderSignals() {
    SIGNAL_DEFS.forEach((def) => {
        const asserted = isAsserted(def);
        $(`sig-${def.key}`).classList.toggle('signal-on', asserted);

        const indicator = $(`ind-${def.key}`);
        if (indicator) {
            indicator.innerText = signals[def.key];
            indicator.className = asserted ? CLS.indOn : CLS.indOff;
        }
    });
}

function renderBus() {
    const busDriven = signals.Ep === 1 || signals.CE === 0 || signals.Ei === 0
                   || signals.Ea === 1 || signals.Eu === 1;
    $('w-bus').classList.toggle('bus-active', busDriven);
    $('bus-value-tag').classList.toggle('hidden', !busDriven);
    if (busDriven) setText('bus-value-tag', toHex2(registers.W_BUS));
}

function renderRegisters() {
    const { PC, MAR, IR, ACC, B, OUT } = registers;
    const op = (IR >> 4) & 0x0F;
    const arg = IR & 0x0F;

    setText('val-pc-bin', toBin4(PC));
    setText('val-pc-hex', toHex1(PC));
    setText('val-mar-bin', toBin4(MAR));
    setText('val-mar-hex', toHex1(MAR));

    setText('val-ir-op-bin', toBin4(op));
    setText('val-ir-arg-bin', toBin4(arg));
    setText('val-ir-decoded', OPCODE_NAMES[op] ? `${OPCODE_NAMES[op]} ${toHex1(arg)}` : 'INVALID');

    setText('val-acc-bin', toBin8Spaced(ACC));
    setText('val-acc-hex', `${toHex2(ACC)} (${ACC})`);
    setText('val-b-bin', toBin8Spaced(B));
    setText('val-b-hex', `${toHex2(B)} (${B})`);

    setText('val-out-bin', toBin8Spaced(OUT));
    setText('val-out-hex', `${toHex2(OUT)} (Dec: ${OUT})`);
}

function renderAlu() {
    const subtract = signals.Su === 1;
    const result = (subtract ? registers.ACC - registers.B : registers.ACC + registers.B) & 0xFF;
    setText('val-alu-bin', toBin8Spaced(result));
    setText('val-alu-hex', toHex2(result));
    setText('alu-operation-label', subtract ? 'Diff [A - B]:' : 'Sum [A + B]:');
}

function renderRamHighlight() {
    const accessing = signals.CE === 0 || signals.Lm === 0;
    for (let i = 0; i < RAM_SIZE; i++) {
        $(`ram-row-${i}`).className = (accessing && i === registers.MAR) ? CLS.rowActive : CLS.rowIdle;
    }
}

function renderLeds() {
    const value = registers.OUT;
    for (let bit = 0; bit < 8; bit++) {
        const on = ((value >> bit) & 1) === 1;
        $(`led-${bit}`).className = `${CLS.ledBase} ${on ? CLS.ledOn : CLS.ledOff}`;
    }
    setText('led-display-dec', value);
}

export function render() {
    renderTStates();
    renderSignals();
    renderBus();
    renderRegisters();
    renderAlu();
    renderRamHighlight();
    renderLeds();
}

// ======================================================
// Smaller UI pieces
// ======================================================

// Redraws one RAM row from ram[addr] (skips the text box while the user is typing in it)
export function updateRamRow(addr) {
    const byte = ram[addr];
    setText(`ram-bin-${addr}`, toBin8Spaced(byte));
    setText(`ram-hex-${addr}`, toHex2(byte));

    const input = $(`ram-input-${addr}`);
    if (document.activeElement !== input) {
        input.value = dataCells.has(addr) ? `${toHex2(byte)} (data)` : disassemble(byte);
        input.dataset.shown = input.value;
    }
}

export function refreshRam() {
    for (let i = 0; i < RAM_SIZE; i++) updateRamRow(i);
}

export function log(message, colorClass = 'text-slate-300') {
    const box = $('log-container');
    const line = document.createElement('div');
    line.className = `${colorClass} leading-tight`;
    line.innerText = `> ${message}`;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
}

export function clearLog() {
    $('log-container').innerHTML = '<div class="text-slate-600">-- Log Cleared --</div>';
}

export function setMicroOp(text) {
    setText('micro-op-text', text);
}

export function setRunButton(running) {
    $('btn-run').className = running ? CLS.btnPause : CLS.btnRun;
    setText('run-text', running ? 'Pause' : 'Run');
    $('run-icon').innerHTML = running ? ICON_PAUSE : ICON_PLAY;
}

const MSG_CLASS = { ok: 'text-emerald-400', error: 'text-rose-400', info: 'text-slate-400' };

export function setLoadMessage(text, kind = 'info') {
    const box = $('load-msg');
    box.className = `mt-2 text-[10px] font-mono leading-tight ${MSG_CLASS[kind]}`;
    box.innerText = text;
}

export function setSpeedLabel(ms) {
    setText('speed-label', `${ms}ms`);
}
