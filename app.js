const GRID_SIZE = 1;
const SCALE = 10;
const CANVAS_WIDTH = 120;
const CANVAS_HEIGHT = 90;
const BASE_CANVAS_PIXEL_WIDTH = CANVAS_WIDTH * SCALE;
const BASE_CANVAS_PIXEL_HEIGHT = CANVAS_HEIGHT * SCALE;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;
const TOUCH_EDIT_WINDOW = 900;
const ROOM_SNAP_THRESHOLD = 2;
const SEGMENT_EDIT_WINDOW = 500;
const WALL_SNAP_THRESHOLD = 3;
const HISTORY_LIMIT = 80;
const METERS_TO_FEET = 3.28084;
const FIXTURE_TYPES = ["sink", "vanity", "toilet", "cabinet", "outlet", "switch"];
const FIXTURE_LABELS = {
  sink: "Sink",
  vanity: "Vanity",
  toilet: "Toilet",
  cabinet: "Cabinet",
  outlet: "Outlet",
  switch: "Switch",
};
const ROOM_COLORS = ["#db6d52", "#6c9f88", "#5d7ea3", "#d9a441", "#8e7cc3", "#a76657", "#4f8b8b"];
const ROOMPLAN_OBJECT_TO_FIXTURE = {
  sink: "sink",
  washbasin: "sink",
  toilet: "toilet",
  storage: "cabinet",
  cabinet: "cabinet",
  refrigerator: "cabinet",
  oven: "cabinet",
};

const state = {
  project: {
    projectName: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    projectAddress: "",
    estimate: {
      sqftRate: 140,
      wallRate: 20,
      doorRate: 450,
      windowRate: 325,
      contingencyPct: 10,
    },
    display: {
      wallLabels: true,
      roomAreaLabels: true,
      roomPerimeterLabels: false,
    },
  },
  floors: [],
  activeFloorId: null,
  rooms: [],
  walls: [],
  openings: [],
  fixtures: [],
  lidarScans: [],
  selectedRoomId: null,
  selectedElement: null,
  drag: null,
  drawMode: false,
  activeElementTool: null,
  drawing: null,
  canvasEditorRoomId: null,
  roomsDropdownOpen: false,
  lastRoomClick: {
    roomId: null,
    timestamp: 0,
  },
  lastSegmentClick: {
    id: null,
    kind: null,
    timestamp: 0,
  },
  roomSelectionTimer: null,
  zoom: 1,
  canvasPan: null,
  canvasEditorSegmentId: null,
  history: {
    undo: [],
    redo: [],
    restoring: false,
  },
};

const els = {
  projectForm: document.getElementById("project-form"),
  projectName: document.getElementById("project-name"),
  customerName: document.getElementById("customer-name"),
  customerPhone: document.getElementById("customer-phone"),
  customerEmail: document.getElementById("customer-email"),
  projectAddress: document.getElementById("project-address"),
  projectTitle: document.getElementById("project-title"),
  projectSubtitle: document.getElementById("project-subtitle"),
  contactName: document.getElementById("contact-name"),
  contactPhone: document.getElementById("contact-phone"),
  contactEmail: document.getElementById("contact-email"),
  activeFloorLabel: document.getElementById("active-floor-label"),
  floorSelect: document.getElementById("floor-select"),
  newFloorName: document.getElementById("new-floor-name"),
  addFloor: document.getElementById("add-floor"),
  deleteFloor: document.getElementById("delete-floor"),
  roomForm: document.getElementById("room-form"),
  drawRoom: document.getElementById("draw-room"),
  drawWall: document.getElementById("draw-wall"),
  lidarToggle: document.getElementById("lidar-toggle"),
  lidarPanel: document.getElementById("lidar-panel"),
  lidarFile: document.getElementById("lidar-file"),
  lidarMergeMode: document.getElementById("lidar-merge-mode"),
  lidarSupport: document.getElementById("lidar-support"),
  lidarSummary: document.getElementById("lidar-summary"),
  loadLidarSample: document.getElementById("load-lidar-sample"),
  drawDoor: document.getElementById("draw-door"),
  drawWindow: document.getElementById("draw-window"),
  openingsToggle: document.getElementById("openings-toggle"),
  openingsDropdown: document.getElementById("openings-dropdown"),
  fixturesToggle: document.getElementById("fixtures-toggle"),
  fixturesDropdown: document.getElementById("fixtures-dropdown"),
  drawSink: document.getElementById("draw-sink"),
  drawVanity: document.getElementById("draw-vanity"),
  drawToilet: document.getElementById("draw-toilet"),
  drawCabinet: document.getElementById("draw-cabinet"),
  drawOutlet: document.getElementById("draw-outlet"),
  drawSwitch: document.getElementById("draw-switch"),
  undoAction: document.getElementById("undo-action"),
  redoAction: document.getElementById("redo-action"),
  measureToggle: document.getElementById("measure-toggle"),
  measureDropdown: document.getElementById("measure-dropdown"),
  toggleWallLabels: document.getElementById("toggle-wall-labels"),
  toggleRoomAreaLabels: document.getElementById("toggle-room-area-labels"),
  toggleRoomPerimeterLabels: document.getElementById("toggle-room-perimeter-labels"),
  drawStatus: document.getElementById("draw-status"),
  roomType: document.getElementById("room-type"),
  roomWidth: document.getElementById("room-width"),
  roomHeight: document.getElementById("room-height"),
  roomX: document.getElementById("room-x"),
  roomY: document.getElementById("room-y"),
  roomColor: document.getElementById("room-color"),
  roomList: document.getElementById("room-list"),
  roomsToggle: document.getElementById("rooms-toggle"),
  roomsDropdown: document.getElementById("rooms-dropdown"),
  canvas: document.getElementById("planner-canvas"),
  canvasWrap: document.querySelector(".canvas-wrap"),
  zoomReadout: document.getElementById("zoom-readout"),
  zoomIn: document.getElementById("zoom-in"),
  zoomOut: document.getElementById("zoom-out"),
  zoomReset: document.getElementById("zoom-reset"),
  canvasRoomEditor: document.getElementById("canvas-room-editor"),
  canvasEditType: document.getElementById("canvas-edit-type"),
  canvasEditWidth: document.getElementById("canvas-edit-width"),
  canvasEditHeight: document.getElementById("canvas-edit-height"),
  canvasEditColor: document.getElementById("canvas-edit-color"),
  canvasDeleteRoom: document.getElementById("canvas-delete-room"),
  canvasCloseEditor: document.getElementById("canvas-close-editor"),
  canvasSegmentEditor: document.getElementById("canvas-segment-editor"),
  canvasSegmentTitle: document.getElementById("canvas-segment-title"),
  canvasSegmentCopy: document.getElementById("canvas-segment-copy"),
  canvasOpeningWidthLabel: document.getElementById("canvas-opening-width-label"),
  canvasOpeningWidth: document.getElementById("canvas-opening-width"),
  canvasDoorSwingLabel: document.getElementById("canvas-door-swing-label"),
  canvasDoorSwing: document.getElementById("canvas-door-swing"),
  canvasSaveSegment: document.getElementById("canvas-save-segment"),
  canvasDeleteSegment: document.getElementById("canvas-delete-segment"),
  canvasCloseSegmentEditor: document.getElementById("canvas-close-segment-editor"),
  actionsToggle: document.getElementById("actions-toggle"),
  actionsDropdown: document.getElementById("actions-dropdown"),
  roomTemplate: document.getElementById("room-card-template"),
  roomCount: document.getElementById("room-count"),
  totalArea: document.getElementById("total-area"),
  selectedRoomLabel: document.getElementById("selected-room-label"),
  loadSample: document.getElementById("load-sample"),
  exportClientPdf: document.getElementById("export-client-pdf"),
  exportEstimatePdf: document.getElementById("export-estimate-pdf"),
  exportPlan: document.getElementById("export-plan"),
  importPlan: document.getElementById("import-plan"),
  clearPlan: document.getElementById("clear-plan"),
  estimateForm: document.getElementById("estimate-form"),
  estimateSqftRate: document.getElementById("estimate-sqft-rate"),
  estimateWallRate: document.getElementById("estimate-wall-rate"),
  estimateDoorRate: document.getElementById("estimate-door-rate"),
  estimateWindowRate: document.getElementById("estimate-window-rate"),
  estimateContingency: document.getElementById("estimate-contingency"),
};

function createRoom(data) {
  const width = clamp(Number(data.width), 4, 60);
  const height = clamp(Number(data.height), 4, 60);
  const roomType = data.type || "Unassigned";

  return {
    id: crypto.randomUUID(),
    type: roomType,
    width,
    height,
    x: clamp(Number(data.x), 0, CANVAS_WIDTH - width),
    y: clamp(Number(data.y), 0, CANVAS_HEIGHT - height),
    color: data.color,
  };
}

function defaultDisplayPrefs() {
  return {
    wallLabels: true,
    roomAreaLabels: true,
    roomPerimeterLabels: false,
  };
}

function ensureProjectShape() {
  state.project.estimate = {
    sqftRate: Number(state.project.estimate?.sqftRate) || 140,
    wallRate: Number(state.project.estimate?.wallRate) || 20,
    doorRate: Number(state.project.estimate?.doorRate) || 450,
    windowRate: Number(state.project.estimate?.windowRate) || 325,
    contingencyPct: Number(state.project.estimate?.contingencyPct) || 10,
  };
  state.project.display = {
    ...defaultDisplayPrefs(),
    ...(state.project.display || {}),
  };
}

function snapshotProject() {
  syncActiveFloorStore();
  return JSON.stringify({
    project: state.project,
    activeFloorId: state.activeFloorId,
    floors: state.floors,
  });
}

function restoreSnapshot(serialized) {
  const parsed = JSON.parse(serialized);
  state.history.restoring = true;
  state.project = parsed.project;
  ensureProjectShape();
  state.floors = normalizeFloors(parsed.floors || []);
  state.activeFloorId = null;
  loadFloorIntoState(parsed.activeFloorId || state.floors[0]?.id);
  state.selectedRoomId = null;
  state.selectedElement = null;
  state.canvasEditorRoomId = null;
  state.canvasEditorSegmentId = null;
  state.drawing = null;
  state.drag = null;
  state.history.restoring = false;
  render();
}

function recordHistory() {
  if (state.history.restoring) {
    return;
  }
  const nextSnapshot = snapshotProject();
  const previousSnapshot = state.history.undo[state.history.undo.length - 1];
  if (nextSnapshot === previousSnapshot) {
    return;
  }
  state.history.undo.push(nextSnapshot);
  if (state.history.undo.length > HISTORY_LIMIT) {
    state.history.undo.shift();
  }
  state.history.redo = [];
  renderHistoryButtons();
}

function undo() {
  if (state.history.undo.length <= 1) {
    return;
  }
  const current = state.history.undo.pop();
  state.history.redo.push(current);
  restoreSnapshot(state.history.undo[state.history.undo.length - 1]);
  renderHistoryButtons();
}

function redo() {
  const next = state.history.redo.pop();
  if (!next) {
    return;
  }
  state.history.undo.push(next);
  restoreSnapshot(next);
  renderHistoryButtons();
}

function renderHistoryButtons() {
  if (els.undoAction) {
    els.undoAction.disabled = state.history.undo.length <= 1;
  }
  if (els.redoAction) {
    els.redoAction.disabled = state.history.redo.length === 0;
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function prefersTouchUi() {
  return window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches;
}

function createFloor(name = "") {
  const floorNumber = state.floors.length + 1;
  return {
    id: crypto.randomUUID(),
    name: name.trim() || (floorNumber === 1 ? "Main floor" : `Floor ${floorNumber}`),
    rooms: [],
    walls: [],
    openings: [],
    fixtures: [],
    lidarScans: [],
  };
}

function normalizeFloors(floors) {
  const normalized = Array.isArray(floors) && floors.length > 0 ? floors : [createFloor("Main floor")];
  return normalized.map((floor, index) => ({
    id: floor.id || crypto.randomUUID(),
    name: floor.name || (index === 0 ? "Main floor" : `Floor ${index + 1}`),
    rooms: Array.isArray(floor.rooms)
      ? floor.rooms.map((room) => {
          const width = clamp(Number(room.width), 4, 60);
          const height = clamp(Number(room.height), 4, 60);
          return {
            id: room.id || crypto.randomUUID(),
            type: room.type || "Unassigned",
            width,
            height,
            x: clamp(Number(room.x), 0, CANVAS_WIDTH - width),
            y: clamp(Number(room.y), 0, CANVAS_HEIGHT - height),
            color: room.color || "#db6d52",
          };
        })
      : [],
    walls: Array.isArray(floor.walls)
      ? floor.walls.map((wall) => createSegment(wall.x1, wall.y1, wall.x2, wall.y2, "wall", wall.id))
      : [],
    openings: Array.isArray(floor.openings)
      ? floor.openings.map((opening) =>
          createSegment(opening.x1, opening.y1, opening.x2, opening.y2, opening.kind || "door", opening.id, {
            wallId: opening.wallId,
            t: Number(opening.t),
            width: Number(opening.width) || undefined,
            swing: opening.swing || "in",
          })
        )
      : [],
    fixtures: Array.isArray(floor.fixtures)
      ? floor.fixtures.map((fixture) =>
          createFixture({ id: fixture.id, kind: fixture.kind || "sink", x: fixture.x, y: fixture.y })
        )
      : [],
    lidarScans: Array.isArray(floor.lidarScans)
      ? floor.lidarScans.map((scan) => ({
          id: scan.id || crypto.randomUUID(),
          name: scan.name || "LiDAR scan",
          platform: scan.platform || "Unknown",
          importedAt: scan.importedAt || new Date().toISOString(),
          pointCount: Number(scan.pointCount) || 0,
          roomCount: Number(scan.roomCount) || 0,
          wallCount: Number(scan.wallCount) || 0,
          openingCount: Number(scan.openingCount) || 0,
          fixtureCount: Number(scan.fixtureCount) || 0,
          confidence: scan.confidence || "Imported",
          sourceType: scan.sourceType || "scan",
        }))
      : [],
  }));
}

function activeFloor() {
  return state.floors.find((floor) => floor.id === state.activeFloorId) ?? null;
}

function syncActiveFloorStore() {
  const floor = activeFloor();
  if (!floor) {
    return;
  }
  floor.rooms = state.rooms.map((room) => ({ ...room }));
  floor.walls = state.walls.map((wall) => ({ ...wall }));
  floor.openings = state.openings.map((opening) => ({ ...opening }));
  floor.fixtures = state.fixtures.map((fixture) => ({ ...fixture }));
  floor.lidarScans = state.lidarScans.map((scan) => ({ ...scan }));
}

function loadFloorIntoState(floorId) {
  syncActiveFloorStore();
  const floor = state.floors.find((entry) => entry.id === floorId);
  if (!floor) {
    return;
  }

  state.activeFloorId = floor.id;
  state.rooms = floor.rooms.map((room) => ({ ...room }));
  state.walls = floor.walls.map((wall) => ({ ...wall }));
  state.openings = floor.openings.map((opening) => ({ ...opening }));
  state.fixtures = floor.fixtures.map((fixture) => ({ ...fixture }));
  state.lidarScans = (floor.lidarScans || []).map((scan) => ({ ...scan }));
  state.selectedRoomId = null;
  state.selectedElement = null;
  state.canvasEditorRoomId = null;
  state.canvasEditorSegmentId = null;
}

function snap(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function roomArea(room) {
  return room.width * room.height;
}

function wallLength(segment) {
  return Math.round(Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1));
}

function roomPerimeter(room) {
  return (room.width + room.height) * 2;
}

function segmentLength(segment) {
  return Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1) || 1;
}

function pointOnSegment(segment, t) {
  return {
    x: segment.x1 + (segment.x2 - segment.x1) * t,
    y: segment.y1 + (segment.y2 - segment.y1) * t,
  };
}

function projectPointToSegment(point, segment) {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const lenSq = dx * dx + dy * dy || 1;
  const rawT = ((point.x - segment.x1) * dx + (point.y - segment.y1) * dy) / lenSq;
  const t = clamp(rawT, 0, 1);
  const projected = pointOnSegment(segment, t);
  const distance = Math.hypot(point.x - projected.x, point.y - projected.y);
  return { ...projected, t, distance };
}

function nearestWall(point) {
  if (state.walls.length === 0) {
    return null;
  }
  return state.walls
    .map((wall) => ({ wall, projection: projectPointToSegment(point, wall) }))
    .sort((a, b) => a.projection.distance - b.projection.distance)[0];
}

function openingSegmentFromWall(wall, t, width, kind, id = crypto.randomUUID(), swing = "in") {
  const length = segmentLength(wall);
  const halfT = clamp(width / length / 2, 0, 0.5);
  const startT = clamp(t - halfT, 0, 1);
  const endT = clamp(t + halfT, 0, 1);
  const start = pointOnSegment(wall, startT);
  const end = pointOnSegment(wall, endT);
  return createSegment(start.x, start.y, end.x, end.y, kind, id, {
    wallId: wall.id,
    t: clamp(t, 0, 1),
    width,
    swing,
  });
}

function snapOpeningToWall(segment, force = false) {
  const midpoint = {
    x: (segment.x1 + segment.x2) / 2,
    y: (segment.y1 + segment.y2) / 2,
  };
  const attachedWall = segment.wallId
    ? state.walls.find((wall) => wall.id === segment.wallId)
    : null;
  const wallMatch = attachedWall
    ? { wall: attachedWall, projection: projectPointToSegment(midpoint, attachedWall) }
    : nearestWall(midpoint);

  if (!wallMatch || (!force && wallMatch.projection.distance > WALL_SNAP_THRESHOLD)) {
    return segment;
  }

  const width = clamp(Number(segment.width) || wallLength(segment) || 3, 1, 20);
  return openingSegmentFromWall(
    wallMatch.wall,
    wallMatch.projection.t,
    width,
    segment.kind,
    segment.id,
    segment.swing || "in"
  );
}

function countFixtures(kind, floorLike = state) {
  return floorLike.fixtures.filter((fixture) => fixture.kind === kind).length;
}

function totalAreaForRooms(rooms) {
  return rooms.reduce((sum, room) => sum + roomArea(room), 0);
}

function totalWallLength(walls) {
  return walls.reduce((sum, wall) => sum + wallLength(wall), 0);
}

function openingsCount(kind) {
  return state.openings.filter((opening) => opening.kind === kind).length;
}

function projectEstimateSettings() {
  return state.project.estimate;
}

function estimateForFloor(floor) {
  const settings = projectEstimateSettings();
  const area = totalAreaForRooms(floor.rooms);
  const wallLinearFeet = totalWallLength(floor.walls);
  const doorCount = floor.openings.filter((opening) => opening.kind === "door").length;
  const windowCount = floor.openings.filter((opening) => opening.kind === "window").length;
  const areaCost = area * settings.sqftRate;
  const wallCost = wallLinearFeet * settings.wallRate;
  const doorCost = doorCount * settings.doorRate;
  const windowCost = windowCount * settings.windowRate;
  const subtotal = areaCost + wallCost + doorCost + windowCost;
  const contingency = subtotal * (settings.contingencyPct / 100);
  const total = subtotal + contingency;

  return {
    area,
    wallLinearFeet,
    doorCount,
    windowCount,
    areaCost,
    wallCost,
    doorCost,
    windowCost,
    subtotal,
    contingency,
    total,
  };
}

function snapRoomToNeighbors(room, movingRoomId = null) {
  const neighbors = state.rooms.filter((entry) => entry.id !== movingRoomId);
  if (neighbors.length === 0) {
    return room;
  }

  let snappedX = room.x;
  let snappedY = room.y;
  const roomRight = room.x + room.width;
  const roomBottom = room.y + room.height;

  neighbors.forEach((neighbor) => {
    const neighborLeft = neighbor.x;
    const neighborRight = neighbor.x + neighbor.width;
    const neighborTop = neighbor.y;
    const neighborBottom = neighbor.y + neighbor.height;

    const xCandidates = [
      { delta: Math.abs(room.x - neighborLeft), value: neighborLeft },
      { delta: Math.abs(room.x - neighborRight), value: neighborRight },
      { delta: Math.abs(roomRight - neighborLeft), value: neighborLeft - room.width },
      { delta: Math.abs(roomRight - neighborRight), value: neighborRight - room.width },
    ];
    const yCandidates = [
      { delta: Math.abs(room.y - neighborTop), value: neighborTop },
      { delta: Math.abs(room.y - neighborBottom), value: neighborBottom },
      { delta: Math.abs(roomBottom - neighborTop), value: neighborTop - room.height },
      { delta: Math.abs(roomBottom - neighborBottom), value: neighborBottom - room.height },
    ];

    xCandidates.forEach((candidate) => {
      if (candidate.delta <= ROOM_SNAP_THRESHOLD) {
        snappedX = candidate.value;
      }
    });
    yCandidates.forEach((candidate) => {
      if (candidate.delta <= ROOM_SNAP_THRESHOLD) {
        snappedY = candidate.value;
      }
    });
  });

  room.x = clamp(snappedX, 0, CANVAS_WIDTH - room.width);
  room.y = clamp(snappedY, 0, CANVAS_HEIGHT - room.height);
  return room;
}

function labelMetrics(room) {
  const minSide = Math.min(room.width, room.height);
  const area = roomArea(room);
  const nameSize = clamp(Math.round(Math.min(minSide * 1.35, Math.sqrt(area) * 2.4)), 11, 26);
  const detailSize = clamp(Math.round(nameSize * 0.62), 9, 16);
  const centerX = (room.width * SCALE) / 2;
  const centerY = (room.height * SCALE) / 2;
  const detailOffset = clamp(Math.round(detailSize * 1.45), 12, 24);

  return {
    nameSize,
    detailSize,
    centerX,
    centerY,
    detailOffset,
  };
}

function selectedRoom() {
  return state.rooms.find((room) => room.id === state.selectedRoomId) ?? null;
}

function render() {
  syncActiveFloorStore();
  renderProjectDetails();
  renderFloorControls();
  renderEstimateForm();
  renderDisplayPrefs();
  renderLidarPanel();
  renderDrawStatus();
  renderHistoryButtons();
  renderCanvasZoom();
  renderCanvas();
  renderCanvasRoomEditor();
  renderCanvasSegmentEditor();
  renderRoomsDropdown();
  renderRoomList();
  renderStats();
}

function renderCanvasZoom() {
  const zoomPercent = Math.round(state.zoom * 100);
  els.canvas.style.width = `${BASE_CANVAS_PIXEL_WIDTH * state.zoom}px`;
  els.canvas.style.height = `${BASE_CANVAS_PIXEL_HEIGHT * state.zoom}px`;
  els.zoomReadout.textContent = `${zoomPercent}%`;
  els.zoomOut.disabled = state.zoom <= MIN_ZOOM;
  els.zoomIn.disabled = state.zoom >= MAX_ZOOM;
}

function renderDrawStatus() {
  const activeTool = currentTool();
  els.drawRoom.textContent = state.drawMode ? "Cancel room" : "Draw room";
  els.drawRoom.className = state.drawMode ? "primary-button" : "secondary-button";
  if (els.drawWall) {
    els.drawWall.className = state.activeElementTool === "wall" ? "primary-button" : "ghost-button";
  }
  syncToolMenuStates();

  if (activeTool === "room") {
    els.drawStatus.textContent = "Room tool on. Click and drag on the canvas to lay out rooms.";
  } else if (activeTool === "wall") {
    els.drawStatus.textContent = "Wall tool on. Click and drag to place a wall segment.";
  } else if (activeTool === "door") {
    els.drawStatus.textContent = "Door tool on. Click and drag to place a door opening.";
  } else if (activeTool === "window") {
    els.drawStatus.textContent = "Window tool on. Click and drag to place a window opening.";
  } else if (FIXTURE_TYPES.includes(activeTool)) {
    els.drawStatus.textContent = `${FIXTURE_LABELS[activeTool]} tool on. Tap or click on the canvas to place it.`;
  } else {
    els.drawStatus.textContent = prefersTouchUi()
      ? "Draw mode off. Tap a room to select it, then tap again to edit."
      : "Draw mode off. Use the tools above the canvas.";
  }

  els.drawStatus.classList.toggle("active", Boolean(activeTool));
  els.canvas.style.cursor = activeTool ? "var(--black-crosshair-cursor)" : "";
}

function syncToolMenuStates() {
  const openingsActive = state.activeElementTool === "door" || state.activeElementTool === "window";
  const fixturesActive = FIXTURE_TYPES.includes(state.activeElementTool);

  if (els.drawDoor) {
    els.drawDoor.className = state.activeElementTool === "door" ? "menu-item is-active" : "menu-item";
  }
  if (els.drawWindow) {
    els.drawWindow.className = state.activeElementTool === "window" ? "menu-item is-active" : "menu-item";
  }

  [
    ["sink", els.drawSink],
    ["vanity", els.drawVanity],
    ["toilet", els.drawToilet],
    ["cabinet", els.drawCabinet],
    ["outlet", els.drawOutlet],
    ["switch", els.drawSwitch],
  ].forEach(([kind, button]) => {
    if (button) {
      button.className = state.activeElementTool === kind ? "menu-item is-active" : "menu-item";
    }
  });

  if (els.openingsToggle) {
    els.openingsToggle.className = openingsActive ? "primary-button" : "ghost-button";
  }
  if (els.fixturesToggle) {
    els.fixturesToggle.className = fixturesActive ? "primary-button" : "ghost-button";
  }
}

function renderProjectDetails() {
  const projectName = state.project.projectName.trim() || "Untitled job";
  const customerName = state.project.customerName.trim() || "Not set";
  const customerPhone = state.project.customerPhone.trim() || "Not set";
  const customerEmail = state.project.customerEmail.trim() || "Not set";
  const projectAddress = state.project.projectAddress.trim();

  els.projectTitle.textContent = projectName;
  els.projectSubtitle.textContent = projectAddress
    ? projectAddress
    : "Add customer details to personalize this plan.";
  els.contactName.textContent = customerName;
  els.contactPhone.textContent = customerPhone;
  els.contactEmail.textContent = customerEmail;
  els.activeFloorLabel.textContent = activeFloor()?.name || "Main floor";

  els.projectName.value = state.project.projectName;
  els.customerName.value = state.project.customerName;
  els.customerPhone.value = state.project.customerPhone;
  els.customerEmail.value = state.project.customerEmail;
  els.projectAddress.value = state.project.projectAddress;
}

function renderFloorControls() {
  const selectedFloorId = state.activeFloorId;
  els.floorSelect.innerHTML = "";
  state.floors.forEach((floor) => {
    const option = document.createElement("option");
    option.value = floor.id;
    option.textContent = floor.name;
    option.selected = floor.id === selectedFloorId;
    els.floorSelect.appendChild(option);
  });
  els.deleteFloor.disabled = state.floors.length <= 1;
}

function renderEstimateForm() {
  const settings = projectEstimateSettings();
  els.estimateSqftRate.value = String(settings.sqftRate);
  els.estimateWallRate.value = String(settings.wallRate);
  els.estimateDoorRate.value = String(settings.doorRate);
  els.estimateWindowRate.value = String(settings.windowRate);
  els.estimateContingency.value = String(settings.contingencyPct);
}

function renderDisplayPrefs() {
  const display = state.project.display || defaultDisplayPrefs();
  if (els.toggleWallLabels) {
    els.toggleWallLabels.checked = Boolean(display.wallLabels);
  }
  if (els.toggleRoomAreaLabels) {
    els.toggleRoomAreaLabels.checked = Boolean(display.roomAreaLabels);
  }
  if (els.toggleRoomPerimeterLabels) {
    els.toggleRoomPerimeterLabels.checked = Boolean(display.roomPerimeterLabels);
  }
}

function renderLidarPanel() {
  if (!els.lidarPanel) {
    return;
  }

  const isOpen = !els.lidarPanel.hidden;
  els.lidarToggle?.setAttribute("aria-expanded", String(isOpen));
  if (els.lidarToggle) {
    els.lidarToggle.className = isOpen ? "primary-button" : "ghost-button";
  }

  if (els.lidarSupport) {
    const hasXr = Boolean(navigator.xr);
    const touchCopy = prefersTouchUi() ? " This device is touch-ready for field review." : "";
    els.lidarSupport.textContent = hasXr
      ? `WebXR is available here. Import ARCore/WebXR JSON or CSV point clouds to build the measured plan.${touchCopy}`
      : `Works on iPhone, iPad, and Android by importing RoomPlan, ARCore/WebXR, or CSV scan exports. Safari does not expose raw LiDAR scans directly to websites.${touchCopy}`;
  }

  if (!els.lidarSummary) {
    return;
  }

  if (state.lidarScans.length === 0) {
    els.lidarSummary.textContent = "No scan imported for this floor yet.";
    return;
  }

  const latest = state.lidarScans[state.lidarScans.length - 1];
  els.lidarSummary.innerHTML = "";
  [
    latest.platform,
    `${latest.roomCount} rooms`,
    `${latest.wallCount} walls`,
    `${latest.openingCount} openings`,
    `${latest.fixtureCount} fixtures`,
    latest.confidence,
  ].forEach((text) => {
    const chip = document.createElement("span");
    chip.textContent = text;
    els.lidarSummary.appendChild(chip);
  });
}

function renderCanvas() {
  els.canvas.innerHTML = "";

  state.rooms.forEach((room) => {
    const group = createRoomSvg(room);
    if (room.id === state.selectedRoomId) {
      group.classList.add("selected");
    }
    if (state.drag?.roomId === room.id) {
      group.classList.add("dragging");
    }
    group.dataset.roomId = room.id;
    group.addEventListener("pointerdown", beginDrag);

    els.canvas.appendChild(group);
  });

  state.walls.forEach((wall) => {
    const group = createSegmentSvg(wall, "wall");
    group.addEventListener("pointerdown", (event) => {
      handleElementSelection(event, "walls", "wall", wall.id);
    });
    els.canvas.appendChild(group);
  });

  state.openings.forEach((opening) => {
    const group = createSegmentSvg(opening, opening.kind);
    group.dataset.openingId = opening.id;
    group.addEventListener("pointerdown", (event) => {
      beginOpeningDrag(event);
    });
    els.canvas.appendChild(group);
  });

  const fixtureLabelPositions = fixtureLabelPositionMap(state.fixtures);
  state.fixtures.forEach((fixture) => {
    const group = createFixtureSvg(fixture, "", fixtureLabelPositions.get(fixture.id));
    group.dataset.fixtureId = fixture.id;
    group.addEventListener("pointerdown", beginFixtureDrag);
    els.canvas.appendChild(group);
  });

  if (state.drawing) {
    let preview = null;
    if (state.drawing.kind === "room") {
      preview = createRoomSvg(state.drawing.room, "drawing-preview");
    } else if (state.drawing.segment) {
      preview = createSegmentSvg(state.drawing.segment, state.drawing.kind, "drawing-preview");
    } else if (state.drawing.fixture) {
      preview = createFixtureSvg(state.drawing.fixture, "drawing-preview");
    }
    if (preview) {
      els.canvas.appendChild(preview);
    }
  }
}

function renderCanvasRoomEditor() {
  const room = selectedRoom();
  const activeRoom = room && room.id === state.canvasEditorRoomId ? room : null;

  els.canvasRoomEditor.hidden = !activeRoom;
  if (!activeRoom) {
    return;
  }

  els.canvasEditType.value = activeRoom.type || "Unassigned";
  els.canvasEditWidth.value = String(activeRoom.width);
  els.canvasEditHeight.value = String(activeRoom.height);
  els.canvasEditColor.value = activeRoom.color;
}

function selectedCanvasItem() {
  if (!state.selectedElement) {
    return null;
  }

  if (state.selectedElement.collection === "walls") {
    return state.walls.find((wall) => wall.id === state.selectedElement.id) ?? null;
  }

  if (state.selectedElement.collection === "fixtures") {
    return state.fixtures.find((fixture) => fixture.id === state.selectedElement.id) ?? null;
  }

  return state.openings.find((opening) => opening.id === state.selectedElement.id) ?? null;
}

function renderCanvasSegmentEditor() {
  const item = selectedCanvasItem();
  const activeSegment = item && state.canvasEditorSegmentId === item.id ? state.selectedElement : null;

  els.canvasSegmentEditor.hidden = !activeSegment;
  if (!activeSegment) {
    return;
  }

  const kindLabel = activeSegment.kind.charAt(0).toUpperCase() + activeSegment.kind.slice(1);
  els.canvasSegmentTitle.textContent = kindLabel;
  els.canvasSegmentCopy.textContent =
    activeSegment.kind === "door" || activeSegment.kind === "window"
      ? `Adjust this ${activeSegment.kind} or delete it from the floor plan.`
      : `Delete this ${activeSegment.kind} from the floor plan.`;

  const isOpening = activeSegment.kind === "door" || activeSegment.kind === "window";
  els.canvasOpeningWidthLabel.hidden = !isOpening;
  els.canvasSaveSegment.hidden = !isOpening;
  if (isOpening) {
    els.canvasOpeningWidth.value = String(Math.round(item.width || wallLength(item) || 3));
  }
  const isDoor = activeSegment.kind === "door";
  els.canvasDoorSwingLabel.hidden = !isDoor;
  if (isDoor) {
    els.canvasDoorSwing.value = item.swing || "in";
  }
}

function createRoomSvg(room, extraClass = "") {
  const metrics = labelMetrics(room);
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.classList.add("room-node");
  if (extraClass) {
    group.classList.add(extraClass);
  }
  group.setAttribute("transform", `translate(${room.x * SCALE}, ${room.y * SCALE})`);

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", room.width * SCALE);
  rect.setAttribute("height", room.height * SCALE);
  rect.setAttribute("fill", `${room.color}CC`);

  const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  nameText.setAttribute("x", metrics.centerX);
  nameText.setAttribute("y", metrics.centerY - metrics.detailOffset);
  nameText.setAttribute("class", "room-name");
  nameText.style.fontSize = `${readableLabelSize(metrics.nameSize)}px`;
  nameText.setAttribute("text-anchor", "middle");
  nameText.textContent = room.type;

  group.append(rect, nameText);

  const detailLines = [`${room.width}' x ${room.height}'`];
  if (state.project.display?.roomAreaLabels) {
    detailLines.push(`${roomArea(room)} sq ft`);
  }
  if (state.project.display?.roomPerimeterLabels) {
    detailLines.push(`${roomPerimeter(room)} lf perimeter`);
  }

  detailLines.forEach((line, index) => {
    const sizeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    sizeText.setAttribute("x", metrics.centerX);
    sizeText.setAttribute("y", metrics.centerY + index * metrics.detailOffset);
    sizeText.setAttribute("class", "room-size");
    sizeText.style.fontSize = `${readableLabelSize(metrics.detailSize)}px`;
    sizeText.setAttribute("text-anchor", "middle");
    sizeText.textContent = line;
    group.appendChild(sizeText);
  });
  return group;
}

function createSegmentSvg(segment, kind, extraClass = "") {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.classList.add("segment-node");
  if (extraClass) {
    group.classList.add(extraClass);
  }
  if (state.selectedElement?.id === segment.id) {
    group.classList.add("selected");
  }

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(segment.x1 * SCALE));
  line.setAttribute("y1", String(segment.y1 * SCALE));
  line.setAttribute("x2", String(segment.x2 * SCALE));
  line.setAttribute("y2", String(segment.y2 * SCALE));
  line.setAttribute("class", `${kind}-line`);

  group.appendChild(line);

  if (kind === "door") {
    const swingArc = createDoorSwingSvg(segment);
    if (swingArc) {
      group.appendChild(swingArc);
    }
  }

  const shouldShowLabel = kind !== "wall" || state.project.display?.wallLabels;
  if (shouldShowLabel) {
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const labelPosition = segmentLabelPosition(segment, kind);
    label.setAttribute("x", String(labelPosition.x));
    label.setAttribute("y", String(labelPosition.y));
    label.setAttribute("class", "segment-label");
    label.style.fontSize = `${readableLabelSize(11)}px`;
    label.textContent = kind === "wall" ? `${wallLength(segment)}'` : kind.charAt(0).toUpperCase() + kind.slice(1);
    group.appendChild(label);
  }

  return group;
}

function createDoorSwingSvg(segment) {
  const width = wallLength(segment);
  if (width <= 0) {
    return null;
  }
  const startX = segment.x1 * SCALE;
  const startY = segment.y1 * SCALE;
  const endX = segment.x2 * SCALE;
  const endY = segment.y2 * SCALE;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.hypot(dx, dy) || 1;
  const radius = width * SCALE;
  const normalSign = segment.swing === "out" ? -1 : 1;
  const normalX = (-dy / length) * radius * normalSign;
  const normalY = (dx / length) * radius * normalSign;
  const arcEndX = startX + normalX;
  const arcEndY = startY + normalY;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", `M ${startX} ${startY} L ${endX} ${endY} M ${endX} ${endY} A ${radius} ${radius} 0 0 ${normalSign > 0 ? 1 : 0} ${arcEndX} ${arcEndY}`);
  path.setAttribute("class", "door-swing");
  return path;
}

function readableLabelSize(baseSize) {
  return String(clamp(baseSize / state.zoom, 7, 14));
}

function createFixture(data) {
  return {
    id: data.id || crypto.randomUUID(),
    kind: data.kind,
    x: clamp(snap(Number(data.x)), 0, CANVAS_WIDTH - 1),
    y: clamp(snap(Number(data.y)), 0, CANVAS_HEIGHT - 1),
  };
}

function createFixtureSvg(fixture, extraClass = "", labelPosition = { x: 0, y: 26 }) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.classList.add("fixture-node", `${fixture.kind}-fixture`);
  if (extraClass) {
    group.classList.add(extraClass);
  }
  if (state.selectedElement?.id === fixture.id) {
    group.classList.add("selected");
  }
  group.setAttribute("transform", `translate(${fixture.x * SCALE}, ${fixture.y * SCALE})`);

  const badge = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  badge.setAttribute("x", "-22");
  badge.setAttribute("y", "-14");
  badge.setAttribute("width", "44");
  badge.setAttribute("height", "28");
  badge.setAttribute("rx", "0");
  badge.setAttribute("ry", "0");
  badge.setAttribute("class", "fixture-badge");

  group.appendChild(badge);

  switch (fixture.kind) {
    case "sink":
      appendSvg(group, "rect", { x: "-10", y: "-6", width: "20", height: "12", rx: "0", ry: "0", class: "fixture-glyph" });
      appendSvg(group, "circle", { cx: "0", cy: "0", r: "2", class: "fixture-cutout" });
      break;
    case "vanity":
      appendSvg(group, "rect", { x: "-13", y: "-8", width: "26", height: "16", rx: "0", ry: "0", class: "fixture-glyph" });
      appendSvg(group, "circle", { cx: "0", cy: "-1", r: "3", class: "fixture-cutout" });
      break;
    case "toilet":
      appendSvg(group, "rect", { x: "-9", y: "-11", width: "18", height: "10", rx: "0", ry: "0", class: "fixture-glyph" });
      appendSvg(group, "ellipse", { cx: "0", cy: "5", rx: "8", ry: "7", class: "fixture-glyph" });
      appendSvg(group, "ellipse", { cx: "0", cy: "5", rx: "3.5", ry: "3", class: "fixture-cutout" });
      break;
    case "cabinet":
      appendSvg(group, "rect", { x: "-14", y: "-9", width: "28", height: "18", rx: "0", ry: "0", class: "fixture-glyph" });
      appendSvg(group, "line", { x1: "0", y1: "-9", x2: "0", y2: "9", class: "fixture-stroke" });
      break;
    case "outlet":
      appendSvg(group, "rect", { x: "-7", y: "-10", width: "14", height: "20", rx: "0", ry: "0", class: "fixture-glyph" });
      appendSvg(group, "circle", { cx: "-2", cy: "-2", r: "1.3", class: "fixture-cutout" });
      appendSvg(group, "circle", { cx: "2", cy: "-2", r: "1.3", class: "fixture-cutout" });
      appendSvg(group, "line", { x1: "-3", y1: "4", x2: "3", y2: "4", class: "fixture-cutout-line" });
      break;
    case "switch":
      appendSvg(group, "rect", { x: "-7", y: "-10", width: "14", height: "20", rx: "0", ry: "0", class: "fixture-glyph" });
      appendSvg(group, "line", { x1: "0", y1: "-4", x2: "0", y2: "5", class: "fixture-cutout-line" });
      break;
    default:
      appendSvg(group, "circle", { cx: "0", cy: "0", r: "9", class: "fixture-glyph" });
      break;
  }

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", String(labelPosition.x));
  label.setAttribute("y", String(labelPosition.y));
  label.setAttribute("class", "segment-label");
  label.style.fontSize = `${readableLabelSize(11)}px`;
  if (labelPosition.x !== 0 || labelPosition.y !== 26) {
    const leader = document.createElementNS("http://www.w3.org/2000/svg", "line");
    leader.setAttribute("x1", "0");
    leader.setAttribute("y1", "16");
    leader.setAttribute("x2", String(labelPosition.x));
    leader.setAttribute("y2", String(labelPosition.y - 10));
    leader.setAttribute("class", "fixture-label-leader");
    group.appendChild(leader);
  }
  label.textContent = FIXTURE_LABELS[fixture.kind] || fixture.kind;
  group.appendChild(label);

  return group;
}

function fixtureLabelPositionMap(fixtures) {
  const slots = [
    { x: 0, y: 26 },
    { x: 0, y: 42 },
    { x: 0, y: -24 },
    { x: 48, y: 26 },
    { x: -48, y: 26 },
    { x: 48, y: -12 },
    { x: -48, y: -12 },
    { x: 0, y: 58 },
    { x: 78, y: 26 },
    { x: -78, y: 26 },
  ];
  const placed = [];
  const positions = new Map();

  fixtures.forEach((fixture) => {
    const label = FIXTURE_LABELS[fixture.kind] || fixture.kind;
    const labelWidth = Math.max(34, label.length * 6.8);
    const labelHeight = 15;
    const originX = fixture.x * SCALE;
    const originY = fixture.y * SCALE;
    const slot = slots.find((candidate) => {
      const bounds = {
        left: originX + candidate.x - labelWidth / 2,
        right: originX + candidate.x + labelWidth / 2,
        top: originY + candidate.y - labelHeight,
        bottom: originY + candidate.y + 4,
      };
      return !placed.some((entry) => rectanglesOverlap(bounds, entry));
    }) || slots[0];

    const bounds = {
      left: originX + slot.x - labelWidth / 2,
      right: originX + slot.x + labelWidth / 2,
      top: originY + slot.y - labelHeight,
      bottom: originY + slot.y + 4,
    };
    placed.push(bounds);
    positions.set(fixture.id, slot);
  });
  return positions;
}

function rectanglesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function appendSvg(parent, tagName, attributes) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    node.setAttribute(name, value);
  });
  parent.appendChild(node);
  return node;
}

function segmentLabelPosition(segment, kind) {
  const midX = ((segment.x1 + segment.x2) / 2) * SCALE;
  const midY = ((segment.y1 + segment.y2) / 2) * SCALE;
  if (kind === "wall") {
    return { x: midX, y: midY - 8 };
  }

  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const length = Math.hypot(dx, dy) || 1;
  const offset = 16;
  return {
    x: midX + (-dy / length) * offset,
    y: midY + (dx / length) * offset,
  };
}

function renderRoomList() {
  els.roomList.innerHTML = "";

  if (state.rooms.length === 0) {
    els.roomList.className = "room-list empty-state";
    els.roomList.textContent = "No rooms yet. Add your first room to start the plan.";
    return;
  }

  els.roomList.className = "room-list";

  state.rooms.forEach((room) => {
    const fragment = els.roomTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".room-card");
    card.style.borderLeft = `10px solid ${room.color}`;
    fragment.querySelector("h3").textContent = room.type;
    fragment.querySelector(".room-card-meta").textContent =
      `${room.width}' x ${room.height}' at (${room.x}', ${room.y}') | ${roomArea(room)} sq ft`;
    fragment.querySelector("button").addEventListener("click", () => {
      handleRoomSelection(room.id);
    });
    els.roomList.appendChild(fragment);
  });
}

function handleRoomSelection(roomId, pointerType = "mouse") {
  if (currentTool()) {
    return;
  }

  const now = Date.now();
  const touchLike = pointerType !== "mouse" || prefersTouchUi();
  const editWindow = touchLike ? TOUCH_EDIT_WINDOW : 500;
  const isDoubleClick =
    state.lastRoomClick.roomId === roomId && now - state.lastRoomClick.timestamp < editWindow;

  if (isDoubleClick) {
    if (state.roomSelectionTimer) {
      clearTimeout(state.roomSelectionTimer);
      state.roomSelectionTimer = null;
    }
    state.selectedRoomId = roomId;
    openCanvasRoomEditor(roomId);
    state.canvasEditorSegmentId = null;
    state.lastRoomClick = { roomId: null, timestamp: 0 };
    return;
  }

  if (touchLike) {
    state.selectedRoomId = roomId;
    state.selectedElement = null;
    state.canvasEditorRoomId = null;
    state.canvasEditorSegmentId = null;
    state.lastRoomClick = { roomId, timestamp: now };
    render();
    return;
  }

  state.lastRoomClick = { roomId, timestamp: now };
  if (state.roomSelectionTimer) {
    clearTimeout(state.roomSelectionTimer);
  }
  state.roomSelectionTimer = setTimeout(() => {
    state.selectedRoomId = roomId;
    state.roomSelectionTimer = null;
    render();
  }, 260);
}

function renderRoomsDropdown() {
  els.roomsDropdown.hidden = !state.roomsDropdownOpen;
  els.roomsToggle.setAttribute("aria-expanded", String(state.roomsDropdownOpen));
  els.roomsToggle.textContent = state.roomsDropdownOpen ? "Hide rooms" : "Show rooms";
}

function renderStats() {
  const totalArea = state.rooms.reduce((sum, room) => sum + roomArea(room), 0);
  const activeRoom = selectedRoom();
  const activeElement = selectedElementLabel();

  els.roomCount.textContent = String(state.rooms.length);
  els.totalArea.textContent = `${totalArea} sq ft`;
  els.selectedRoomLabel.textContent = activeRoom ? activeRoom.type : activeElement || "None";
}

function updateProjectFields() {
  state.project = {
    ...state.project,
    projectName: els.projectName.value,
    customerName: els.customerName.value,
    customerPhone: els.customerPhone.value,
    customerEmail: els.customerEmail.value,
    projectAddress: els.projectAddress.value,
  };
  renderProjectDetails();
}

function updateEstimateSettings() {
  state.project.estimate = {
    sqftRate: Math.max(0, Number(els.estimateSqftRate.value) || 0),
    wallRate: Math.max(0, Number(els.estimateWallRate.value) || 0),
    doorRate: Math.max(0, Number(els.estimateDoorRate.value) || 0),
    windowRate: Math.max(0, Number(els.estimateWindowRate.value) || 0),
    contingencyPct: clamp(Number(els.estimateContingency.value) || 0, 0, 100),
  };
}

function updateDisplayPrefs() {
  state.project.display = {
    wallLabels: Boolean(els.toggleWallLabels?.checked),
    roomAreaLabels: Boolean(els.toggleRoomAreaLabels?.checked),
    roomPerimeterLabels: Boolean(els.toggleRoomPerimeterLabels?.checked),
  };
  recordHistory();
  render();
}

function addFloor() {
  syncActiveFloorStore();
  const floor = createFloor(els.newFloorName.value);
  state.floors.push(floor);
  els.newFloorName.value = "";
  loadFloorIntoState(floor.id);
  recordHistory();
  render();
}

function deleteActiveFloor() {
  if (state.floors.length <= 1) {
    return;
  }

  const currentIndex = state.floors.findIndex((floor) => floor.id === state.activeFloorId);
  if (currentIndex === -1) {
    return;
  }

  state.floors.splice(currentIndex, 1);
  const fallbackFloor = state.floors[Math.max(0, currentIndex - 1)] ?? state.floors[0];
  loadFloorIntoState(fallbackFloor.id);
  recordHistory();
  render();
}

function switchFloor(event) {
  loadFloorIntoState(event.target.value);
  render();
}

function updateCanvasSelectedRoom(event) {
  event.preventDefault();
  const room = selectedRoom();
  if (!room || room.id !== state.canvasEditorRoomId) {
    return;
  }

  room.type = els.canvasEditType.value;
  room.width = clamp(Number(els.canvasEditWidth.value), 4, 60);
  room.height = clamp(Number(els.canvasEditHeight.value), 4, 60);
  room.x = clamp(room.x, 0, CANVAS_WIDTH - room.width);
  room.y = clamp(room.y, 0, CANVAS_HEIGHT - room.height);
  snapRoomToNeighbors(room, room.id);
  room.color = els.canvasEditColor.value;
  syncRoomFormFields(room);
  closeCanvasRoomEditor();
  recordHistory();
  render();
}

function deleteSelectedRoom() {
  if (state.selectedElement) {
    if (state.selectedElement.collection === "walls") {
      state.walls = state.walls.filter((wall) => wall.id !== state.selectedElement.id);
    } else if (state.selectedElement.collection === "fixtures") {
      state.fixtures = state.fixtures.filter((fixture) => fixture.id !== state.selectedElement.id);
    } else {
      state.openings = state.openings.filter((opening) => opening.id !== state.selectedElement.id);
    }
    state.selectedElement = null;
    recordHistory();
    render();
    return;
  }

  if (!state.selectedRoomId) {
    return;
  }

  state.rooms = state.rooms.filter((room) => room.id !== state.selectedRoomId);
  state.selectedRoomId = null;
  state.canvasEditorRoomId = null;
  recordHistory();
  render();
}

function deleteCanvasSelectedRoom() {
  const room = selectedRoom();
  if (!room || room.id !== state.canvasEditorRoomId) {
    return;
  }

  state.rooms = state.rooms.filter((entry) => entry.id !== room.id);
  state.selectedRoomId = null;
  state.canvasEditorRoomId = null;
  recordHistory();
  render();
}

function deleteCanvasSelectedSegment() {
  const item = selectedCanvasItem();
  if (!item || item.id !== state.canvasEditorSegmentId || !state.selectedElement) {
    return;
  }

  if (state.selectedElement.collection === "walls") {
    state.walls = state.walls.filter((wall) => wall.id !== item.id);
  } else if (state.selectedElement.collection === "fixtures") {
    state.fixtures = state.fixtures.filter((fixture) => fixture.id !== item.id);
  } else {
    state.openings = state.openings.filter((opening) => opening.id !== item.id);
  }

  state.selectedElement = null;
  state.canvasEditorSegmentId = null;
  recordHistory();
  render();
}

function updateCanvasSelectedSegment() {
  const item = selectedCanvasItem();
  if (!item || item.id !== state.canvasEditorSegmentId || !state.selectedElement) {
    return;
  }

  if (state.selectedElement.collection === "openings") {
    item.width = clamp(Number(els.canvasOpeningWidth.value) || item.width || wallLength(item), 1, 20);
    if (item.kind === "door") {
      item.swing = els.canvasDoorSwing.value || "in";
    }
    Object.assign(item, snapOpeningToWall(item, true));
    state.canvasEditorSegmentId = null;
    recordHistory();
    render();
  }
}

function beginDrag(event) {
  if (currentTool()) {
    canvasPointerDown(event);
    return;
  }

  const roomId = event.currentTarget.dataset.roomId;
  const room = state.rooms.find((entry) => entry.id === roomId);
  if (!room) {
    return;
  }

  state.selectedRoomId = room.id;
  state.selectedElement = null;
  state.canvasEditorSegmentId = null;
  state.drag = {
    roomId,
    node: event.currentTarget,
    originX: event.clientX,
    originY: event.clientY,
    startX: room.x,
    startY: room.y,
    moved: false,
  };

  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.addEventListener("pointermove", handleDrag);
  event.currentTarget.addEventListener("pointerup", endDrag);
  event.currentTarget.addEventListener("pointercancel", endDrag);
  event.currentTarget.classList.add("dragging", "selected");
  renderStats();
}

function beginFixtureDrag(event) {
  if (currentTool()) {
    canvasPointerDown(event);
    return;
  }

  const fixtureId = event.currentTarget.dataset.fixtureId;
  const fixture = state.fixtures.find((entry) => entry.id === fixtureId);
  if (!fixture) {
    return;
  }

  state.selectedRoomId = null;
  state.canvasEditorRoomId = null;
  state.canvasEditorSegmentId = null;
  state.selectedElement = {
    id: fixture.id,
    kind: fixture.kind,
    collection: "fixtures",
  };
  state.drag = {
    type: "fixture",
    fixtureId,
    node: event.currentTarget,
    originX: event.clientX,
    originY: event.clientY,
    startX: fixture.x,
    startY: fixture.y,
    moved: false,
  };

  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.addEventListener("pointermove", handleDrag);
  event.currentTarget.addEventListener("pointerup", endDrag);
  event.currentTarget.addEventListener("pointercancel", endDrag);
  event.currentTarget.classList.add("dragging", "selected");
  renderStats();
}

function beginOpeningDrag(event) {
  if (currentTool()) {
    canvasPointerDown(event);
    return;
  }

  const openingId = event.currentTarget.dataset.openingId;
  const opening = state.openings.find((entry) => entry.id === openingId);
  if (!opening) {
    return;
  }

  state.selectedRoomId = null;
  state.canvasEditorRoomId = null;
  state.canvasEditorSegmentId = null;
  state.selectedElement = {
    id: opening.id,
    kind: opening.kind,
    collection: "openings",
  };
  state.drag = {
    type: "opening",
    openingId,
    node: event.currentTarget,
    startSnapshot: { ...opening },
    moved: false,
  };

  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.addEventListener("pointermove", handleDrag);
  event.currentTarget.addEventListener("pointerup", endDrag);
  event.currentTarget.addEventListener("pointercancel", endDrag);
  event.currentTarget.classList.add("dragging", "selected");
  renderStats();
}

function handleDrag(event) {
  if (!state.drag) {
    return;
  }

  const deltaX = (event.clientX - state.drag.originX) / SCALE;
  const deltaY = (event.clientY - state.drag.originY) / SCALE;
  const gridDeltaX = deltaX / state.zoom;
  const gridDeltaY = deltaY / state.zoom;
  if (Math.abs(deltaX) > 0.2 || Math.abs(deltaY) > 0.2) {
    state.drag.moved = true;
  }

  if (state.drag.type === "fixture") {
    const fixture = state.fixtures.find((entry) => entry.id === state.drag.fixtureId);
    if (!fixture) {
      return;
    }
    fixture.x = clamp(Math.round(state.drag.startX + gridDeltaX), 0, CANVAS_WIDTH - 1);
    fixture.y = clamp(Math.round(state.drag.startY + gridDeltaY), 0, CANVAS_HEIGHT - 1);
    state.drag.node.setAttribute("transform", `translate(${fixture.x * SCALE}, ${fixture.y * SCALE})`);
    els.selectedRoomLabel.textContent = selectedElementLabel();
    return;
  }

  if (state.drag.type === "opening") {
    const opening = state.openings.find((entry) => entry.id === state.drag.openingId);
    if (!opening) {
      return;
    }
    const point = eventToGridPoint(event);
    const wall = opening.wallId ? state.walls.find((entry) => entry.id === opening.wallId) : null;
    const match = wall
      ? { wall, projection: projectPointToSegment(point, wall) }
      : nearestWall(point);
    if (match) {
      const nextOpening = openingSegmentFromWall(
        match.wall,
        match.projection.t,
        opening.width || wallLength(opening) || 3,
        opening.kind,
        opening.id,
        opening.swing || "in"
      );
      Object.assign(opening, nextOpening);
      redrawSegmentNode(state.drag.node, opening, opening.kind);
    }
    els.selectedRoomLabel.textContent = selectedElementLabel();
    return;
  }

  const room = state.rooms.find((entry) => entry.id === state.drag.roomId);
  if (!room) {
    return;
  }
  room.x = clamp(Math.round(state.drag.startX + gridDeltaX), 0, CANVAS_WIDTH - room.width);
  room.y = clamp(Math.round(state.drag.startY + gridDeltaY), 0, CANVAS_HEIGHT - room.height);
  snapRoomToNeighbors(room, room.id);
  state.drag.node.setAttribute("transform", `translate(${room.x * SCALE}, ${room.y * SCALE})`);
  els.selectedRoomLabel.textContent = room.type;
}

function redrawSegmentNode(node, segment, kind) {
  const updated = createSegmentSvg(segment, kind);
  node.replaceChildren(...Array.from(updated.childNodes));
  node.className.baseVal = updated.className.baseVal;
  node.classList.add("dragging", "selected");
}

function endDrag(event) {
  const node = event.currentTarget;
  const room = selectedRoom();
  const dragState = state.drag;
  if (dragState?.type === "fixture") {
    const fixture = state.fixtures.find((entry) => entry.id === dragState.fixtureId);
    if (fixture) {
      fixture.x = clamp(snap(fixture.x), 0, CANVAS_WIDTH - 1);
      fixture.y = clamp(snap(fixture.y), 0, CANVAS_HEIGHT - 1);
    }
  } else if (dragState?.type === "opening") {
    const opening = state.openings.find((entry) => entry.id === dragState.openingId);
    if (opening) {
      Object.assign(opening, snapOpeningToWall(opening));
    }
  } else if (room) {
    room.x = clamp(snap(room.x), 0, CANVAS_WIDTH - room.width);
    room.y = clamp(snap(room.y), 0, CANVAS_HEIGHT - room.height);
  }

  state.drag = null;
  if (node.hasPointerCapture(event.pointerId)) {
    node.releasePointerCapture(event.pointerId);
  }
  node.classList.remove("dragging");
  node.removeEventListener("pointermove", handleDrag);
  node.removeEventListener("pointerup", endDrag);
  node.removeEventListener("pointercancel", endDrag);

  if (dragState?.type === "fixture" && !dragState.moved && !currentTool()) {
    handleElementSelection(event, "fixtures", state.selectedElement?.kind || "fixture", dragState.fixtureId);
    return;
  }

  if (dragState?.type === "opening" && !dragState.moved && !currentTool()) {
    const opening = state.openings.find((entry) => entry.id === dragState.openingId);
    handleElementSelection(event, "openings", opening?.kind || "door", dragState.openingId);
    return;
  }

  if (dragState && !dragState.moved && !currentTool()) {
    handleRoomSelection(dragState.roomId, event.pointerType);
    return;
  }

  if (dragState?.moved) {
    recordHistory();
  }
  render();
}

function toggleDrawMode(forceValue) {
  if (state.drawing) {
    cancelCanvasDrawing();
  }

  closeCanvasRoomEditor();
  closeToolMenus();
  state.activeElementTool = null;
  state.drawMode = typeof forceValue === "boolean" ? forceValue : !state.drawMode;
  state.drawing = null;
  renderDrawStatus();
  renderCanvas();
}

function setZoom(nextZoom) {
  state.zoom = clamp(Number(nextZoom), MIN_ZOOM, MAX_ZOOM);
  renderCanvasZoom();
  renderCanvas();
}

function nudgeZoom(direction) {
  setZoom(state.zoom + ZOOM_STEP * direction);
}

function beginCanvasPan(event) {
  if (!els.canvasWrap) {
    return;
  }

  const isMiddleMouse = event.pointerType === "mouse" && event.button === 1;
  const isTouchCanvasPan =
    event.pointerType !== "mouse" &&
    !currentTool() &&
    event.target === els.canvas &&
    !state.drag;

  if (!isMiddleMouse && !isTouchCanvasPan) {
    return;
  }

  event.preventDefault();
  state.canvasPan = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: els.canvasWrap.scrollLeft,
    scrollTop: els.canvasWrap.scrollTop,
  };

  els.canvasWrap.classList.add("panning");
  els.canvasWrap.setPointerCapture?.(event.pointerId);
}

function moveCanvasPan(event) {
  if (!state.canvasPan || event.pointerId !== state.canvasPan.pointerId) {
    return;
  }

  event.preventDefault();
  const deltaX = event.clientX - state.canvasPan.startX;
  const deltaY = event.clientY - state.canvasPan.startY;
  els.canvasWrap.scrollLeft = state.canvasPan.scrollLeft - deltaX;
  els.canvasWrap.scrollTop = state.canvasPan.scrollTop - deltaY;
}

function endCanvasPan(event) {
  if (!state.canvasPan || event.pointerId !== state.canvasPan.pointerId) {
    return;
  }

  if (els.canvasWrap.hasPointerCapture?.(event.pointerId)) {
    els.canvasWrap.releasePointerCapture(event.pointerId);
  }
  state.canvasPan = null;
  els.canvasWrap.classList.remove("panning");
}

function toggleElementTool(kind) {
  if (state.drawing) {
    cancelCanvasDrawing();
  }

  closeCanvasRoomEditor();
  state.drawMode = false;
  state.activeElementTool = state.activeElementTool === kind ? null : kind;
  state.drawing = null;
  closeToolMenus();
  renderDrawStatus();
  renderCanvas();
}

function canvasPointerDown(event) {
  const activeTool = currentTool();
  if (!activeTool) {
    return;
  }

  if (state.drawing) {
    return;
  }

  if (event.target.closest && event.target.closest("#canvas-room-editor")) {
    return;
  }

  const start = eventToGridPoint(event);
  state.selectedRoomId = null;
  state.selectedElement = null;
  state.canvasEditorSegmentId = null;
  closeCanvasRoomEditor();

  if (activeTool === "room") {
    const draftRoom = createRoom({
      type: els.roomType.value,
      width: 4,
      height: 4,
      x: start.x,
      y: start.y,
      color: els.roomColor.value,
    });
    state.drawing = {
      kind: "room",
      pointerId: event.pointerId,
      startX: start.x,
      startY: start.y,
      room: draftRoom,
    };
    syncRoomFormFields(draftRoom);
  } else if (FIXTURE_TYPES.includes(activeTool)) {
    state.drawing = {
      kind: activeTool,
      pointerId: event.pointerId,
      fixture: createFixture({ kind: activeTool, x: start.x, y: start.y }),
    };
  } else {
    state.drawing = {
      kind: activeTool,
      pointerId: event.pointerId,
      startX: start.x,
      startY: start.y,
      segment: createSegment(start.x, start.y, start.x + 1, start.y, activeTool, crypto.randomUUID(), {
        width: activeTool === "door" || activeTool === "window" ? 3 : undefined,
      }),
    };
  }

  event.preventDefault();
  const captureTarget = event.currentTarget?.setPointerCapture ? event.currentTarget : els.canvas;
  state.drawing.captureTarget = captureTarget;
  captureTarget.setPointerCapture(event.pointerId);
  els.canvas.addEventListener("pointermove", canvasPointerMove);
  els.canvas.addEventListener("pointerup", canvasPointerUp);
  els.canvas.addEventListener("pointercancel", canvasPointerUp);
  render();
}

function canvasPointerMove(event) {
  if (!state.drawing) {
    return;
  }

  const point = eventToGridPoint(event);
  if (state.drawing.kind === "room") {
    const nextRoom = roomFromDrag(
      state.drawing.startX,
      state.drawing.startY,
      point.x,
      point.y,
      els.roomType.value,
      els.roomColor.value,
      state.drawing.room.id
    );

    state.drawing.room = snapRoomToNeighbors(nextRoom, nextRoom.id);
    syncRoomFormFields(nextRoom);
  } else if (state.drawing.fixture) {
    state.drawing.fixture = createFixture({
      kind: state.drawing.kind,
      x: point.x,
      y: point.y,
      id: state.drawing.fixture.id,
    });
  } else {
    const rawWidth = Math.max(1, Math.round(Math.hypot(point.x - state.drawing.startX, point.y - state.drawing.startY)));
    state.drawing.segment = createSegment(
      state.drawing.startX,
      state.drawing.startY,
      point.x,
      point.y,
      state.drawing.kind,
      state.drawing.segment.id,
      { width: rawWidth }
    );
    if (state.drawing.kind === "door" || state.drawing.kind === "window") {
      state.drawing.segment = snapOpeningToWall(state.drawing.segment, true);
    }
  }
  renderCanvas();
}

function canvasPointerUp(event) {
  if (!state.drawing) {
    return;
  }

  const drawing = state.drawing;
  cancelCanvasDrawing(event.pointerId);

  state.drawing = null;
  if (drawing.kind === "room") {
    const finalRoom = drawing.room;
    state.rooms.push(finalRoom);
    state.selectedRoomId = finalRoom.id;
    state.roomsDropdownOpen = true;
    syncRoomFormFields(finalRoom);
  } else if (drawing.fixture) {
    state.fixtures.push(drawing.fixture);
    state.selectedElement = {
      id: drawing.fixture.id,
      kind: drawing.fixture.kind,
      collection: "fixtures",
    };
  } else if (drawing.kind === "wall") {
    state.walls.push(drawing.segment);
  } else {
    state.openings.push(snapOpeningToWall(drawing.segment, true));
  }
  recordHistory();
  render();
}

function roomFromDrag(startX, startY, endX, endY, type, color, id = crypto.randomUUID()) {
  const rawWidth = Math.abs(endX - startX) + 1;
  const rawHeight = Math.abs(endY - startY) + 1;
  const width = clamp(rawWidth, 4, 60);
  const height = clamp(rawHeight, 4, 60);
  const x = clamp(Math.min(startX, endX), 0, CANVAS_WIDTH - width);
  const y = clamp(Math.min(startY, endY), 0, CANVAS_HEIGHT - height);

  const roomType = type || "Unassigned";
  return {
    id,
    type: roomType,
    width,
    height,
    x,
    y,
    color,
  };
}

function createSegment(x1, y1, x2, y2, kind, id = crypto.randomUUID(), extra = {}) {
  const segment = {
    id,
    kind,
    x1: snap(clamp(x1, 0, CANVAS_WIDTH - 1)),
    y1: snap(clamp(y1, 0, CANVAS_HEIGHT - 1)),
    x2: snap(clamp(x2, 0, CANVAS_WIDTH - 1)),
    y2: snap(clamp(y2, 0, CANVAS_HEIGHT - 1)),
    ...extra,
  };
  if (kind === "door" || kind === "window") {
    segment.width = clamp(Number(segment.width) || wallLength(segment) || 3, 1, 20);
  }
  if (kind === "door") {
    segment.swing = segment.swing || "in";
  }
  return segment;
}

function currentTool() {
  if (state.drawMode) {
    return "room";
  }
  return state.activeElementTool;
}

function cancelCanvasDrawing(pointerId = state.drawing?.pointerId) {
  const captureTarget = state.drawing?.captureTarget || els.canvas;
  if (pointerId !== undefined && captureTarget.hasPointerCapture?.(pointerId)) {
    captureTarget.releasePointerCapture(pointerId);
  }
  els.canvas.removeEventListener("pointermove", canvasPointerMove);
  els.canvas.removeEventListener("pointerup", canvasPointerUp);
  els.canvas.removeEventListener("pointercancel", canvasPointerUp);
}

function eventToGridPoint(event) {
  const rect = els.canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  const x = clamp(Math.floor((event.clientX - rect.left) * scaleX), 0, CANVAS_WIDTH - 1);
  const y = clamp(Math.floor((event.clientY - rect.top) * scaleY), 0, CANVAS_HEIGHT - 1);

  return { x: snap(x), y: snap(y) };
}

function syncRoomFormFields(room) {
  els.roomWidth.value = String(room.width);
  els.roomHeight.value = String(room.height);
  els.roomX.value = String(room.x);
  els.roomY.value = String(room.y);
}

function openCanvasRoomEditor(roomId) {
  state.selectedRoomId = roomId;
  state.selectedElement = null;
  state.canvasEditorRoomId = roomId;
  state.canvasEditorSegmentId = null;
  state.drawMode = false;
  state.drawing = null;
  render();
}

function handleElementSelection(event, collection, kind, id) {
  if (currentTool()) {
    canvasPointerDown(event);
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  const now = Date.now();
  const isDoubleClick =
    state.lastSegmentClick.id === id &&
    state.lastSegmentClick.kind === kind &&
    now - state.lastSegmentClick.timestamp < SEGMENT_EDIT_WINDOW;

  state.selectedRoomId = null;
  state.canvasEditorRoomId = null;
  state.selectedElement = {
    id,
    kind,
    collection,
  };

  if (isDoubleClick) {
    state.canvasEditorSegmentId = id;
    state.lastSegmentClick = { id: null, kind: null, timestamp: 0 };
  } else {
    state.canvasEditorSegmentId = null;
    state.lastSegmentClick = { id, kind, timestamp: now };
  }

  render();
}

function selectedElementLabel() {
  if (!state.selectedElement) {
    return "";
  }
  return state.selectedElement.kind.charAt(0).toUpperCase() + state.selectedElement.kind.slice(1);
}

function closeCanvasRoomEditor() {
  state.canvasEditorRoomId = null;
  renderCanvasRoomEditor();
}

function closeCanvasSegmentEditor() {
  state.canvasEditorSegmentId = null;
  renderCanvasSegmentEditor();
}

function toggleRoomsDropdown(forceValue) {
  state.roomsDropdownOpen = typeof forceValue === "boolean" ? forceValue : !state.roomsDropdownOpen;
  renderRoomsDropdown();
}

function setDropdown(trigger, dropdown, shouldOpen) {
  if (!trigger || !dropdown) {
    return;
  }
  dropdown.hidden = !shouldOpen;
  trigger.setAttribute("aria-expanded", String(shouldOpen));
}

function closeToolMenus() {
  setDropdown(els.openingsToggle, els.openingsDropdown, false);
  setDropdown(els.fixturesToggle, els.fixturesDropdown, false);
  setDropdown(els.measureToggle, els.measureDropdown, false);
}

function toggleToolMenu(trigger, dropdown, forceValue) {
  const shouldOpen = typeof forceValue === "boolean" ? forceValue : dropdown.hidden;
  closeToolMenus();
  setDropdown(trigger, dropdown, shouldOpen);
}

function toggleActionsMenu(forceValue) {
  const shouldOpen =
    typeof forceValue === "boolean" ? forceValue : els.actionsDropdown.hidden;

  els.actionsDropdown.hidden = !shouldOpen;
  els.actionsToggle.setAttribute("aria-expanded", String(shouldOpen));
}

function handleDocumentClick(event) {
  if (!event.target.closest(".action-menu")) {
    closeToolMenus();
    toggleActionsMenu(false);
  }
}

function handleActionsToggle(event) {
  event.stopPropagation();
  closeToolMenus();
  toggleActionsMenu();
}

function handleToolMenuToggle(event, trigger, dropdown) {
  event.stopPropagation();
  toggleActionsMenu(false);
  toggleToolMenu(trigger, dropdown);
}

function handleActionsMenuItemClick() {
  toggleActionsMenu(false);
}

function handleDocumentKeydown(event) {
  const modifier = event.ctrlKey || event.metaKey;
  if (modifier && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      redo();
    } else {
      undo();
    }
    return;
  }
  if (modifier && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redo();
    return;
  }

  if (event.key === "Escape") {
    closeToolMenus();
    toggleActionsMenu(false);
    closeCanvasRoomEditor();
    closeCanvasSegmentEditor();
  }
}

function createFloorSvgMarkup(floor) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${CANVAS_WIDTH * SCALE} ${CANVAS_HEIGHT * SCALE}`);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("aria-label", `${floor.name} floor plan`);

  floor.rooms.forEach((room) => {
    svg.appendChild(createRoomSvg(room));
  });
  floor.walls.forEach((wall) => {
    svg.appendChild(createSegmentSvg(wall, "wall"));
  });
  floor.openings.forEach((opening) => {
    svg.appendChild(createSegmentSvg(opening, opening.kind));
  });
  const fixtureLabelPositions = fixtureLabelPositionMap(floor.fixtures);
  floor.fixtures.forEach((fixture) => {
    svg.appendChild(createFixtureSvg(fixture, "", fixtureLabelPositions.get(fixture.id)));
  });

  return svg.outerHTML;
}

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function exportPlan() {
  syncActiveFloorStore();
  const payload = {
    exportedAt: new Date().toISOString(),
    project: state.project,
    activeFloorId: state.activeFloorId,
    floors: state.floors,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "elevated-floor-plan.json";
  link.click();
  URL.revokeObjectURL(url);
}

function exportClientPdf() {
  syncActiveFloorStore();
  const roomsCount = state.floors.reduce((sum, floor) => sum + floor.rooms.length, 0);
  if (roomsCount === 0) {
    window.alert("Add at least one room before exporting a client PDF.");
    return;
  }

  const totalArea = state.floors.reduce((sum, floor) => sum + totalAreaForRooms(floor.rooms), 0);
  const projectName = state.project.projectName.trim() || "Untitled job";
  const customerName = state.project.customerName.trim() || "Not set";
  const customerPhone = state.project.customerPhone.trim() || "Not set";
  const customerEmail = state.project.customerEmail.trim() || "Not set";
  const projectAddress = state.project.projectAddress.trim() || "Not set";
  const floorSections = state.floors
    .map((floor) => {
      const roomRows = floor.rooms
        .map(
          (room) => `
        <tr>
          <td>${escapeHtml(floor.name)}</td>
          <td>${escapeHtml(room.type)}</td>
          <td>${room.width}' x ${room.height}'</td>
          <td>(${room.x}', ${room.y}')</td>
          <td>${roomArea(room)} sq ft</td>
        </tr>`
        )
        .join("");

      return `
        <section class="floor-sheet">
          <div class="floor-heading">
            <h2>${escapeHtml(floor.name)}</h2>
            <p>${floor.rooms.length} rooms | ${totalAreaForRooms(floor.rooms)} sq ft</p>
          </div>
          <section class="plan-wrap">
            ${createFloorSvgMarkup(floor)}
          </section>
          <table>
            <thead>
              <tr>
                <th>Floor</th>
                <th>Room</th>
                <th>Size</th>
                <th>Position</th>
                <th>Area</th>
              </tr>
            </thead>
            <tbody>
              ${roomRows || '<tr><td colspan="5">No rooms on this floor yet.</td></tr>'}
            </tbody>
          </table>
        </section>`;
    })
    .join("");

  const printWindow = window.open("", "_blank", "width=1200,height=900");
  if (!printWindow) {
    window.alert("Allow pop-ups for this site to export a client PDF.");
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(projectName)} - Floor Plan</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #1f2430;
        --muted: #5f6574;
        --line: #d7d9de;
        --panel: #ffffff;
        --accent: #db6d52;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 32px;
        font-family: Arial, sans-serif;
        color: var(--ink);
        background: #f6f4ef;
      }

      .sheet {
        max-width: 1100px;
        margin: 0 auto;
        background: var(--panel);
        border: 1px solid var(--line);
        padding: 28px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 2px solid #ece7df;
        padding-bottom: 18px;
        margin-bottom: 22px;
      }

      h1 {
        margin: 0 0 10px;
        font-size: 28px;
      }

      .subtle {
        color: var(--muted);
        margin: 0;
      }

      .meta {
        min-width: 280px;
      }

      .meta-row {
        margin-bottom: 10px;
      }

      .meta-row strong,
      .summary strong {
        display: inline-block;
        min-width: 92px;
      }

      .summary {
        display: flex;
        gap: 18px;
        flex-wrap: wrap;
        margin-bottom: 18px;
        padding: 14px 16px;
        background: #faf7f1;
        border: 1px solid #ece7df;
      }

      .floor-sheet {
        margin-top: 22px;
      }

      .floor-heading {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 12px;
        margin-bottom: 12px;
      }

      .floor-heading h2 {
        margin: 0;
        font-size: 22px;
      }

      .floor-heading p {
        margin: 0;
        color: var(--muted);
      }

      .plan-wrap {
        border: 1px solid var(--line);
        background:
          linear-gradient(rgba(47, 61, 82, 0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(47, 61, 82, 0.12) 1px, transparent 1px),
          #ffffff;
        background-size: 10px 10px, 10px 10px, auto;
        padding: 12px;
      }

      svg {
        display: block;
        width: 100%;
        height: auto;
        background: transparent;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 22px;
      }

      th,
      td {
        border: 1px solid var(--line);
        padding: 10px 12px;
        text-align: left;
        font-size: 14px;
      }

      th {
        background: #f3eee5;
      }

      @media print {
        body {
          background: white;
          padding: 0;
        }

        .sheet {
          border: none;
          max-width: none;
          margin: 0;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <section class="sheet">
      <header class="header">
        <div>
          <h1>${escapeHtml(projectName)}</h1>
          <p class="subtle">Elevated Building Planner export</p>
        </div>
        <div class="meta">
          <div class="meta-row"><strong>Customer:</strong> ${escapeHtml(customerName)}</div>
          <div class="meta-row"><strong>Phone:</strong> ${escapeHtml(customerPhone)}</div>
          <div class="meta-row"><strong>Email:</strong> ${escapeHtml(customerEmail)}</div>
          <div class="meta-row"><strong>Address:</strong> ${escapeHtml(projectAddress)}</div>
          <div class="meta-row"><strong>Exported:</strong> ${new Date().toLocaleString()}</div>
        </div>
      </header>

      <section class="summary">
        <div><strong>Floors:</strong> ${state.floors.length}</div>
        <div><strong>Rooms:</strong> ${roomsCount}</div>
        <div><strong>Total area:</strong> ${totalArea} sq ft</div>
      </section>

      ${floorSections}
    </section>
    <script>
      window.addEventListener("load", () => {
        window.print();
      });
    </script>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function exportEstimatePdf() {
  syncActiveFloorStore();
  const projectName = state.project.projectName.trim() || "Untitled job";
  const customerName = state.project.customerName.trim() || "Not set";
  const settings = projectEstimateSettings();
  const floorRows = state.floors
    .map((floor) => {
      const estimate = estimateForFloor(floor);
      return `
        <tr>
          <td>${escapeHtml(floor.name)}</td>
          <td>${estimate.area} sq ft</td>
          <td>${estimate.wallLinearFeet} lf</td>
          <td>${estimate.doorCount}</td>
          <td>${estimate.windowCount}</td>
          <td>${currency(estimate.subtotal)}</td>
          <td>${currency(estimate.contingency)}</td>
          <td>${currency(estimate.total)}</td>
        </tr>`;
    })
    .join("");
  const totals = state.floors.reduce(
    (sum, floor) => {
      const estimate = estimateForFloor(floor);
      return {
        area: sum.area + estimate.area,
        wallLinearFeet: sum.wallLinearFeet + estimate.wallLinearFeet,
        doorCount: sum.doorCount + estimate.doorCount,
        windowCount: sum.windowCount + estimate.windowCount,
        subtotal: sum.subtotal + estimate.subtotal,
        contingency: sum.contingency + estimate.contingency,
        total: sum.total + estimate.total,
      };
    },
    { area: 0, wallLinearFeet: 0, doorCount: 0, windowCount: 0, subtotal: 0, contingency: 0, total: 0 }
  );

  const printWindow = window.open("", "_blank", "width=1100,height=900");
  if (!printWindow) {
    window.alert("Allow pop-ups for this site to export an estimate sheet.");
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(projectName)} - Estimate Sheet</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 30px;
        font-family: Arial, sans-serif;
        color: #1f2430;
        background: #f6f4ef;
      }
      .sheet {
        max-width: 1050px;
        margin: 0 auto;
        background: white;
        border: 1px solid #d7d9de;
        padding: 28px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid #ece7df;
      }
      h1, h2 { margin: 0; }
      .muted { color: #5f6574; }
      .assumptions {
        margin: 18px 0;
        padding: 14px 16px;
        background: #faf7f1;
        border: 1px solid #ece7df;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 18px;
      }
      th, td {
        border: 1px solid #d7d9de;
        padding: 10px 12px;
        text-align: left;
        font-size: 14px;
      }
      th { background: #f3eee5; }
      tfoot td {
        font-weight: 700;
        background: #fbf8f2;
      }
      @media print {
        body { background: white; padding: 0; }
        .sheet { border: none; padding: 0; max-width: none; }
      }
    </style>
  </head>
  <body>
    <section class="sheet">
      <header class="header">
        <div>
          <h1>${escapeHtml(projectName)}</h1>
          <p class="muted">Estimate sheet for ${escapeHtml(customerName)}</p>
        </div>
        <div>
          <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
        </div>
      </header>

      <section class="assumptions">
        <div><strong>Area rate:</strong> ${currency(settings.sqftRate)} / sq ft</div>
        <div><strong>Wall rate:</strong> ${currency(settings.wallRate)} / lf</div>
        <div><strong>Door allowance:</strong> ${currency(settings.doorRate)} each</div>
        <div><strong>Window allowance:</strong> ${currency(settings.windowRate)} each</div>
        <div><strong>Contingency:</strong> ${settings.contingencyPct}%</div>
      </section>

      <table>
        <thead>
          <tr>
            <th>Floor</th>
            <th>Area</th>
            <th>Walls</th>
            <th>Doors</th>
            <th>Windows</th>
            <th>Subtotal</th>
            <th>Contingency</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${floorRows}
        </tbody>
        <tfoot>
          <tr>
            <td>Project total</td>
            <td>${totals.area} sq ft</td>
            <td>${totals.wallLinearFeet} lf</td>
            <td>${totals.doorCount}</td>
            <td>${totals.windowCount}</td>
            <td>${currency(totals.subtotal)}</td>
            <td>${currency(totals.contingency)}</td>
            <td>${currency(totals.total)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
    <script>
      window.addEventListener("load", () => {
        window.print();
      });
    </script>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toggleLidarPanel() {
  if (!els.lidarPanel) {
    return;
  }
  els.lidarPanel.hidden = !els.lidarPanel.hidden;
  renderLidarPanel();
}

function importLidarFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const contents = String(reader.result || "");
      const bundle = file.name.toLowerCase().endsWith(".csv")
        ? lidarBundleFromCsv(contents, file.name)
        : lidarBundleFromJson(JSON.parse(contents), file.name);
      applyLidarBundle(bundle);
    } catch (error) {
      window.alert("That scan could not be read. Import RoomPlan/ARCore/WebXR JSON or a CSV with x,y,z columns.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function applyLidarBundle(bundle) {
  const normalized = normalizeLidarBundle(bundle);
  const mergeMode = els.lidarMergeMode?.value || "append";

  if (mergeMode === "replace") {
    state.rooms = [];
    state.walls = [];
    state.openings = [];
    state.fixtures = [];
    state.lidarScans = [];
  }

  state.rooms.push(...normalized.rooms);
  state.walls.push(...normalized.walls);
  normalized.openings.forEach((opening) => {
    state.openings.push(snapOpeningToWall(opening, true));
  });
  state.fixtures.push(...normalized.fixtures);
  state.lidarScans.push(normalized.scan);
  state.selectedRoomId = normalized.rooms[0]?.id ?? state.rooms[0]?.id ?? null;
  state.selectedElement = null;
  state.canvasEditorRoomId = null;
  state.canvasEditorSegmentId = null;
  state.roomsDropdownOpen = true;
  recordHistory();
  render();
}

function normalizeLidarBundle(bundle) {
  const points = [];
  bundle.rooms.forEach((room) => {
    points.push({ x: room.x, y: room.y }, { x: room.x + room.width, y: room.y + room.height });
  });
  [...bundle.walls, ...bundle.openings].forEach((segment) => {
    points.push({ x: segment.x1, y: segment.y1 }, { x: segment.x2, y: segment.y2 });
  });
  bundle.fixtures.forEach((fixture) => points.push({ x: fixture.x, y: fixture.y }));

  if (points.length === 0) {
    throw new Error("Empty LiDAR bundle");
  }

  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  const availableWidth = CANVAS_WIDTH - 12;
  const availableHeight = CANVAS_HEIGHT - 12;
  const scale = Math.min(1, availableWidth / Math.max(maxX - minX, 1), availableHeight / Math.max(maxY - minY, 1));
  const tx = (value) => (value - minX) * scale + 6;
  const ty = (value) => (value - minY) * scale + 6;

  const rooms = bundle.rooms.map((room, index) => {
    const width = clamp(Math.max(4, Math.round(room.width * scale)), 4, 60);
    const height = clamp(Math.max(4, Math.round(room.height * scale)), 4, 60);
    return {
      id: crypto.randomUUID(),
      type: room.type || `Scanned Room ${index + 1}`,
      width,
      height,
      x: clamp(Math.round(tx(room.x)), 0, CANVAS_WIDTH - width),
      y: clamp(Math.round(ty(room.y)), 0, CANVAS_HEIGHT - height),
      color: room.color || ROOM_COLORS[index % ROOM_COLORS.length],
    };
  });
  const walls = bundle.walls.map((wall) => createSegment(tx(wall.x1), ty(wall.y1), tx(wall.x2), ty(wall.y2), "wall"));
  const openings = bundle.openings.map((opening) =>
    createSegment(tx(opening.x1), ty(opening.y1), tx(opening.x2), ty(opening.y2), opening.kind || "door", crypto.randomUUID(), {
      width: Number(opening.width) ? Math.max(1, Math.round(Number(opening.width) * scale)) : undefined,
      swing: opening.swing || "in",
    })
  );
  const fixtures = bundle.fixtures
    .filter((fixture) => FIXTURE_TYPES.includes(fixture.kind))
    .map((fixture) => createFixture({ kind: fixture.kind, x: tx(fixture.x), y: ty(fixture.y) }));

  return {
    rooms,
    walls,
    openings,
    fixtures,
    scan: {
      id: crypto.randomUUID(),
      name: bundle.name || "LiDAR scan",
      platform: bundle.platform || "LiDAR import",
      importedAt: new Date().toISOString(),
      pointCount: bundle.pointCount || 0,
      roomCount: rooms.length,
      wallCount: walls.length,
      openingCount: openings.length,
      fixtureCount: fixtures.length,
      confidence: bundle.confidence || "Scaled to 1 square = 1 ft",
      sourceType: bundle.sourceType || "scan",
    },
  };
}

function lidarBundleFromJson(data, name = "scan.json") {
  const looksLikePlannerJson =
    Array.isArray(data.floors) ||
    Boolean(data.project) ||
    (Array.isArray(data.rooms) &&
      !Array.isArray(data.doors) &&
      !Array.isArray(data.windows) &&
      ((Array.isArray(data.openings) || Array.isArray(data.walls)) ||
        data.rooms.some((room) => "width" in room && ("height" in room || "depth" in room))));
  if (looksLikePlannerJson) {
    return lidarBundleFromPlannerJson(data, name);
  }
  if (Array.isArray(data.walls) && data.walls.some((wall) => Array.isArray(wall.transform))) {
    return lidarBundleFromRoomPlan(data, name);
  }
  const points = extractPointCloud(data);
  if (points.length > 0) {
    return lidarBundleFromPoints(points, name, data.platform || "Android/WebXR point cloud");
  }
  if (Array.isArray(data.walls) || Array.isArray(data.doors) || Array.isArray(data.windows)) {
    return lidarBundleFromMeasuredObjects(data, name);
  }
  throw new Error("Unsupported LiDAR JSON");
}

function lidarBundleFromPlannerJson(data, name) {
  const floor = Array.isArray(data.floors) ? data.floors.find((entry) => entry.id === data.activeFloorId) || data.floors[0] : data;
  const rooms = (floor.rooms || []).map((room, index) => ({
    type: room.type || `Scanned Room ${index + 1}`,
    width: Number(room.width) || 8,
    height: Number(room.height || room.depth) || 8,
    x: Number(room.x) || 0,
    y: Number(room.y) || 0,
    color: room.color || ROOM_COLORS[index % ROOM_COLORS.length],
  }));
  return {
    name,
    platform: "Planner JSON",
    sourceType: "floor-plan",
    confidence: "Exact planner geometry",
    pointCount: 0,
    rooms,
    walls: (floor.walls || []).map((wall) => ({ x1: Number(wall.x1), y1: Number(wall.y1), x2: Number(wall.x2), y2: Number(wall.y2) })),
    openings: (floor.openings || []).map((opening) => ({
      x1: Number(opening.x1),
      y1: Number(opening.y1),
      x2: Number(opening.x2),
      y2: Number(opening.y2),
      kind: opening.kind || "door",
      width: Number(opening.width) || undefined,
      swing: opening.swing || "in",
    })),
    fixtures: (floor.fixtures || []).map((fixture) => ({ kind: fixture.kind || "sink", x: Number(fixture.x), y: Number(fixture.y) })),
  };
}

function lidarBundleFromRoomPlan(data, name) {
  const walls = (data.walls || []).map((wall) => roomPlanSegment(wall, "wall")).filter(Boolean);
  const doors = (data.doors || []).map((door) => roomPlanSegment(door, "door")).filter(Boolean);
  const windows = (data.windows || []).map((windowItem) => roomPlanSegment(windowItem, "window")).filter(Boolean);
  const openings = [...doors, ...windows, ...(data.openings || []).map((opening) => roomPlanSegment(opening, "door")).filter(Boolean)];
  const fixtures = (data.objects || [])
    .map((object) => {
      const category = String(object.category || object.type || "").toLowerCase();
      const kind = ROOMPLAN_OBJECT_TO_FIXTURE[category];
      const center = roomPlanCenter(object);
      return kind && center ? { kind, x: center.x, y: center.y } : null;
    })
    .filter(Boolean);

  const roomFromWalls = boundingRoomFromSegments(walls, data.name || "Scanned Room");
  return {
    name,
    platform: "iPhone/iPad RoomPlan",
    sourceType: "roomplan-json",
    confidence: "RoomPlan dimensions converted from meters",
    pointCount: 0,
    rooms: roomFromWalls ? [roomFromWalls] : [],
    walls,
    openings,
    fixtures,
  };
}

function roomPlanSegment(item, kind) {
  const center = roomPlanCenter(item);
  if (!center) {
    return null;
  }
  const dimensions = item.dimensions || item.dimension || [];
  const length = Math.max(1, Number(dimensions[0] || item.width || item.length || 1) * METERS_TO_FEET);
  const angle = roomPlanAngle(item.transform);
  const dx = Math.cos(angle) * length * 0.5;
  const dy = Math.sin(angle) * length * 0.5;
  return {
    kind,
    x1: center.x - dx,
    y1: center.y - dy,
    x2: center.x + dx,
    y2: center.y + dy,
    width: kind === "wall" ? undefined : length,
  };
}

function roomPlanCenter(item) {
  const transform = item.transform;
  if (!Array.isArray(transform) || transform.length < 16) {
    return null;
  }
  return {
    x: Number(transform[12] || 0) * METERS_TO_FEET,
    y: Number(transform[14] || 0) * METERS_TO_FEET,
  };
}

function roomPlanAngle(transform = []) {
  if (!Array.isArray(transform) || transform.length < 3) {
    return 0;
  }
  return Math.atan2(Number(transform[2]) || 0, Number(transform[0]) || 1);
}

function lidarBundleFromMeasuredObjects(data, name) {
  const unitScale = String(data.units || data.unit || "").toLowerCase().startsWith("meter") ? METERS_TO_FEET : 1;
  const walls = (data.walls || []).map((wall) => measuredSegment(wall, "wall", unitScale)).filter(Boolean);
  const openings = [...(data.doors || []).map((door) => measuredSegment(door, "door", unitScale)), ...(data.windows || []).map((windowItem) => measuredSegment(windowItem, "window", unitScale))].filter(Boolean);
  const rooms = (data.rooms || []).map((room, index) => measuredRoom(room, index, unitScale)).filter(Boolean);
  const roomFromWalls = rooms.length ? null : boundingRoomFromSegments(walls, data.name || "Scanned Room");
  return {
    name,
    platform: data.platform || "Measured LiDAR objects",
    sourceType: "object-json",
    confidence: unitScale === METERS_TO_FEET ? "Meters converted to feet" : "Imported dimensions",
    pointCount: 0,
    rooms: roomFromWalls ? [roomFromWalls] : rooms,
    walls,
    openings,
    fixtures: (data.fixtures || data.objects || []).map((fixture) => measuredFixture(fixture, unitScale)).filter(Boolean),
  };
}

function measuredSegment(item, kind, unitScale) {
  const x1 = Number(item.x1 ?? item.start?.x);
  const y1 = Number(item.y1 ?? item.start?.y ?? item.start?.z);
  const x2 = Number(item.x2 ?? item.end?.x);
  const y2 = Number(item.y2 ?? item.end?.y ?? item.end?.z);
  if ([x1, y1, x2, y2].some((value) => Number.isNaN(value))) {
    return null;
  }
  return { kind, x1: x1 * unitScale, y1: y1 * unitScale, x2: x2 * unitScale, y2: y2 * unitScale, width: Number(item.width) * unitScale || undefined };
}

function measuredRoom(room, index, unitScale) {
  const width = Number(room.width || room.dimensions?.[0]);
  const height = Number(room.height || room.depth || room.dimensions?.[1] || room.dimensions?.[2]);
  if (!width || !height) {
    return null;
  }
  return {
    type: room.type || room.name || `Scanned Room ${index + 1}`,
    width: width * unitScale,
    height: height * unitScale,
    x: Number(room.x || room.center?.x || 0) * unitScale,
    y: Number(room.y ?? room.center?.y ?? room.center?.z ?? 0) * unitScale,
    color: room.color || ROOM_COLORS[index % ROOM_COLORS.length],
  };
}

function measuredFixture(fixture, unitScale) {
  const kind = ROOMPLAN_OBJECT_TO_FIXTURE[String(fixture.kind || fixture.category || fixture.type || "").toLowerCase()] || fixture.kind;
  if (!FIXTURE_TYPES.includes(kind)) {
    return null;
  }
  const x = Number(fixture.x ?? fixture.center?.x);
  const y = Number(fixture.y ?? fixture.center?.y ?? fixture.center?.z);
  return Number.isNaN(x) || Number.isNaN(y) ? null : { kind, x: x * unitScale, y: y * unitScale };
}

function extractPointCloud(data) {
  const rawPoints = Array.isArray(data.points)
    ? data.points
    : Array.isArray(data.pointCloud)
      ? data.pointCloud
      : Array.isArray(data.vertices)
        ? data.vertices
        : [];
  const unitScale = String(data.units || data.unit || "meters").toLowerCase().startsWith("foot") ? 1 : METERS_TO_FEET;
  return rawPoints
    .map((point) => pointFromAny(point, unitScale))
    .filter(Boolean);
}

function pointFromAny(point, unitScale = 1) {
  if (Array.isArray(point)) {
    const x = Number(point[0]);
    const y = Number(point[2] ?? point[1]);
    return Number.isNaN(x) || Number.isNaN(y) ? null : { x: x * unitScale, y: y * unitScale, label: point[3] };
  }
  const x = Number(point.x);
  const y = Number(point.z ?? point.y);
  return Number.isNaN(x) || Number.isNaN(y) ? null : { x: x * unitScale, y: y * unitScale, label: point.label || point.category || point.type };
}

function lidarBundleFromCsv(contents, name = "scan.csv") {
  const rows = contents.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  if (rows.length < 2) {
    throw new Error("Empty CSV");
  }
  const headers = rows[0].split(",").map((header) => header.trim().toLowerCase());
  const xIndex = headers.indexOf("x");
  const yIndex = headers.includes("z") ? headers.indexOf("z") : headers.indexOf("y");
  const labelIndex = headers.findIndex((header) => ["label", "category", "type"].includes(header));
  if (xIndex < 0 || yIndex < 0) {
    throw new Error("CSV needs x and y/z columns");
  }
  const points = rows.slice(1).map((row) => {
    const cells = row.split(",").map((cell) => cell.trim());
    const x = Number(cells[xIndex]);
    const y = Number(cells[yIndex]);
    return Number.isNaN(x) || Number.isNaN(y) ? null : { x: x * METERS_TO_FEET, y: y * METERS_TO_FEET, label: cells[labelIndex] };
  }).filter(Boolean);
  return lidarBundleFromPoints(points, name, "Android/iPhone/iPad CSV point cloud");
}

function lidarBundleFromPoints(points, name, platform) {
  const room = boundingRoomFromPoints(points, "Scanned Room");
  const walls = room ? rectangleWalls(room) : [];
  const fixtures = points
    .map((point) => {
      const kind = ROOMPLAN_OBJECT_TO_FIXTURE[String(point.label || "").toLowerCase()] || String(point.label || "").toLowerCase();
      return FIXTURE_TYPES.includes(kind) ? { kind, x: point.x, y: point.y } : null;
    })
    .filter(Boolean);
  return {
    name,
    platform,
    sourceType: "point-cloud",
    confidence: "Bounding room inferred from point cloud",
    pointCount: points.length,
    rooms: room ? [room] : [],
    walls,
    openings: [],
    fixtures,
  };
}

function boundingRoomFromSegments(segments, type) {
  const points = segments.flatMap((segment) => [{ x: segment.x1, y: segment.y1 }, { x: segment.x2, y: segment.y2 }]);
  return boundingRoomFromPoints(points, type);
}

function boundingRoomFromPoints(points, type) {
  if (!points.length) {
    return null;
  }
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  return {
    type,
    x: minX,
    y: minY,
    width: Math.max(4, maxX - minX),
    height: Math.max(4, maxY - minY),
    color: ROOM_COLORS[0],
  };
}

function rectangleWalls(room) {
  const left = room.x;
  const right = room.x + room.width;
  const top = room.y;
  const bottom = room.y + room.height;
  return [
    { x1: left, y1: top, x2: right, y2: top },
    { x1: right, y1: top, x2: right, y2: bottom },
    { x1: right, y1: bottom, x2: left, y2: bottom },
    { x1: left, y1: bottom, x2: left, y2: top },
  ];
}

function loadLidarSample() {
  const sample = {
    name: "Mobile LiDAR room sample",
    units: "feet",
    rooms: [{ type: "Scanned Living Room", width: 24, height: 18, x: 0, y: 0 }],
    walls: rectangleWalls({ x: 0, y: 0, width: 24, height: 18 }),
    doors: [{ x1: 9, y1: 18, x2: 14, y2: 18, width: 5 }],
    windows: [{ x1: 4, y1: 0, x2: 12, y2: 0, width: 8 }],
    fixtures: [
      { kind: "outlet", x: 22, y: 6 },
      { kind: "switch", x: 15, y: 17 },
      { kind: "cabinet", x: 3, y: 14 },
    ],
  };
  applyLidarBundle(lidarBundleFromMeasuredObjects(sample, "sample-lidar-room.json"));
}

function importPlan(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!Array.isArray(parsed.floors) && !Array.isArray(parsed.rooms)) {
        throw new Error("Invalid plan file");
      }

      state.project = {
        projectName: parsed.project?.projectName || "",
        customerName: parsed.project?.customerName || "",
        customerPhone: parsed.project?.customerPhone || "",
        customerEmail: parsed.project?.customerEmail || "",
        projectAddress: parsed.project?.projectAddress || "",
        estimate: {
          sqftRate: Number(parsed.project?.estimate?.sqftRate) || 140,
          wallRate: Number(parsed.project?.estimate?.wallRate) || 20,
          doorRate: Number(parsed.project?.estimate?.doorRate) || 450,
          windowRate: Number(parsed.project?.estimate?.windowRate) || 325,
          contingencyPct: Number(parsed.project?.estimate?.contingencyPct) || 10,
        },
        display: {
          ...defaultDisplayPrefs(),
          ...(parsed.project?.display || {}),
        },
      };
      ensureProjectShape();

      if (Array.isArray(parsed.floors)) {
        state.floors = normalizeFloors(parsed.floors);
        loadFloorIntoState(parsed.activeFloorId || state.floors[0]?.id);
      } else {
        const legacyFloor = createFloor("Main floor");
        legacyFloor.rooms = parsed.rooms.map((room) => {
          const width = clamp(Number(room.width), 4, 60);
          const height = clamp(Number(room.height), 4, 60);
          return {
            id: room.id || crypto.randomUUID(),
            type: room.type || "Unassigned",
            width,
            height,
            x: clamp(Number(room.x), 0, CANVAS_WIDTH - width),
            y: clamp(Number(room.y), 0, CANVAS_HEIGHT - height),
            color: room.color || "#db6d52",
          };
        });
        legacyFloor.walls = Array.isArray(parsed.walls)
          ? parsed.walls.map((wall) => createSegment(wall.x1, wall.y1, wall.x2, wall.y2, "wall", wall.id))
          : [];
        legacyFloor.openings = Array.isArray(parsed.openings)
          ? parsed.openings.map((opening) =>
              createSegment(opening.x1, opening.y1, opening.x2, opening.y2, opening.kind || "door", opening.id, {
                wallId: opening.wallId,
                t: Number(opening.t),
                width: Number(opening.width) || undefined,
                swing: opening.swing || "in",
              })
            )
          : [];
        legacyFloor.fixtures = Array.isArray(parsed.fixtures)
          ? parsed.fixtures.map((fixture) =>
              createFixture({ id: fixture.id, kind: fixture.kind || "sink", x: fixture.x, y: fixture.y })
            )
          : [];
        legacyFloor.lidarScans = Array.isArray(parsed.lidarScans) ? parsed.lidarScans : [];
        state.floors = [legacyFloor];
        loadFloorIntoState(legacyFloor.id);
      }

      state.selectedRoomId = state.rooms[0]?.id ?? null;
      state.history.undo = [];
      state.history.redo = [];
      recordHistory();
      render();
    } catch (error) {
      window.alert("That file could not be loaded as a floor plan JSON.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function clearPlan() {
  state.project = {
    projectName: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    projectAddress: "",
    estimate: {
      sqftRate: 140,
      wallRate: 20,
      doorRate: 450,
      windowRate: 325,
      contingencyPct: 10,
    },
    display: defaultDisplayPrefs(),
  };
  state.floors = [createFloor("Main floor")];
  loadFloorIntoState(state.floors[0].id);
  recordHistory();
  render();
}

function loadSamplePlan() {
  state.project = {
    projectName: "Weston first-floor remodel",
    customerName: "Avery Weston",
    customerPhone: "(919) 555-0144",
    customerEmail: "avery.weston@example.com",
    projectAddress: "18 River Birch Lane, Raleigh, NC",
    estimate: {
      sqftRate: 155,
      wallRate: 24,
      doorRate: 525,
      windowRate: 360,
      contingencyPct: 12,
    },
    display: {
      wallLabels: true,
      roomAreaLabels: true,
      roomPerimeterLabels: false,
    },
  };
  state.floors = [
    {
      id: crypto.randomUUID(),
      name: "Main floor",
      rooms: [
        { id: crypto.randomUUID(), type: "Kitchen", width: 16, height: 14, x: 8, y: 8, color: "#db6d52" },
        { id: crypto.randomUUID(), type: "Bathroom", width: 10, height: 12, x: 24, y: 8, color: "#d9a441" },
        { id: crypto.randomUUID(), type: "Living Room", width: 22, height: 18, x: 8, y: 24, color: "#6c9f88" },
        { id: crypto.randomUUID(), type: "Mudroom", width: 10, height: 8, x: 32, y: 24, color: "#5d7ea3" },
      ],
      walls: [
        createSegment(6, 6, 46, 6, "wall"),
        createSegment(46, 6, 46, 44, "wall"),
        createSegment(46, 44, 6, 44, "wall"),
        createSegment(6, 44, 6, 6, "wall"),
      ],
      openings: [
        createSegment(18, 44, 24, 44, "door", crypto.randomUUID(), { width: 6, swing: "in" }),
        createSegment(30, 6, 38, 6, "window", crypto.randomUUID(), { width: 8 }),
      ],
      fixtures: [
        createFixture({ kind: "sink", x: 17, y: 16 }),
        createFixture({ kind: "cabinet", x: 14, y: 12 }),
        createFixture({ kind: "outlet", x: 42, y: 26 }),
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "Second floor",
      rooms: [
        { id: crypto.randomUUID(), type: "Primary Bedroom", width: 18, height: 16, x: 10, y: 10, color: "#8e7cc3" },
        { id: crypto.randomUUID(), type: "Bedroom", width: 12, height: 12, x: 30, y: 10, color: "#5d7ea3" },
        { id: crypto.randomUUID(), type: "Bathroom", width: 10, height: 8, x: 30, y: 24, color: "#d9a441" },
      ],
      walls: [
        createSegment(8, 8, 46, 8, "wall"),
        createSegment(46, 8, 46, 34, "wall"),
        createSegment(46, 34, 8, 34, "wall"),
        createSegment(8, 34, 8, 8, "wall"),
      ],
      openings: [
        createSegment(20, 34, 26, 34, "door", crypto.randomUUID(), { width: 6, swing: "in" }),
        createSegment(12, 8, 20, 8, "window", crypto.randomUUID(), { width: 8 }),
      ],
      fixtures: [
        createFixture({ kind: "toilet", x: 34, y: 27 }),
        createFixture({ kind: "switch", x: 22, y: 32 }),
      ],
    },
  ];
  loadFloorIntoState(state.floors[0].id);
  state.selectedRoomId = state.rooms[0].id;
  state.roomsDropdownOpen = true;
  state.history.undo = [];
  state.history.redo = [];
  recordHistory();
  render();
}

els.projectForm.addEventListener("input", updateProjectFields);
els.projectForm.addEventListener("change", recordHistory);
els.estimateForm.addEventListener("input", updateEstimateSettings);
els.estimateForm.addEventListener("change", recordHistory);
els.floorSelect.addEventListener("change", switchFloor);
els.addFloor.addEventListener("click", addFloor);
els.deleteFloor.addEventListener("click", deleteActiveFloor);
els.roomsToggle.addEventListener("click", () => toggleRoomsDropdown());
els.actionsToggle.addEventListener("click", handleActionsToggle);
els.openingsToggle?.addEventListener("click", (event) => handleToolMenuToggle(event, els.openingsToggle, els.openingsDropdown));
els.fixturesToggle?.addEventListener("click", (event) => handleToolMenuToggle(event, els.fixturesToggle, els.fixturesDropdown));
els.measureToggle?.addEventListener("click", (event) => handleToolMenuToggle(event, els.measureToggle, els.measureDropdown));
els.undoAction?.addEventListener("click", undo);
els.redoAction?.addEventListener("click", redo);
els.toggleWallLabels?.addEventListener("change", updateDisplayPrefs);
els.toggleRoomAreaLabels?.addEventListener("change", updateDisplayPrefs);
els.toggleRoomPerimeterLabels?.addEventListener("change", updateDisplayPrefs);
els.drawRoom.addEventListener("click", () => toggleDrawMode());
els.lidarToggle?.addEventListener("click", toggleLidarPanel);
els.lidarFile?.addEventListener("change", importLidarFile);
els.loadLidarSample?.addEventListener("click", loadLidarSample);
if (els.drawWall) {
  els.drawWall.addEventListener("click", () => toggleElementTool("wall"));
}
if (els.drawDoor) {
  els.drawDoor.addEventListener("click", () => {
    toggleElementTool("door");
    setDropdown(els.openingsToggle, els.openingsDropdown, false);
  });
}
if (els.drawWindow) {
  els.drawWindow.addEventListener("click", () => {
    toggleElementTool("window");
    setDropdown(els.openingsToggle, els.openingsDropdown, false);
  });
}
[
  ["sink", els.drawSink],
  ["vanity", els.drawVanity],
  ["toilet", els.drawToilet],
  ["cabinet", els.drawCabinet],
  ["outlet", els.drawOutlet],
  ["switch", els.drawSwitch],
].forEach(([kind, button]) => {
  button?.addEventListener("click", () => {
    toggleElementTool(kind);
    setDropdown(els.fixturesToggle, els.fixturesDropdown, false);
  });
});
els.zoomIn.addEventListener("click", () => nudgeZoom(1));
els.zoomOut.addEventListener("click", () => nudgeZoom(-1));
els.zoomReset.addEventListener("click", () => setZoom(1));
els.canvasWrap.addEventListener("pointerdown", beginCanvasPan);
els.canvasWrap.addEventListener("pointermove", moveCanvasPan);
els.canvasWrap.addEventListener("pointerup", endCanvasPan);
els.canvasWrap.addEventListener("pointercancel", endCanvasPan);
els.canvasWrap.addEventListener("lostpointercapture", endCanvasPan);
els.canvasWrap.addEventListener("auxclick", (event) => {
  if (event.button === 1) {
    event.preventDefault();
  }
});
els.canvasRoomEditor.addEventListener("submit", updateCanvasSelectedRoom);
els.canvasDeleteRoom.addEventListener("click", deleteCanvasSelectedRoom);
els.canvasCloseEditor.addEventListener("click", closeCanvasRoomEditor);
els.canvasSaveSegment.addEventListener("click", updateCanvasSelectedSegment);
els.canvasDeleteSegment.addEventListener("click", deleteCanvasSelectedSegment);
els.canvasCloseSegmentEditor.addEventListener("click", closeCanvasSegmentEditor);
els.exportClientPdf.addEventListener("click", () => {
  handleActionsMenuItemClick();
  exportClientPdf();
});
els.exportEstimatePdf.addEventListener("click", () => {
  handleActionsMenuItemClick();
  exportEstimatePdf();
});
els.exportPlan.addEventListener("click", () => {
  handleActionsMenuItemClick();
  exportPlan();
});
els.importPlan.addEventListener("change", (event) => {
  handleActionsMenuItemClick();
  importPlan(event);
});
els.clearPlan.addEventListener("click", clearPlan);
els.loadSample.addEventListener("click", () => {
  handleActionsMenuItemClick();
  loadSamplePlan();
});
els.canvas.addEventListener("pointerdown", canvasPointerDown);
document.addEventListener("click", handleDocumentClick);
document.addEventListener("keydown", handleDocumentKeydown);

if (state.floors.length === 0) {
  state.floors = [createFloor("Main floor")];
  loadFloorIntoState(state.floors[0].id);
}

ensureProjectShape();
recordHistory();
render();
