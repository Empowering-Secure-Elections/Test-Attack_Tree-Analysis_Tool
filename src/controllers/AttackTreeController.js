import TreeAnalyzerController from "./TreeAnalyzerController";

export default class AttackTreeController {

  /**
   * Parse the input text based on its detected format.
   * @param {string} text A string to parse.
   */
  parseInput(text) {
    const format = Window.map.detectFormat(text);

    if (format === "DSL") {
      this.parseDSL(text);
    } else if (format === "CSV") {
      this.parseCSV(text);
    } else {
      Window.map.openNotificationWithIcon(
        "error",
        "Format Error",
        "Input format is not recognized"
      );
    }
  }

  /**
   * Checks if the format of DSL input is in the expected tab-indented pattern.
   * @param {string} text The DSL input to validate.
   * @returns {Array} Whether the input is valid or not.
   */
  patternMatch(text) {
    // D3 library also sanitizes input (e.g., won't allow tabs, cleans whitespace).
    const lineRegex = /^(\t*[\W|\w|\s]+)$/g;
    var str = text.match(lineRegex);
    // If we do not match on the regex or str includes tab (potentially in the name) or str is blank
    if (str == null || this.getLineText(str[0]).includes("\t") || !text.trim()) {
      // Return a format error.
      return [false, "Format Error", "Line must have tabs followed by text"];
    }
    return [true];
  }

  /**
   * Calculates the number of tabs for a line.
   * @param {string} line A line to calculate the number of tabs.
   * @return {number} The number of tabs.
   */
  calcNumberOfTabs(line) {
    var numOfTabs = 0;
    var start = 0;
    while (line.charAt(start++) === "\t") numOfTabs++;
    // Return numOfTabs + 1 because we start at depth of 1.
    return numOfTabs + 1;
  }

  /**
   * Gets the text for a line.
   * @param {string} line A line to get the text.
   * @return {string} The text of the line.
   */
  getLineText(line) {
    var words = line.split(/^\t*/g);
    if (words.length === 1) {
      return words[0];
    }
    return words[1];
  }

  /**
   * Verify the pattern.
   * @param {number} curr_num A current line number of tabs.
   * @param {number} prev_num A previous line number of tabs.
   * @param {string} prevLineType A previous line type.
   * @return {Array} The result of verifying the pattern.
   */
  patternVerify(curr_num, prev_num, prevLineType) {
    //let pipeSplit = text.split("|");
    if (!(curr_num > 1 && curr_num <= parseInt(prev_num, 10) + 1)) {
      return [false, "Syntax Error", "Tab Indentation Error"];
    }

    //check if prev line was a node, then currNum must be greater
    if (prevLineType === "Node") {
      if (!(curr_num > prev_num)) {
        console.log("node cannot");
        return [false, "Syntax Error", "Node should be child of previous line"];
      }
    }

    //check if prev line was a leaf, then curr num must be less or equal
    if (prevLineType === "Leaf") {
      if (!(curr_num <= prev_num)) {
        console.log("leaf cannot");
        return [false, "Syntax Error", "Leaf cannot have children"];
      }
    }

    return [true];
  }

  /**
   * Show an error.
   * @param {string} title A title for an error.
   * @param {string} description A description for an error.
   * @param {number} lineNum A line number.
   */
  showError(title, description, lineNum) {
    Window.map.openNotificationWithIcon(
      "error",
      title,
      "Error at line " + lineNum + ": \n" + description
    );
  }

  /**
   * Parse the DSL.
   * @param {string} text A line of text.
   * @return {Array} The result of verifying the pattern.
   */
  parseDSL(text) {
    text = text.trim();
    var output = "";
    var lines = text.split("\n");

    //initial pass on text to ensure it has good form
    for (var i = 0; i < lines.length; i++) {
      var result = this.patternMatch(lines[i]);
      if (result[0] === false) {
        this.showError(result[1], result[2], i + 1);
        return;
        // stop execution
      }
    }

    var identifier = 0;

    //regex for node syntax
    const nodeRegex = /\w+;(OR|AND)$/g;

    //stacks
    var squareBrackets = [];
    var curlyBraces = [];

    // The number of tabs is really the depth level.
    var prevLineNum = this.calcNumberOfTabs(lines[0]);

    if (prevLineNum !== 1) {
      console.log("Should start with no tab");
      this.showError("Start Tab", "Should start with no tab", 1);
      return;
    }
    var second_split = this.getLineText(lines[0]).split(";");

    output += "[{";
      output += "\"ID\": " + identifier + ",";
      identifier++;

    if (lines.length === 1) {
      //must be leaf
      let metricsVerif = this.verifyMetrics(second_split);
      if (!metricsVerif[0]) {
        console.log("Metrics Bad");
        this.showError(metricsVerif[1], metricsVerif[2], 1);
        return;
        // stop execution
      }
      //check for metrics
      output += '"name":"' + second_split[0] + '"';
      let metrics_map = this.getLeafMetrics(second_split);
      //iterate over key, value pairs in metrics mapping
      for (const [key, value] of Object.entries(metrics_map)) {
        output += ',"' + key + '": ' + value;
      }
      squareBrackets.push("]");
      curlyBraces.push("}");
    } else {
      //must be node
      if (this.getLineText(lines[0]).match(nodeRegex) === null) {
        console.log("Node syntax bad");
        this.showError("Verification Error", "Must be <text>;<OR|AND>", 1);
        return;
        // stop execution
      }
      output +=
        '"name":"' +
        second_split[0] +
        '", "operator":"' +
        second_split[1] +
        '"';
      squareBrackets.push("]");
      curlyBraces.push("}");
    }

    var prevLineType = "Node";

    var curr_num;
    var prev_num;
    for (i = 1; i < lines.length; i++) {
      prev_num = prevLineNum;
      curr_num = this.calcNumberOfTabs(lines[i]);
      var result = this.patternVerify(curr_num, prev_num, prevLineType);
      if (!result[0]) {
        this.showError(result[1], result[2], i + 1);
        return;
        // stop execution
      }

      second_split = this.getLineText(lines[i]).split(";");

      // if curr node is not a neighbor to previous node
      // or is a level above the previous node
      if (curr_num < prev_num) {
        var count = Math.abs(prev_num - curr_num);
        for (var j = 0; j < count; j++) {
          output += curlyBraces.pop();
          output += squareBrackets.pop();
          if (j === count - 1) {
            output += curlyBraces.pop();
            output += ",";
          }
        }
      } else if (curr_num > prev_num) {
        output += ', "children": [';
        squareBrackets.push("]");
      } else {
        output += curlyBraces.pop() + ",";
      }

      output += "{";
      output += "\"ID\": " + identifier + ",";
      identifier++;
      curlyBraces.push("}");

      // Identifying leaf nodes:
      if (i < lines.length - 1) {
        var next_num = this.calcNumberOfTabs(lines[i + 1]);
        if (next_num <= curr_num) {
          prevLineType = "Leaf";
          //verify metrics before
          let metricsVerif = this.verifyMetrics(second_split);
          if (!metricsVerif[0]) {
            this.showError(metricsVerif[1], metricsVerif[2], i + 1);
            console.log("Metrics Bad");
            return;
            // stop execution
          }
          //check for metrics
          output += '"name":"' + second_split[0] + '"';
          let metrics_map = this.getLeafMetrics(second_split);
          //iterate over key, value pairs in metrics mapping
          for (const [key, value] of Object.entries(metrics_map)) {
            output += ',"' + key + '":' + value;
          }

        } else {
          prevLineType = "Node";
          // verify node snytax

          // the actual text for the node for the current line
          // Get the unsplit version of the actual text.
          if (this.getLineText(lines[i]).match(nodeRegex) === null) {
            console.log(lines[i]);
            console.log("Node syntax bad");
            this.showError(
              "Verification Error",
              "Must be <text>;<OR|AND>",
              i + 1
            );
            return;
            // stop execution
          }
          output +=
            '"name":"' +
            second_split[0] +
            '","operator":"' +
            second_split[1] +
            '"';
        }
      } else {
        let metricsVerif = this.verifyMetrics(second_split);
        if (!metricsVerif[0]) {
          this.showError(metricsVerif[1], metricsVerif[2], i + 1);
          console.log("Metrics Bad");
          return;
          // stop execution
        }
        //check for metrics
        output += '"name":"' + second_split[0] + '"';
        let metrics_map = this.getLeafMetrics(second_split);
        //iterate over key, value pairs in metrics mapping
        for (const [key, value] of Object.entries(metrics_map)) {
          output += ',"' + key + '": ' + value;
        }
      }

      prevLineNum = curr_num;
    }

    console.log(squareBrackets.length);
    console.log(curlyBraces.length);
    count = squareBrackets.length;
    for (i = 0; i < count; i++) {
      output += curlyBraces.pop();
      output += squareBrackets.pop();
    }

    // Set tree data removing square brackets from start and end
    Window.map.openNotificationWithIcon(
      "success",
      "Tree Generation Successful",
      ""
    );
    output = output.substring(1, output.length - 1)
    Window.map.setTreeData(output);
    console.log(output)
    const treeAnalyzerController = new TreeAnalyzerController();
    Window.map.setScenarioData(treeAnalyzerController.analyzeTree(
      JSON.parse(output)
    ));
  }

  /**
   * Verify the metrics.
   * @param {string} metrics A string of metrics.
   * @return {Array} The result of verifying the metrics.
   */
  verifyMetrics(metrics) {
    // all metrics values we use in our system
    var metricsArr = ["o", "a", "t", "d"];
    var set = new Set();
    // Regex to ensure metrics are properly formatted.
    const regex = /^\w=(1\.0|[0]\.\d+|[0-5])$/g;
    for (var i = 1; i < metrics.length; i++) {
      //check for proper syntax
      if (metrics[i].match(regex) == null) {
        return [
          false,
          "Incorrect Leaf Syntax",
          "Leaf not formatted correctly. Should have <Text>;Optional Metrics",
        ];
      }
      var key_val = metrics[i].split("=");
      if (!metricsArr.includes(key_val[0])) {
        return [
          false,
          "Incorrect Metrics Syntax",
          "Metric(s) Value should be o,a,t, or d",
        ];
      }
      set.add(key_val[0]);
    }
    return [set.size === metrics.length - 1];
  }

  /**
   * Get the leaf metrics.
   * @param {string} metrics A string of metrics.
   * @return {object} The result getting the leaf metrics.
   */
  getLeafMetrics(metrics) {
    var output = {};
    //case where only name is provided
    if (metrics.length === 1) {
      return output;
    }
    for (var i = 1; i < metrics.length; i++) {
      var key_val = metrics[i].split("=");
      output[key_val[0]] = key_val[1];
    }
    return output;
  }

  /**
   * Parses the CSV-formatted text.
   * @param {string} text - The CSV input.
   */
  parseCSV(text) {
    const lines = text.trim().split("\n");
    const nodes = new Map();
    let rootCount = 0;
    let hasMetrics = null; // null = undecided, true = must have, false = must not have

    for (let i = 0; i < lines.length; i++) {
      let result = this.patternMatch(lines[i]);
      if (result[0] === false) {
        this.showError(result[1], result[2], i + 1);
        return;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length < 4) {
        this.showError("Invalid Row Format", "Each row must have at least 4 columns (ID, Parent ID, Name, Type).", i + 1);
        return;
      }

      // Parse ID
      const ID = parseInt(parts[0], 10);
      if (isNaN(ID)) {
        this.showError("Invalid ID", `Invalid ID '${parts[0]}'.`, i + 1);
        return;
      }

      // Parse Parent ID
      let parentID = parts[1].trim() ? parseInt(parts[1], 10) : null;
      if (parentID !== null && isNaN(parentID)) {
        this.showError("Invalid Parent ID", `Invalid Parent ID '${parts[1]}'.`, i + 1);
        return;
      }

      // Check if parentID is the same as ID
      if (parentID !== null && parentID === ID) {
        this.showError("Invalid Parent Reference", `Node ID ${ID} cannot have itself as a parent.`, i + 1);
        return;
      }

      // Used to check how many root nodes exists
      if (parentID === null) {
        rootCount++;
      }

      // Parse Name
      const name = parts[2].trim();
      if (!name) {
        this.showError("Invalid Name", "Node name cannot be blank.", i + 1);
        return;
      }

      // Parse Type
      let type = parts[3].trim();
      if (!["OR", "AND", "LEAF"].includes(type)) {
        this.showError("Invalid Node Type", `Invalid node type '${type}'.`, i + 1);
        return;
      }

      // Create node object
      let node = { ID, name };
      if (type === "OR" || type === "AND") {
        node.operator = type;
        node.children = [];
      } else if (type === "LEAF") {
        let o = parts[4] ? parseFloat(parts[4]) : null;
        let a = parts[5] ? parseFloat(parts[5]) : null;
        let t = parts[6] ? parseFloat(parts[6]) : null;
        let d = parts[7] ? parseFloat(parts[7]) : null;

        // Check if some but not all metrics are listed
        const metrics = [o, a, t, d];
        const hasAnyMetric = metrics.some(m => m !== null);
        const hasAllMetrics = metrics.every(m => m !== null);
        if (hasAnyMetric && !hasAllMetrics) {
          this.showError("Incomplete Metrics", "Either no metrics or all four metrics (o, a, t, d) must be listed.", i + 1);
          return;
        }

        // Validate the all-or-none rule for leaf node metrics
        let hasCurrentMetrics = o !== null || a !== null || t !== null || d !== null;
        if (hasMetrics === null) {
          hasMetrics = hasCurrentMetrics; // Set initial state
        } else if (hasMetrics !== hasCurrentMetrics) {
          this.showError("Inconsistent Metrics", "Either all or no leaf nodes should have metrics listed.", i + 1);
          return;
        }

        // If using metrics, ensure they are all valid numbers
        if (hasMetrics) {
          if (isNaN(o) || isNaN(a) || isNaN(t) || isNaN(d)) {
            this.showError("Invalid Metrics", "Metrics must be numbers.", i + 1);
            return;
          }
          node.o = o;
          node.a = a;
          node.t = t;
          node.d = d;
        }
      }

      nodes.set(ID, node);
    }

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(",");
      const ID = parseInt(parts[0], 10);
      let parentID = parts[1].trim() ? parseInt(parts[1], 10) : null;

      if (parentID !== null && !nodes.has(parentID)) {
        this.showError("Invalid Parent Reference", `Parent ID ${parentID} does not match any existing node ID.`, i + 1);
        return;
      }
    }

    // Checks if there is one root node
    if (rootCount === 0) {
      this.showError("No Root Node", "There must be one root node (a node without a Parent ID).", 1);
      return;
    } else if (rootCount > 1) {
      this.showError("Multiple Root Nodes", "There can only be one root node (a node without a Parent ID).", 1);
      return;
    }

    text = text.trim();
    try {
      // Convert CSV to JSON structure
      const jsonTree = this.convertCSVToJSON(text);

      // Notify user of success
      Window.map.openNotificationWithIcon(
        "success",
        "Tree Generation Successful",
        ""
      );

      // Convert JSON to string and set the tree data
      const output = JSON.stringify(jsonTree);
      Window.map.setTreeData(output);
      console.log(output);

      // Analyze the tree and set scenario data
      const treeAnalyzerController = new TreeAnalyzerController();
      Window.map.setScenarioData(treeAnalyzerController.analyzeTree(jsonTree));

    } catch (error) {
      console.error("Error parsing CSV:", error);
      Window.map.openNotificationWithIcon(
        "error",
        "Tree Generation Failed",
        "Invalid CSV format"
      );
    }
  }

  /**
   * Converts a CSV string into a JSON structure.
   * @param {string} text - The CSV input.
   * @returns {Object} - The root node of the generated JSON tree.
   */
  convertCSVToJSON(text) {
    const lines = text.trim().split("\n");
    const nodes = new Map();
    let root = null;

    for (const line of lines) {
      const parts = line.split(",");
      const ID = parseInt(parts[0], 10);
      const parentID = parts[1] ? parseInt(parts[1], 10) : null;
      const name = parts[2].trim();
      let type = parts[3]?.trim();

      // Ensure node exists in map
      if (!nodes.has(ID)) {
        nodes.set(ID, { ID, name });
      }

      let node = nodes.get(ID);
      node.name = name; // Update name in case it was missing before

      if (type === "OR" || type === "AND") {
        node.operator = type; // Use "operator" instead of "type"
        node.children = []; // Ensure children array exists for OR/AND nodes
      } else if (type === "LEAF") {
        // Handle leaf nodes and optional metrics
        let o = null, a = null, t = null, d = null;
        if (parts.length > 4) {
          o = parts[4] ? parseFloat(parts[4]) : null;
          a = parts[5] ? parseFloat(parts[5]) : null;
          t = parts[6] ? parseFloat(parts[6]) : null;
          d = parts[7] ? parseFloat(parts[7]) : null;
        }

        if (o !== null && a !== null && t !== null && d !== null) {
          node.o = o;
          node.a = a;
          node.t = t;
          node.d = d;
        }
      }

      // Attach to parent if applicable
      if (parentID === null) {
        root = node;
      } else {
        if (!nodes.has(parentID)) {
          nodes.set(parentID, { ID: parentID, children: [] });
        }
        let parent = nodes.get(parentID);

        if (!parent.children) {
          parent.children = []; // Ensure parent has children array
        }

        parent.children.push(node);
      }
    }

    return root;
  }

}
