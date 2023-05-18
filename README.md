# AT-AT (Attack Tree Analysis Tool)

AT-AT (Attack Tree Analysis Tool) is a application that allows users to develop and analyze attack trees. The overall goal is to automatically generate a set of possible attack scenarios that can be used to provide guidance for how to improve the design of the system to which the attack tree belongs to.

## Features

- Simplified DSL syntax to specify attack trees and a JSON format for parsed attack trees
- Parser to convert inputted attack trees into JSON (with syntax checker)
- Generates (i.e., visualizes) inputted attack trees
- Determines all attack scenarios on the inputted attack tree
- Lists all the possible attack scenarios and their severity for the inputted attack tree
- Provides recommendations to mitigate attacks in an attack scenario based on the metrics and keywords found in the scenario path
- Highlights a user-selected attack scenario on the tree
- Allows multiple trees to be modeled and analyzed at the same time by switching between tabs in the application
- Generates an HTML report of the attack tree analysis which includes all attack scenarios and recommendations

![Animation](https://user-images.githubusercontent.com/49103000/162790364-1ef16090-8c68-420c-b465-f07abbc6aaf3.gif)

## Documentation

- [User Manual](Documentation/User%20Manual.pdf)
- [Testing Document](Documentation/Testing%20Document.pdf)

## Download

[Latest Release](https://github.com/yathuvaran/AT-AT/releases/tag/v1.0.0)

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run make`

Complies the app as an executable for distribution to the `out` folder.
It correctly bundles React in production mode and optimizes the app for the best performance.
The app is minified and the filenames include the hashes.

#### How to build linux binaries under 'node:16-alpine' docker image

- `apk add git rpm dpkg fakeroot`
- `npm install`
- `npm run make`

#### How to build windows binaries under 'mcr.microsoft.com/windows:20H2' docker image

- Dependencies:
  - Install node 16 (from https://nodejs.org/download/release/v16.20.0/node-v16.20.0-x64.msi )
    `curl -O https://nodejs.org/download/release/v16.20.0/node-v16.20.0-x64.msi
     start /wait msiexec /i node-v16.20.0-x64.msi /qn`
  - Install git (from https://git-scm.com/download/win )
    `curl -O https://github.com/git-for-windows/git/releases/download/v2.40.1.windows.1/Git-2.40.1-64-bit.exe
     start /wait Git-2.40.1-64-bit.exe /SILENT`
- `npm install`
- `npm run make`
