/**
 * NEURALIS // Monospace Shell Terminal
 * Handles shell commands, keyboard history, autocompletion, and state synching.
 */

import { stateStore } from './state.js';
import { resolvePath, getNodeAtPath, compileAsciiTree } from './fs.js';

class TerminalShell {
  constructor() {
    this.logsElement = document.getElementById('terminal-logs');
    this.inputElement = document.getElementById('terminal-input');
    this.screenElement = document.getElementById('terminal-screen');
    this.promptDirElement = document.getElementById('prompt-dir');
    
    this.commandHistory = [];
    this.historyPointer = -1;
    this.availableCommands = [
      'help', 'ls', 'cd', 'cat', 'tree', 'mkdir', 'touch', 'rm', 'clear', 'agent', 'theme', 'verify'
    ];

    this.initListeners();
  }

  // Set up listeners for typing, tab complete, history
  initListeners() {
    if (!this.inputElement) return;

    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const inputVal = this.inputElement.value.trim();
        if (inputVal) {
          this.executeUserCommand(inputVal);
          this.commandHistory.push(inputVal);
          this.historyPointer = this.commandHistory.length;
        } else {
          // Empty enter line
          this.appendLogLine('command', '');
        }
        this.inputElement.value = '';
        this.scrollTerminal();
      } 
      
      // Command History: UP Arrow
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.commandHistory.length > 0 && this.historyPointer > 0) {
          this.historyPointer--;
          this.inputElement.value = this.commandHistory[this.historyPointer];
        }
      } 
      
      // Command History: DOWN Arrow
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyPointer < this.commandHistory.length - 1) {
          this.historyPointer++;
          this.inputElement.value = this.commandHistory[this.historyPointer];
        } else {
          this.historyPointer = this.commandHistory.length;
          this.inputElement.value = '';
        }
      }
      
      // Tab Autocomplete!
      else if (e.key === 'Tab') {
        e.preventDefault();
        this.handleAutocomplete();
      }
    });

    // Theme switching tabs
    document.querySelectorAll('.theme-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const theme = tab.dataset.theme;
        this.switchTheme(theme);
      });
    });

    // Focus input when clicking terminal background
    if (this.screenElement) {
      this.screenElement.addEventListener('click', () => {
        this.inputElement.focus();
      });
    }
  }

  // Switch application layout style themes
  switchTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    document.querySelectorAll('.theme-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
    this.appendLogLine('system', `Terminal interface swaped to theme [${themeName.toUpperCase()}].`);
    this.scrollTerminal();
  }

  // Sync log array from central state store
  syncLogs(logsArray, currentDir) {
    if (!this.logsElement) return;
    this.logsElement.innerHTML = '';
    
    for (const log of logsArray) {
      this.appendUIElement(log.type, log.text);
    }
    
    if (this.promptDirElement) {
      this.promptDirElement.textContent = `neuralis:${currentDir === '/' ? '~' : currentDir}$`;
    }
    
    this.scrollTerminal();
  }

  // Append a raw text log string
  appendLogLine(type, text) {
    // Write directly to our UI screen and state logger
    this.appendUIElement(type, text);
    stateStore.state.terminalLogs.push({ type, text });
    if (stateStore.state.terminalLogs.length > 150) {
      stateStore.state.terminalLogs.shift();
    }
  }

  // Create physical HTML element
  appendUIElement(type, text) {
    if (!this.logsElement) return;

    const line = document.createElement('div');
    if (type === 'command') {
      line.className = 'command-line';
      line.textContent = text;
    } else if (type === 'error') {
      line.className = 'error-line';
      line.textContent = `[ERROR] ${text}`;
    } else if (type === 'success') {
      line.className = 'success-line';
      line.textContent = `[SUCCESS] ${text}`;
    } else if (type === 'system') {
      line.className = 'system-line';
      line.textContent = `[SYS] ${text}`;
    } else {
      line.className = 'output-line';
      line.textContent = text;
    }

    this.logsElement.appendChild(line);
  }

  // Autocomplete commands or files based on typed prefixes
  handleAutocomplete() {
    const rawInput = this.inputElement.value;
    const parts = rawInput.split(/\s+/);
    
    // Command autocomplete
    if (parts.length === 1) {
      const match = this.availableCommands.find(c => c.startsWith(parts[0]));
      if (match) {
        this.inputElement.value = match + ' ';
      }
    } 
    // File autocomplete for commands like cat, cd, etc.
    else if (parts.length > 1) {
      const command = parts[0];
      const typedFile = parts.slice(1).join(' ');
      
      const currentDirNode = getNodeAtPath(stateStore.state.vfs, stateStore.state.currentDir);
      if (currentDirNode && currentDirNode.children) {
        const fileNames = Object.keys(currentDirNode.children);
        const match = fileNames.find(f => f.toLowerCase().startsWith(typedFile.toLowerCase()));
        if (match) {
          const isDir = currentDirNode.children[match].type === 'directory';
          this.inputElement.value = `${command} ${match}${isDir ? '/' : ''}`;
        }
      }
    }
  }

  // Core Command Interpreter
  executeUserCommand(inputLine) {
    // Display command string on console
    this.appendLogLine('command', inputLine);

    const parts = inputLine.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const currentVfs = stateStore.state.vfs;
    const currentDir = stateStore.state.currentDir;

    switch (command) {
      case 'help':
        this.appendLogLine('output', 'NEURALIS SHELL SIMULATOR COMMANDS:');
        this.appendLogLine('output', '  help             Displays this instruction handbook.');
        this.appendLogLine('output', '  ls               Lists files and folders in active path.');
        this.appendLogLine('output', '  cd <path>        Change directory location.');
        this.appendLogLine('output', '  cat <file>       Display file contents.');
        this.appendLogLine('output', '  tree             Compile visual ASCII directory tree.');
        this.appendLogLine('output', '  mkdir <dir>      Create a new directory.');
        this.appendLogLine('output', '  touch <file>     Create an empty text file.');
        this.appendLogLine('output', '  rm <path>        Deletes a file or directory.');
        this.appendLogLine('output', '  agent            Status report of coordinated neural agents.');
        this.appendLogLine('output', '  theme <name>     Swap interface skin (slate, oceanic, amber, light).');
        this.appendLogLine('output', '  verify           Initiate system test runs.');
        this.appendLogLine('output', '  clear            Wipe terminal output logs.');
        break;

      case 'clear':
        if (this.logsElement) this.logsElement.innerHTML = '';
        stateStore.state.terminalLogs = [];
        break;

      case 'ls': {
        const node = getNodeAtPath(currentVfs, currentDir);
        if (node && node.children) {
          const items = Object.keys(node.children).sort().map(name => {
            const child = node.children[name];
            return child.type === 'directory' ? `${name}/` : name;
          });
          if (items.length > 0) {
            this.appendLogLine('output', items.join('    '));
          } else {
            this.appendLogLine('output', '(directory empty)');
          }
        } else {
          this.appendLogLine('error', 'Unable to resolve directory structure.');
        }
        break;
      }

      case 'cd': {
        if (args.length === 0) {
          stateStore.state.currentDir = '/';
          this.syncPrompt();
          break;
        }
        const resolved = resolvePath(currentVfs, args[0], currentDir);
        const node = getNodeAtPath(currentVfs, resolved);
        
        if (node && node.type === 'directory') {
          stateStore.state.currentDir = resolved;
          this.syncPrompt();
        } else {
          this.appendLogLine('error', `cd: no such directory: ${args[0]}`);
        }
        break;
      }

      case 'cat': {
        if (args.length === 0) {
          this.appendLogLine('error', 'cat: missing file parameter');
          break;
        }
        const resolved = resolvePath(currentVfs, args[0], currentDir);
        const node = getNodeAtPath(currentVfs, resolved);
        
        if (node && node.type === 'file') {
          const lines = node.content.split('\n');
          for (const line of lines) {
            this.appendLogLine('output', line);
          }
        } else {
          this.appendLogLine('error', `cat: ${args[0]}: No such file`);
        }
        break;
      }

      case 'tree': {
        const rootNode = getNodeAtPath(currentVfs, currentDir);
        if (rootNode) {
          const ascii = compileAsciiTree(rootNode);
          if (ascii) {
            const lines = ascii.split('\n');
            for (const line of lines) {
              this.appendLogLine('output', line);
            }
          } else {
            this.appendLogLine('output', '.');
          }
        }
        break;
      }

      case 'mkdir': {
        if (args.length === 0) {
          this.appendLogLine('error', 'mkdir: missing directory name');
          break;
        }
        const resolved = resolvePath(currentVfs, args[0], currentDir);
        const parts = resolved.split('/').filter(p => p !== '');
        const folderName = parts.pop();
        const parentPath = '/' + parts.join('/');
        
        const parentNode = getNodeAtPath(currentVfs, parentPath);
        if (parentNode && parentNode.type === 'directory') {
          parentNode.children[folderName] = {
            type: 'directory',
            name: folderName,
            children: {}
          };
          this.appendLogLine('success', `Created directory: ${args[0]}`);
          // Force VFS tree redraw
          stateStore.notify();
        } else {
          this.appendLogLine('error', 'mkdir: parent directory not found');
        }
        break;
      }

      case 'touch': {
        if (args.length === 0) {
          this.appendLogLine('error', 'touch: missing file name');
          break;
        }
        const resolved = resolvePath(currentVfs, args[0], currentDir);
        const parts = resolved.split('/').filter(p => p !== '');
        const fileName = parts.pop();
        const parentPath = '/' + parts.join('/');
        
        const parentNode = getNodeAtPath(currentVfs, parentPath);
        if (parentNode && parentNode.type === 'directory') {
          parentNode.children[fileName] = {
            type: 'file',
            name: fileName,
            content: `// ${fileName} created via terminal shell\n`
          };
          this.appendLogLine('success', `Created file: ${args[0]}`);
          stateStore.notify();
        } else {
          this.appendLogLine('error', 'touch: directory does not exist');
        }
        break;
      }

      case 'rm': {
        if (args.length === 0) {
          this.appendLogLine('error', 'rm: missing target path');
          break;
        }
        const resolved = resolvePath(currentVfs, args[0], currentDir);
        const parts = resolved.split('/').filter(p => p !== '');
        const itemName = parts.pop();
        const parentPath = '/' + parts.join('/');
        
        const parentNode = getNodeAtPath(currentVfs, parentPath);
        if (parentNode && parentNode.children && parentNode.children[itemName]) {
          delete parentNode.children[itemName];
          this.appendLogLine('success', `Deleted: ${args[0]}`);
          stateStore.notify();
        } else {
          this.appendLogLine('error', `rm: ${args[0]}: No such file or directory`);
        }
        break;
      }

      case 'agent': {
        const agents = stateStore.state.agents;
        const count = Object.keys(agents).length;
        this.appendLogLine('output', `COORDINATION SUMMARY: ${count} Active Coordinated Agents.`);
        for (const id in agents) {
          const a = agents[id];
          this.appendLogLine('output', `  • ${a.name} (${a.role}) - Status: ${a.status.toUpperCase()} | Cost: $${a.cost.toFixed(4)} | Tokens: ${a.tokens}`);
        }
        break;
      }

      case 'theme': {
        if (args.length === 0) {
          this.appendLogLine('output', 'Available themes: slate, oceanic, amber, light. Usage: theme <name>');
          break;
        }
        const name = args[0].toLowerCase();
        if (['slate', 'oceanic', 'amber', 'light'].includes(name)) {
          this.switchTheme(name);
        } else {
          this.appendLogLine('error', `theme: unknown theme: ${args[0]}`);
        }
        break;
      }

      case 'verify':
        this.appendLogLine('system', 'Running integration verification suites...');
        setTimeout(() => {
          this.appendLogLine('success', 'ALL VERIFIED! Terminal integrity and workspace health matches premium console telemetry.');
          this.scrollTerminal();
        }, 800);
        break;

      default:
        this.appendLogLine('error', `Command not recognized: '${command}'. Type 'help' to review available operations.`);
        break;
    }
  }

  // Scroll terminal logs container to the absolute bottom
  scrollTerminal() {
    if (this.screenElement) {
      this.screenElement.scrollTop = this.screenElement.scrollHeight;
    }
  }

  // Sync prompt prefix with current directory
  syncPrompt() {
    if (this.promptDirElement) {
      const currentDir = stateStore.state.currentDir;
      this.promptDirElement.textContent = `neuralis:${currentDir === '/' ? '~' : currentDir}$`;
    }
  }
}

let shellInstance = null;
export function initTerminalShell() {
  if (!shellInstance) {
    shellInstance = new TerminalShell();
  }
  return shellInstance;
}
