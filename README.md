# OpenSCAD Formatter

[![Visual Studio Marketplace Version](https://vsmarketplacebadge.apphb.com/version/JulianGmp.openscad-formatter.svg)](https://marketplace.visualstudio.com/items?itemName=JulianGmp.openscad-formatter)

[Also available at Open VSX](https://open-vsx.org/extension/JulianGmp/openscad-formatter)

A simple formatter for OpenSCAD files, that utilizes clang-format.

*Important: you will have to install clang-format yourself, it is not shipped with this extension.*

*Note: this extension does not provide syntax highlighting or other language features for OpenSCAD files, please take a look at the [Antyos.openscad](https://marketplace.visualstudio.com/items?itemName=Antyos.openscad) extension instead.*

## Extension Settings

* `openscad-formatter.clang-format.executable`: The path to the clang-format executable.
* `openscad-formatter.clang-format.style`: The style parameters for clang-format*

*please refer to the [documentation of clang-format](https://clang.llvm.org/docs/ClangFormatStyleOptions.html) for the various options.

## Known issues

- Partial formatting („Format Selection“ in the command palette) is not implemented.
- vscode's format settings for tab size or space replacement are currenlty ignored.

## Release Notes

### 1.1.1
Fix an issue where `use` statements would lead to bad formatting (see [discussion #1](https://github.com/JulianGmp/vscode-openscad-formatter/issues/1#issuecomment-1133753753)).

### 1.1.0
Fix #1: OpenSCAD files with includes are now formatted normally.

### 1.0.1
Update README

### 1.0.0
Initial release

