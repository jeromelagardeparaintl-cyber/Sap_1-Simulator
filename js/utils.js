// Small, pure formatting helpers (no DOM, no state).

export const toBin4 = (v) => (v & 0x0F).toString(2).padStart(4, '0');
export const toBin8 = (v) => (v & 0xFF).toString(2).padStart(8, '0');
export const toHex1 = (v) => (v & 0x0F).toString(16).toUpperCase() + 'H';
export const toHex2 = (v) => (v & 0xFF).toString(16).toUpperCase().padStart(2, '0') + 'H';

// 8-bit value as "0010 0101"
export const toBin8Spaced = (v) => {
    const b = toBin8(v);
    return `${b.slice(0, 4)} ${b.slice(4)}`;
};
