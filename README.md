# coc-als
[Coc.nvim](https://github.com/neoclide/coc.nvim) integration for the [Ada Language Server](https://github.com/AdaCore/ada_language_server). This plugin is a port of the [VSCode extension](https://github.com/AdaCore/ada_language_server/tree/master/integration/vscode/ada).

## Installation

### Install Coc.nvim 

[See this page](https://github.com/neoclide/coc.nvim#quick-start)

### Install coc-als

From within (Neo)vim: 
```vim
:CocInstall coc-als
```

### Install ada_language_server

Unfortunately, at the time of writing, AdaCore doesn't provide standalone precompiled versions of the Ada Language Server. Short of compiling the server yourself, which is very painfull, you'll need to get it from another source.  
+ If you have a sufficiently recent installation of GNAT Studio, ada_language_server should already be installed and in your PATH. GNAT Studio uses the Ada Language Server internally.
+ ada_language_server is also packaged with the VSCode extension. Manually download the extension archive from the [Visual Studio marketplace](https://marketplace.visualstudio.com/items?itemName=AdaCore.ada) and extract the binary somewhere in your path (.vsix files are simply compressed archive files).

## Configuration

coc-als has a JSON schema compatible with [coc-json](https://github.com/neoclide/coc-json). Strongly recommended to manipulate coc.nvim configuration.

Default configuration: 
```jsonc
{
  "ada.serverBin": "ada_language_server", // must be in the path, otherwise use full path to the binary
  "ada.enabled": true,
  "ada.trace.server": "off",
  "ada.projectFile": "", // See below
  "ada.scenarioVariables": {},
  "ada.defaultCharset":  "iso-8859-1",
  "ada.displayMethodAncestryOnNavigation": "usage_and_abstract_only", // never | usage_and_abstract_only | definition_only | always
  "ada.enableDiagnostics": true,
  "ada.renameInComments": false
}
```

`projectFile` is by far the most important option. If left empty, the language server will try to load a .gpr project file from the current directory. This will fail if your project file is not at the root of your workspace or if you have multiple project files in the folder. Configure your workspace on a per-project basis with `:CocLocalConfig`.

## Features 

coc-als tries to support all the features of the Ada Language Server but doesn't add any itself. ALS is under active developpement and doesn't yet have the level of polish of some other language servers.  
Working features include:
+ Semantic completion
+ Go to definition/implementation/type definition
+ Find references 
+ Search through symbols 
+ Call/called by trees 
+ List imported/importing files (with `CocList`)
+ Symbol hover info (documentation must be written **below** the definition to show up, as far as I know this isn't configurable).
+ Code diagnostics (very limited, catches syntax errors but not much else).
+ Rename symbol
+ Code format (AFAIK format is not configurable at all)

## Related notes

### Working from behind a proxy

Ada is mostly used in corporate environments where you're likely to access the Internet from behind a proxy. Your tools need to be configured properly in order to work: 

On Linux, add session-wide configuration in your .profile.
```bash
export HTTP_PROXY=http://proxy.evil.corp:666
export HTTPS_PROXY=http://proxy.evil.corp:666
export NO_PROXY=.evil.corp # suffixes that are part of the internal network
```

Most plugin managers are Git based, configure your global git settings:
```bash
git config --global http.proxy 'http://proxy.evil.corp:666'
git config --global https.proxy 'http://proxy.evil.corp:666'
```

Configure npm and yarn (to install node packages and use coc.nvim's plugin system): 
```bash
npm config set proxy http://username:password@host:port
npm config set https-proxy http://username:password@host:port

yarn config set proxy http://username:password@host:port
yarn config set https-proxy http://username:password@host:port
```

If you see SSL related errors, try to add the following configuration: 
```bash
npm config set strict-ssl false
yarn config set strict-ssl false
```

Depending on your proxy configuration you may have to use a proxy address of the form `http://username:password@host:port`. Avoid this at all cost if you can, as anyone with reading rights over your home directory will have access to your password in clear text. Bash history is saved in a file, so calling commands on the fly from the command line is not a good option either. 

### Disabling default vim Ada mappings

The default ada.vim configuration sets up an autocommand that creates mappings that you probably don't want. As the autocommand is run on FileType, it may even override some of your custom mappings. I couldn't find an option to disable this behaviour, but I was able to hack around it. Create a file named `~/.vim/autoload/ada.vim` with the following content: 
```vim 
source $VIMRUNTIME/autoload/ada.vim
function! ada#Map_Menu(a, b, c)
  " Prevent the default ada.vim to
  " trash mappings
endfunction
```
This will override the Map_Menu function that creates the mappings to do nothing, while preserving the rest of the settings and functions in the default `autoload/ada.vim`
