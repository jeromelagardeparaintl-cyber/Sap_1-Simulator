# SAP-1 Computer Architecture Simulator

An interactive, browser-based simulator of the **SAP-1 (Simple-As-Possible 1)** computer from Albert Paul Malvino's *Digital Computer Electronics*. Step through the fetch and execute cycles one T-state at a time and watch the W-bus, registers, control signals, and output LEDs change.

No installation, no build step, no dependencies to download. It is a single HTML file.

---

## Features

- 16 x 8-bit RAM, editable (type mnemonics, hex, binary, or decimal)
- Program Counter, MAR, Instruction Register, Accumulator, B Register, ALU, Output Register
- 6 T-state sequencer (T1-T3 fetch, T4-T6 execute) with a 12-bit control word display
- Animated W-bus that lights up when a component drives it
- 8-LED binary output display with decimal readout
- Step, Run/Pause, Reset, and adjustable clock speed (50-1000 ms)
- Execution log that describes every micro-operation
- Built-in sample program: `25H + 05H - 23H = 07H`

---

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-folder>
   ```
2. **Make sure `index.html` is in the root of the repo.**
3. **Run it with a local server** (required for ES modules):
   ```bash
   # Python 3
   python -m http.server 8000
   # then visit http://localhost:8000
   ```
   (VS Code users can also use the *Live Server* extension.)
4. Click **Sample (25H + 05H - 23H)**, then **Step** or **Run**.

> An internet connection is required on first load (Tailwind CSS and Google Fonts come from CDNs).

---

## Instruction Set

| Mnemonic | Opcode | Operation |
|----------|--------|-----------|
| `LDA x`  | 0000   | Load RAM[x] into the Accumulator |
| `ADD x`  | 0001   | B <- RAM[x]; A <- A + B |
| `SUB x`  | 0010   | B <- RAM[x]; A <- A - B |
| `OUT`    | 1110   | Copy the Accumulator to the Output Register |
| `HLT`    | 1111   | Stop the computer |

Each instruction is 8 bits: the **high nibble** is the opcode and the **low nibble** is the 4-bit RAM address (operand).

### Timing

| T-State | Phase   | Micro-operation |
|---------|---------|-----------------|
| T1 | Fetch   | PC -> W-bus -> MAR |
| T2 | Fetch   | PC <- PC + 1 |
| T3 | Fetch   | RAM[MAR] -> W-bus -> IR |
| T4-T6 | Execute | Depends on the instruction (see log) |

---

## Sample Program

| Addr | Content | Meaning |
|------|---------|---------|
| 0H | `09H` | `LDA 9H` |
| 1H | `1AH` | `ADD AH` |
| 2H | `2BH` | `SUB BH` |
| 3H | `EFH` | `OUT` |
| 4H | `FFH` | `HLT` |
| 9H | `25H` | data |
| AH | `05H` | data |
| BH | `23H` | data |

Expected result: `25H + 05H - 23H = 07H` (binary `0000 0111`, decimal 7).

---

## Entering Your Own Programs

Click any cell in the **Mnemonic/Data** column and type one of:

- Mnemonic: `LDA 9H`, `ADD A`, `SUB 3`, `OUT`, `HLT`
- Hex: `25H`
- Binary (8 digits): `00100101`
- Decimal: `37`

Press **Enter** or click away to save. Remember that data and instructions share the same RAM, so place your data at addresses your program never executes (e.g. 9H-FH).

---

## Controls

| Control | What it does |
|---------|--------------|
| **Sample** | Loads the demo program and resets the machine |
| **Step (T-State)** | Advances exactly one T-state |
| **Run / Pause** | Auto-steps at the selected clock speed |
| **Reset** | Clears registers and returns to T1 (RAM is kept) |
| **Speed slider** | Sets the delay between T-states |
| **Clear** | Clears the execution log |

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
    ├── main.js              # entry point: wires buttons, starts the app
    ├── simulator.js         # orchestrator: tick, reset, load sample, edit RAM
    ├── cpu.js               # control unit: fetch/execute micro-operations
    ├── state.js             # registers, RAM, signals, clock (single source of truth)
    ├── constants.js         # opcodes, signal definitions, sizes
    ├── assembler.js         # text <-> byte conversion (assemble / disassemble)
    ├── runner.js            # auto-run timer (Run / Pause / speed)
    ├── ui.js                # ALL DOM code: build + render
    ├── sample.js            # demo program data
    ├── utils.js             # pure formatting helpers (hex / binary)
    ├── pwa.js               # service worker registration
    └── tailwind-config.js   # Tailwind theme config
```

### How the modules fit together

```
main.js ──> simulator.js ──> cpu.js ──> state.js
   │             │  └──────> runner.js     ▲
   │             └────────> ui.js ─────────┘ (reads state, draws it)
   └──> ui.js, pwa.js
```

- **cpu.js never touches the DOM**, and **ui.js never changes state**.
- To add an instruction: add its opcode in `constants.js` and its micro-program in the `EXECUTE` table in `cpu.js`.
- To change how something looks: edit `ui.js`, `index.html`, or `css/styles.css`.

> Because the code uses ES modules, the app must be served over HTTP (`python -m http.server 8000`) or GitHub Pages. Opening `index.html` by double-click will not work.

---

## Deploy with GitHub Pages (optional)

1. Push `index.html` to the `main` branch.
2. On GitHub: **Settings -> Pages**.
3. Under *Build and deployment*, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
4. After a minute your simulator is live at `https://<username>.github.io/<repo-name>/`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Page looks unstyled | You are offline or the Tailwind CDN is blocked. Connect to the internet and refresh. |
| Nothing happens on Step | Open the browser console (F12) and check for errors; make sure the whole file was saved. |
| Program does not stop | Your program needs an `HLT` instruction at the end. |
| Wrong output after editing RAM | Check that data bytes are not placed where the PC will execute them. |

---

## Tech Stack

- HTML5 / vanilla JavaScript (ES modules)
- [Tailwind CSS](https://tailwindcss.com/) (CDN)
- Google Fonts: Inter and JetBrains Mono

---

## Authors

Add your team members' names here.

## License

Add a license of your choice (e.g. MIT) here.
