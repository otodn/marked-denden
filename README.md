# marked-denden
<!-- Description -->

## ! WIP !
marked-denden is a [Marked](https://github.com/markedjs/marked) extension to enable the [DenDenMarkdown](https://github.com/denshoch/DenDenMarkdown) syntax to be used in Marked.js.

Currently only ruby, Horizontal-in-Vertical Text Composition and EPUB pagebreak syntax, Footnote are supported.

# Usage
<!-- Show most examples of how to use this extension -->

```js
import { marked } from "marked";
import markedFootnote from 'marked-footnote';
import dendenMarkdown from "marked-denden";

// or UMD script
// <script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/marked-footnote/dist/index.umd.min.js"></script>
// <script src="https://cdn.jsdelivr.net/gh/otodn/marked-denden/src/index.umd.min.js"></script>

const dendenOptions = { 
    rubyParenthesisOpen: "",
    rubyParenthesisClose: "",
    autoTcy: true,
    tcyDigit: 2,
    autoTextOrientation: true,
    epubType: true,
    dpubRole: true,
  }

// Setting DenDenMarkdown and outputs closer together.
marked.setOptions({
    gfm: true,
    breaks: true,
  });

// This extension overrides the footnote extension and should not change the order.
marked.use(markedFootnote())
marked.use(dendenMarkdown(default_options));

// OR
// marked.use(markedFootnote(),dendenMarkdown(dendenOptions));

marked.parse("{電子出版|でんししゅっぱん}を手軽に");
// <p><ruby>電子出版<rt>でんししゅっぱん</rt></ruby>を手軽に</p>

marked.parse("^ABC^ 2月29日!? ★≠☆");
// <p><span class="tcy">ABC</span> 2月<span class="tcy">29</span>日<span class="tcy">!?</span> <span class="upright">★</span><span class="sideways">≠</span><span class="upright">☆</span></p>

```

## `options`

|option|type|default|description|
|:----|:----|:----|:----|
|rubyParenthesisOpen|string| `""` |Opening parentheses for `<rp>`.|
|rubyParenthesisClose|string| `""` |Closing parentheses for `<rp>`.|
|autoTcy|boolean|true|Automatic number assignment of Horizontal-in-Vertical Text Composition class to a number.|
|tcyDigit|number|2|Number of digits to which the Horizontal-in-Vertical Text Composition is automatically assigned.|
|autoTextOrientation|boolean|true|Add a class that automatically adjusts the orientation of strings for portrait writing.|
|epubType|boolean|true|Add `epub:type="pagebreak"` to page break tags.|
|dpubRole|boolean|true|Add `role="doc-pagebreak"` to page break tags.|
|footnoteBacklinkContent|string| `⏎` | Text linking to the reference source.⏎

# TODO

- [x] Footnotes: Thanks [marked-extensions/packages/footnote](https://github.com/bent10/marked-extensions/tree/main/packages/footnote) !

# Original Copyright and License

DenDenMarkdown
Copyright (c) 2013 Densho Channel
http://densho.hatenablog.com/
All rights reserved.

based on:

PHP Markdown Lib Copyright (c) 2004-2013 Michel Fortin
http://michelf.ca/
All rights reserved.

Markdown
Copyright (c) 2003-2005 John Gruber http://daringfireball.net/ All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

Neither the name "Markdown" nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

This software is provided by the copyright holders and contributors "as is" and any express or implied warranties, including, but not limited to, the implied warranties of merchantability and fitness for a particular purpose are disclaimed. In no event shall the copyright owner or contributors be liable for any direct, indirect, incidental, special, exemplary, or consequential damages (including, but not limited to, procurement of substitute goods or services; loss of use, data, or profits; or business interruption) however caused and on any theory of liability, whether in contract, strict liability, or tort (including negligence or otherwise) arising in any way out of the use of this software, even if advised of the possibility of such damage.
