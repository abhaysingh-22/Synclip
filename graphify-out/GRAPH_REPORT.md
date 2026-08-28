# Graph Report - Synclip  (2026-08-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 199 nodes · 226 edges · 13 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `90c4ff8f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- expo
- dependencies
- mobile/package.json
- index.tsx
- backend/package.json
- index.js
- roomManager.js
- desktop/package.json
- include
- android
- expo-router

## God Nodes (most connected - your core abstractions)
1. `expo` - 16 edges
2. `HomeScreen()` - 8 edges
3. `getSocket()` - 5 edges
4. `start()` - 5 edges
5. `scripts` - 5 edges
6. `include` - 5 edges
7. `connectToServer()` - 4 edges
8. `emitClipboardUpdate()` - 4 edges
9. `joinRoom()` - 4 edges
10. `setServerUrl()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `HomeScreen()` --calls--> `connectToServer()`  [EXTRACTED]
  mobile/src/app/index.tsx → mobile/src/socket.ts
- `HomeScreen()` --calls--> `joinRoom()`  [EXTRACTED]
  mobile/src/app/index.tsx → mobile/src/socket.ts
- `HomeScreen()` --calls--> `setServerUrl()`  [EXTRACTED]
  mobile/src/app/index.tsx → mobile/src/socket.ts
- `loadSavedCredentials()` --calls--> `setServerUrl()`  [EXTRACTED]
  mobile/src/app/index.tsx → mobile/src/socket.ts
- `sendIfNew()` --calls--> `emitClipboardUpdate()`  [EXTRACTED]
  mobile/src/app/index.tsx → mobile/src/socket.ts

## Import Cycles
- None detected.

## Communities (13 total, 0 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.05
Nodes (39): expo, expo-camera, expo-clipboard, expo-constants, expo-font, expo-linking, expo-splash-screen, expo-status-bar (+31 more)

### Community 1 - "expo"
Cohesion: 0.08
Nodes (25): projectId, typedRoutes, expo, experiments, extra, icon, ios, name (+17 more)

### Community 2 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, cors, dotenv, express, nanoid, socket.io, socket.io-client, dotenv (+17 more)

### Community 3 - "mobile/package.json"
Cohesion: 0.12
Nodes (16): @babel/core, devDependencies, @babel/core, @types/react, typescript, main, name, private (+8 more)

### Community 4 - "index.tsx"
Cohesion: 0.25
Nodes (13): HomeScreen(), loadSavedCredentials(), sendIfNew(), startClipboardMonitor(), Status, styles, connectToServer(), emitClipboardUpdate() (+5 more)

### Community 5 - "backend/package.json"
Cohesion: 0.13
Nodes (14): author, description, devDependencies, nodemon, keywords, license, main, name (+6 more)

### Community 6 - "index.js"
Cohesion: 0.31
Nodes (7): startClipboardMonitor(), writeClipboard(), start(), generateQR(), connectToServer(), createRoom(), socket

### Community 7 - "roomManager.js"
Cohesion: 0.24
Nodes (9): createRoom(), generateRoomId(), getRoomBySocket(), joinRoom(), removeSocket(), rooms, app, io (+1 more)

### Community 8 - "desktop/package.json"
Cohesion: 0.17
Nodes (11): author, description, keywords, license, main, name, scripts, start (+3 more)

### Community 9 - "include"
Cohesion: 0.18
Nodes (10): compilerOptions, paths, strict, extends, include, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts (+2 more)

### Community 10 - "android"
Cohesion: 0.29
Nodes (7): backgroundColor, adaptiveIcon, package, permissions, android, android.permission.CAMERA, android.permission.RECORD_AUDIO

### Community 11 - "expo-router"
Cohesion: 0.40
Nodes (3): expo-router, plugins, expo-router

## Knowledge Gaps
- **95 isolated node(s):** `Status`, `expo`, `expo-camera`, `expo-clipboard`, `expo-constants` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `expo-router`, `dependencies`, `mobile/package.json`?**
  _High betweenness centrality (0.423) - this node is a cross-community bridge._
- **Why does `socket.io-client` connect `dependencies` to `dependencies`?**
  _High betweenness centrality (0.246) - this node is a cross-community bridge._
- **What connects `Status`, `expo`, `expo-camera` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `mobile/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._