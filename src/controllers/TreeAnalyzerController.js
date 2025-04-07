import { attackPatterns } from "../assets/AttackPatterns";
export default class TreeAnalyzerController {
  /**
   * Analyzes a tree.
   * @param {object} tree A tree.
   * @return {Array} The list of paths.
   */
  analyzeTree(tree) {
    console.log("Computing Scenarios");
    // Initialize empty path severity array.
    var pathSeverity = [];
    // Array to hold metric characters.
    var metrics = ["o", "a", "t", "d"];
    // Get the generated paths for a tree.
    var paths = this.generatePaths(tree);
    // Iterate across paths and add to the front of pathSeverity.
    // Creating an object with an empty id array and a 0 severity.
    for (var i = 0; i < paths.length; i++) {
      // Initialize object to hold 4 highest metrics for the path
      var highestMetrics = {};
      //Initialize object to hold specific mitigations
      var specificMitigations = {};

      pathSeverity.unshift({
        path: [],
        namepath: [], // To store the path of nodes by their names
        severity: 0,
        highestMetrics: {},
        o: -1,
        a: [],
        t: [],
        d: [],
        tupledSeverity: "",
      });
      // Iterate across the nodes in each path and push that node to the path.
      for (var j = 0; j < paths[i].length; j++) {
        // Check if leaf first, if so, determine if it has highest metrics in path.
        if (paths[i][j]["metrics"]) {
          metrics.forEach((metric) => {
            if (
              !highestMetrics[metric] ||
              !highestMetrics[metric][0] ||
              highestMetrics[metric][0] < paths[i][j]["metrics"][metric]
            ) {
              highestMetrics[metric] = [
                paths[i][j]["metrics"][metric],
                paths[i][j]["name"],
              ];
            }
          });

          console.log(paths[i][j]["metrics"]);
          if (paths[i][j]["metrics"]["o"] !== undefined) {
            if (pathSeverity[0]["o"] == -1) {
              pathSeverity[0]["o"] = paths[i][j]["metrics"]["o"];
            } else {
              pathSeverity[0]["o"] *= paths[i][j]["metrics"]["o"];
            }
          }

          if (paths[i][j]["metrics"]["a"] !== undefined) {
            pathSeverity[0]["a"].push(paths[i][j]["metrics"]["a"]);
          }

          if (paths[i][j]["metrics"]["t"] !== undefined) {
            pathSeverity[0]["t"].push(paths[i][j]["metrics"]["t"]);
          }

          if (paths[i][j]["metrics"]["d"] !== undefined) {
            pathSeverity[0]["d"].push(paths[i][j]["metrics"]["d"]);
          }
        }

        // Add to the severity each of the valued weights.
        pathSeverity[0]["severity"] += paths[i][j]["value"];
        pathSeverity[0]["path"].push(paths[i][j]["id"]);
        pathSeverity[0]["namepath"].push(paths[i][j]["name"]);

        // Loop over each specific recommendation and check if it's in the node name.
        for (const [key, value] of Object.entries(attackPatterns)) {
          if (paths[i][j]["name"].toLowerCase().includes(key.toLowerCase())) {
            specificMitigations[key] = value;
          }
        }
      }
      pathSeverity[0]["highestMetrics"] = highestMetrics;
      pathSeverity[0]["specificMitigations"] = specificMitigations;
    }
    // Sort array in decreasing order by severity.
    pathSeverity.sort((a, b) => b.severity - a.severity);
    for (var i = 0; i < pathSeverity.length; i++) {
      pathSeverity[i]["name"] = "Scenario " + (i + 1);
      pathSeverity[i]["key"] = i + 1;
    }
    for (var i = 0; i < pathSeverity.length; i++) {
      if (pathSeverity[i]["severity"] == 0) {
        pathSeverity[i]["severity"] = "N/A";
      }
      if (pathSeverity[i]["o"] == -1) {
        pathSeverity[i]["o"] = "N/A";
      } else {
        pathSeverity[i]["o"] = pathSeverity[i]["o"].toFixed(8); // to output up to 8 decimal places
      }
      
      if (pathSeverity[i]["a"].length == 0) {
        console.log("in N/A")
        console.log(pathSeverity[i]["a"])
        pathSeverity[i]["a"] = "N/A";
      } else {
        console.log("Not in N/A")
        console.log(pathSeverity[i]["a"])
        var sum = 0;
        for (var j = 0; j < pathSeverity[i]["a"].length; j++) {
          sum += pathSeverity[i]["a"][j];
        }
        pathSeverity[i]["a"] = (sum / pathSeverity[i]["a"].length).toFixed(4);
      }
      
      if (pathSeverity[i]["t"].length == 0) {
        pathSeverity[i]["t"] = "N/A";
      } else {
        var sum = 0;
        for (var j = 0; j < pathSeverity[i]["t"].length; j++) {
          sum += pathSeverity[i]["t"][j];
        }
        pathSeverity[i]["t"] = (sum / pathSeverity[i]["t"].length).toFixed(4);
      }
      
      if (pathSeverity[i]["d"].length == 0) {
        pathSeverity[i]["d"] = "N/A";
      } else {
        var sum = 0;
        for (var j = 0; j < pathSeverity[i]["d"].length; j++) {
          sum += pathSeverity[i]["d"][j];
        }
        pathSeverity[i]["d"] = (sum / pathSeverity[i]["d"].length).toFixed(4);
      }
    }
    console.log(pathSeverity);
    return pathSeverity;
  }

  /**
   * Calculates the paths for a tree and weights for each node.
   * @param {object} tree A tree.
   * @return {Array} The list of paths.
   */
  generatePaths(tree) {
    let paths = [];
    let stack = [{ node: tree, path: [] }];
    while (stack.length > 0) {
      let { node, path } = stack.pop();
      let currentNodeInfo = {
        id: node["ID"],
        value: this.calculateAverage(node),
        metrics: this.getMetrics(node),
        name: node["name"],
      };
      let currentPath = [...path, currentNodeInfo];
      // Leaf node
      if (!("children" in node) || node.children.length === 0) {
        paths.push(currentPath);
        continue;
      }
      if (node["operator"] === "OR") {
        // For "OR", just explore each child independently
        for (let child of node.children) {
          stack.push({ node: child, path: currentPath });
        }
      } else if (node["operator"] === "AND") {
        // For "AND", combine paths from all children
        let childPaths = [[]];
        for (let child of node.children) {
          let subPaths = this.generatePaths(child);
          let newChildPaths = [];
          for (let base of childPaths) {
            for (let sub of subPaths) {
              newChildPaths.push([...base, ...sub]);
            }
          }
          childPaths = newChildPaths;
        }
        // Now prefix current node to each combined child path
        for (let childPath of childPaths) {
          paths.push([...currentPath, ...childPath]);
        }
      }
    }
    return paths;
  }

  getMetrics(tree) {
    return { o: tree["o"], a: tree["a"], t: tree["t"], d: tree["d"] };
  }

  /**
   * Calculates the average for a given set of metrics.
   * @param {object} leaf the leaf node to calculate the average
   * @return {number} The number representing the average of the metrics.
   */
  calculateAverage(leaf) {
    var metrics = ["o", "a", "t", "d"];
    var weight = 0;
    // Counter for the number of metrics actually present.
    var num = 0;
    // Iterate across metrics list and check if present in leaf.
    for (var i = 0; i < metrics.length; i++) {
      if (metrics[i] in leaf) {
        // Add to the weight and increment the number of metrics.
        weight += leaf[metrics[i]];
        num++;
      }
    }
    // Return the weight if num is 0, otherwise return the average.
    return num === 0 ? weight : weight / num;
  }
}
