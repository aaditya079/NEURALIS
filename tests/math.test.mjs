import { strict as assert } from 'assert';
import { divide, percentage } from '../src/utils/math.js';

console.log('🧪 Starting Math Unit Tests...');

try {
  assert.equal(divide(10, 2), 5);
  console.log('✓ divide test passed');
  
  assert.equal(percentage(5, 10), 50);
  console.log('✓ percentage test passed');
  
  // Test divide by zero error throwing
  assert.throws(() => divide(10, 0), RangeError);
  console.log('✓ divide zero denominator error check passed');

  // Test percentage by zero error throwing
  assert.throws(() => percentage(5, 0), RangeError);
  console.log('✓ percentage zero total error check passed');
  
  console.log('🎉 Math tests passed!');
} catch (e) {
  console.error('❌ Math test failed:', e);
  process.exit(1);
}
