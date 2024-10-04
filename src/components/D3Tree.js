import React from "react";
import Tree from "react-d3-tree";
import AND from "../assets/AND.png";
import AND_RED from "../assets/AND_RED.png";
import OR from "../assets/OR.png";
import OR_RED from "../assets/OR_RED.png";


const nodeSize = { x: 275, y: 150 };

const foreignObjectProps = {
  width: nodeSize.x ,
  height: nodeSize.y,
  x: -50,
  y: -55,
};

class D3Tree extends React.Component {
  renderHighlightedLeaf(nodeDatum, toggleNode) {
    const textWidth = nodeDatum.name.length * 1.5; // Adjust the factor as needed for desired width
    const boxWidth = textWidth + 35 ; // Add padding
    const boxHeight = 90; // Set a fixed height or adjust as needed
    return (
      <g>
        <foreignObject width={boxWidth} height={boxHeight} x={-boxWidth / 2} y={-boxHeight / 50} onClick={toggleNode}>
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", border: "1px solid red" }}>
            {nodeDatum.name}
          </div>
        </foreignObject>
      </g>
    );
  }

  renderLeaf(nodeDatum, toggleNode) {
    const textWidth = nodeDatum.name.length * 2; // Adjust the factor as needed for desired width
    const boxWidth = textWidth + 50 ; // Add padding
    const boxHeight = 90; // Set a fixed height or adjust as needed
  
    return (
      <g>
        <foreignObject width={boxWidth} 
        height={boxHeight} 
        x={-boxWidth / 2} 
        y={-boxHeight / 50} 
        onClick={toggleNode}>
          <div style={{ 
            width: "100%", 
            height: "100%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            textAlign: "center", 
            border: "1px solid black" }}>
            {nodeDatum.name}
          </div>
        </foreignObject>
      </g>
    );
  }
  

  renderHighlightedOrNode(nodeDatum, toggleNode, foreignObjectProps) {
    const textWidth = nodeDatum.name.length * 10; // Adjust the factor as needed for desired width
    const boxWidth = textWidth + 20 ; // Add padding
    const boxHeight = 50; // Set a fixed height or adjust as needed
    return (
      <g onClick={toggleNode}>
        <foreignObject {...foreignObjectProps}>
          <div
            style={{
              backgroundColor: "transparent", // modifying color
            }}
          >
            <img
              src={OR_RED}
              alt="or_red"
              style={{
                height: 50,
                position: "absolute",
                zIndex: 1,
                top: 5,
                left: 27,
                backgroundColor: "#f0f2f5",
              }}
            />
            <div
              style={{
                textAlign: "center",
                marginTop: 55,
                marginLeft: 5,
                fontWeight: "bold",
                zIndex: 1,
                backgroundColor: "#f0f2f5",
                width: boxWidth,
                height: boxHeight,
                backgroundColor: "#f0f2f5",
                border: "1px solid red",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
            >
              {nodeDatum.name}
            </div>
          </div>
        </foreignObject>
      </g>
    );
  }

  renderOrNode(nodeDatum, toggleNode, foreignObjectProps) {
    const textWidth = nodeDatum.name.length * 5; // Adjust the factor as needed for desired width
    const boxWidth = textWidth + 25; // Add padding
    const boxHeight = 50; // Set a fixed height or adjust as needed
    

    return (
      <g onClick={toggleNode}>
        <foreignObject {...foreignObjectProps}>
          <div
            style={{
              backgroundColor: "transparent", // modifying color
            }}
          >
            <img
              src={OR}
              alt="or"
              style={{
                height: 50,
                position: "absolute",
                zIndex: 1,
                top: 5,
                left: 27,
                backgroundColor: "#f0f2f5",
              }}
            />
            <div
              style={{
                textAlign: "center",
                marginTop: 55,
                marginLeft: 0,
                fontWeight: "bold",
                zIndex: 1,
                backgroundColor: "#f0f2f5",
                width: boxWidth,
                height: boxHeight,
                backgroundColor: "#f0f2f5",
                border: "1px solid black",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
            >
              {nodeDatum.name}
            </div>
          </div>
        </foreignObject>
      </g>
    );
  }

  renderHighlightedAndNode(nodeDatum, toggleNode, foreignObjectProps) {
    const textWidth = nodeDatum.name.length * 10; // Adjust the factor as needed for desired width
    const boxWidth = textWidth + 20 ; // Add padding
    const boxHeight = 50; // Set a fixed height or adjust as needed
    return (
      <g onClick={toggleNode}>
        <foreignObject {...foreignObjectProps}>
          <div
            style={{
              backgroundColor: "transparent", // modifying color
            }}
          >
            <img
              src={AND_RED}
              alt="and_red"
              style={{
                height: 50,
                position: "absolute",
                zIndex: 1,
                top: 5,
                left: 25,
                backgroundColor: "#f0f2f5",
              }}
            />
            <div
              style={{
                textAlign: "center",
                marginTop: 55,
                fontWeight: "bold",
                zIndex: 1,
                backgroundColor: "#f0f2f5",
                width: boxWidth,
                height: boxHeight,
                backgroundColor: "#f0f2f5",
                border: "1px solid red",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
            >
              {nodeDatum.name}
            </div>
          </div>
        </foreignObject>
      </g>
    );
  }

  renderAndNode(nodeDatum, toggleNode, foreignObjectProps) {
    const textWidth = nodeDatum.name.length * 5; // Adjust the factor as needed for desired width
    const boxWidth = textWidth + 25 ; // Add padding
    const boxHeight = 50; // Set a fixed height or adjust as needed
    return (
      <g onClick={toggleNode}>
        <foreignObject {...foreignObjectProps}>
          <div
            style={{
              backgroundColor: "transparent", // modifying color
            }}
          >
            <img
              src={AND}
              alt="and"
              style={{
                height: 50,
                position: "absolute",
                zIndex: 1,
                top: 4,
                left: 25,
                backgroundColor: "#f0f2f5",
              }}
            />
            <div
              style={{
                textAlign: "center",
                marginTop: 55,
                marginLeft: 5,
                fontWeight: "bold",
                zIndex: 1,
                backgroundColor: "#f0f2f5",
                width: boxWidth,
                height: boxHeight,
                backgroundColor: "#f0f2f5",
                border: "1px solid black",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
            >
              {nodeDatum.name}
            </div>
          </div>
        </foreignObject>
      </g>
    );
  }

  renderSvgNode = ({ nodeDatum, toggleNode, foreignObjectProps }) => {
    if (nodeDatum["highlight"]) {
      switch (nodeDatum["operator"]) {
        case "OR":
          return this.renderHighlightedOrNode(
            nodeDatum,
            toggleNode,
            foreignObjectProps
          );
        case "AND":
          return this.renderHighlightedAndNode(
            nodeDatum,
            toggleNode,
            foreignObjectProps
          );
        default:
          return this.renderHighlightedLeaf(nodeDatum, toggleNode);
      }
    } 
    //render non-highlighted nodes
    else {
      switch (nodeDatum["operator"]) {
        case "OR":
          return this.renderOrNode(nodeDatum, toggleNode, foreignObjectProps);
        case "AND":
          return this.renderAndNode(nodeDatum, toggleNode, foreignObjectProps);
        default:
          return this.renderLeaf(nodeDatum, toggleNode);
      }
    }
  };

  getDynamicPathClass = ({ source, target }, orientation) => {
    if (target.data.highlight) {
      // Target node has no children -> this link leads to a leaf node.
      return "highlight_link";
    } else {
      // Calculate adjustment for line length
      const adjustment = 20; // You can adjust this value as needed
  
      // Calculate new coordinates for the source and target based on the orientation
      let newX = target.x;
      let newY = target.y;
  
      if (orientation === "horizontal") {
        if (target.x > source.x) {
          newX -= adjustment;
        } else {
          newX += adjustment;
        }
      } else {
        if (target.y > source.y) {
          newY -= adjustment;
        } else {
          newY += adjustment;
        }
      }
  
      // Return class and adjusted coordinates
      return `default_link_${orientation}_${source.data.operator}_${target.data.operator}_${target.data.highlight ? "highlight" : "regular"}_${source.depth}_${target.depth}`;
    }
  };
  render() {
    console.log(this.props.reportGen);
    if (this.props.reportGen) {
      console.log(this.props.translate)
      return (
        <div className="treeContainer">
          <Tree
            orientation="vertical"
            data={this.props.data}
            translate={{ x: this.props.translate, y: 200}}
            renderCustomNodeElement={(rd3tProps) =>
              this.renderSvgNode({ ...rd3tProps, foreignObjectProps })
            }
            pathClassFunc={this.getDynamicPathClass}
            pathFunc="step"
            collapsible={this.props.reportGen ? false : true}
            zoom={this.props.reportGen ? (this.props.translate > 2000 ? 2 : 1) : 1}
            zoomable={this.props.reportGen ? false : true}
            hasInteractiveNodes={this.props.reportGen ? true : false}
            scaleExtent={this.props.reportGen ? { min: 1, max: 2 } : undefined}
          ></Tree>
        </div>
      );
    }
    return (
      <Tree
        orientation="vertical"
        data={this.props.data}
        translate={{ x: 600, y: 200 }}
        renderCustomNodeElement={(rd3tProps) =>
          this.renderSvgNode({ ...rd3tProps, foreignObjectProps })
        }
        pathClassFunc={this.getDynamicPathClass}
        pathFunc="step"
        collapsible={this.props.reportGen ? false : true}
        zoom={this.props.reportGen ? 2 : 1}
        zoomable={this.props.reportGen ? false : true}
        hasInteractiveNodes={this.props.reportGen ? true : false}
        scaleExtent={this.props.reportGen ? { min: 1, max: 2 } : undefined}
      ></Tree>
    );
  }
}
export default D3Tree;
