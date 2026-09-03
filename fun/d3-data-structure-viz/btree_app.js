import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { SnackBar } from "./modules/js-snackbar.js";
import { BTree } from "./btree.js";

const STORAGE_KEY = "d3_btree";
const PADDING = 80;
let width = window.innerWidth;
let height = window.innerHeight;
let tree;
let svg;
let links;
let nodes;
let drawEdge;
let selectedNodeId = null;
let hoveredNodeId = null;
let hoveredEdgeId = null;
let contextNodeId = null;
let contextEdgeId = null;
let edgeStartId = null;
let edgeIndex = null;
let mouseX = 0;
let mouseY = 0;
let canvasMouseX = 0;
let canvasMouseY = 0;
let viewBox = { x: 0, y: 0, width, height };
let contextMenu;
let indexDialog;
let editDialog;

function randIntRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadState() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, tree.stringify());
  } catch (error) {
    console.warn("Unable to persist B-tree state.", error);
  }
}

function showError(message) {
  SnackBar({ message, dismissible: true, timeout: 5000, status: "error", container: "body", position: "tm" });
}

function fitToContent() {
  if (!tree.nodes.length) {
    viewBox = { x: 0, y: 0, width, height };
    svg.node().setAttribute("viewBox", `0 0 ${width} ${height}`);
    return;
  }
  const minX = Math.min(...tree.nodes.map(node => node.x - node.width / 2)) - PADDING;
  const maxX = Math.max(...tree.nodes.map(node => node.x + node.width / 2)) + PADDING;
  const minY = Math.min(...tree.nodes.map(node => node.y - node.height / 2)) - PADDING;
  const maxY = Math.max(...tree.nodes.map(node => node.y + node.height / 2)) + PADDING;
  const scale = Math.min(1, width / (maxX - minX), height / (maxY - minY));
  viewBox = {
    x: (minX + maxX - width / scale) / 2,
    y: (minY + maxY - height / scale) / 2,
    width: width / scale,
    height: height / scale
  };
  svg.node().setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
}

function updatePointer(event) {
  [mouseX, mouseY] = d3.pointer(event);
  canvasMouseX = viewBox.x + mouseX * viewBox.width / width;
  canvasMouseY = viewBox.y + mouseY * viewBox.height / height;
}

function drawNode(nodeSelection) {
  nodeSelection.append("rect")
    .attr("class", "btree-node-shape")
    .attr("x", node => -node.width / 2)
    .attr("y", node => -node.height / 2)
    .attr("width", node => node.width)
    .attr("height", node => node.height)
    .attr("rx", 3)
    .style("fill", node => node.color === "red" ? "#C5050C" : node.color === "black" ? "#111" : "#fff");
  nodeSelection.append("line")
    .attr("class", "btree-divider")
    .attr("x1", node => -node.width / 2)
    .attr("x2", node => node.width / 2)
    .attr("y1", 0)
    .attr("y2", 0);
  nodeSelection.append("text")
    .attr("class", "btree-data")
    .attr("y", node => -node.height / 4)
    .attr("text-anchor", "middle")
    .text(node => node.label);
  nodeSelection.each(function (node) {
    const cellWidth = node.width / Math.max(1, node.children.length);
    const array = d3.select(this).append("g").attr("class", "btree-array");
    node.children.forEach((childId, index) => {
      const x = -node.width / 2 + index * cellWidth;
      array.append("rect").attr("x", x).attr("y", 0).attr("width", cellWidth).attr("height", node.height / 2);
    });
    if (!node.children.length) {
      array.append("text").attr("x", 0).attr("y", node.height / 4 + 7).attr("text-anchor", "middle").text("[]");
    }
  });
}

function redraw() {
  tree.refreshSim(width, height);
  const nodeUpdate = nodes.selectAll(".btree-node").data(tree.nodes, node => node.id);
  nodeUpdate.exit().remove();
  const entered = nodeUpdate.enter().append("g").attr("class", "btree-node")
    .on("mouseover", (event, node) => { hoveredNodeId = node.id; hoveredEdgeId = null; })
    .on("mouseout", () => { hoveredNodeId = null; orderElements(); })
    .on("dblclick", (event, node) => selectNode(node.id))
    .on("click", (event, node) => finishChild(node.id));
  const merged = entered.merge(nodeUpdate);
  merged.selectAll("*").remove();
  drawNode(merged);
  merged.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));
  const edgeUpdate = links.selectAll(".btree-link").data(tree.getEdges(), edge => edge.id);
  edgeUpdate.exit().remove();
  edgeUpdate.enter().append("path")
    .attr("class", "btree-link")
    .on("mouseover", (event, edge) => {
      hoveredEdgeId = edge.id;
      hoveredNodeId = null;
      updateEdgeStyles();
    })
    .on("mouseout", () => {
      hoveredEdgeId = null;
      updateEdgeStyles();
      orderElements();
    })
    .merge(edgeUpdate)
    .classed("btree-link-selected", edge => edge.id === hoveredEdgeId || edge.id === contextEdgeId);
  orderElements();
  saveState();
}

function updateEdgeStyles() {
  links.selectAll(".btree-link")
    .classed("btree-link-selected", edge => edge.id === hoveredEdgeId || edge.id === contextEdgeId);
}

function orderElements() {
  const layer = nodes.node();
  const nodeElements = new Map(nodes.selectAll(".btree-node").nodes().map(element => [element.__data__.id, element]));
  const edgeElements = new Map(links.selectAll(".btree-link").nodes().map(element => [element.__data__.id, element]));

  const appendSubtree = node => {
    const nodeElement = nodeElements.get(node.id);
    if (nodeElement) layer.appendChild(nodeElement);
    node.children.forEach((childId, index) => {
      const edgeElement = edgeElements.get(`${node.id}-${childId}-${index}`);
      if (edgeElement) layer.appendChild(edgeElement);
      const child = tree.getNodeById(childId);
      if (child) appendSubtree(child);
    });
  };

  tree.roots.forEach(appendSubtree);
  if (drawEdge.node()) layer.prepend(drawEdge.node());
}

function tick() {
  links.selectAll(".btree-link").attr("d", edge => {
    const anchor = childAnchor(edge.parent, edge.index, edge.parent.children.length);
    return `M ${anchor.x},${anchor.y} L ${edge.child.x},${edge.child.y - edge.child.height / 2}`;
  });
  nodes.selectAll(".btree-node").attr("transform", node => `translate(${node.x},${node.y})`);
  if (edgeStartId !== null) {
    const parent = tree.getNodeById(edgeStartId);
    const anchor = childAnchor(parent, edgeIndex ?? parent.children.length, parent.children.length + 1);
    drawEdge.attr("d", `M ${anchor.x},${anchor.y} L ${canvasMouseX},${canvasMouseY}`);
  } else drawEdge.attr("d", "");
  fitToContent();
}

function childAnchor(parent, index, childCount) {
  const count = Math.max(1, childCount);
  const cellWidth = parent.width / count;
  const safeIndex = Math.max(0, Math.min(index, count - 1));
  return {
    x: parent.x - parent.width / 2 + (safeIndex + 0.5) * cellWidth,
    y: parent.y + parent.height / 4
  };
}

function dragstarted(event) {
  if (!event.active) tree.restartSim();
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
}

function dragged(event) {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
}

function dragended(event) {
  if (!event.active) tree.simulation.alphaTarget(0);
  event.subject.fx = null;
  event.subject.fy = null;
  saveState();
}

function selectNode(id) {
  selectedNodeId = id;
  nodes.selectAll(".btree-node-shape").classed("btree-selected", node => node.id === id);
}

function finishChild(childId) {
  if (edgeStartId === null) return;
  
  const startId = edgeStartId;
  const index = edgeIndex ?? tree.getNodeById(edgeStartId).children.length;
  
  edgeStartId = null;
  edgeIndex = null;
  contextMenu.style.display = "none";
  
  try {
    tree.addChild(startId, childId, index);
  } catch (error) {
    showError(error.message);
  }
  
  redraw();
}

function startChild(index) {
  edgeStartId = contextNodeId;
  edgeIndex = index;
  contextMenu.style.display = "none";
}

function showIndexDialog() {
  indexDialog.style.display = "grid";
  document.querySelector("#child-index").focus();
}

function showEditDialog() {
  const node = tree.getNodeById(contextNodeId);
  if (!node) return;
  document.querySelector("#node-data").value = node.label;
  editDialog.style.display = "grid";
  document.querySelector("#node-data").focus();
}

function showContextMenu(event) {
  event.preventDefault();
  updatePointer(event);
  const targetNode = event.target.closest?.(".btree-node");
  const targetEdge = event.target.closest?.(".btree-link");
  contextNodeId = targetNode?.__data__?.id ?? null;
  contextEdgeId = targetEdge?.__data__?.id ?? (targetNode ? null : hoveredEdgeId);
  if (contextNodeId === null && contextEdgeId === null) contextNodeId = hoveredNodeId;
  hoveredNodeId = contextNodeId;
  updateEdgeStyles();
  contextMenu.style = `width: 300px; left: ${event.clientX}px; top: ${event.clientY}px;`;
  const onNode = contextNodeId !== null;
  const onEdge = contextEdgeId !== null;
  document.querySelector("#menu-item-add-node").style.display = onNode ? "none" : "";
  document.querySelector("#menu-item-edit-node").style.display = onNode ? "" : "none";
  document.querySelector("#menu-item-delete-node").style.display = onNode ? "" : "none";
  document.querySelector("#menu-item-delete-edge").style.display = onEdge ? "" : "none";
  document.querySelector("#menu-item-leftmost-child").style.display = onNode ? "" : "none";
  document.querySelector("#menu-item-rightmost-child").style.display = onNode ? "" : "none";
  document.querySelector("#menu-item-middle-child").style.display = onNode ? "" : "none";
}

function addNode() {
  tree.addNode(canvasMouseX, canvasMouseY, String(randIntRange(1, 100)));
  redraw();
}

function deleteNode() {
  if (contextNodeId === null && hoveredNodeId === null) return;
  tree.deleteNode(contextNodeId ?? hoveredNodeId);
  contextNodeId = null;
  hoveredNodeId = null;
  redraw();
}

function deleteEdge() {
  if (contextEdgeId === null) return;
  const edge = tree.getEdges().find(candidate => candidate.id === contextEdgeId);
  if (!edge) return;
  tree.deleteChild(edge.parent.id, edge.child.id, edge.index);
  contextEdgeId = null;
  hoveredEdgeId = null;
  contextMenu.style.display = "none";
  redraw();
}

function run() {
  contextMenu = document.querySelector("#contextMenu");
  document.querySelector("#menu-item-add-node").onclick = () => { contextMenu.style.display = "none"; addNode(); };
  document.querySelector("#menu-item-edit-node").onclick = () => { contextMenu.style.display = "none"; showEditDialog(); };
  document.querySelector("#menu-item-delete-node").onclick = () => { contextMenu.style.display = "none"; deleteNode(); };
  document.querySelector("#menu-item-delete-edge").onclick = deleteEdge;
  document.querySelector("#menu-item-leftmost-child").onclick = () => startChild(0);
  document.querySelector("#menu-item-rightmost-child").onclick = () => startChild(tree.getNodeById(contextNodeId)?.children.length ?? 0);
  document.querySelector("#menu-item-middle-child").onclick = () => {
    contextMenu.style.display = "none";
    showIndexDialog();
  };
  indexDialog = document.querySelector("#index-dialog");
  editDialog = document.querySelector("#edit-dialog");
  
  indexDialog.addEventListener("submit", event => {
    event.preventDefault();
    const index = parseInt(document.querySelector("#child-index").value, 10);
    if (!isNaN(index) && index >= 0) {
      startChild(index);
      indexDialog.style.display = "none";
    }
  });

  document.querySelector("#cancel-index").onclick = () => { indexDialog.style.display = "none"; };
  editDialog.addEventListener("submit", event => {
    event.preventDefault();
    const node = tree.getNodeById(contextNodeId);
    const value = document.querySelector("#node-data").value.trim();
    if (!node || !value) return;
    node.label = value;
    editDialog.style.display = "none";
    redraw();
  });
  document.querySelector("#cancel-edit").onclick = () => { editDialog.style.display = "none"; };
  document.querySelector("#menu-item-clear-all").onclick = () => { tree.clearAll(); contextMenu.style.display = "none"; redraw(); };
  document.querySelector("#menu-item-save-file").onclick = () => saveFile();
  document.querySelector("#menu-item-open-file").onclick = () => openFile();
  svg = d3.select("#d3_container").append("svg").attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`).on("contextmenu", event => { showContextMenu(event); event.preventDefault(); });
  nodes = svg.append("g").attr("class", "tree-layer");
  links = nodes;
  drawEdge = nodes.append("path").attr("class", "btree-link-preview");
  const defaults = [
    { id: 0, x: width / 2, y: 160, label: "40", color: "none", children: [1, 2, 4] },
    { id: 1, x: width / 2 - 240, y: 350, label: "20", color: "none", children: [3] },
    { id: 2, x: width / 2, y: 350, label: "60", color: "none", children: [] },
    { id: 3, x: width / 2 - 240, y: 540, label: "10", color: "none", children: [] },
    { id: 4, x: width / 2 + 240, y: 350, label: "80", color: "none", children: [] }
  ];
  try { tree = new BTree(JSON.parse(loadState()).nodes, width, height, tick); } catch (error) { tree = new BTree(defaults, width, height, tick); }
  const firstNode = tree.getNodeById(0);
  if (firstNode?.label === "root") firstNode.label = String(randIntRange(1, 100));
  redraw();
  document.querySelector("#data_playground").onmousemove = updatePointer;
  document.querySelector("#data_playground").onclick = event => { if (!contextMenu.contains(event.target)) contextMenu.style.display = "none"; };
  window.onresize = () => { width = window.innerWidth; height = window.innerHeight; svg.attr("width", width).attr("height", height); tree.refreshSim(width, height); };
}

async function saveFile() {
  const blob = new Blob([tree.stringify()], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "btree.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

async function openFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try { tree.simulation.stop(); tree = BTree.fromString(await file.text(), width, height, tick); redraw(); } catch (error) { showError("Malformed B-tree file."); }
  };
  input.click();
}

run();