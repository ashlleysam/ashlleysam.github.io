const MIN_VIEW_WIDTH = 120;
const MAX_VIEW_WIDTH = 10000;

export function installCamera({ svg, getViewBox, setViewBox, resetView, onChange = () => {} }) {
  const surface = svg.node();
  const controls = document.querySelector("#camera-controls");
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function apply(viewBox) {
    setViewBox(viewBox);
    svg.attr("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    onChange();
  }

  function zoomAt(clientX, clientY, factor) {
    const rect = surface.getBoundingClientRect();
    const viewBox = getViewBox();
    const pointerX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const pointerY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const worldX = viewBox.x + pointerX * viewBox.width;
    const worldY = viewBox.y + pointerY * viewBox.height;
    const width = Math.max(MIN_VIEW_WIDTH, Math.min(MAX_VIEW_WIDTH, viewBox.width * factor));
    const height = viewBox.height * width / viewBox.width;
    apply({
      x: worldX - pointerX * width,
      y: worldY - pointerY * height,
      width,
      height
    });
  }

  function reset() {
    resetView();
  }

  svg.on("wheel.camera", event => {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, Math.exp(event.deltaY * 0.001));
  });

  svg.on("pointerdown.camera", event => {
    if (event.button !== 0 || event.target !== surface) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    surface.setPointerCapture?.(event.pointerId);
    surface.classList.add("camera-dragging");
  });

  svg.on("pointermove.camera", event => {
    if (!dragging) return;
    const rect = surface.getBoundingClientRect();
    const viewBox = getViewBox();
    const dx = (event.clientX - lastX) * viewBox.width / rect.width;
    const dy = (event.clientY - lastY) * viewBox.height / rect.height;
    apply({ ...viewBox, x: viewBox.x - dx, y: viewBox.y - dy });
    lastX = event.clientX;
    lastY = event.clientY;
  });

  svg.on("pointerup.camera pointercancel.camera", event => {
    dragging = false;
    surface.releasePointerCapture?.(event.pointerId);
    surface.classList.remove("camera-dragging");
  });

  controls?.querySelector("[data-camera=reset]")?.addEventListener("click", reset);
  controls?.querySelector("[data-camera=zoom-in]")?.addEventListener("click", () => {
    const rect = surface.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.8);
  });
  controls?.querySelector("[data-camera=zoom-out]")?.addEventListener("click", () => {
    const rect = surface.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.25);
  });

  window.addEventListener("keydown", event => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      const rect = surface.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.8);
    } else if (event.key === "-") {
      event.preventDefault();
      const rect = surface.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.25);
    }
  });
}
