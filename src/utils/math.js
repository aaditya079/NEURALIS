// Math Utility Module
export function divide(a, b) {
  if (b === 0) {
    throw new RangeError('divide: denominator must not be 0');
  }
  return a / b;
}

export function percentage(value, total) {
  if (total === 0) {
    throw new RangeError('percentage: total must not be 0');
  }
  return (value / total) * 100;
}
