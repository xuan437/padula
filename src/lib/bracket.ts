// Team slot is "not ready" if empty or a placeholder like "Winner of QF1", "TBD", "BYE"
export const isPlaceholder = (name?: string | null): boolean =>
  !name || /^(winner|tbd|bye)/i.test(name);

export function getRoundName(roundNum: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNum;
  if (fromEnd === 0) return 'Championship Final';
  if (fromEnd === 1) return 'Semi-Finals';
  if (fromEnd === 2) return 'Quarter-Finals';
  if (fromEnd === 3) return 'Round of 16';
  return `Round ${roundNum}`;
}

export function getSeedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const nextSize = order.length * 2;
    const nextOrder: number[] = [];
    for (const seed of order) {
      nextOrder.push(seed);
      nextOrder.push(nextSize + 1 - seed);
    }
    order = nextOrder;
  }
  return order;
}
