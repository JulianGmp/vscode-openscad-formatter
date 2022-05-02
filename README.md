# OpenSCAD Formatter

[![Visual Studio Marketplace Version](https://vsmarketplacebadge.apphb.com/version/JulianGmp.openscad-formatter.svg)](https://marketplace.visualstudio.com/items?itemName=JulianGmp.openscad-formatter)

A simple formatter for OpenSCAD files, that utilizes clang-format.

*Important: you will have to install clang-format yourself, it is not shipped with this extension.*

## Extension Settings

* `openscad-formatter.clang-format.executable`: The path to the clang-format executable.
* `openscad-formatter.clang-format.style`: The style parameter for clang-format

## Known issues

- Files with includes will be indented wrongly (see issue #1)
- Partial formatting („Format Selection“ in the command palette) is not implemented.
- Utilize the vscode settings for tabs (width and if they are replaced with spaces) when formatting.

## Release Notes

### 1.0.0

Initial release

### 1.0.1
Update README
