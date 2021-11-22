# OpenSCAD Formatter

[![Visual Studio Marketplace Version](https://vsmarketplacebadge.apphb.com/version/JulianGmp.openscad-formatter.svg)](https://marketplace.visualstudio.com/items?itemName=JulianGmp.openscad-formatter)

A simple formatter for OpenSCAD files, that utilizes clang-format.

*Important: you will have to install clang-format yourself, it is not shipped with this extension.*

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `openscad-formatter.clang-format.executable`: The path to the clang-format executable.
* `openscad-formatter.clang-format.style`: The style parameter for clang-format

## To-Do's and known issues

- Partial formatting („Format Selection“ in the command palette) is not implemented.
- Utilize the vscode settings for tabs (width and if they are replaced with spaces) when formatting.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release
