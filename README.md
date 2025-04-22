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

## Documentation

[User Manual](Documentation/ESE%20AT%20AT%20User%20Manual.pdf)

## Download

[Latest Release](https://github.com/Empowering-Secure-Elections/attack-tree_analysis_tool/releases/tag/baseline-v1.0)

## Available Scripts

In the project directory, you can run:

### `npm run start`

#### Required Software
Node.js (from https://nodejs.org/en)

##### Required Node Packages
- `npm install --global cross-env`
- `npm install express`
- `npm install react-scripts@latest`
- `npm install react`

##### Install Packages 
`npm install`

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

Once edits have been made reload the page to see changes.\
You will also see any lint errors in the console.

#### How to build linux binaries under 'node:16-alpine' docker image

- `apk add git rpm dpkg fakeroot`
- `npm install`
- `npm run make`

#### How to build windows binaries under 'mcr.microsoft.com/windows:20H2' docker image

- Dependencies:
  - Install node 16 (from https://nodejs.org/download/release/v16.20.0/node-v16.20.0-x64.msi)
    - `curl -O https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
     start /wait msiexec /i node-v16.20.0-x64.msi /qn`
  - Install git (from https://git-scm.com/download/win )
    - `curl -O https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe
     start /wait Git-2.40.1-64-bit.exe /SILENT`
- `npm install`
- `npm run make`

## Required Software
Node.js (from https://nodejs.org/en)

#### Node Packages
- `npm install -g express`
- `npm install react-scripts@latest`
- `npm install react`
