/**
 * NEURALIS // Real line-by-line LCS Diffing Engine
 * Computes the Longest Common Subsequence of lines between two strings to generate highlighted visual diffs.
 */

// Compute real line diffs using classic Dynamic Programming LCS
export function computeLineDiff(beforeStr = '', afterStr = '') {
  // Normalize line endings
  const before = beforeStr.replace(/\r\n/g, '\n').split('\n');
  const after = afterStr.replace(/\r\n/g, '\n').split('\n');
  
  const n = before.length;
  const m = after.length;
  
  // Build Dynamic Programming grid
  const dp = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (before[i - 1] === after[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to assemble diff results list
  const diff = [];
  let i = n;
  let j = m;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && before[i - 1] === after[j - 1]) {
      diff.unshift({
        type: 'unchanged',
        text: before[i - 1],
        lnBefore: i,
        lnAfter: j
      });
      i--;
      j--;
    } 
    // Prefer addition over deletion when weights are equal (standard diffing heuristic)
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({
        type: 'added',
        text: after[j - 1],
        lnAfter: j
      });
      j--;
    } 
    else {
      diff.unshift({
        type: 'removed',
        text: before[i - 1],
        lnBefore: i
      });
      i--;
    }
  }
  
  return diff;
}

// Render dynamic diff results into the workspace panel HTML
export function renderDiffView(containerElement, beforeStr = '', afterStr = '', filename = 'code.js') {
  if (!containerElement) return;
  containerElement.innerHTML = '';

  const fileNameLabel = document.getElementById('diff-file-name');
  if (fileNameLabel) {
    fileNameLabel.textContent = filename;
  }

  // Handle case where file is newly created or unmodified
  const diffLines = computeLineDiff(beforeStr, afterStr);
  
  if (diffLines.length === 0 || (diffLines.length === 1 && diffLines[0].text === '')) {
    containerElement.innerHTML = '<div class="empty-state">File is empty or holds zero content.</div>';
    return;
  }

  const listContainer = document.createElement('div');
  listContainer.className = 'diff-lines-list';

  diffLines.forEach(line => {
    const row = document.createElement('div');
    row.className = `diff-line ${line.type}`;

    // Line number labels
    const lnNum = document.createElement('div');
    lnNum.className = 'diff-ln';
    
    if (line.type === 'unchanged') {
      lnNum.textContent = line.lnAfter;
    } else if (line.type === 'added') {
      lnNum.textContent = line.lnAfter;
    } else {
      lnNum.textContent = '–';
    }

    const textContent = document.createElement('div');
    textContent.className = 'diff-text';
    textContent.textContent = line.text;

    row.appendChild(lnNum);
    row.appendChild(textContent);
    listContainer.appendChild(row);
  });

  containerElement.appendChild(listContainer);
}
