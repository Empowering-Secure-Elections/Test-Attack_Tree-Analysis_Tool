import React from "react";
import {
  Tabs,
  Layout,
  Button,
  notification,
  Table,
  Drawer,
  Typography,
} from "antd";
import "antd/dist/antd.css";
import UIController from "./controllers/UIController";
import D3Tree from "./components/D3Tree";
import MenuBar from "./components/MenuBar";
import RecommendationBox from "./components/RecommendationBox";
import { UnControlled as CodeMirror } from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import { svg2pdf } from 'svg2pdf.js';
import { jsPDF } from 'jspdf';
import AND from "./assets/AND.png";
import OR from "./assets/OR.png";

// Attack tree metrics will include Occurrence Score (O), Attack Cost (A),
// Technical Difficulty (T), and Discovering Difficulty (D).
// Keep this import here just in case.
// Used for internal themes.
// import "codemirror/theme/material-darker.css";
const { TabPane } = Tabs;
const { Sider, Content, Footer } = Layout;
const { Title } = Typography;
const uiController = new UIController();
// Constant columns for displaying scenarios.
const columns = [
  {
    title: "Scenario",
    dataIndex: "name",
    render: (text) => <a>{text}</a>,
  },
  {
    title: "Severity",
    children: [
      {
        title: "O",
        dataIndex: "o",
        sorter: (a, b) => a.o - b.o, // Sort by 'O' value
      },
      {
        title: "A",
        dataIndex: "a",
        sorter: (a, b) => a.a - b.a, // Sort by 'A' value
      },
      {
        title: "T",
        dataIndex: "t",
        sorter: (a, b) => a.t - b.t, // Sort by 'T' value
      },
      {
        title: "D",
        dataIndex: "d",
        sorter: (a, b) => a.d - b.d, // Sort by 'D' value
      },
    ],
  },
];

// Initialize the current panes.
var currentPanes = [
  {
    title: "New Tab 0",
    // Initialize the tree to be an empty object and the dsl/csv text to empty string.
    content: { tree: {}, dsl: "" },
    key: "0",
    closable: false,
  },
];

class App extends React.Component {
  newTabIndex = 1;
  // Initialize the currentIndex to be the first pane key.
  currentIndex = currentPanes[0].key;
  constructor(props) {
    super(props);
    this.instance = null;
    this.state = {
      visible: false,
      activeKey: currentPanes[0].key,
      panes: currentPanes,
      siderWidth: 450,
      treeData: { name: "" },
      treeDataSaved: {},
      scenarioData: [],
      selectedRowsArray: [],
      highestMetricsData: {},
      specificRecommendationsData: {},
      showRecommendations: false,
      generated: false,
      showTreeDisabled: false,
    };
    this.rowSelectionOnChange = this.rowSelectionOnChange.bind(this);
  }

  rowSelectionOnChange(selectedRowKeys, selectedRows) {
    console.log(this.state.scenarioData);
    // Call uiController function after changed
    this.setState(
      {
        selectedRowsArray: selectedRowKeys,
        treeData: uiController.highlightTree(
          JSON.parse(JSON.stringify(this.state.treeDataSaved)),
          selectedRows[0].path
        ),
        highestMetricsData: selectedRows[0],
      },
      () => {
        var highlight_links = document.getElementsByClassName("highlight_link");
        var svg_nodes = document.getElementsByClassName("rd3t-node");
        if (svg_nodes[0]) {
          const parent = svg_nodes[0].parentNode;
          for (var i = 0; i < highlight_links.length; i++) {
            parent.appendChild(highlight_links[0]);
          }
          for (var i = 0; i < svg_nodes.length; i++) {
            parent.appendChild(svg_nodes[0]);
          }
        }
      }
    );
  }

  /**
   * Open a notification with an icon.
   * @param {string} type A type of notification.
   * @param {string} title A title for a notification.
   * @param {string} desc A description for a notification.
   */
  openNotificationWithIcon = (type, title, desc) => {
    notification[type]({
      message: title,
      description: desc,
    });
  };

  /**
   * When a component mounts on the DOM object.
   */
  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
    this.updateEditorSize();
    if (document.getElementById("recommendation_box")) {
      document.getElementById("recommendation_box").style.width =
        window.innerWidth -
        document.getElementById("code_sider").offsetWidth +
        "px";
    }
    Window.map = this;
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () => {
    this.updateEditorSize();
    if (document.getElementById("recommendation_box")) {
      document.getElementById("recommendation_box").style.width =
        window.innerWidth -
        document.getElementById("code_sider").offsetWidth +
        "px";
    }
  };

  updateEditorSize = () => {
    const siderWidth = document.getElementById("code_sider").offsetWidth;
    const height =
      window.innerHeight -
      document.getElementById("generateButtonDiv").scrollHeight -
      document.getElementsByClassName("ant-tabs")[0].clientHeight -
      document.getElementsByClassName("ant-menu")[0].scrollHeight;

    this.instance.setSize(siderWidth, height);
  };

  initResize = (e) => {
    e.preventDefault();
    window.addEventListener("mousemove", this.resize);
    window.addEventListener("mouseup", this.stopResize);
  };

  resize = (e) => {
    const minWidth = 300;
    const maxWidth = 1000;
    const newWidth = e.clientX;
    if (newWidth > minWidth && newWidth < maxWidth) {
      this.setState({ siderWidth: newWidth }, () => {
        this.updateEditorSize();
      });
    }
  };

  stopResize = () => {
    window.removeEventListener("mousemove", this.resize);
    window.removeEventListener("mouseup", this.stopResize);
  };

  /**
   * On a change given an activeKey for tabs.
   * @param {number} activeKey An active key value.
   */
  onChange = (activeKey) => {
    // Save everything associated with current index to currentPanes.
    for (var i = 0; i < currentPanes.length; i++) {
      // If indexed currentPanes key matches the current index.
      if (currentPanes[i].key === this.currentIndex) {
        // Save the tree data and dsl/csv at the current index.
        currentPanes[i]["content"]["tree"] = this.state.treeDataSaved;
        currentPanes[i]["content"]["dsl"] = this.instance.getValue();
        currentPanes[i]["content"]["scenarioData"] = this.state.scenarioData;
      }
    }
    // Active key is our target key.
    // TODO: Fix variable name.
    this.currentIndex = activeKey;
    var activeKeyIndex = 0;
    // Iterate across currentPanes.
    for (i = 0; i < currentPanes.length; i++) {
      // If currentPane key at index matches active key, update activeKeyIndex.
      if (currentPanes[i].key === activeKey) {
        activeKeyIndex = i;
      }
    }
    // Set the activeKey, and treeData.
    this.setState({
      activeKey,
      // TreeData should be updated to the current panes at the activeKeyIndex.
      treeData: currentPanes[activeKeyIndex].content.tree,
      treeDataSaved: currentPanes[activeKeyIndex].content.tree,
      scenarioData: currentPanes[activeKeyIndex].content.scenarioData,
      selectedRowsArray: [],
      highestMetricsData: {},
    });
    // Set the text content to be DSL/CSV of currentPanes at the activeKeyIndex.
    this.instance.setValue(currentPanes[activeKeyIndex].content.dsl);
  };

  /**
   * On an edit given a targetKey and an action.
   * @param {number} targetKey An active key value.
   * @param {number} action An active key value.
   */
  onEdit = (targetKey, action) => {
    this[action](targetKey);
  };

  /**
   * Adding a new tab.
   */
  add = () => {
    const { panes } = this.state;
    // Declare the activeKey to be the incremented tab index.
    const activeKey = `${this.newTabIndex++}`;
    // Spread syntax.
    const newPanes = [...panes];
    // Add a new tab to newPanes.
    newPanes.push({
      title: "New Tab " + activeKey,
      content: "Content of new Tab",
      key: activeKey,
    });
    currentPanes.push({
      title: "New Tab" + activeKey,
      content: { tree: { name: "" }, dsl: "" },
      key: activeKey,
    });
    // Iterate across newPanes and set each pane to closable.
    // This is because if we have multiple tabs, they should all be closable.
    for (var i = 0; i < newPanes.length; i++) {
      newPanes[i].closable = true;
    }
    this.setState({
      panes: newPanes,
      activeKey,
    });
    this.onChange(activeKey);
  };

  /**
   * Removing a tab.
   * @param {number} targetKey A target key number for the pane to be removed.
   */
  remove = (targetKey) => {
    // Get the panes and activeKey from this state.
    const { panes, activeKey } = this.state;
    let newActiveKey = activeKey;
    let lastIndex;
    // Iterate across each pane and index.
    panes.forEach((pane, i) => {
      // If the pane's key matches the target key, it is the pane to remove.
      if (pane.key === targetKey) {
        // Decrement the last index to move to the previous tab.
        lastIndex = i - 1;
      }
    });
    // Create a newPanes collection that includes all but the removed pane.
    const newPanes = panes.filter((pane) => pane.key !== targetKey);
    if (newPanes.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key;
        // If we deleted the first tab.
      } else {
        // Set the newActiveKey to be the new first tab.
        newActiveKey = newPanes[0].key;
      }
    }
    this.onChange(newActiveKey);

    // Remove the target pane from the current panes.
    currentPanes = currentPanes.filter((pane) => pane.key !== targetKey);
    this.setState({
      // Set the panes to be the newPanes.
      panes: newPanes,
      // Set the activeKey to be the newActive
      activeKey: newActiveKey,
    });
    // If only one pane remaining, set closable to false.
    if (currentPanes.length === 1) {
      newPanes[0].closable = false;
    }
  };

  setTreeData(inputTreeData) {
    this.setState(
      {
        treeData: JSON.parse(inputTreeData),
        treeDataSaved: JSON.parse(inputTreeData),
      },
      () => {
        var svg_nodes = document.getElementsByClassName("rd3t-node");
        if (svg_nodes[0]) {
          const parent = svg_nodes[0].parentNode;
          for (var i = 0; i < svg_nodes.length; i++) {
            parent.appendChild(svg_nodes[0]);
          }
        }
      }
    );
  }

  getTreeData() {
    return this.state.treeData;
  }

  showRecommendations() {
    this.setState({ showRecommendations: !this.state.showRecommendations });
    console.log(this.state.showRecommendations);
  }

  setScenarioData(attackScenarios) {
    this.setState({ scenarioData: attackScenarios });
  }

  getTextAreaValue() {
    return this.instance.getValue();
  }

  setTextAreaValue(text) {
    this.instance.setValue(text);
  }

  /**
    * Determines the format of the text.
    * @param {string} text A string to analyze.
    * @return {string} "DSL", "CSV", "TOO_SHORT", or "UNKNOWN".
    */
  detectFormat(text) {
    text = text.trim();
    const lines = text.split("\n");

    if (lines.length < 3) return "TOO_SHORT"; // Empty or too short text

    // Check for DSL format
    if (!lines[0].startsWith("\t") && lines.slice(2).every(line => line.startsWith("\t"))) {
      return "DSL";
    }

    // Check for CSV format
    const csvRegex = /^([^,\n]*,)*[^,\n]*$/;
    if (lines.every(line => csvRegex.test(line) && !line.startsWith("\t"))) {
      return "CSV";
    }

    return "UNKNOWN";
  }

  /**
  * Exports the image of the scenario attack tree in PDF format.
  */
  handleScenarioPdfSave = async () => {
    const treeContainer = document.querySelector(".rd3t-tree-container");
    const originalSvg = treeContainer.querySelector("svg");
    const svgClone = originalSvg.cloneNode(true);

    await this.removeNonHighlightedElements(svgClone);

    // Get the scenario data
    const selectedScenarioId = this.state.selectedRowsArray[0];
    const selectedScenario = this.state.scenarioData.find(
      scenario => scenario.key === selectedScenarioId
    );

    // Get names of visible leaf nodes
    const visibleLeafNodes = Array.from(
      await svgClone.querySelectorAll('.rd3t-leaf-node')
    ).map(leaf => leaf.textContent);

    // Filter the namepath to only include nodes that are leaf nodes
    const scenarioLeafNodes = selectedScenario.namepath.filter(nodeName =>
      visibleLeafNodes.includes(nodeName)
    );

    // Get the corresponding indices
    const scenarioLeafNodeIndices = scenarioLeafNodes.map(nodeName => {
      const nameIndex = selectedScenario.namepath.indexOf(nodeName);
      return selectedScenario.path[nameIndex];
    });

    const getScenarioLeafNode = (node, nodeIndex) => {
      if ((!node.children || node.children.length === 0) &&
        !node.operator && (nodeIndex == node.ID)) {
        return node;
      }

      if (node.children) {
        for (const child of node.children) {
          const foundNode = getScenarioLeafNode(child, nodeIndex);
          if (foundNode) return foundNode;
        }
      }

      return null;
    };

    const getMetricsForScenarioLeafNodes = () => {
      return scenarioLeafNodes.map((nodeName, index) => {
        const nodeIndex = scenarioLeafNodeIndices[index];
        const leafNode = getScenarioLeafNode(this.state.treeData, nodeIndex);

        return {
          name: nodeName,
          id: nodeIndex,
          a: leafNode.a || 0,
          t: leafNode.t || 0,
          d: leafNode.d || 0,
          o: leafNode.o || 0
        };
      });
    };

    const leafNodesWithMetrics = getMetricsForScenarioLeafNodes();

    const metricsSummary = leafNodesWithMetrics.map(node => ({
      name: node.name,
      id: node.id,
      a: node.a,
      t: node.t,
      d: node.d,
      o: node.o
    }));

    // Generate paths (connection lines)
    const paths = svgClone.querySelectorAll('.highlight_link');
    paths.forEach(path => {
      path.setAttribute('stroke', 'black');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('fill', 'none');
      path.removeAttribute('marker-end');
      path.removeAttribute('marker-start');
    });

    const allPaths = Array.from(svgClone.querySelectorAll('.highlight_link'));
    const mainGroup = svgClone.querySelector('g');
    if (mainGroup && allPaths.length > 0) {
      allPaths.forEach(path => {
        mainGroup.insertBefore(path, mainGroup.firstChild);
      });
    }

    // Process foreignObject elements
    const foreignObjects = svgClone.querySelectorAll('foreignObject');
    for (const foreignObject of foreignObjects) {
      const g = await this.convertForeignObjectToSvg(foreignObject, true);
      if (g) {
        foreignObject.parentNode.replaceChild(g, foreignObject);
      }
    }

    // Calculate dimensions of the pdf
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const allElements = [...svgClone.querySelectorAll('g[transform]'), ...allPaths];
    allElements.forEach(element => {
      const getElementBounds = (el) => {
        const bbox = el.getBBox();
        const transform = el.getAttribute('transform');
        let translateX = 0;
        let translateY = 0;

        if (transform) {
          const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
          if (match) {
            translateX = parseFloat(match[1]);
            translateY = parseFloat(match[2]);
          }
        }

        minX = Math.min(minX, bbox.x + translateX);
        minY = Math.min(minY, bbox.y + translateY);
        maxX = Math.max(maxX, bbox.x + bbox.width + translateX);
        maxY = Math.max(maxY, bbox.y + bbox.height + translateY);

        Array.from(el.children).forEach(child => {
          if (child.getBBox) {
            getElementBounds(child);
          }
        });
      };

      getElementBounds(element);
    });

    const margin = 100;
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    let width = contentWidth + (margin * 2);
    let height = contentHeight + (margin * 2) + 100;

    // Center content
    const desiredCenterX = width / 2;
    const desiredCenterY = height / 2;

    const contentCenterX = minX + (contentWidth / 2);
    const contentCenterY = minY + (contentHeight / 2);

    const translateX = desiredCenterX - contentCenterX;
    const translateY = desiredCenterY - contentCenterY;

    if (mainGroup) {
      mainGroup.setAttribute('transform', `translate(${translateX},${translateY})`);
    }

    // Set viewBox and dimensions
    svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);

    const MAX_PDF_DIMENSION = 14400;
    if (width > MAX_PDF_DIMENSION || height > MAX_PDF_DIMENSION) {
      const widthScale = MAX_PDF_DIMENSION / width;
      const heightScale = MAX_PDF_DIMENSION / height;
      const scale = Math.min(widthScale, heightScale) * 0.95;
      width *= scale;
      height *= scale;
    }

    const headerHeight = 120;
    height += headerHeight;

    // Create PDF with adjusted dimensions
    const pdf = new jsPDF({
      orientation: height > width ? 'portrait' : 'landscape',
      unit: 'pt',
      format: [width, height]
    });

    // Add header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 0, width, headerHeight, 'F');

    pdf.setFontSize(16);
    pdf.text(`Scenario #${selectedScenario.key}`, 20, 25);
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Overall o: ${selectedScenario.o}`, 20, 45);

    const lineHeight = 20;
    const leftMargin = 20;
    let xPosition = leftMargin;
    let yPosition = 85; // Start below other printed stuff

    // Iterate over metricsSummary to add leaf node details to pdf header
    metricsSummary.forEach((node) => {
      if (yPosition + lineHeight * 2 > headerHeight) {
        xPosition += 300;
        yPosition = 20;
      }

      pdf.text(node.name, xPosition, yPosition);
      yPosition += lineHeight;
      pdf.text(`a: ${node.a}, t: ${node.t}, d: ${node.d}, o: ${node.o}`, xPosition, yPosition);
      yPosition += lineHeight + 10;
    });

    try {
      const tempContainer = document.createElement('div');
      tempContainer.appendChild(svgClone);
      document.body.appendChild(tempContainer);

      await svg2pdf(svgClone, pdf, {
        x: 0,
        y: headerHeight,
        width: width,
        height: height - headerHeight
      });

      pdf.save(`Scenario_${selectedScenarioId}.pdf`);
      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  /**
   * Formats the foreign objects for svg. For the pdf export methods.
   * @param {Element} object The foreignObject element to convert
   * @param {boolean} useDataNodeType Whether to use data-node-type attribute for node type detection
   * @returns {Promise<SVGElement>} The converted SVG group element
   */
  convertForeignObjectToSvg = async (object, useDataNodeType = false) => {
    const div = object.querySelector('div');
    if (!div) return;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const transform = object.getAttribute('transform');
    const translateMatch = transform ? transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/) : null;
    const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
    const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
    g.setAttribute('transform', `translate(${translateX},${translateY})`);

    let isOperator;
    if (useDataNodeType) {
      isOperator = object.getAttribute('data-node-type') === 'operator';
      g.setAttribute('data-node-type', isOperator ? 'operator' : 'leaf');
    } else {
      const img = div.querySelector('img');
      isOperator = !!img;
    }

    const imgAlt = useDataNodeType ?
      object.getAttribute('data-img-alt') :
      div.querySelector('img')?.alt;

    if (isOperator) {
      // Operator images
      const operatorBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      operatorBg.setAttribute("x", "-20");
      operatorBg.setAttribute("y", "-40");
      operatorBg.setAttribute("width", "40");
      operatorBg.setAttribute("height", "40");
      operatorBg.setAttribute("fill", "white");
      operatorBg.setAttribute("rx", "5");
      g.appendChild(operatorBg);

      const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
      const imgSrc = imgAlt?.toUpperCase().includes('AND') ? AND : OR;

      image.setAttributeNS("http://www.w3.org/1999/xlink", "href", imgSrc);
      image.setAttribute("width", "40");
      image.setAttribute("height", "40");
      image.setAttribute("x", "-20");
      image.setAttribute("y", "-40");
      g.appendChild(image);
    }

    const textDiv = div.querySelector('div') || div;
    const textContent = textDiv.textContent;
    if (textContent) {
      if (isOperator) {
        // Operator text boxes
        const maxWidth = 180;
        const textHeight = 30;

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", -maxWidth / 2);
        rect.setAttribute("y", "10");
        rect.setAttribute("width", maxWidth.toString());
        rect.setAttribute("height", textHeight.toString());
        rect.setAttribute("fill", "white");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "1");
        rect.setAttribute("rx", "5");
        g.appendChild(rect);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-family", "Arial");
        text.setAttribute("font-size", "14px");
        g.appendChild(text);

        const words = textContent.split(" ");
        let line = [];
        let lineCount = 0;
        const lineHeight = 15;
        const startY = 25;

        words.forEach((word) => {
          const testLine = line.length === 0 ? word : line.join(" ") + " " + word;
          const testLineWidth = testLine.length * 8;

          if (testLineWidth > maxWidth - 2) {
            const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            tspan.setAttribute("x", "0");
            tspan.setAttribute("y", startY + (lineCount * lineHeight));
            tspan.textContent = line.join(" ");
            text.appendChild(tspan);

            line = [word];
            lineCount++;
          } else {
            line.push(word);
          }
        });

        if (line.length > 0) {
          const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
          tspan.setAttribute("x", "0");
          tspan.setAttribute("y", startY + (lineCount * lineHeight));
          tspan.textContent = line.join(" ");
          text.appendChild(tspan);
        }

        const totalHeight = Math.max(textHeight, (lineCount) * lineHeight + 20);
        rect.setAttribute("height", totalHeight.toString());
      } else {
        // Leaf text boxes
        const maxWidth = 135;
        const boxHeight = 65;

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", -maxWidth / 2);
        rect.setAttribute("y", -boxHeight / 50);
        rect.setAttribute("width", maxWidth.toString());
        rect.setAttribute("height", boxHeight.toString());
        rect.setAttribute("fill", "none");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "1");
        g.appendChild(rect);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-family", "Arial");
        text.setAttribute("font-size", "14px");
        g.appendChild(text);

        const words = textContent.split(" ");
        let line = [];
        let lineCount = 0;
        const lineHeight = 15;
        const startY = 20;

        words.forEach((word) => {
          const testLine = line.length === 0 ? word : line.join(" ") + " " + word;
          const testLineWidth = testLine.length * 8;

          if (testLineWidth > maxWidth - 2) {
            const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            tspan.setAttribute("x", "0");
            tspan.setAttribute("y", startY + (lineCount * lineHeight));
            tspan.textContent = line.join(" ");
            text.appendChild(tspan);

            line = [word];
            lineCount++;
          } else {
            line.push(word);
          }
        });

        if (line.length > 0) {
          const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
          tspan.setAttribute("x", "0");
          tspan.setAttribute("y", startY + (lineCount * lineHeight));
          tspan.textContent = line.join(" ");
          text.appendChild(tspan);
        }

        const totalHeight = Math.max(boxHeight, (lineCount) * lineHeight + 40);
        rect.setAttribute("height", totalHeight.toString());
      }
    }

    return g;
  };

  /**
  * Removes the nodes in the tree that are not highlighed for a scenario. For the scenario pdf save method.
  */
  async removeNonHighlightedElements(svgClone) {
    const highlightedPaths = svgClone.querySelectorAll('.highlight_link');
    const andOrNodes = svgClone.querySelectorAll('.rd3t-node');
    const leafNodes = svgClone.querySelectorAll('.rd3t-leaf-node');
    const highlightedNodeIds = new Set();

    // Function to extract coordinates from transform attribute
    const getNodeCoordinates = (transform) => {
      const match = transform.match(/translate\(([-\d.]+),([-\d.]+)\)/);
      return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
    };

    // Function to extract coordinates from path's d attribute
    const getPathEndpoints = (d) => {
      const coordinates = d.split(/[A-Z,\s]+/).filter(c => c).map(parseFloat);
      return {
        start: { x: coordinates[0], y: coordinates[1] },
        end: { x: coordinates[coordinates.length - 2], y: coordinates[coordinates.length - 1] }
      };
    };

    // Build a map of node positions
    const nodePositions = new Map();
    const preservedNodes = new Map();
    const addNodeToPositionMap = (node) => {
      const transform = node.getAttribute('transform');
      if (transform) {
        const coords = getNodeCoordinates(transform);
        if (coords) {
          const nodeId = node.getAttribute('data-id') || node.id;
          nodePositions.set(`${coords.x},${coords.y}`, nodeId);

          const foreignObject = node.querySelector('foreignObject');
          const img = foreignObject?.querySelector('img');
          const nodeInfo = {
            isOperator: node.classList.contains('rd3t-node') && !node.classList.contains('rd3t-leaf-node'),
            content: node.innerHTML,
            foreignObject: foreignObject?.cloneNode(true),
            imgAlt: img?.alt || null,
            imgSrc: img?.src || null
          };
          preservedNodes.set(nodeId, nodeInfo);
        }
      }
    };

    // Initialize node positions and preserve attributes
    andOrNodes.forEach(addNodeToPositionMap);
    leafNodes.forEach(addNodeToPositionMap);

    // Function to find all connected nodes through highlighted paths
    const findConnectedNodes = (nodeId) => {
      const connectedPaths = Array.from(highlightedPaths).filter(path => {
        const pathD = path.getAttribute('d');
        if (!pathD) return false;

        const endpoints = getPathEndpoints(pathD);
        const startKey = `${endpoints.start.x},${endpoints.start.y}`;
        const endKey = `${endpoints.end.x},${endpoints.end.y}`;

        return nodePositions.get(startKey) === nodeId || nodePositions.get(endKey) === nodeId;
      });

      connectedPaths.forEach(path => {
        const endpoints = getPathEndpoints(path.getAttribute('d'));
        const startKey = `${endpoints.start.x},${endpoints.start.y}`;
        const endKey = `${endpoints.end.x},${endpoints.end.y}`;

        const startNodeId = nodePositions.get(startKey);
        const endNodeId = nodePositions.get(endKey);

        if (startNodeId && !highlightedNodeIds.has(startNodeId)) {
          highlightedNodeIds.add(startNodeId);
          findConnectedNodes(startNodeId);
        }
        if (endNodeId && !highlightedNodeIds.has(endNodeId)) {
          highlightedNodeIds.add(endNodeId);
          findConnectedNodes(endNodeId);
        }
      });
    };

    // Find initially highlighted nodes
    highlightedPaths.forEach(path => {
      const pathD = path.getAttribute('d');
      if (pathD) {
        const endpoints = getPathEndpoints(pathD);
        const startKey = `${endpoints.start.x},${endpoints.start.y}`;
        const endKey = `${endpoints.end.x},${endpoints.end.y}`;

        const startNodeId = nodePositions.get(startKey);
        const endNodeId = nodePositions.get(endKey);

        if (startNodeId) highlightedNodeIds.add(startNodeId);
        if (endNodeId) highlightedNodeIds.add(endNodeId);
      }
    });

    // Process all initially highlighted nodes to find their connections
    Array.from(highlightedNodeIds).forEach(findConnectedNodes);

    // Remove non-highlighted nodes while preserving node structure
    const removeNonHighlighted = (elements, checkFunction) => {
      elements.forEach(element => {
        const nodeId = element.getAttribute('data-id') || element.id;
        if (!checkFunction(element)) {
          element.remove();
        } else {
          // Restore the preserved node content
          const nodeInfo = preservedNodes.get(nodeId);
          if (nodeInfo) {
            element.setAttribute('class', '');

            // Restore node type classes
            if (nodeInfo.isOperator) {
              element.setAttribute('class', 'rd3t-node');
              element.setAttribute('data-node-type', 'operator');

              // Preserve the foreignObject with the image
              if (nodeInfo.foreignObject) {
                const currentForeignObject = element.querySelector('foreignObject');
                if (currentForeignObject) {
                  const newForeignObject = nodeInfo.foreignObject.cloneNode(true);

                  const img = newForeignObject.querySelector('img');
                  if (img && nodeInfo.imgAlt) {
                    img.alt = nodeInfo.imgAlt;
                    img.src = nodeInfo.imgSrc;
                    img.style.display = 'block';
                  }

                  newForeignObject.setAttribute('data-node-type', 'operator');
                  if (nodeInfo.imgAlt) {
                    newForeignObject.setAttribute('data-img-alt', nodeInfo.imgAlt);
                  }

                  ['transform', 'width', 'height'].forEach(attr => {
                    if (currentForeignObject.hasAttribute(attr)) {
                      newForeignObject.setAttribute(attr,
                        currentForeignObject.getAttribute(attr));
                    }
                  });

                  currentForeignObject.replaceWith(newForeignObject);
                }
              }
            } else {
              // For leaf nodes
              element.setAttribute('class', 'rd3t-leaf-node');
              element.setAttribute('data-node-type', 'leaf');
            }
          }

        }
      });
    };

    removeNonHighlighted(andOrNodes, node => {
      const nodeId = node.getAttribute('data-id') || node.id;
      return highlightedNodeIds.has(nodeId);
    });
    removeNonHighlighted(leafNodes, node => {
      const nodeId = node.getAttribute('data-id') || node.id;
      return highlightedNodeIds.has(nodeId);
    });
    removeNonHighlighted(
      svgClone.querySelectorAll('path'),
      path => path.classList.contains('highlight_link')
    );

    // Clean up orphaned elements
    const cleanup = () => {
      const before = svgClone.innerHTML.length;
      svgClone.querySelectorAll('*').forEach(el => {
        if (!el.innerHTML.trim() && !el.getAttribute('d')) {
          el.remove();
        }
      });
      const after = svgClone.innerHTML.length;
      return before !== after;
    };

    while (cleanup()) { }
  }

  showDrawer = () => {
    this.setState(
      {
        generated: true,
      },
      () => {
        uiController.genScenarios();
      }
    );
    this.setState({ visible: true });
  };

  onClose = () => {
    this.setState({ visible: false });
  };

  generate = () => {
    this.setState(
      {
        selectedRowsArray: [],
        highestMetricsData: {},
        generated: true,
      },
      () => {
        const success = uiController.getInputtedText();
        if (success) {
          this.setState({ showTreeDisabled: true });
        }
      }
    );
  };

  clearSelection = () => {
    this.setState({
      treeData: JSON.parse(JSON.stringify(this.state.treeDataSaved)),
      selectedRowsArray: [],
      highestMetricsData: {},
    });
  };

  scenarioPdfExport = async (record) => {
    await this.rowSelectionOnChange([record.key], [record]);
    await this.handleScenarioPdfSave();
  };

  render() {
    const { panes, activeKey } = this.state;
    // Define the actionsColumn for the scenarios display
    const actionsColumn = {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (record) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            this.scenarioPdfExport(record);
          }}
        >
          Export
        </Button>
      ),
    };
    if (this.instance != null) {
    }
    console.log("app render");
    return (
      <div>
        <MenuBar
          scenarioData={this.state.scenarioData}
          originalTree={this.state.treeDataSaved}
          enableRecommendation={this.state.showRecommendations}
        ></MenuBar>
        <Tabs
          type="editable-card"
          onChange={this.onChange}
          activeKey={activeKey}
          onEdit={this.onEdit}
        >
          {panes.map((pane) => (
            <TabPane
              tab={pane.title}
              key={pane.key}
              closable={pane.closable}
            ></TabPane>
          ))}
        </Tabs>
        <Layout>
          <Sider width={this.state.siderWidth} id="code_sider">
            <div className="resizable">
              <CodeMirror
                editorDidMount={(editor) => {
                  this.instance = editor;
                }}
                onChange={(editor, data, value) => {
                  this.setState({ showTreeDisabled: false });
                  document.getElementById("showTreeButton").disabled = this.state.showTreeDisabled;
                  document.getElementById("showScenariosButton").disabled = !this.state.showTreeDisabled;
                }}
                options={{
                  mode: null,
                  lineNumbers: true,
                  indentWithTabs: true,
                  viewportMargin: 20,
                  indentUnit: 4,
                }}
              />
            </div>
            <div
              id="generateButtonDiv"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button id="showTreeButton" disabled={this.state.showTreeDisabled} onClick={this.generate}>Show Tree</Button>
              <Button id="showScenariosButton" disabled={!this.state.showTreeDisabled} onClick={this.showDrawer}>Show Scenarios</Button>
            </div>
            <div
              className="resize-handle"
              onMouseDown={this.initResize}
            />
          </Sider>
          <Layout>
            <Content id="tree">
              <D3Tree data={this.state.treeData} reportGen={false} />
            </Content>
            <Drawer
              title="Attack Scenarios"
              placement="right"
              onClose={this.onClose}
              visible={this.state.visible}
              width={600}
            >
              <Button onClick={this.clearSelection}>Clear</Button>
              <Table
                style={{ height: "400px" }}
                pagination={false}
                bordered
                rowSelection={{
                  type: "radio",
                  onChange: this.rowSelectionOnChange,
                  selectedRowKeys: this.state.selectedRowsArray,
                }}
                columns={[...columns, actionsColumn]}
                dataSource={this.state.scenarioData}
              />
            </Drawer>
            {!this.state.showRecommendations ? (
              <div></div>
            ) : (
              <RecommendationBox
                data={this.state.highestMetricsData}
              ></RecommendationBox>
            )}
          </Layout>
        </Layout>
      </div>
    );
  }
}

export default App;
