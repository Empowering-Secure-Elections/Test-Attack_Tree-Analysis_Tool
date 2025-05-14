# AT-AT (Attack Tree Analysis Tool)

AT-AT (Attack Tree Analysis Tool) is a application that allows users to develop and analyze attack trees. The overall goal is to automatically generate a set of possible attack scenarios that can be used to provide guidance for how to improve the design of the system to which the attack tree belongs to. This project is a fork of https://github.com/yathuvaran/AT-AT and as such has many references to the original team and copied material. As we continue to update, it will and expand on the original.

## Features

- Simplified DSL/CSV syntax to specify attack trees and a JSON format for parsed attack trees
- Parser to convert inputted attack trees into JSON (with syntax checker)
- Generates (i.e., visualizes) inputted attack trees
- Determines all attack scenarios on the inputted attack tree
- Lists all the possible attack scenarios and their severity for the inputted attack tree
- Provides recommendations to mitigate attacks in an attack scenario based on the metrics and keywords found in the scenario path
- Highlights a user-selected attack scenario on the tree
- Allows multiple trees to be modeled and analyzed at the same time by switching between tabs in the application
- Allows for the DSL/CSV syntax of a tree to be exported for reuse in the tool
- Generates an HTML report of the attack tree analysis which includes all attack scenarios and recommendations
- Generates a PDF file with the graphic of the attack tree
- Generates a PDF report of an individual scenario with the attack scenario tree graphic and the list of terminal nodes in the scenario

<video controls style="width: 100%; max-width: 1000px; height: auto;">
  <source src="Attack_Tree_Guide.mp4" type="video/mp4">
</video>

## Documentation

[User Manual](ESE%20AT%20AT%20User%20Manual.pdf)

## Online Access

You can access the latest version of this application online on the [Render website](https://attack-tree-analysis-tool.onrender.com/) at https://attack-tree-analysis-tool.onrender.com/.

## Example Inputs

You can download these example inputs to generate an attack tree from.
- [Basic DSL example input](https://github.com/Empowering-Secure-Elections/ESE-Attack_Tree-Analysis_Tool/blob/main/Examples/Basic%20Attack%20Tree%20Example/basic.txt)
- [Basic CSV example input](https://github.com/Empowering-Secure-Elections/ESE-Attack_Tree-Analysis_Tool/blob/main/Examples/Basic%20Attack%20Tree%20Example/basic.csv)

## Download

[Latest Release](https://github.com/Empowering-Secure-Elections/ESE-Attack_Tree-Analysis_Tool/releases/latest)

## Available Scripts

In the project directory, you can run:

### `npm run start`

## Required Software

Node.js (from https://nodejs.org/en)

##### Install Node Packages

`npm install`

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

Once edits have been made reload the page to see changes.\
You will also see any lint errors in the console.
