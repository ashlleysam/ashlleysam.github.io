import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export class BTree {
  constructor(nodes, width, height, tick) {
    this.nodes = nodes;
    this.max_node_id = Math.max(-1, ...nodes.map(node => node.id));
    this.parent = new Map();
    this.tick = tick;
    this._recompute();
    this.simulation = d3.forceSimulation(this.nodes)
      .alphaTarget(0.3)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(node => node.width / 2 + 20))
      .force("tree", this._treeForce())
      .on("tick", tick);
  }

  _recompute() {
    this.nodesById = new Map(this.nodes.map(node => [node.id, node]));
    this.parent = new Map();
    this.nodes.forEach(node => {
      node.children = Array.isArray(node.children) ? node.children : [];
      node.children.forEach(childId => this.parent.set(childId, node.id));
      this._resizeNode(node);
    });
    this.roots = this.nodes.filter(node => !this.parent.has(node.id));
    this.roots.forEach(node => this._computeSubtreeWidth(node, new Set()));
  }

  _resizeNode(node) {
    const dataWidth = Math.max(150, String(node.label).length * 18 + 36);
    const arrayWidth = Math.max(150, node.children.length * 72 + 20);
    node.width = Math.max(dataWidth, arrayWidth);
    node.height = 116;
  }

  _computeSubtreeWidth(node, path) {
    if (path.has(node.id)) throw new Error("A cycle was found in the B-tree.");
    const nextPath = new Set(path).add(node.id);
    const children = node.children.map(childId => this.getNodeById(childId)).filter(Boolean);
    children.forEach(child => this._computeSubtreeWidth(child, nextPath));
    const childWidth = children.reduce((width, child) => width + child.subtreeWidth, 0);
    const childSpacing = Math.max(90, node.width / 2 + 50) * Math.max(0, children.length - 1);
    node.subtreeWidth = Math.max(node.width, childWidth + childSpacing);
    return node.subtreeWidth;
  }

  _computeExpectedPositions(node, expectedX, expectedY, positions) {
    positions.set(node.id, { x: expectedX, y: expectedY });
    const children = node.children.map(childId => this.getNodeById(childId)).filter(Boolean);
    if (!children.length) return;
    if (children.length === 1) {
      this._computeExpectedPositions(children[0], expectedX, expectedY + 190, positions);
      return;
    }
    const spacing = Math.max(90, node.width / 2 + 50);
    const childrenWidth = children.reduce((width, child) => width + child.subtreeWidth, 0)
      + spacing * (children.length - 1);
    let childX = expectedX - childrenWidth / 2;
    children.forEach(child => {
      const childCenter = childX + child.subtreeWidth / 2;
      this._computeExpectedPositions(child, childCenter, expectedY + 190, positions);
      childX += child.subtreeWidth + spacing;
    });
  }

  _treeForce() {
    return alpha => {
      const expectedPositions = new Map();
      this.roots.forEach(root => this._computeExpectedPositions(root, root.x, root.y, expectedPositions));
      this.nodes.forEach(node => {
        const expected = expectedPositions.get(node.id);
        if (!expected) return;
        node.vx += (expected.x - node.x) * 0.08 * alpha;
        node.vy += (expected.y - node.y) * 0.12 * alpha;
      });
    };
  }

  refreshSim(width, height) {
    this.nodes.forEach(node => this._resizeNode(node));
    this.simulation.nodes(this.nodes)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("tree", this._treeForce())
      .alphaTarget(0.3);
  }

  restartSim() {
    this.simulation.alphaTarget(0.3).restart();
  }

  getNodeById(id) {
    return this.nodesById.get(Number(id));
  }

  getEdges() {
    return this.nodes.flatMap(parent => parent.children.map((childId, index) => ({
      id: `${parent.id}-${childId}-${index}`,
      parent,
      child: this.getNodeById(childId),
      index
    })).filter(edge => edge.child));
  }

  addNode(x, y, label = null) {
    const node = {
      id: ++this.max_node_id,
      x,
      y,
      label: label ?? String(this.max_node_id),
      color: "none",
      selected: false,
      children: []
    };
    this._resizeNode(node);
    this.nodes.push(node);
    this._recompute();
    return node;
  }

  canAddChild(parentId, childId) {
    if (parentId === childId || this.parent.has(childId)) return false;
    let current = parentId;
    while (this.parent.has(current)) {
      current = this.parent.get(current);
      if (current === childId) return false;
    }
    return Boolean(this.getNodeById(parentId) && this.getNodeById(childId));
  }

  addChild(parentId, childId, index) {
    if (!this.canAddChild(parentId, childId)) {
      throw new Error("A node can only have one parent, and this child would create a cycle.");
    }
    const parent = this.getNodeById(parentId);
    const insertionIndex = Math.max(0, Math.min(index, parent.children.length));
    parent.children.splice(insertionIndex, 0, Number(childId));
    this._recompute();
  }

  deleteChild(parentId, childId, index) {
    const parent = this.getNodeById(parentId);
    const childIndex = Number.isInteger(index) ? index : parent?.children.indexOf(Number(childId));
    if (!parent || childIndex < 0 || parent.children[childIndex] !== Number(childId)) return false;
    parent.children.splice(childIndex, 1);
    this._recompute();
    return true;
  }

  deleteNode(id) {
    this.nodes = this.nodes.filter(node => node.id !== Number(id));
    this.nodes.forEach(node => {
      node.children = node.children.filter(childId => childId !== Number(id));
    });
    this._recompute();
  }

  clearAll() {
    this.nodes = [];
    this._recompute();
  }

  stringify() {
    return JSON.stringify({
      nodes: this.nodes.map(node => ({
        id: node.id,
        x: node.x,
        y: node.y,
        label: node.label,
        color: node.color,
        selected: false,
        children: [...node.children]
      }))
    });
  }

  static fromString(jsonString, width, height, tick) {
    const json = JSON.parse(jsonString);
    if (!Array.isArray(json.nodes)) throw new Error("Malformed B-tree file.");
    return new BTree(json.nodes, width, height, tick);
  }
}
