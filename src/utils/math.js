// Math Utility Module
export function divide(a, b) {
  // Direct division - potential division by zero risk!
  return a / b;
}

export function percentage(value, total) {
  return (value / total) * 100;
}
