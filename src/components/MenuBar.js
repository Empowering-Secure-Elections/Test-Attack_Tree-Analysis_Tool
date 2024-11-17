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
        this.handleCsvSave();
        break;
      case "setting:7":
        this.handleTreePdfSave();
        break;
      case "setting:8":
        Window.map.handleScenarioPdfSave();
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
  handleCsvSave = () => {
    // Checks to see if there are scenarios
    if (this.props.scenarioData && this.props.scenarioData.length > 0) {
      const fileContent = this.props.scenarioData.map((scenario) => {
        const path = scenario.namepath.join(" -> "); // Use "->" for path
        return `${scenario.name},${scenario.o},${path}`;
      }).join("\n");
  
      var blob = new Blob([fileContent], {
        type: "text/csv;charset=utf-8",
      });
      saveAs(blob, "Scenarios.csv");
    } else {
      Window.map.openNotificationWithIcon("error", "Generate tree before exporting CSV file", "");
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
        const g = await this.convertForeignObjectToSvg(foreignObject);
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

  /**
  * Formats the foreign objects for svg. For the tree pdf save method.
  */
  convertForeignObjectToSvg = async (object) => {
    const div = object.querySelector('div');
    if (!div) return;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const transform = object.getAttribute('transform');
    const translateMatch = transform ? transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/) : null;
    const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
    const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;

    g.setAttribute('transform', `translate(${translateX},${translateY})`);

    // Handle operator node images
    const img = div.querySelector('img');
    if (img) {
      const operatorBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      operatorBg.setAttribute("x", "-20");
      operatorBg.setAttribute("y", "-40");
      operatorBg.setAttribute("width", "40");
      operatorBg.setAttribute("height", "40");
      operatorBg.setAttribute("fill", "white");
      operatorBg.setAttribute("rx", "5");
      g.appendChild(operatorBg);

      const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
      const imgSrc = img.alt.toUpperCase().includes('AND') ? AND : OR;

      image.setAttributeNS("http://www.w3.org/1999/xlink", "href", imgSrc);
      image.setAttribute("width", "40");
      image.setAttribute("height", "40");
      image.setAttribute("x", "-20");
      image.setAttribute("y", "-40");
      g.appendChild(image);
    }

    // Handle text content
    const textDiv = div.querySelector('div') || div;
    const textContent = textDiv.textContent;
    if (textContent) {
      if (img) {
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

        // Process words into lines
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

        // Process words into lines
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
            <Menu.Item key="setting:7" icon={<FileImageOutlined />}>
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
