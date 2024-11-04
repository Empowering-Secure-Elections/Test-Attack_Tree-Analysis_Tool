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
  FileExcelOutlined
} from "@ant-design/icons";
import UIController from "../controllers/UIController";
import { getByTestId } from "@testing-library/dom";
import D3Tree from "./D3Tree";
import RecommendationBox from "./RecommendationBox";
import {SVG} from '@svgdotjs/svg.js'
import { svg2pdf } from 'svg2pdf.js';
import { jsPDF } from 'jspdf';
import AND from "../assets/AND.png";
import OR from "../assets/OR.png";

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
    this.setState({translate: document.getElementsByClassName("rd3t-svg")[0].width.baseVal.value})
  }

  handleClick = (e) => {
    console.log(e);
    switch (e.key) {
      case "setting:4":
        Window.map.showRecommendations();
        var message = this.props.enableRecommendation
          ? "Recommendations Disabled"
          : "Recommendations Enabled";
        Window.map.openNotificationWithIcon("success", message, "");
        break;
      case "setting:2":
        this.toggleOpened();
        break;
      case "setting:3":
        Window.map.exportDSL();
        break;
      case "setting:6":
        Window.map.exportScenarios();
        break;
      case "setting:7":
        this.handlePdfSave();
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

  convertObjectToSvg = async (object) => {
    const div = object.querySelector('div');
    if (!div) return;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Get the original transform and extract translation values
    const transform = object.getAttribute('transform');
    const translateMatch = transform ? transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/) : null;
    const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
    const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;

    // Set the transform on the group
    g.setAttribute('transform', `translate(${translateX},${translateY})`);

    // Handle operator images (AND/OR)
    const img = div.querySelector('img');
    if (img) {
      const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
      const imgSrc = img.alt.toUpperCase().includes('AND') ? AND : OR;

      image.setAttributeNS("http://www.w3.org/1999/xlink", "href", imgSrc);
      image.setAttribute("width", "40");
      image.setAttribute("height", "40");
      image.setAttribute("x", "-20");
      image.setAttribute("y", "-20");
      g.appendChild(image);
    }

    // Handle text content
    const textDiv = div.querySelector('div') || div;
    const textContent = textDiv.textContent;
    if (textContent) {
      const textWidth = textContent.length * 7 + 20;
      const textHeight = 30;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

      if (img) {
        rect.setAttribute("x", -textWidth / 2);
        rect.setAttribute("y", "25");
      } else {
        rect.setAttribute("x", -textWidth / 2);
        rect.setAttribute("y", -textHeight / 2);
      }

      rect.setAttribute("width", textWidth.toString());
      rect.setAttribute("height", textHeight.toString());
      rect.setAttribute("fill", "#f0f2f5");
      rect.setAttribute("stroke", "black");
      rect.setAttribute("stroke-width", "1");
      rect.setAttribute("rx", "5");
      g.appendChild(rect);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.textContent = textContent;

      if (img) {
        text.setAttribute("x", "0");
        text.setAttribute("y", "40");
      } else {
        text.setAttribute("x", "0");
        text.setAttribute("y", "0");
      }
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-family", "Arial");
      text.setAttribute("font-size", "12px");
      g.appendChild(text);
    }

    return g;
  };

  handlePdfSave = async () => {
    // Checks if scenario data exists which indicates the tree was generated
    if (this.props.scenarioData && this.props.scenarioData.length > 0) {
      const treeContainer = document.querySelector(".rd3t-tree-container");
      const originalSvg = treeContainer.querySelector("svg");

      if (!originalSvg) {
        console.error("No SVG element found in the tree container");
        return;
      }

      // Prevent multiple simultaneous exports
      if (this.isExporting) {
        return;
      }
      this.isExporting = true;

      const svgClone = originalSvg.cloneNode(true);

      // Fix the path elements (connection lines)
      const paths = svgClone.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('stroke', 'black');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
        path.removeAttribute('marker-end');
        path.removeAttribute('marker-start');
      });

      // Remove any existing marker definitions
      const defs = svgClone.querySelector('defs');
      if (defs) {
        defs.remove();
      }

      // Process all foreignObject elements
      const foreignObjects = svgClone.querySelectorAll('foreignObject');
      for (const foreignObject of foreignObjects) {
        const g = await this.convertObjectToSvg(foreignObject);
        if (g) {
          foreignObject.parentNode.replaceChild(g, foreignObject);
        }
      }

      // Ensure paths are rendered behind nodes
      const allPaths = Array.from(svgClone.querySelectorAll('path'));
      const mainGroup = svgClone.querySelector('g');
      if (mainGroup && allPaths.length > 0) {
        allPaths.forEach(path => {
          mainGroup.insertBefore(path, mainGroup.firstChild);
        });
      }

      // Get the actual dimensions of the tree
      const treeBox = originalSvg.getBBox();
      const margin = 50;

      // Calculate initial dimensions
      let width = treeBox.width + (margin * 2);
      let height = treeBox.height + (margin * 2);

      // PDF maximum dimensions (14400 userUnit)
      const MAX_PDF_DIMENSION = 14400;

      // Calculate scale if dimensions exceed maximum
      let scale = 1;
      if (width > MAX_PDF_DIMENSION || height > MAX_PDF_DIMENSION) {
        const widthScale = MAX_PDF_DIMENSION / width;
        const heightScale = MAX_PDF_DIMENSION / height;
        scale = Math.min(widthScale, heightScale) * 0.95; // 5% safety margin

        // Apply scale to dimensions
        width *= scale;
        height *= scale;
      }

      // Set viewBox to center the tree with scaling
      svgClone.setAttribute('viewBox',
        `${treeBox.x - margin} ${treeBox.y - margin} ${treeBox.width + margin * 2} ${treeBox.height + margin * 2}`
      );

      // Create PDF with scaled dimensions
      const pdf = new jsPDF({
        orientation: height > width ? 'portrait' : 'landscape',
        unit: 'pt',
        format: [width, height]
      });

      try {
        const tempContainer = document.createElement('div');
        tempContainer.appendChild(svgClone);
        document.body.appendChild(tempContainer);

        // Convert SVG to PDF with scaling
        await svg2pdf(svgClone, pdf, {
          x: 0,
          y: 0,
          width: width,
          height: height
        });

        pdf.save('attack_tree.pdf');
        document.body.removeChild(tempContainer);
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        this.isExporting = false;
      }
    } else {
      Window.map.openNotificationWithIcon("error", "Generate tree before exporting SVG file", "");
    }
  };

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
      o: "Occurrence Score",//was l
      a: "Attack Cost",//was v
      t: "Technical Difficulty", //was r
      d: "Discovery Difficulty", //was t
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
            <Menu.Item key="setting:1" icon={<UploadOutlined />}>
              <Upload
                key="upload"
                accept=".txt"
                showUploadList={false}
                beforeUpload={(file) => {
                  const reader = new FileReader();

                  reader.onload = (e) => {
                    uiController.getImportedDSL(e.target.result);
                  };
                  reader.readAsText(file);
                  // Prevent upload
                  return false;
                }}
              >
                <Button>Import DSL</Button>
              </Upload>
            </Menu.Item>
            <Menu.Item key="setting:2" icon={<FileOutlined />}>
              Generate Report
            </Menu.Item>
            <Menu.Item key="setting:3" icon={<DownloadOutlined />}>
              Export DSL
            </Menu.Item>
            <Menu.Item key="setting:5" icon={<FileImageOutlined />} onClick={this.handleSvgSave.bind(this)}>
              Export SVG
            </Menu.Item>
            <Menu.Item key="setting:6" icon={<FileExcelOutlined />}>
              Export CSV
            </Menu.Item>
            <Menu.Item key="setting:7" icon={<FileImageOutlined />} onClick={this.handlePdfSave.bind(this)}>
              Export PDF
            </Menu.Item>
          </SubMenu>
          <SubMenu key="SubMenu2" icon={<DesktopOutlined />} title="View">
            {this.props.enableRecommendation ? (
              <Menu.Item key="setting:4">Disable Recommendations</Menu.Item>
            ) : (
              <Menu.Item key="setting:4">Enable Recommendations</Menu.Item>
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
