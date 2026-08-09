/**
 * Un interpréteur du sous-ensemble x86-64 qu'utilise minilibC.
 *
 * Les douze fonctions du projet tiennent dans quatorze instructions —
 * mov, movsx, cmp, inc, add, sub, xor, ret et les sauts. Assez peu pour
 * les exécuter ici plutôt que de raconter ce qu'elles font : la démo
 * charge les vrais fichiers .asm du dépôt, les assemble en mémoire et
 * avance instruction par instruction, registres à l'appui.
 *
 * Ce n'est pas un émulateur : pas de pile, pas d'appel, pas de drapeau
 * d'état complet. `cmp` retient ses deux opérandes et les sauts
 * conditionnels les comparent — ce qui donne exactement le comportement
 * attendu ici, où tout est comparaison d'octets ou de compteurs.
 */

export const ARG_REGISTERS = ["rdi", "rsi", "rdx", "rcx", "r8", "r9"] as const;

export const REGISTERS = [
  "rax",
  "rdi",
  "rsi",
  "rdx",
  "rcx",
  "r8",
  "r9",
  "r10",
  "r11",
  "r12",
  "r13",
] as const;

export type Register = (typeof REGISTERS)[number];

/** Les moitiés basses utilisées par le projet : al, sil, r11b… */
const LOW_BYTE: Record<string, Register> = {
  al: "rax",
  dil: "rdi",
  sil: "rsi",
  dl: "rdx",
  cl: "rcx",
  r8b: "r8",
  r9b: "r9",
  r10b: "r10",
  r11b: "r11",
  r12b: "r12",
  r13b: "r13",
};

export interface Instruction {
  op: string;
  operands: string[];
  /** Ligne dans le fichier source, pour surligner au bon endroit. */
  line: number;
  label?: string;
}

export interface Program {
  instructions: Instruction[];
  labels: Map<string, number>;
  /** Le texte d'origine, tel qu'il est affiché à côté de l'exécution. */
  lines: string[];
}

export interface MachineState {
  registers: Record<Register, number>;
  memory: Uint8Array;
  base: number;
  pc: number;
  line: number;
  done: boolean;
  steps: number;
  /**
   * Les deux dernières valeurs comparées. Un vrai processeur garderait des
   * drapeaux ; les sauts d'ici n'ont besoin que de ça, et c'est plus
   * lisible à afficher que ZF, SF et OF.
   */
  compared: [number, number];
}

/** Assemble : les étiquettes deviennent des indices, le reste disparaît. */
export function parseAsm(source: string): Program {
  const lines = source.replace(/\r/g, "").split("\n");
  const instructions: Instruction[] = [];
  const labels = new Map<string, number>();

  lines.forEach((raw, index) => {
    let text = raw.split(";")[0].trim();
    if (text === "") return;

    // Une étiquette peut précéder une instruction sur la même ligne.
    const label = /^([A-Za-z_.][\w.$]*)\s*:\s*(.*)$/.exec(text);
    if (label) {
      labels.set(label[1], instructions.length);
      text = label[2].trim();
      if (text === "") return;
    }

    const [op, ...rest] = text.split(/\s+/);
    const lowered = op.toLowerCase();
    // Directives d'assemblage : rien à exécuter.
    if (["bits", "section", "global", "extern", "default"].includes(lowered)) return;

    const operands = rest
      .join(" ")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    instructions.push({ op: lowered, operands, line: index });
  });

  return { instructions, labels, lines };
}

interface Operand {
  kind: "register" | "memory" | "immediate";
  register?: Register;
  size: 1 | 8;
  value?: number;
}

function parseOperand(text: string): Operand {
  let rest = text.trim();
  let size: 1 | 8 | null = null;

  const sized = /^(byte|word|dword|qword)\s*/i.exec(rest);
  if (sized) {
    size = sized[1].toLowerCase() === "byte" ? 1 : 8;
    rest = rest.slice(sized[0].length).trim();
  }

  const memory = /^\[\s*([A-Za-z0-9]+)\s*\]$/.exec(rest);
  if (memory) {
    const register = memory[1].toLowerCase();
    return {
      kind: "memory",
      register: (LOW_BYTE[register] ?? register) as Register,
      size: size ?? 8,
    };
  }

  const lowered = rest.toLowerCase();
  if (LOW_BYTE[lowered]) return { kind: "register", register: LOW_BYTE[lowered], size: 1 };
  if ((REGISTERS as readonly string[]).includes(lowered)) {
    return { kind: "register", register: lowered as Register, size: 8 };
  }

  return { kind: "immediate", size: size ?? 8, value: Number(rest) };
}

export function makeState(memoryBytes: number, base = 0x1000): MachineState {
  const registers = Object.fromEntries(REGISTERS.map((r) => [r, 0])) as Record<
    Register,
    number
  >;
  return {
    registers,
    memory: new Uint8Array(memoryBytes),
    base,
    pc: 0,
    line: 0,
    done: false,
    steps: 0,
    compared: [0, 0],
  };
}

function readRegister(state: MachineState, register: Register, size: 1 | 8): number {
  const value = state.registers[register];
  return size === 1 ? value & 0xff : value;
}

function writeRegister(
  state: MachineState,
  register: Register,
  size: 1 | 8,
  value: number,
) {
  if (size === 1) {
    state.registers[register] = (state.registers[register] & ~0xff) | (value & 0xff);
    return;
  }
  state.registers[register] = value;
}

function address(state: MachineState, operand: Operand): number {
  return state.registers[operand.register!] - state.base;
}

function readMemory(state: MachineState, at: number, size: 1 | 8): number {
  if (at < 0 || at >= state.memory.length) return 0;
  if (size === 1) return state.memory[at];
  let value = 0;
  // Petit-boutiste, comme le processeur : mov r10, [rsi] lit huit octets.
  for (let i = 7; i >= 0; i--) value = value * 256 + (state.memory[at + i] ?? 0);
  return value;
}

function writeMemory(state: MachineState, at: number, size: 1 | 8, value: number) {
  if (at < 0 || at >= state.memory.length) return;
  if (size === 1) {
    state.memory[at] = value & 0xff;
    return;
  }
  let rest = value;
  for (let i = 0; i < 8; i++) {
    state.memory[at + i] = rest & 0xff;
    rest = Math.floor(rest / 256);
  }
}

function read(state: MachineState, operand: Operand, size: 1 | 8): number {
  if (operand.kind === "immediate") return operand.value ?? 0;
  if (operand.kind === "register") return readRegister(state, operand.register!, size);
  return readMemory(state, address(state, operand), size);
}

function write(state: MachineState, operand: Operand, size: 1 | 8, value: number) {
  if (operand.kind === "register") writeRegister(state, operand.register!, size, value);
  else if (operand.kind === "memory") writeMemory(state, address(state, operand), size, value);
}

/**
 * La taille d'une opération vient de l'opérande la plus explicite : un
 * suffixe `byte`, sinon un registre 8 bits, sinon 64 bits. C'est ce que
 * fait nasm, et c'est ce qui distingue `mov [rdi], r11b` de `mov r10, [rsi]`.
 */
function operationSize(operands: Operand[]): 1 | 8 {
  if (operands.some((o) => o.size === 1 && o.kind !== "memory")) return 1;
  if (operands.some((o) => o.size === 1)) return 1;
  return 8;
}

const MAX_STEPS = 20_000;

/** Exécute une instruction. Rend false quand la fonction a fini (ret). */
export function step(state: MachineState, program: Program): boolean {
  if (state.done) return false;
  if (state.pc < 0 || state.pc >= program.instructions.length || state.steps > MAX_STEPS) {
    state.done = true;
    return false;
  }

  const instruction = program.instructions[state.pc];
  state.line = instruction.line;
  state.steps += 1;
  const operands = instruction.operands.map(parseOperand);
  const size = operationSize(operands);
  let next = state.pc + 1;

  const jumpTo = (label: string) => {
    const target = program.labels.get(label);
    next = target === undefined ? program.instructions.length : target;
  };

  switch (instruction.op) {
    case "mov":
      write(state, operands[0], size, read(state, operands[1], size));
      break;
    case "movsx": {
      const value = read(state, operands[1], 1);
      write(state, operands[0], 8, value > 127 ? value - 256 : value);
      break;
    }
    case "xor": {
      const value = read(state, operands[0], size) ^ read(state, operands[1], size);
      write(state, operands[0], size, value);
      break;
    }
    case "add":
      write(state, operands[0], size, read(state, operands[0], size) + read(state, operands[1], size));
      break;
    case "sub":
      write(state, operands[0], size, read(state, operands[0], size) - read(state, operands[1], size));
      break;
    case "inc":
      write(state, operands[0], size, read(state, operands[0], size) + 1);
      break;
    case "dec":
      write(state, operands[0], size, read(state, operands[0], size) - 1);
      break;
    case "cmp":
      state.compared = [read(state, operands[0], size), read(state, operands[1], size)];
      break;
    case "jmp":
      jumpTo(instruction.operands[0]);
      break;
    case "je":
    case "jz":
      if (state.compared[0] === state.compared[1]) jumpTo(instruction.operands[0]);
      break;
    case "jne":
    case "jnz":
      if (state.compared[0] !== state.compared[1]) jumpTo(instruction.operands[0]);
      break;
    case "jg":
      if (state.compared[0] > state.compared[1]) jumpTo(instruction.operands[0]);
      break;
    case "jge":
      if (state.compared[0] >= state.compared[1]) jumpTo(instruction.operands[0]);
      break;
    case "jl":
      if (state.compared[0] < state.compared[1]) jumpTo(instruction.operands[0]);
      break;
    case "jle":
      if (state.compared[0] <= state.compared[1]) jumpTo(instruction.operands[0]);
      break;
    case "ret":
      state.done = true;
      return false;
    default:
      // Une instruction hors du sous-ensemble : mieux vaut s'arrêter que
      // faire semblant d'avoir exécuté quelque chose.
      state.done = true;
      return false;
  }

  state.pc = next;
  return true;
}
