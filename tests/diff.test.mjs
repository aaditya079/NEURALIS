// tests/diff.test.mjs - Native ESM unit tests for LCS diff engine
import assert from 'assert';
import { computeLineDiff } from '../js/diff.js';

console.log('🧪 Starting Neuralis Unit Tests...');

try {
  // Test Case 1: Unmodified text
  console.log('  Testing Case 1: Unmodified single-line diffs...');
  const res1 = computeLineDiff('hello world', 'hello world');
  assert.strictEqual(res1.length, 1);
  assert.strictEqual(res1[0].type, 'unchanged');
  assert.strictEqual(res1[0].text, 'hello world');
  console.log('  ✓ Case 1 Passed.');

  // Test Case 2: Added line
  console.log('  Testing Case 2: Multi-line additions...');
  const before2 = 'line one\nline two';
  const after2 = 'line one\nline added\nline two';
  const res2 = computeLineDiff(before2, after2);
  
  assert.strictEqual(res2.length, 3);
  assert.strictEqual(res2[0].type, 'unchanged');
  assert.strictEqual(res2[1].type, 'added');
  assert.strictEqual(res2[1].text, 'line added');
  assert.strictEqual(res2[2].type, 'unchanged');
  console.log('  ✓ Case 2 Passed.');

  // Test Case 3: Removed line
  console.log('  Testing Case 3: Multi-line deletions...');
  const before3 = 'line one\nline removed\nline two';
  const after3 = 'line one\nline two';
  const res3 = computeLineDiff(before3, after3);

  assert.strictEqual(res3.length, 3);
  assert.strictEqual(res3[0].type, 'unchanged');
  assert.strictEqual(res3[1].type, 'removed');
  assert.strictEqual(res3[1].text, 'line removed');
  assert.strictEqual(res3[2].type, 'unchanged');
  console.log('  ✓ Case 3 Passed.');

  // Test Case 4: Complex replacement (LCS dynamic grid test)
  console.log('  Testing Case 4: Complex DP matrix replacements...');
  const before4 = 'apple\nbanana\ncherry';
  const after4 = 'apple\nblueberry\ncherry\ndate';
  const res4 = computeLineDiff(before4, after4);
  
  // cherry and apple should be unchanged, banana removed, blueberry added, date added
  const removedCount = res4.filter(l => l.type === 'removed').length;
  const addedCount = res4.filter(l => l.type === 'added').length;
  const unchangedCount = res4.filter(l => l.type === 'unchanged').length;
  
  assert.strictEqual(removedCount, 1);
  assert.strictEqual(addedCount, 2);
  assert.strictEqual(unchangedCount, 2);
  console.log('  ✓ Case 4 Passed.');

  console.log('\n🎉 ALL NEURALIS UNIT TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ UNIT TEST FAILURE DETECTED:');
  console.error(error);
  process.exit(1);
}
