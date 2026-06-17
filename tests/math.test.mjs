import { strict as assert } from 'assert';
import { divide, percentage } from '../src/utils/math.js';

console.log('🧪 Starting Math Unit Tests...');

try {
  assert.equal(divide(10, 2), 5);
  console.log('✓ divide test passed');
  
  assert.equal(percentage(5, 10), 50);
  console.log('✓ percentage test passed');
  
  console.log('🎉 Math tests passed!');
} catch (e) {
  console.error('❌ Math test failed:', e);
  process.exit(1);
}
