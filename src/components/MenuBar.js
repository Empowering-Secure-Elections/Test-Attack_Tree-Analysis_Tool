import React, { useState, useEffect, Component } from "react";
import ReactDOM from "react-dom";
import ReactDOMServer from "react-dom/server";
import "../App.css";
import "antd/dist/antd.css";
import "../index.css";
import { Menu, Upload, message, Modal, Button } from "antd";
import { Layout, Typography } from "antd";
const { Title } = Typography;
import { saveAs } from "file-saver";
import {
  UploadOutlined,
  SettingOutlined,
  DesktopOutlined,
  DownloadOutlined,
  FileOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import UIController from "../controllers/UIController";
import { getByTestId } from "@testing-library/dom";
import D3Tree from "./D3Tree";
import RecommendationBox from "./RecommendationBox";
import {SVG} from '@svgdotjs/svg.js'
import { svg2pdf } from 'svg2pdf.js';
import { jsPDF } from 'jspdf';

const uiController = new UIController();

const { SubMenu } = Menu;

class MenuBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: false,
      translate: 0,
    };
  }

  componentDidMount() {
    this.setState({ translate: document.getElementsByClassName("rd3t-svg")[0].width.baseVal.value })
  }

  handleClick = (e) => {
    console.log(e);
    switch (e.key) {
      case "setting:3":
        Window.map.showRecommendations();
        var message = this.props.enableRecommendation
          ? "Recommendations Disabled"
          : "Recommendations Enabled";
        Window.map.openNotificationWithIcon("success", message, "");
        break;
      case "setting:4":
        this.toggleOpened();
        break;
      case "setting:5":
        this.exportDslInput();
        break;
      case "setting:6":
        this.exportCsvInput();
        break;
      case "setting:8": 
        this.handleTreePdfSave();
        break;
      case "setting:9":
        this.handleScenariosCsvSave();
        break;
      case "setting:10":
        this.handleTerminalNodesCsvSave();
        break;
    }
  };

  createReport() {
    const element = <div>{this.renderTrees()}</div>;
    console.log(ReactDOMServer.renderToString(element));
    var blob = new Blob([ReactDOMServer.renderToString(element)], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, "Report.html");
  }

  //creating a graphic for exporting to the saved file
  creategraphic(){
    return(
    <D3Tree
      key="og"
      data={this.props.originalTree ? this.props.originalTree : {}}
      reportGen={true}
      translate={this.state.translate}
    ></D3Tree>
    );
  }

  //save the graphic
  handleSvgSave() {
    // Checks if scenario data exists which indicates the tree was generated
    if (this.props.scenarioData && this.props.scenarioData.length > 0) {
      const svgContent = ReactDOMServer.renderToStaticMarkup(this.creategraphic());
      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      saveAs(blob, "Attack__Tree.svg");
    } else {
      Window.map.openNotificationWithIcon("error", "Generate tree before exporting SVG file", "");
    }
  }

  /**
   * Exports the scenarios of a tree to a CSV file.
   * The first column is the scenario number, 
   * the second column is the overall likelihood of that scenario, 
   * the third column is the path of nodes of the scenario.
   */
  handleScenariosCsvSave = () => {
    // Checks to see if there are scenarios
    if (this.props.scenarioData && this.props.scenarioData.length > 0) {
      const treeData = Window.map.getTreeData(); // Full attack tree JSON structure
      const terminalNodeIds = new Set();

      // Recursively collect terminal node IDs
      const collectTerminalNodes = (node) => {
        if (!node.operator || (node.operator !== "AND" && node.operator !== "OR")) {
          terminalNodeIds.add(node.ID); // Store terminal node ID
        }
        if (node.children) {
          node.children.forEach(collectTerminalNodes);
        }
      };
      (Array.isArray(treeData) ? treeData : [treeData]).forEach(collectTerminalNodes);

      let fileContent = "Scenario Name,O,Terminal Nodes\n"; // CSV Header
      // Process each scenario to extract terminal nodes
      fileContent += this.props.scenarioData.map((scenario) => {

        if (!Array.isArray(scenario.path) || !Array.isArray(scenario.namepath) ||
          scenario.path.length !== scenario.namepath.length || scenario.path.length === 0) {
          return `${scenario.name},${scenario.o},NO_TERMINAL_NODES`;
        }

        // Find terminal nodes by mapping scenario.path to scenario.namepath
        const terminalNodes = scenario.path
          .map((nodeId, index) => terminalNodeIds.has(nodeId) ? scenario.namepath[index] : null)
          .filter(nodeName => nodeName !== null); // Remove null values

        return `${scenario.name},${scenario.o},${terminalNodes.join(", ")}`;
      }).join("\n");

      var blob = new Blob([fileContent], { type: "text/csv;charset=utf-8" });
      saveAs(blob, "Scenarios.csv");
    } else {
      Window.map.openNotificationWithIcon("error", "Generate tree before exporting the scenarios", "");
    }
  };

  /**
   * Exports a CSV file containing all terminal (leaf) nodes from the attack tree.
   */
  handleTerminalNodesCsvSave = () => {
    // Checks to see if there are scenarios
    if (this.props.scenarioData && this.props.scenarioData.length > 0) {
      const treeData = Window.map.getTreeData();
      const terminalNodes = [];

      // Recursively collect terminal nodes with their metrics
      const collectTerminalNodes = (node) => {
        if (!node.operator || (node.operator !== "AND" && node.operator !== "OR")) {
          terminalNodes.push({
            name: node.name || "",
            o: node.o !== undefined ? node.o : "",
            a: node.a !== undefined ? node.a : "",
            t: node.t !== undefined ? node.t : "",
            d: node.d !== undefined ? node.d : ""
          });
        }
        if (node.children) {
          node.children.forEach(collectTerminalNodes);
        }
      };

      (Array.isArray(treeData) ? treeData : [treeData]).forEach(collectTerminalNodes);

      // Prepare CSV content
      let fileContent = "Node Name,O,A,T,D\n"; // CSV Header
      fileContent += terminalNodes.map(node =>
        `${node.name},${node.o},${node.a},${node.t},${node.d}`
      ).join("\n");

      var blob = new Blob([fileContent], { type: "text/csv;charset=utf-8" });
      saveAs(blob, "TerminalNodes.csv");
    } else {
      Window.map.openNotificationWithIcon("error", "Generate tree before exporting the terminal nodes", "");
    }
  };

  /**
   * Exports the attack tree data in DSL format.
   */
  exportDslInput() {
    // Checks if scenario data exists which indicates the tree was generated
    if (this.props.scenarioData && this.props.scenarioData.length > 0) {
      const format = Window.map.detectFormat(Window.map.getTextAreaValue());
      var fileContent;

      if (format === "DSL") {
        fileContent = Window.map.getTextAreaValue();
      } else if (format === "CSV") {
        try {
          fileContent = this.convertJsonToDsl(Window.map.getTreeData());
        } catch (error) {
          Window.map.openNotificationWithIcon("error", "Failed to convert to DSL", "");
          return;
        }
      } else {
        Window.map.openNotificationWithIcon("error", "Unrecognized input text format", "");
        return;
      }

      var blob = new Blob([fileContent], {
        type: "text/plain;charset=utf-8",
      });
      saveAs(blob, "AttackTreeInput.txt");
    } else {
      Window.map.openNotificationWithIcon("error", "Generate tree before exporting DSL input file", "");
    }
  }

  /**
   * Converts JSON attack tree data into DSL format.
   * @param {Object} jsonData - JSON representation of the attack tree.
   * @return {string} DSL formatted string.
   */
  convertJsonToDsl(jsonData) {
    let dslLines = [];

    function traverse(node, indent = "") {
      const { name, operator, o, a, t, d, children = [] } = node;
      const type = children.length > 0 
        ? (operator ? operator : (() => { throw new Error(`Operator missing for node: ${name}`) }))
        : "LEAF"; // Default to LEAF if no children

      let line = `${indent}${name}`;

      if (type === "LEAF") {
        if (o !== undefined && a !== undefined && t !== undefined && d !== undefined) {
          line += `;o=${o};a=${a};t=${t};d=${d}`;
        }
      } else {
        line += `;${type}`;
      }

      dslLines.push(line);

      for (const child of children) {
        traverse(child, indent + "\t");
      }
    }

    try {
      traverse(jsonData);
    } catch (error) {
      Window.map.openNotificationWithIcon("error", "Format Error", error.message);
    }

    return dslLines.join("\n");
  }

  /**
   * Exports the attack tree data in CSV format.
   */
  exportCsvInput() {
    // Checks if scenario data exists which indicates the tree was generated
    if (this.props.scenarioData && this.props.scenarioData.length > 0) {
      const format = Window.map.detectFormat(Window.map.getTextAreaValue());
      var fileContent;

      if (format === "DSL") {
        try {
          fileContent = this.convertJsonToCsv(Window.map.getTreeData());
        } catch (error) {
          Window.map.openNotificationWithIcon("error", "Failed to convert to CSV", "");
          return;
        }
      } else if (format === "CSV") {
        fileContent = Window.map.getTextAreaValue();
      } else {
        Window.map.openNotificationWithIcon("error", "Unrecognized input text format", "");
        return;
      }

      var blob = new Blob([fileContent], {
        type: "text/csv;charset=utf-8",
      });
      saveAs(blob, "AttackTreeInput.csv");
    } else {
      Window.map.openNotificationWithIcon("error", "Generate tree before exporting CSV input file", "");
    }
  }

  /**
   * Converts JSON attack tree data into CSV format.
   * @param {Object} jsonData - JSON representation of the attack tree.
   * @return {string} CSV formatted string.
   */
  convertJsonToCsv(jsonData) {
    let csvLines = [];

    const traverse = (node, parentID = "", childIndex = 1) => {
      const { name, operator, o, a, t, d, children = [] } = node;

      // Compute hierarchical ID
      const nodeID = parentID ? `${parentID}.${childIndex}` : "1";

      // Determine node type mapping
      let type;
      if (children.length > 0) {
        if (!operator) {
          throw new Error(`Operator missing for node: ${name}`);
        }
        type = operator === "AND" ? "A" : operator === "OR" ? "O" : "Unknown";
      } else {
        type = "T"; // Leaf node
      }

      // Format CSV line
      const csvFriendlyName = this.escapeCsvValue(name);
      let line = `${type},${nodeID},${csvFriendlyName}`;

      // Append metrics if it's a leaf node
      if (type === "T" && o !== undefined && a !== undefined && t !== undefined && d !== undefined) {
        line += `,${o},${a},${t},${d}`;
      }

      csvLines.push(line);

      // Recursively process children with correct numbering
      children.forEach((child, index) => {
        traverse(child, nodeID, index + 1);
      });
    };

    try {
      traverse(jsonData);
    } catch (error) {
      Window.map.openNotificationWithIcon("error", "Format Error", error.message);
    }

    return csvLines.join("\n");
  }

  /**
   * Escapes special characters in CSV values.
   * @param {string} value - The value to be escaped for CSV.
   * @return {string} The escaped CSV value.
   */
  escapeCsvValue(value) {
    if (typeof value === "string") {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`; // Wrap in quotes and escape existing quotes
      }
    }
    return value;
  }

  toggleOpened = () => {
    // Checks if scenario data exists which indicates the tree was generated
    if (this.props.scenarioData && this.props.scenarioData.length > 0) {
      this.setState(
        {
          opened: !this.state.opened
        },
        () => {
          this.setState({translate: document.getElementsByClassName("rd3t-svg")[0].width.baseVal.value})
        }
      )
    } else {
      Window.map.openNotificationWithIcon("error", "Generate tree before exporting report", "");
    }
  };

  handleSave = () => {
    document
      .getElementsByClassName("ant-modal-body")[0]
      .insertAdjacentHTML(
        "beforeend",
        "<style>.highlight_link{stroke:red !important;stroke-width: 3;stroke-opacity: 1;}</style>"
      );
    [document.getElementsByClassName("ant-modal-body")[0]];
    var blob = new Blob(
      [document.getElementsByClassName("ant-modal-body")[0].innerHTML],
      { type: "text/plain;charset=utf-8" }
    );
    console.log(document.getElementsByClassName("ant-modal-body")[0]);
    saveAs(blob, "Report.html");
  };

  handleCancel = () => {
    this.setState({ opened: false });
  };

  /**
   * Function to generate recommendations for report.
   */
  generateRecommendations(scenarioData) {
    // Local map for metrics to full names.
    var metrics = {
      o: "Occurrence Score",
      a: "Attack Cost",
      t: "Technical Difficulty",
      d: "Discovery Difficulty",
    };
    // Define local variables to store rows and count for a unique key.
    var rows;
    var count = 2;
    // If data is defined.
    if (scenarioData) {
      // Create an empty array for rows.
      rows = [];
      // Iterate across metrics and check if value is defined.
      Object.keys(scenarioData["highestMetrics"]).forEach((metric) => {
        if (scenarioData["highestMetrics"][metric][0]) {
          // Push a recommendation to the rows array.
          rows.push(
            // Add a title element with the key being the count and the
            // formatted text of the node and metrics.
            <li>
              {'Node "' +
                scenarioData["highestMetrics"][metric][1] +
                '" with a ' +
                metrics[metric] +
                " of " +
                scenarioData["highestMetrics"][metric][0]}
            </li>
          );
          count++;
        }
      });
    }
    // Iterate across specific mitigation keys and add them as a header.
    Object.keys(scenarioData["specificMitigations"]).forEach((attack) => {
      rows.push(<h3>{attack}</h3>);
      // Iterate across each attack mitigation and add it to the list.
      for (
        var i = 0;
        i < scenarioData["specificMitigations"][attack].length;
        i++
      ) {
        console.log(scenarioData["specificMitigations"][attack][i]);
        rows.push(
          <li>
            <a
              key={"Mitigation" + i}
              href={scenarioData["specificMitigations"][attack][i]["Link"]}
              target="_blank"
            >
              {scenarioData["specificMitigations"][attack][i]["Mitigation"]}
            </a>
          </li>
        );
      }
    });
    return rows;
  }

  renderTrees() {
    var trees = [];
    if (this.props.scenarioData) {
      for (var i = 0; i < this.props.scenarioData.length; i++) {
        trees.push(
          <div key={i}>
            <h1>{this.props.scenarioData[i].name}</h1>
            <D3Tree
              reportGen={true}
              translate={this.state.translate}
              data={uiController.highlightTree(
                JSON.parse(JSON.stringify(this.props.originalTree)),
                this.props.scenarioData[i].path
              )}
            ></D3Tree>
            <Title key={0} level={2}>
              Recommendations for {this.props.scenarioData[i].name}
            </Title>
            <Title key={1} level={3}>
              Highest Metrics to be Mitigated:
            </Title>
            {this.generateRecommendations(this.props.scenarioData[i])}
          </div>
        );
      }
    }
    return trees;
  }

  fixSizing(){
    var treeContainers = document.getElementsByClassName("treeContainer");
    for (var i = 0; i < treeContainers.length; i++){
      treeContainers[i].style.height = document.getElementsByClassName("rd3t-svg")[0].height.baseVal.value
    }
  }

  fixHighlighting() {
    var test = document.getElementsByClassName("ant-modal-body")[1];
    if (test != null) {
      var highlight_links = test.getElementsByClassName("highlight_link");
      var svg_nodes = test.getElementsByClassName("rd3t-node");
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
  }

  /**
  * Exports the image of the attack tree in PDF format.
  */
  handleTreePdfSave = async () => {
    if (this.props.scenarioData && this.props.scenarioData.length > 0) {
      const treeContainer = document.querySelector(".rd3t-tree-container");
      const originalSvg = treeContainer.querySelector("svg");
      const svgClone = originalSvg.cloneNode(true);

      // Generate paths (connection lines)
      const paths = svgClone.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('stroke', 'black');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
        path.removeAttribute('marker-end');
        path.removeAttribute('marker-start');
      });

      const allPaths = Array.from(svgClone.querySelectorAll('path'));
      const mainGroup = svgClone.querySelector('g');
      if (mainGroup && allPaths.length > 0) {
        allPaths.forEach(path => {
          mainGroup.insertBefore(path, mainGroup.firstChild);
        });
      }

      // Process the foreignObject elements (the nodes and text boxes)
      const foreignObjects = svgClone.querySelectorAll('foreignObject');
      for (const foreignObject of foreignObjects) {
        const g = await Window.map.convertForeignObjectToSvg(foreignObject, false);
        if (g) {
          foreignObject.parentNode.replaceChild(g, foreignObject);
        }
      }

      const treeBox = originalSvg.getBBox();
      const margin = 50;
      let width = treeBox.width + (margin * 2);
      let height = treeBox.height + (margin * 2);

      const MAX_PDF_DIMENSION = 14400;

      let scale = 1;
      if (width > MAX_PDF_DIMENSION || height > MAX_PDF_DIMENSION) {
        const widthScale = MAX_PDF_DIMENSION / width;
        const heightScale = MAX_PDF_DIMENSION / height;
        scale = Math.min(widthScale, heightScale) * 0.95;

        width *= scale;
        height *= scale;
      }

      // Center the tree
      svgClone.setAttribute('viewBox',
        `${treeBox.x - margin} ${treeBox.y - margin} ${treeBox.width + margin * 2} ${treeBox.height + margin * 2}`
      );

      const pdf = new jsPDF({
        orientation: height > width ? 'portrait' : 'landscape',
        unit: 'pt',
        format: [width, height]
      });

      try {
        const tempContainer = document.createElement('div');
        tempContainer.appendChild(svgClone);
        document.body.appendChild(tempContainer);

        await svg2pdf(svgClone, pdf, {
          x: 0,
          y: 0,
          width: width,
          height: height
        });

        pdf.save('Attack_Tree.pdf');
        document.body.removeChild(tempContainer);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    } else {
      Window.map.openNotificationWithIcon("error", "Generate tree before exporting PDF file", "");
    }
  };

  render() {
    const { opened, count } = this.state;
    return (
      <div>
        <Menu
          selectable={false}
          onClick={this.handleClick}
          //selectedKeys={[current]}
          mode="horizontal"
        >
          <SubMenu key="SubMenu1" icon={<SettingOutlined />} title="File">
            <SubMenu key="SubMenu3" icon={<UploadOutlined />} title="Import File">
              <Menu.Item key="setting:1" icon={<FileTextOutlined />}>
                <Upload
                  key="upload-dsl"
                  accept=".txt"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      uiController.getImportedFile(e.target.result);
                    };
                    reader.readAsText(file);
                    // Prevent upload
                    return false;
                  }}
                >
                  <Button>Import DSL</Button>
                </Upload>
              </Menu.Item>
              <Menu.Item key="setting:2" icon={<FileExcelOutlined />}>
                <Upload
                  key="upload-csv"
                  accept=".csv"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      uiController.getImportedFile(e.target.result);
                    };
                    reader.readAsText(file);
                    // Prevent upload
                    return false;
                  }}
                >
                  <Button>Import CSV</Button>
                </Upload>
              </Menu.Item>
            </SubMenu>
            <Menu.Item key="setting:4" icon={<FileOutlined />}>
              Generate Report
            </Menu.Item>
            <SubMenu key="SubMenu4" icon={<DownloadOutlined />} title="Export Input File">
              <Menu.Item key="setting:5" icon={<FileTextOutlined />}>
                Export DSL Input
              </Menu.Item>
              <Menu.Item key="setting:6" icon={<FileExcelOutlined />}>
                Export CSV Input
              </Menu.Item>
            </SubMenu>
            <Menu.Item key="setting:7" icon={<FileImageOutlined />} onClick={this.handleSvgSave.bind(this)}>
              Export SVG
            </Menu.Item>
            <Menu.Item key="setting:8" icon={<FileImageOutlined />}>
              Export PDF
            </Menu.Item>
            <Menu.Item key="setting:9" icon={<FileExcelOutlined />}>
              Export Scenarios
            </Menu.Item>
            <Menu.Item key="setting:10" icon={<FileExcelOutlined />}>
              Export Terminal Nodes
            </Menu.Item>
          </SubMenu>
          <SubMenu key="SubMenu2" icon={<DesktopOutlined />} title="View">
            {this.props.enableRecommendation ? (
              <Menu.Item key="setting:3">Disable Recommendations</Menu.Item>
            ) : (
              <Menu.Item key="setting:3">Enable Recommendations</Menu.Item>
            )}
          </SubMenu>
        </Menu>
        <Modal
          title={
            <div>
              <h1>Report Preview</h1>
              <Button onClick={this.handleCancel}>Cancel</Button>
              <Button onClick={this.handleSave}>Save Report</Button>
            </div>
          }
          closable={false}
          visible={opened}
          key="modal"
          footer={null}
          width="320"
        >
          <h1>Original Tree</h1>
          <D3Tree
            key="og"
            data={this.props.originalTree ? this.props.originalTree : {}}
            reportGen={true}
            translate={this.state.translate}
          ></D3Tree>
          {this.renderTrees()}
        </Modal>
        {this.fixSizing()}
      </div>
    );
  }
}

export default MenuBar;
