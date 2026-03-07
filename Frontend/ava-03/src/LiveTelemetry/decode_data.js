// ---------- Safe parsing helpers ----------
const parseBigInt = (x) => {
  if (typeof x === "bigint") return x;
  if (typeof x === "number") return BigInt(Math.trunc(x));
  if (typeof x === "string") {
    try {
      return BigInt(x);
    } catch {
      return 0n;
    }
  }
  return 0n;
};

export const asBigIntArray = (data) => {
  if (Array.isArray(data)) return data.map(parseBigInt);
  return [parseBigInt(data)];
};

export const bigintToSafeNumber = (b) => {
  const MAX = BigInt(Number.MAX_SAFE_INTEGER);
  const MIN = BigInt(Number.MIN_SAFE_INTEGER);
  if (b > MAX) return Number.MAX_SAFE_INTEGER;
  if (b < MIN) return Number.MIN_SAFE_INTEGER;
  return Number(b);
};