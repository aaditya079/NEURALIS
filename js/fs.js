/**
 * NEURALIS // Virtual Filesystem (VFS) Utilities & Sidebar Renderer
 * Translates in-memory VFS JSON objects into interactive HTML trees.
 */

// Helper: Traverse VFS JSON structure to resolve a absolute/relative path
export function resolvePath(vfs, path, currentDir = '/') {
  // Normalize double slashes and trailing slashes
  let fullPath = path.startsWith('/') ? path : `${currentDir}/${path}`;
  fullPath = fullPath.split('/').filter(p => p !== '' && p !== '.').reduce((acc, part) => {
    if (part === '..') {
      acc.pop();
    } else {
      acc.push(part);
    }
    return acc;
  }, []).join('/');

  return '/' + fullPath;
}

// Helper: Retrieve a node (file or folder) at a normalized path
export function getNodeAtPath(vfs, resolvedPath) {
  if (resolvedPath === '/' || resolvedPath === '') return vfs;

  const parts = resolvedPath.split('/').filter(p => p !== '');
  let current = vfs;

  for (const part of parts) {
    if (current && current.children && current.children[part]) {
      current = current.children[part];
    } else {
      return null;
    }
  }
  return current;
}

// Sidebar visual builder: Recursively compile VFS JSON into HTML elements
export function renderVfsTree(vfsNode, parentElement, onFileClick, currentPath = '') {
  parentElement.innerHTML = '';
  
  if (!vfsNode || !vfsNode.children || Object.keys(vfsNode.children).length === 0) {
    parentElement.innerHTML = '<div class="empty-state">Workspace is empty.</div>';
    return;
  }

  const listContainer = document.createElement('div');
  listContainer.className = 'vfs-folder-contents';

  // Sort: Folders first, then Files
  const sortedNames = Object.keys(vfsNode.children).sort((a, b) => {
    const nodeA = vfsNode.children[a];
    const nodeB = vfsNode.children[b];
    if (nodeA.type !== nodeB.type) {
      return nodeA.type === 'directory' ? -1 : 1;
    }
    return a.localeCompare(b);
  });

  for (const name of sortedNames) {
    const child = vfsNode.children[name];
    const itemPath = `${currentPath}/${name}`;
    
    const nodeWrapper = document.createElement('div');
    nodeWrapper.className = 'vfs-node';

    const itemElement = document.createElement('div');
    itemElement.className = 'vfs-item';
    itemElement.dataset.path = itemPath;
    itemElement.dataset.type = child.type;

    // Custom icons
    let iconSvg = '';
    if (child.type === 'directory') {
      iconSvg = `
        <svg class="vfs-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      `;
    } else {
      // Check file extensions for code vs json vs markup
      const ext = name.split('.').pop();
      let colorClass = 'text-accent';
      if (ext === 'json') colorClass = 'state-thinking';
      if (ext === 'css') colorClass = 'state-executing';

      iconSvg = `
        <svg class="vfs-icon ${colorClass}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      `;
    }

    itemElement.innerHTML = `
      ${iconSvg}
      <span class="vfs-name">${name}</span>
    `;

    nodeWrapper.appendChild(itemElement);

    if (child.type === 'directory') {
      // Create nested container
      const contentsContainer = document.createElement('div');
      contentsContainer.className = 'vfs-folder-contents';
      
      // Auto expand folders
      renderVfsTree(child, contentsContainer, onFileClick, itemPath);
      nodeWrapper.appendChild(contentsContainer);
    } else {
      // Hook click events on files to view content diffs
      itemElement.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Highlight in sidebar
        document.querySelectorAll('.vfs-item').forEach(el => el.classList.remove('active'));
        itemElement.classList.add('active');

        if (onFileClick) {
          onFileClick(itemPath, child.content);
        }
      });
    }

    listContainer.appendChild(nodeWrapper);
  }

  parentElement.appendChild(listContainer);
}

// Compile VFS schema as simple ascii visual representation (ls -R / tree)
export function compileAsciiTree(vfsNode, indent = '') {
  let output = '';
  const keys = Object.keys(vfsNode.children || {}).sort();

  keys.forEach((key, index) => {
    const isLast = index === keys.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    const child = vfsNode.children[key];

    output += `${indent}${branch}${key}${child.type === 'directory' ? '/' : ''}\n`;
    
    if (child.type === 'directory') {
      const nextIndent = indent + (isLast ? '    ' : '│   ');
      output += compileAsciiTree(child, nextIndent);
    }
  });

  return output;
}
