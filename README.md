# React Localization Loader

[![npm version](https://img.shields.io/npm/v/react-localoader.svg?style=flat)](https://www.npmjs.com/package/react-localoader) [![Build Status](https://travis-ci.org/montzkie18/react-localoader.svg?branch=master)](https://travis-ci.org/montzkie18/react-localoader)

Automatically converts all your React components from this:
```javascript
import React from 'react';
import Tooltip from './Tooltip';

const CustomComponent = (props) => (
  <div>
    Welcome {props.username}, click <a href="http://link.com">here</a>
    <Tooltip text="Hi there"/>
  </div>
);
```

To this:
```javascript
import i18n from 'react-localoader/lib/i18n';
import Localize from 'react-localoader/lib/components/Localize';
import React from 'react';
import Tooltip from './Tooltip';

const CustomComponent = (props) => (
  <div>
    <Localize elements={[<a href="http://link.com">$1</a>]}
      expressions={{"props-username": props.username}}
    >Welcome %[props-username], click *here*</Localize> 
    <Tooltip text={i18n.t("Hi there")}/>
  </div>
);
```

## Usage

```
npm install --save react-localoader
```

In your webpack config, just add a new loader for JS/JSX files like this:
```
var baseConfig = {
  // ...
  module: {
    rules: [{
        test: /\.(js|jsx)$/,
        loader: 'react-localoader'
    }]
  }
};
```

## Config File

All configurations are loaded from `.i18nrc` JSON file located at the root of your project folder. The JSON file looks like something below:

```
{
  basePath: '.',
  srcFolders: ['src'],
  defaultLocale: 'en',
  exportPath: './public/locale',
  attributeNames: ['title', 'placeholder', 'label', 'tooltip', 'content'],
  attributeIgnores: ['id', 'name', 'className'],
}
```

## Config Options
##### basePath
Root folder to search for source files to localize.

##### srcFolders
Folders inside the basePath where all your JS/JSX files are located. This is used by the CLI commands and not by the webpack loader. Supports glob patterns.

##### defaultLocale
Defines which locale your current React components are written so they can be exported to `${exportPath}/${defaultLocale}.json`

##### exportPath
Folder where all exported `${locale}.json` data will be saved.

##### attributeNames
Regex patterns of JSX attributes you want to localize. Remember that this is always treated as a pattern so `label` will always include both `label` and `labelPosition`. You must include `labelPosition` to `attributeIgnores` if you do not want it to be localized.

##### attributeIgnores
List of specific attribute names you want excluded from localization.

## CLI

You can use the following commands to manage your locale data.

##### > react-localoader export

Applies localization to all your source code inside your defined `srcFolders`. It then extracts all the children of `<Localize>` tag and first param of `i18n.t()` call. All this strings are compiled and saved to `${exportPath}${defaultLocal}.json` in the following format:
```json
[
  {
    "string_keyhash": {
      "description": "./path/to/component/this/was/extracted/from",
      "text": "Text we need to localize"
    }
  },
  ...
]
```

## Credits

This project was inspired by Jon Jensen's work [here](https://github.com/jenseng/react-i18nliner)