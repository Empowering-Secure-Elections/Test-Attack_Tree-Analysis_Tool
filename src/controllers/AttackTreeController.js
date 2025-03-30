import TreeAnalyzerController from "./TreeAnalyzerController";

export default class AttackTreeController {

  /**
   * Parse the input text based on its detected format.
   * @param {string} text A string to parse.
   */
  parseInput(text) {
    const format = Window.map.detectFormat(text);

    if (format === "DSL") {
      console.log("dsl");
      this.parseDSL(text);
    } else if (format === "CSV") {
      console.log("csv");
      this.parseCSV(text);
    } else if (format === "TOO_SHORT") {
      Window.map.openNotificationWithIcon("error", "Input too short", "Input must be at least 3 lines long");
    } else {
      Window.map.openNotificationWithIcon("error", "Format Error", "Input format is not recognized");
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
    var identifier = 0;
    let metricsNo = null; // null = undecided, 0 = no metrics, 3 = three metrics, 4 = four metrics
    let weightA = 0.33, weightT = 0.33, weightD = 0.33; // Default weights

    const firstLineParts = lines[0].split(";");
    if (firstLineParts.length == 3 &&
      !isNaN(parseFloat(firstLineParts[0])) &&
      !isNaN(parseFloat(firstLineParts[1])) &&
      !isNaN(parseFloat(firstLineParts[2]))) {
      weightA = parseFloat(firstLineParts[0]);
      weightT = parseFloat(firstLineParts[1]);
      weightD = parseFloat(firstLineParts[2]);
      lines.shift(); // Remove the weights line
    }

    // Validate that weights sum to approximately 1 (with a 0.03 margin)
    const totalWeight = weightA + weightT + weightD;
    if (totalWeight < 0.97 || totalWeight > 1.03) {
      this.showError("Invalid Weights", `The sum of weights should be approximately 1, with a ±0.03 margin allowed for rounding. Found: ${totalWeight.toFixed(2)}.`, 1);
      return;
    }

    // Initial pass on text to ensure it has good form
    for (var i = 0; i < lines.length; i++) {
      var result = this.patternMatch(lines[i]);
      if (result[0] === false) {
        this.showError(result[1], result[2], i + 1);
        return;
        // stop execution
      }
    }

    const scaleResult = this.determineMetricScale(lines);
    const metricScale = scaleResult ? scaleResult.scale : null;

    //regex for node syntax
    const nodeRegex = /^[\w\s"'“”‘’\/\-()!@#$%&*~+_=?.,]+;(OR|AND)$/g;

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

    // first line must be a node
    if (this.getLineText(lines[0]).match(nodeRegex) === null) {
      console.log("Node syntax bad");
      this.showError("Verification Error", "Must be <text>;<OR|AND>", 1);
      return;
    }

    output +=
      '"name":"' +
      this.escapeDslQuotes(second_split[0]) +
      '", "operator":"' +
      second_split[1] +
      '"';
    squareBrackets.push("]");
    curlyBraces.push("}");

    var prevLineType = "Node";

    var curr_num;
    var prev_num;

    // First pass to detect the metrics format across all leaf nodes
    for (i = 1; i < lines.length; i++) {
      curr_num = this.calcNumberOfTabs(lines[i]);
      second_split = this.getLineText(lines[i]).split(";");

      // Identify leaf nodes
      if (i < lines.length - 1) {
        var next_num = this.calcNumberOfTabs(lines[i + 1]);
        if (next_num <= curr_num) {
          // This is a leaf node
          let metrics_map = this.getLeafMetrics(second_split);
          let currentMetricsNo; // Can be 0, 3, or 4

          // Check scale and metrics for nodes with metrics
          if (metrics_map.a == undefined && metrics_map.t == undefined && metrics_map.d == undefined && metrics_map.o == undefined) {
            currentMetricsNo = 0;
          } else if (Object.keys(metrics_map).length > 0) {
            // If scale hasn't been determined yet, try to determine it
            if (metricScale === null) {
              const scaleResult = this.determineMetricScale(lines.slice(i));
              if (scaleResult && scaleResult.scale) {
                metricScale = scaleResult.scale;
              }
            }

            // Validate metrics count
            if (metrics_map.a !== undefined && metrics_map.t !== undefined && metrics_map.d !== undefined) {
              if (metrics_map.o !== undefined) {
                currentMetricsNo = 4;
              } else {
                currentMetricsNo = 3;
              }
            } else {
              this.showError("Incomplete Metrics", "Either no metrics, three metrics (a, t, d), or four metrics (o, a, t, d) must be listed.", i + 1);
              return;
            }

            // Validate metrics against scale if scale is determined
            if (metricScale) {
              const metricsVerif = this.validateMetricsForScale(second_split, metricScale);
              if (!metricsVerif[0]) {
                this.showError(metricsVerif[1], metricsVerif[2], i + 1);
                return;
              }
            }

            // Set or validate metrics format consistency
            if (metricsNo === null) {
              metricsNo = currentMetricsNo;
            } else if (metricsNo !== currentMetricsNo) {
              this.showError(
                "Inconsistent Metrics",
                "All leaf nodes must have the same number of metrics: either none, three (a, t, d), or four (o, a, t, d).",
                i + 1
              );
              return;
            }
          }
        }
      } else if (i === lines.length - 1) {
        // Check the last line if it's a leaf
        let metrics_map = this.getLeafMetrics(second_split);
        let currentMetricsNo; // Can be 0, 3, or 4

        if (metrics_map.a == undefined && metrics_map.t == undefined && metrics_map.d == undefined && metrics_map.o == undefined) {
          currentMetricsNo = 0;
        } else if (metrics_map.a !== undefined && metrics_map.t !== undefined && metrics_map.d !== undefined) {
          if (metrics_map.o !== undefined) {
            currentMetricsNo = 4;
          } else {
            currentMetricsNo = 3;
          }
        } else if (Object.keys(metrics_map).length > 0) {
          this.showError("Incomplete Metrics", "Either no metrics, three metrics (a, t, d), or four metrics (o, a, t, d) must be listed.", i + 1);
          return;
        }

        if (metricsNo === null) {
          metricsNo = currentMetricsNo;
        } else if (metricsNo !== currentMetricsNo) {
          this.showError(
            "Inconsistent Metrics",
            "All leaf nodes must have the same number of metrics: either none, three (a, t, d), or four (o, a, t, d).",
            i + 1
          );
          return;
        }
      }
    }

    // Continue with existing processing but now we know the metrics format
    for (i = 1; i < lines.length; i++) {
      prev_num = prevLineNum;
      curr_num = this.calcNumberOfTabs(lines[i]);

      if (metricScale) {
        let metricsVerif = this.validateMetricsForScale(second_split, metricScale);
        if (!metricsVerif[0]) {
          this.showError(metricsVerif[1], metricsVerif[2], i + 1);
          return;
        }
      }

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

          // Verify metrics
          let metricsVerif = this.verifyMetrics(second_split);
          if (!metricsVerif[0]) {
            this.showError(metricsVerif[1], metricsVerif[2], i + 1);
            console.log("Metrics Bad");
            return;
            // stop execution
          }

          output += '"name":"' + this.escapeDslQuotes(second_split[0]) + '"';
          let metrics_map = this.getLeafMetrics(second_split);

          // Validate metrics against expected format (0, 3, or 4 metrics)
          let currentMetricsNo; // Can be 0, 3, or 4
          if (metrics_map.a == undefined && metrics_map.t == undefined && metrics_map.d == undefined && metrics_map.o == undefined) {
            currentMetricsNo = 0;
          } else if (metrics_map.a !== undefined && metrics_map.t !== undefined && metrics_map.d !== undefined) {
            if (metrics_map.o !== undefined) {
              currentMetricsNo = 4;
            } else {
              currentMetricsNo = 3;
              if (metricScale) {
                metrics_map.o = this.calculateMetricO(metrics_map.a, metrics_map.t, metrics_map.d, weightA, weightT, weightD, metricScale);
              } else {
                this.showError("Ambiguous metric scale", "Metric scale (0,1] or [1,5] could not be determined", i + 1);
                return;
              }
            }
          } else {
            this.showError("Incomplete Metrics", "Either no metrics, three metrics (a, t, d), or four metrics (o, a, t, d) must be listed.", i + 1);
            return;
          }

          // Check if metrics match the determined format
          if (metricsNo !== 0 && currentMetricsNo === 0) {
            this.showError("Missing Metrics", `Expected ${metricsNo} metrics but found none for this leaf node.`, i + 1);
            return;
          }

          // Add metrics to output
          for (const [key, value] of Object.entries(metrics_map)) {
            output += ',"' + key + '":' + value;
          }

        } else {
          prevLineType = "Node";

          // Verify node syntax

          // The actual text for the node for the current line
          // Get the unsplit version of the actual text.
          if (this.getLineText(lines[i]).match(nodeRegex) === null) {
            console.log(lines[i]);
            console.log("Node syntax bad");
            this.showError("Verification Error", "Must be <text>;<OR|AND>", i + 1);
            return;
            // stop execution
          }
          output +=
            '"name":"' +
            this.escapeDslQuotes(second_split[0]) +
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

        // Add name to output
        output += '"name":"' + this.escapeDslQuotes(second_split[0]) + '"';

        // Get metrics for this leaf
        let metrics_map = this.getLeafMetrics(second_split);

        // Validate metrics against expected format
        let currentMetricsNo; // Can be 0, 3, or 4
        if (metrics_map.a == undefined && metrics_map.t == undefined && metrics_map.d == undefined && metrics_map.o == undefined) {
          currentMetricsNo = 0;
        } else if (metrics_map.a !== undefined && metrics_map.t !== undefined && metrics_map.d !== undefined) {
          if (metrics_map.o !== undefined) {
            currentMetricsNo = 4;
          } else {
            currentMetricsNo = 3;
            if (metricScale) {
              metrics_map.o = this.calculateMetricO(metrics_map.a, metrics_map.t, metrics_map.d, weightA, weightT, weightD, metricScale);
            } else {
              this.showError("Ambiguous metric scale", "Metric scale (0,1] or [1,5] could not be determined", i + 1);
              return;
            }
          }
        } else {
          this.showError("Incomplete Metrics", "Either no metrics, three metrics (a, t, d), or four metrics (o, a, t, d) must be listed.", i + 1);
          return;
        }

        // Check if metrics match the determined format
        if (metricsNo !== 0 && currentMetricsNo === 0) {
          this.showError("Missing Metrics", `Expected ${metricsNo} metrics but found none for this leaf node.`, i + 1);
          return;
        }

        // Add metrics to output
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
    output = output.substring(1, output.length - 1);
    console.log(output);
    Window.map.setTreeData(output);
    const treeAnalyzerController = new TreeAnalyzerController();
    Window.map.setScenarioData(treeAnalyzerController.analyzeTree(JSON.parse(output)));
    Window.map.openNotificationWithIcon("success", "Tree Generation Successful", "");
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
          "Metric(s) Value should be o, a, t, or d",
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
   * Verify and determine the metric scale for leaf nodes
   * @param {Array} lines Array of DSL text lines
   * @returns {Object} Object with scale and initial line index where scale was determined
   */
  determineMetricScale(lines) {
    let scale = null;
    let scaleDefinitionLine = -1;

    for (let i = 1; i < lines.length; i++) {
      const second_split = this.getLineText(lines[i]).split(";");

      // Skip non-leaf nodes
      if (i < lines.length - 1 && this.calcNumberOfTabs(lines[i + 1]) > this.calcNumberOfTabs(lines[i])) {
        continue;
      }

      // Extract metrics
      const metrics = second_split.slice(1);
      const metricMap = {};

      metrics.forEach(metric => {
        const [key, value] = metric.split('=');
        metricMap[key] = parseFloat(value);
      });

      // Check a, t, d metrics
      if (metricMap.a !== undefined && metricMap.t !== undefined && metricMap.d !== undefined) {
        const isFloatScale =
          (metricMap.a > 0 && metricMap.a <= 1) &&
          (metricMap.t > 0 && metricMap.t <= 1) &&
          (metricMap.d > 0 && metricMap.d <= 1);

        const isIntegerScale =
          Number.isInteger(metricMap.a) &&
          Number.isInteger(metricMap.t) &&
          Number.isInteger(metricMap.d) &&
          metricMap.a >= 1 && metricMap.a <= 5 &&
          metricMap.t >= 1 && metricMap.t <= 5 &&
          metricMap.d >= 1 && metricMap.d <= 5;

        // Ambiguous case (all metrics are 1)
        if (metricMap.a === 1 && metricMap.t === 1 && metricMap.d === 1) {
          continue;
        }

        if (isFloatScale) {
          scale = "FLOAT";
          scaleDefinitionLine = i;
          break;
        } else if (isIntegerScale) {
          scale = "INT";
          scaleDefinitionLine = i;
          break;
        }
      }
    }

    return { scale, scaleDefinitionLine };
  }

  /**
   * Validate metrics for a specific scale
   * @param {Array} metrics Metrics to validate
   * @param {string} scale Scale to validate against ("FLOAT" or "INT")
   * @return {Array} Validation result
   */
  validateMetricsForScale(metrics, scale) {
    const minFloat = 0;
    const maxFloat = 1;
    const minInteger = 1;
    const maxInteger = 5;

    for (let i = 1; i < metrics.length; i++) {
      const [key, value] = metrics[i].split('=');
      const numValue = parseFloat(value);

      // Validate 'o' metric is always on float scale
      if (key === 'o' && (numValue < minFloat || numValue > maxFloat)) {
        return [
          false,
          "Invalid Metric Range",
          `Metric 'o' must be within 0-1 float scale. Found: ${numValue}`
        ];
      }

      // Validate a, t, d metrics
      if (['a', 't', 'd'].includes(key)) {
        if (scale === "FLOAT") {
          // Float scale: (0,1]
          if (numValue <= minFloat || numValue > maxFloat) {
            return [
              false,
              "Invalid Metric Range",
              `Metric '${key}' must be within (0,1] float scale. Found: ${numValue}`
            ];
          }
        } else if (scale === "INT") {
          // Integer scale: [1,5]
          if (!Number.isInteger(numValue) || numValue < minInteger || numValue > maxInteger) {
            return [
              false,
              "Invalid Metric Range",
              `Metric '${key}' must be an integer within [1,5] scale. Found: ${numValue}`
            ];
          }
        }
      }
    }

    return [true];
  }

  /**
   * Escapes any existing quotes in a DSL string.
   * @param {string} str - The string value to be escaped for DSL.
   * @return {string} The escaped DSL value.
   */
  escapeDslQuotes(str) {
    return str.replace(/"/g, '\\"');
  }

  /**
   * Parses the CSV-formatted text.
   * @param {string} text - The CSV input.
   */
  parseCSV(text) {
    text = text.trim();
    const lines = text.split("\n");
    const nodes = new Map();
    const seenIDs = new Set();
    let rootCount = 0;
    let metricsNo = null; // null = undecided, 0 = no metrics, 3 = three metrics, 4 = four metrics
    let metricScale = null; // null = undecided, "FLOAT" = (0,1] scale, "INT" = [1,5] scale
    const ambiguousNodes = [];

    // Detect if the first line contains weights
    let weightA = 0.33, weightT = 0.33, weightD = 0.33; // Default weights
    if (lines.length > 0) {
      const firstLineParts = this.parseCsvLine(lines[0]);

      // Check if first three parts are valid numbers and other parts are either missing or null/empty
      if (firstLineParts.length >= 3 &&
        !isNaN(parseFloat(firstLineParts[0])) &&
        !isNaN(parseFloat(firstLineParts[1])) &&
        !isNaN(parseFloat(firstLineParts[2])) &&
        firstLineParts.slice(3).every(part => part === null || part === "")) {
        // Set weights and remove the first line from processing
        weightA = parseFloat(firstLineParts[0]);
        weightT = parseFloat(firstLineParts[1]);
        weightD = parseFloat(firstLineParts[2]);
        lines.shift();
      }
    }

    // Validate that weights sum to approximately 1 (with a 0.03 margin)
    const totalWeight = weightA + weightT + weightD;
    if (totalWeight < 0.97 || totalWeight > 1.03) {
      this.showError("Invalid Weights", `The sum of weights should be approximately 1, with a ±0.03 margin allowed for rounding. Found: ${totalWeight.toFixed(2)}.`, 1);
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      let result = this.patternMatch(lines[i]);
      if (result[0] === false) {
        this.showError(result[1], result[2], i + 1);
        return;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const parts = this.parseCsvLine(lines[i]);
      if (parts.length < 3) {
        this.showError("Invalid Row Format", "Each row must have at least 3 columns (Type, ID, Name).", i + 1);
        return;
      } else if (parts.length > 7 && parts.slice(7).some(part => part !== null && part !== "")) {
        this.showError("Unexpected Extra Data", "There should not be more than 7 columns.", i + 1);
        return;
      }

      const type = parts[0].trim();
      const ID = parts[1].trim();
      const name = parts[2].trim();
      const parentID = ID.includes(".") ? ID.substring(0, ID.lastIndexOf(".")) : null;

      // Check node type
      if (!["O", "A", "T"].includes(type)) {
        this.showError("Invalid Node Type", `Invalid node type '${type}'.`, i + 1);
        return;
      }

      // Check ID format
      if (!/^[0-9]+(\.[0-9]+)*$/.test(ID)) {
        this.showError("Invalid ID Format", `Invalid node ID '${ID}'.`, i + 1);
        return;
      }

      // Check for duplicate IDs
      if (seenIDs.has(ID)) {
        this.showError("Duplicate ID", `ID '${ID}' is used more than once.`, i + 1);
        return;
      }
      seenIDs.add(ID);

      // Check for blank name
      if (name === "") {
        this.showError("Invalid Name", "Name cannot be blank.", i + 1);
        return;
      }

      // Used to check how many root nodes exists
      if (parentID === null) {
        rootCount++;
      }

      // Create node object
      let node = { ID, name };
      if (type === "O" || type === "A") {
        node.operator = type === "O" ? "OR" : "AND";
        node.children = [];
      } else if (type === "T") {
        let o = null, a = null, t = null, d = null;
        let currentMetricsNo = 0; // Can be 0, 3, or 4
        let currentNodeScale = null;
        let isAmbiguous = false; // Flag to track if this node has ambiguous metrics

        if (parts.length >= 6 && parts[3] !== "" && parts[4] !== "" && parts[5] !== "") {
          if (parts.length >= 7 && parts[6] !== null && parts[6] !== "") {
            // Explicit 'o' value provided along with 'a', 't', and 'd'
            o = parseFloat(parts[3]);
            a = parseFloat(parts[4]);
            t = parseFloat(parts[5]);
            d = parseFloat(parts[6]);
            currentMetricsNo = 4;

            // Validate 'o' is always on [0,1] scale
            if (isNaN(o) || o < 0 || o > 1) {
              this.showError("Invalid 'o' Metric", "The 'o' metric must be a number within 0-1 scale.", i + 1);
              return;
            }

            // Determine scale for a, t, d metrics
            if (a === 1 && t === 1 && d === 1) {
              // All metrics are 1, can't determine scale yet
              currentNodeScale = null;
              isAmbiguous = true; // Mark as ambiguous
            } else if (isIntegerInRange(a) && isIntegerInRange(t) && isIntegerInRange(d)) {
              currentNodeScale = "INT";
            } else if (0 < a <= 1 && 0 < t <= 1 && 0 < d <= 1) { //else if (isFloatScale(a, t, d)) {
              currentNodeScale = "FLOAT";
            } else {
              this.showError(
                "Invalid Metric Scale",
                "Metrics a, t, d must either all be integers in [1,5] or all be floats in (0,1].",
                i + 1
              );
              return;
            }

          } else {
            // 'o' is missing, so we'll calculate it based on 'a', 't', and 'd'
            a = parseFloat(parts[3]);
            t = parseFloat(parts[4]);
            d = parseFloat(parts[5]);
            currentMetricsNo = 3;

            // Determine scale for a, t, d metrics
            if (a === 1 && t === 1 && d === 1) {
              // All metrics are 1, can't determine scale yet
              currentNodeScale = null;
              isAmbiguous = true;
            } else if (isIntegerInRange(a) && isIntegerInRange(t) && isIntegerInRange(d)) {
              currentNodeScale = "INT";
            } else if (0 < a <= 1 && 0 < t <= 1 && 0 < d <= 1) { //else if (isFloatScale(a, t, d)) {
              currentNodeScale = "FLOAT";
            } else {
              this.showError(
                "Invalid Metric Scale",
                "Metrics a, t, d must either all be integers in [1,5] or all be floats in (0,1].",
                i + 1
              );
              return;
            }

            if (!isAmbiguous) {
              // If this node is not ambiguous, we can calculate 'o' immediately
              if (metricScale === null) {
                // This node establishes the scale
                metricScale = currentNodeScale;
              }
              // Calculate 'o' with the appropriate scale
              o = this.calculateMetricO(a, t, d, weightA, weightT, weightD, currentNodeScale);
            } else if (metricScale !== null) {
              // If we already know the scale from previous nodes, we can calculate 'o' for this ambiguous node
              o = this.calculateMetricO(a, t, d, weightA, weightT, weightD, metricScale);
              isAmbiguous = false; // No longer ambiguous since we know how to interpret it
            } else {
              // We have ambiguous metrics and don't know the scale yet - defer calculation
              // Store node info for later processing
              ambiguousNodes.push({
                nodeIndex: i,
                node: node,
                metrics: { a, t, d }
              });
            }
          }
        } else {
          o = parts[3] ? parseFloat(parts[3]) : null;
          a = parts[4] ? parseFloat(parts[4]) : null;
          t = parts[5] ? parseFloat(parts[5]) : null;
          d = parts[6] ? parseFloat(parts[6]) : null;
        }

        // Check if some but not all metrics are listed 
        const metrics = [o, a, t, d];
        const hasAnyMetric = metrics.some(m => m !== null);
        const hasAllMetrics = metrics.every(m => m !== null);
        if (hasAnyMetric && !hasAllMetrics && !isAmbiguous) {
          this.showError("Incomplete Metrics", "Either no metrics, three metrics (a, t, d), or four metrics (o, a, t, d) must be listed.", i + 1);
          return;
        }

        // Validate that leaf nodes have the same number of metrics
        if (metricsNo === null) {
          metricsNo = currentMetricsNo;
        } else if (metricsNo !== currentMetricsNo && !isAmbiguous) {
          this.showError(
            "Inconsistent Metrics",
            "All leaf nodes must have the same number of metrics: either none, three (a, t, d), or four (o, a, t, d).",
            i + 1
          );
          return;
        }

        // If this is the first node with a defined scale, set the global scale
        if (metricScale === null && currentNodeScale !== null) {
          metricScale = currentNodeScale;
        }

        // Once a scale is established, ensure all subsequent nodes use the same scale
        if (metricScale !== null && currentNodeScale !== null && metricScale !== currentNodeScale) {
          this.showError(
            "Inconsistent Metric Scales",
            `All nodes must use the same metric scale. Expected ${metricScale === "INT" ? "[1,5] integers" : "(0,1] floats"}.`,
            i + 1
          );
          return;
        }

        // If using metrics and not ambiguous, ensure they are all valid numbers
        if (hasAnyMetric && !isAmbiguous) {
          if (isNaN(o) || isNaN(a) || isNaN(t) || isNaN(d)) {
            this.showError("Invalid Metrics", "Metrics must be numbers.", i + 1);
            return;
          } else {
            // Validate 'o' is always on [0,1] scale
            if (o < 0 || o > 1) {
              this.showError("Invalid 'o' Metric Range", "The 'o' metric must be within 0-1 scale.", i + 1);
              return;
            }

            // Validate a, t, d based on the established scale
            const currentScale = currentNodeScale || metricScale;
            if (currentScale === "INT") {
              // Check that a, t, d are integers in [1,5]
              if (!isIntegerInRange(a) || !isIntegerInRange(t) || !isIntegerInRange(d)) {
                this.showError(
                  "Invalid Metric Range",
                  "When using integer scale, metrics a, t, d must be integers in range [1,5].",
                  i + 1
                );
                return;
              }
            } else if (currentScale === "FLOAT") {
              // Check that a, t, d are floats in (0,1]
              if (a <= 0 || a > 1 || t <= 0 || t > 1 || d <= 0 || d > 1) {
                this.showError(
                  "Invalid Metric Range",
                  "When using float scale, metrics a, t, d must be in range (0,1].",
                  i + 1
                );
                return;
              }
            }

            node.o = o;
            node.a = a;
            node.t = t;
            node.d = d;
          }
        } else if (isAmbiguous) {
          // For ambiguous nodes, store the a, t, d values but not o yet
          node.a = a;
          node.t = t;
          node.d = d;
          // 'o' will be set later once we know the scale
        }
      }

      nodes.set(ID, node);
    }

    // After all nodes are processed, check if we have a scale and process ambiguous nodes
    if (ambiguousNodes.length > 0) {
      if (metricScale === null) {
        // If we still don't have a scale after all nodes, we can't proceed
        this.showError(
          "Ambiguous Metrics",
          "Cannot determine scale. At least one node needs non-ambiguous metrics (a, t, d not all 1).",
          ambiguousNodes[0].nodeIndex + 1
        );
        return;
      }

      // Process all ambiguous nodes now that we know the scale
      for (const ambiguousNode of ambiguousNodes) {
        const { node, metrics } = ambiguousNode;

        // Calculate 'o' with the now-established scale
        node.o = this.calculateMetricO(metrics.a, metrics.t, metrics.d, weightA, weightT, weightD, metricScale);
      }
    }

    for (let [ID, node] of nodes) {
      const parentID = ID.includes(".") ? ID.substring(0, ID.lastIndexOf(".")) : null;

      if (parentID !== null) {
        // Check if the parent node exists
        if (!nodes.has(parentID)) {
          this.showError("Invalid Parent Reference", `Parent ID ${parentID} does not match any existing node ID.`, i + 1);
          return;
        }
        let parent = nodes.get(parentID);

        // Check if the parent is a leaf node (which should not have children)
        if (parent.operator !== "AND" && parent.operator !== "OR") {
          this.showError("Invalid Child Assignment", `Terminal/leaf node '${parentID}' cannot have children.`, i + 1);
          return;
        }

        parent.children.push(node);
      }
    }

    // Check that all AND/OR nodes have at least one child
    for (let node of nodes.values()) {
      if ((node.operator === "AND" || node.operator === "OR") && node.children.length === 0) {
        this.showError("Missing Children", `${node.operator} node '${node.ID}' must have at least one child.`, i + 1);
        return;
      }
    }

    // Checks if there is one root node
    if (rootCount !== 1) {
      this.showError("Root Node Error", "There can only be one root node.", i + 1);
      return;
    }

    try {
      const root = [...nodes.values()].find(n => !n.ID.includes("."));
      const output = JSON.stringify(root);
      console.log(output);
      Window.map.setTreeData(output);

      const treeAnalyzerController = new TreeAnalyzerController();
      Window.map.setScenarioData(treeAnalyzerController.analyzeTree(root));

      Window.map.openNotificationWithIcon("success", "Tree Generation Successful", "");
    } catch (error) {
      console.error("Error parsing CSV:", error);
      Window.map.openNotificationWithIcon("error", "Tree Generation Failed", "Invalid CSV format");
    }

    // Helper function for scale detection
    function isIntegerInRange(value) {
      return Number.isInteger(value) && 1 <= value <= 5;
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
      const parts = this.parseCsvLine(line);

      if (parts.length < 3) {
        throw new Error("Invalid CSV format: Each row must have at least 3 columns (Type, ID, Name).");
      }

      const type = parts[0].trim(); // First column is node type (A, O, T)
      const ID = parts[1].trim(); // Second column is hierarchical ID
      const name = parts[2].trim(); // Third column is node name
      const parentID = ID.includes(".") ? ID.substring(0, ID.lastIndexOf(".")) : null; // Extract parent ID

      // Ensure node exists in map
      if (!nodes.has(ID)) {
        nodes.set(ID, { ID, name });
      }

      let node = nodes.get(ID);
      node.name = name;

      if (type === "O" || type === "A") {
        node.operator = type === "O" ? "OR" : "AND";
        node.children = [];
      } else if (type === "T") {
        // Handle leaf nodes and optional metrics
        let o = parts[3] ? parseFloat(parts[3]) : null;
        let a = parts[4] ? parseFloat(parts[4]) : null;
        let t = parts[5] ? parseFloat(parts[5]) : null;
        let d = parts[6] ? parseFloat(parts[6]) : null;

        if ([o, a, t, d].some(m => m !== null)) {
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

  /**
   * Parses a single CSV line into an array of values.
   * @param {string} line - The CSV line to be parsed.
   * @return {Array} An array of parsed values from the CSV line.
   */
  parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      let char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quote ("" -> ")
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes; // Toggle quote mode
        }
      } else if (char === ',' && !inQuotes) {
        values.push(this.unescapeCsvValue(current));
        current = "";
      } else {
        current += char;
      }
    }

    values.push(this.unescapeCsvValue(current));
    return values;
  }

  /**
   * Unescapes a CSV value.
   * @param {string} value - The CSV value to be unescaped.
   * @return {string} The unescaped value.
   */
  unescapeCsvValue(value) {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/""/g, '"'); // Remove surrounding quotes & restore inner quotes
    }
    return value.replace(/""/g, '"'); // Just restore escaped quotes if no surrounding quotes
  }

  /**
   * Calculates the 'o' metric using weighted values.
   * TODO - delete after you take this out of parseCSV
   */
  calculateMetricO(a, t, d, weightA, weightT, weightD) {
    let tempA = 0.04 / a;
    let tempT = 0.04 / t;
    let tempD = 0.04 / d;

    return (tempA * weightA) + (tempT * weightT) + (tempD * weightD);
  }

  /**
   * Calculates the 'o' metric using weighted values.
   * @param {string} scale Metric scale used, whether "INT" for [1, 5], or "FLOAT" for (0,1] 
   * @return {number} Calculated 'o' metric
   */
  calculateMetricO(a, t, d, weightA, weightT, weightD, scale) {
    if (scale === "INT") {
      a = a / 5;
      t = t / 5;
      d = d / 5;
    }

    let tempA = 0.04 / a;
    let tempT = 0.04 / t;
    let tempD = 0.04 / d;

    return (tempA * weightA) + (tempT * weightT) + (tempD * weightD);
  }

}
