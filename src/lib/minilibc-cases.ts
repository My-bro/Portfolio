/**
 * Les contextes d'appel de la démo minilibC.
 *
 * Chaque entrée dit trois choses : le fichier .asm à exécuter, la ligne de
 * C qui appellerait la fonction, et ce que la libc du système renverrait.
 * C'est cette dernière qui sert de juge — la démo montre les registres,
 * mais elle doit aussi montrer que le résultat est le bon.
 */

export type ArgKind = "string" | "char" | "int";

export interface CaseArg {
  /** Registre porteur, dans l'ordre de la convention System V. */
  register: "rdi" | "rsi" | "rdx";
  kind: ArgKind;
  /** Chaîne à poser en mémoire, ou valeur immédiate. */
  value: string | number;
  /** Ce que l'argument représente, en français. */
  role: string;
}

export interface Case {
  key: string;
  /** Nom du fichier dans public/minilibc/, sans l'extension. */
  file: string;
  signature: string;
  call: string;
  args: CaseArg[];
  /** Tampon modifiable : memset et memcpy écrivent dans leur destination. */
  writesTo?: 0;
  /** Ce que renvoie la libc, pour comparaison. */
  expect: (args: (string | number)[]) => string;
  /** Comment lire rax à l'arrivée. */
  returns: "int" | "pointer" | "buffer";
}

const S = (v: string | number) => String(v);

export const CASES: Case[] = [
  {
    key: "strlen",
    file: "strlen",
    signature: "size_t strlen(const char *s)",
    call: 'strlen("Epitech")',
    args: [{ register: "rdi", kind: "string", value: "Epitech", role: "la chaîne" }],
    expect: (a) => S(String(a[0]).length),
    returns: "int",
  },
  {
    key: "strchr",
    file: "strchr",
    signature: "char *strchr(const char *s, int c)",
    call: "strchr(\"bonjour\", 'o')",
    args: [
      { register: "rdi", kind: "string", value: "bonjour", role: "la chaîne" },
      { register: "rsi", kind: "char", value: "o", role: "le caractère cherché" },
    ],
    expect: (a) => S(String(a[0]).indexOf(String(a[1]))),
    returns: "pointer",
  },
  {
    key: "strrchr",
    file: "strrchar",
    signature: "char *strrchr(const char *s, int c)",
    call: "strrchr(\"bonjour\", 'o')",
    args: [
      { register: "rdi", kind: "string", value: "bonjour", role: "la chaîne" },
      { register: "rsi", kind: "char", value: "o", role: "le caractère cherché" },
    ],
    expect: (a) => S(String(a[0]).lastIndexOf(String(a[1]))),
    returns: "pointer",
  },
  {
    key: "strcmp",
    file: "strcmp",
    signature: "int strcmp(const char *s1, const char *s2)",
    call: 'strcmp("abc", "abd")',
    args: [
      { register: "rdi", kind: "string", value: "abc", role: "première chaîne" },
      { register: "rsi", kind: "string", value: "abd", role: "seconde chaîne" },
    ],
    // Le projet rend -1, 0 ou 1 là où la libc rend une différence : c'est
    // le signe qui compte, et c'est lui qu'on compare.
    expect: (a) => S(Math.sign(String(a[0]) < String(a[1]) ? -1 : String(a[0]) > String(a[1]) ? 1 : 0)),
    returns: "int",
  },
  {
    key: "strstr",
    file: "strstr",
    signature: "char *strstr(const char *haystack, const char *needle)",
    call: 'strstr("hello world", "wor")',
    args: [
      { register: "rdi", kind: "string", value: "hello world", role: "la botte de foin" },
      { register: "rsi", kind: "string", value: "wor", role: "l'aiguille" },
    ],
    expect: (a) => S(String(a[0]).indexOf(String(a[1]))),
    returns: "pointer",
  },
  {
    key: "memset",
    file: "memset",
    signature: "void *memset(void *s, int c, size_t n)",
    call: "memset(buffer, 'x', 4)",
    args: [
      { register: "rdi", kind: "string", value: "........", role: "le tampon" },
      { register: "rsi", kind: "char", value: "x", role: "l'octet à écrire" },
      { register: "rdx", kind: "int", value: 4, role: "le nombre d'octets" },
    ],
    writesTo: 0,
    expect: (a) =>
      String(a[1]).repeat(Number(a[2])) + String(a[0]).slice(Number(a[2])),
    returns: "buffer",
  },
  {
    key: "memcpy",
    file: "memcpy",
    signature: "void *memcpy(void *dest, const void *src, size_t n)",
    call: "memcpy(dest, \"SOURCE\", 3)",
    args: [
      { register: "rdi", kind: "string", value: "......", role: "la destination" },
      { register: "rsi", kind: "string", value: "SOURCE", role: "la source" },
      { register: "rdx", kind: "int", value: 3, role: "le nombre d'octets" },
    ],
    writesTo: 0,
    expect: (a) =>
      String(a[1]).slice(0, Number(a[2])) + String(a[0]).slice(Number(a[2])),
    returns: "buffer",
  },
];
