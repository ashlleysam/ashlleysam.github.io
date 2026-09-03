const views = {
  binarytree: {
    label: "Binary tree",
    source: "binarytree.html?v=5"
  },
  graph: {
    label: "Graph",
    source: "graph.html?v=5"
  },
  btree: {
    label: "B-tree",
    source: "btree.html?v=8"
  }
};
const SELECTED_VIEW_STORAGE_KEY = "selected-data-structure";

const frame = document.querySelector("#structure-frame");
const tabs = document.querySelectorAll(".structure-tab");
const fullscreenButton = document.querySelector("#fullscreen-button");

function selectView(viewName) {
  const view = views[viewName] || views.binarytree;
  const selectedName = views[viewName] ? viewName : "binarytree";

  try {
    localStorage.setItem(SELECTED_VIEW_STORAGE_KEY, selectedName);
  } catch (error) {
    console.warn("Unable to persist selected data structure.", error);
  }

  frame.src = view.source;
  frame.title = `${view.label} editor`;
  tabs.forEach(tab => {
    const isSelected = tab.dataset.view === selectedName;
    tab.classList.toggle("is-selected", isSelected);
    tab.setAttribute("aria-selected", isSelected);
  });

  if (window.location.hash !== `#${selectedName}`) {
    window.history.replaceState(null, "", `#${selectedName}`);
  }
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => selectView(tab.dataset.view));
});

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await document.documentElement.requestFullscreen();
  }
}

function updateFullscreenButton() {
  const isFullscreen = Boolean(document.fullscreenElement);
  const label = isFullscreen ? "Exit fullscreen" : "Enter fullscreen";
  fullscreenButton.setAttribute("aria-label", label);
  fullscreenButton.setAttribute("data-tooltip", label);
}

fullscreenButton.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", updateFullscreenButton);

window.addEventListener("hashchange", () => selectView(window.location.hash.slice(1)));

let initialView = window.location.hash.slice(1);
if (!views[initialView]) {
  try {
    initialView = localStorage.getItem(SELECTED_VIEW_STORAGE_KEY) || "binarytree";
  } catch (error) {
    initialView = "binarytree";
  }
}
selectView(initialView);