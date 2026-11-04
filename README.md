# SAP-1 Computer Architecture Simulator

A browser-based simulator of the **SAP-1 (Simple-As-Possible 1)** computer. Enter your own values, load them into RAM, and watch the fetch-decode-execute cycle move data across the W-Bus, through the registers, and onto the output LEDs.

**Live demo:** https://sap1-simulator.vercel.app/

---

## Language and Framework (with justification)

**HTML + CSS + JavaScript (ES modules), no framework.**

- The SAP-1 is a small, fixed machine (16 bytes of RAM, 6 registers, 5 instructions). A framework would add build tooling without making the simulation any clearer.
- Plain JavaScript keeps the **simulation logic (`cpu.js`) separate from the display (`ui.js`)**, which mirrors the hardware split between the controller-sequencer and the visible registers.
- Zero dependencies: nothing to install, and it runs on any static host.
- Styling uses the Tailwind CSS CDN plus a small custom stylesheet (`css/styles.css`).

## Install and Run

**Dependencies to install: none.** The only external resources are the Tailwind CSS and Google Fonts CDNs (internet needed on first load).

```bash
git clone https://github.com/jeromelagardeparaintl-cyber/Sap_1-Simulator
cd Sap_1-Simulator
python -m http.server 8000      # or: npx serve   |   VS Code "Live Server"
```

Open <http://localhost:8000>. A local server is required because the code uses ES modules (double-clicking `index.html` will not work).

---

## How to Use

1. **Load Program panel (top left):** type three values for the formula **A (+/-) B (+/-) C**, pick `+` or `-` for each operator, choose **Hex** or **Decimal**, and click **Load into RAM**. The app writes the machine code and your data into RAM and shows the *expected* result.
2. Click **Run** (auto-executes until `HLT`), **Step Instruction** (one whole instruction), or **Step T-State** (one clock pulse).
3. Read the answer on the **Output Register** and the **8 LEDs**.
4. **Reset** clears the registers and returns to T1 (RAM keeps your program so you can run it again). **Clear RAM** empties memory.

No values are pre-loaded or hard-coded: the app starts with empty memory, and every data byte comes from what you type. You can also edit any RAM cell directly (see below).

### Example formulas for the demonstration

| Formula (hex) | Type in the panel | Expected output |
|---|---|---|
| 25H + 05H - 23H | `25` `+` `05` `-` `23` | `07H` (0000 0111) |
| 3CH - 0FH + 05H | `3C` `-` `0F` `+` `05` | `32H` (0011 0010) |
| 50H - 1EH - 0AH | `50` `-` `1E` `-` `0A` | `28H` (0010 1000) |

### Memory layout the panel generates

| Addr | Instruction | Machine code |
|------|-------------|--------------|
| 0H | `LDA 9H` | 0000 1001 |
| 1H | `ADD AH` or `SUB AH` | 0001/0010 1010 |
| 2H | `ADD BH` or `SUB BH` | 0001/0010 1011 |
| 3H | `OUT` | 1110 1111 |
| 4H | `HLT` | 1111 1111 |
| 9H, AH, BH | your values A, B, C | (data) |

---

## Features

- 16 x 8-bit RAM viewer with the currently accessed address highlighted
- Separate panels for PC, MAR, IR (opcode/operand split), Accumulator, B Register, ALU (2's complement), and Output Register, all with live binary and hex values
- Animated **W-Bus** showing when a component drives the bus, with the byte on it
- 6-step **T-state sequencer** and a 12-bit **control signal word**
- 8-LED binary output display with decimal readout
- Execution log describing every micro-operation
- Adjustable clock speed for Run mode
- Installable offline (PWA)

## Instruction Set

| Mnemonic | Opcode | Operation |
|----------|--------|-----------|
| `LDA x`  | 0000   | Load RAM[x] into the Accumulator |
| `ADD x`  | 0001   | B <- RAM[x]; A <- A + B |
| `SUB x`  | 0010   | B <- RAM[x]; A <- A - B (2's complement) |
| `OUT`    | 1110   | Copy the Accumulator to the Output Register |
| `HLT`    | 1111   | Stop the computer |

| T-State | Phase   | Micro-operation |
|---------|---------|-----------------|
| T1 | Fetch   | PC -> W-bus -> MAR |
| T2 | Fetch   | PC <- PC + 1 |
| T3 | Fetch   | RAM[MAR] -> W-bus -> IR |
| T4-T6 | Execute | Depends on the instruction (see the log) |

## Writing Programs by Hand

Click any cell in the **Mnemonic/Data** column and type:

- Instruction: `LDA 9H`, `ADD A`, `SUB 3` (the address is **one hex digit, 0-F**), `OUT`, `HLT`
- Hex data: `25H` (always with the `H`)
- Binary data (8 digits): `00100101`
- Decimal data: `37` (0-255)

Invalid input is rejected with a message in the log and the cell keeps its old value.

**Always end your program with `HLT`.** SAP-1 has no jump instruction and an empty cell (`00H`) is really `LDA 0H`, not a no-op. Without `HLT` the PC runs past address FH, wraps to 0H, and the simulator pauses with a warning.

---

## Project Structure

```
.
├── index.html               # page layout only (no logic)
├── manifest.webmanifest     # PWA metadata
├── sw.js                    # service worker (offline cache)
├── icon.svg                 # app icon
├── css/
│   └── styles.css           # custom CSS (glow animations, scrollbars)
└── js/
    ├── main.js              # entry point: wires buttons and the Load Program panel
    ├── simulator.js         # orchestrator: tick, step instruction, reset, load, edit RAM
    ├── program-builder.js   # turns "A +/- B +/- C" + typed values into machine code
    ├── cpu.js               # control unit: fetch/execute micro-operations
    ├── state.js             # registers, RAM, signals, clock (single source of truth)
    ├── constants.js         # opcodes, signal definitions, sizes
    ├── assembler.js         # text <-> byte conversion and input validation
    ├── runner.js            # auto-run timer (Run / Pause / speed)
    ├── ui.js                # ALL DOM code: build + render
    ├── utils.js             # pure formatting helpers (hex / binary)
    ├── pwa.js               # service worker registration
    └── tailwind-config.js   # Tailwind theme config
```

`cpu.js` never touches the DOM and `ui.js` never changes machine state. To add an instruction, add its opcode in `constants.js` and a micro-program in the `EXECUTE` table in `cpu.js`.

## Deploy (Vercel)

Import the GitHub repo in Vercel with Framework Preset **Other**, Root Directory `./`, and no build command. Every push to `main` redeploys. When you change any file, bump `CACHE` in `sw.js` so installed copies update.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page | Serve over HTTP (not `file://`) and check the browser console (F12). |
| Unstyled page | Offline or CDN blocked. Reconnect and refresh. |
| Program never stops | It needs an `HLT`. The simulator pauses with a warning when the PC wraps. |
| Old version after deploy | Bump `CACHE` in `sw.js`, push, then hard refresh (Ctrl+Shift+R). |

## Team

ARCILLA, Josh Nathaniel R.		
BELMONTE, Cloiez Veniz L.		
CAMPOS, Vera Coleen S.		
DE GUZMAN, Hazel Rose V.		
LAGARDE, Jerome S.		
MOLINA, Andrei Marshall DC.		

