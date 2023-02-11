export function dendenMarkdown(_options = {}) {

    const default_options = {
        rubyParenthesisOpen: "",
        rubyParenthesisClose: "",
        autoTcy: true,
        tcyDigit: 2,
        autoTextOrientation: true,
        epubType: true,
        dpubRole: true,
    }

    const options = {
        ...default_options,
        ..._options
    }


    /**
     * PHPと互換性保ちたかった
     * 
     * @param {string} str
     */
    function htmlspecialchars(str) {
        return String(str).replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
    }

    /**
     * 指定されたインデックスの文字列を独立させた配列を返す
     * 
     * @param {string} text
     * @param {array} indexes 
     */
    function splitTextAtIndex(text, indexes) {
        const splitText = [];
        let prevIndex = 0;
        for (let i = 0; i < indexes.length; i++) {
            splitText.push(text.substring(prevIndex, indexes[i]));
            splitText.push(text.substring(indexes[i], indexes[i] + 1))
            prevIndex = indexes[i] + 1;
        }
        splitText.push(text.substring(prevIndex));
        return splitText;
    }

    return {
        extensions: [
            {// 改ページ
                name: 'docBreak',
                level: 'block',
                start(src) { return src.indexOf('\n\n'); },
                tokenizer(src, tokens) {
                    const rule = /^={3,}(?=\n{2,})/;
                    const match = rule.exec(src);
                    if (match) {
                        return {
                            type: "docbreak",
                            raw: match[0],
                        }
                    }
                },
                renderer(token) {
                    return this.parser.options.xhtml ? `<hr class="docbreak"/>\n` : `<hr class="docbreak">\n`;
                }
            }, {// ページ番号(行)
                name: 'pageNumber',
                level: 'block',
                tokenizer(src, tokens) {
                    const rule = /^\[%(%?)(.*)(?<!\])\]\n/;
                    const match = rule.exec(src);
                    if (match) {
                        return {
                            type: "pageNumber",
                            raw: match[0],
                            text: match[2],
                            show: match[1] ? true : false,
                        }
                    }
                },
                renderer(token) {
                    const options = this.parser.options.getDendenOption();
                    const epub_tag = options.epubType ? ' epub:type="pagebreak"' : '';
                    const role_tag = options.dpubRole ? ' role="doc-pagebreak"' : '';
                    const show_num = token.show ? token.text : '';

                    return `<div id="pagenum_${token.text}" class="pagenum" title="${token.text}"${epub_tag}${role_tag}>${show_num}</div>\n`;
                }
            },{// ページ番号(インライン)
                name: 'pageNumberInline',
                level: 'inline',
                start(src) { return src.indexOf('['); },
                tokenizer(src, tokens) {
                    const rule = /^\[%(%?)(.*)(?<!\])\]/;
                    const match = rule.exec(src);
                    if (match) {
                        return {
                            type: "pageNumberInline",
                            raw: match[0],
                            text: match[2],
                            show: match[1] ? true : false,
                        }
                    }
                },
                renderer(token) {
                    const options = this.parser.options.getDendenOption();
                    const epub_tag = options.epubType ? ' epub:type="pagebreak"' : '';
                    const role_tag = options.dpubRole ? ' role="doc-pagebreak"' : '';
                    const show_num = token.show ? token.text : '';

                    return `<span id="pagenum_${token.text}" class="pagenum" title="${token.text}"${epub_tag}${role_tag}>${show_num}</span>`;
                }
            },
            { // ルビ
                name: 'ruby',
                level: 'inline',
                start(src) { return src.indexOf('{'); },
                tokenizer(src, tokens) {
                    const rule = /^((?<!\{)\{)(?=\S)(?!\1)((?:[^|]+?)+?)\|([^\}]+?)\}/;
                    const match = rule.exec(src);
                    if (match) {
                        const [, , rb, rt] = match;
                        if (/\\$/.test(rb)) { return; }
                        const rtarray = rt.split("|")
                        const rt_tokens = []
                        for (const obj of rtarray) {
                            rt_tokens.push(this.lexer.inlineTokens(obj))
                        }

                        const token = {
                            type: 'ruby',
                            raw: match[0],
                            text: rb,
                            rt: rt_tokens.flat(1),
                            mono: rb.length === rtarray.length,
                            tokens: this.lexer.inlineTokens(rb),
                        };

                        return token;
                    }
                },
                renderer(token) {
                    const options = this.parser.options.getDendenOption();
                    const rpOpen = options.rubyParenthesisOpen ? `<rp>${htmlspecialchars(options.rubyParenthesisOpen)}</rp>` : "";
                    const rpClose = options.rubyParenthesisClose ? `<rp>${htmlspecialchars(options.rubyParenthesisClose)}</rp>` : "";
                    if (token.mono) {
                        const ruby_tag = token.rt.map((el, i) => {
                            return `${token.text[i]}${rpOpen}<rt>${this.parser.parseInline([el])}</rt>${rpClose}`
                        }).join("")
                        return `<ruby>${ruby_tag}</ruby>`;
                    }
                    return `<ruby>${this.parser.parseInline(token.tokens)}${rpOpen}<rt>${this.parser.parseInline(token.rt)}</rt>${rpClose}</ruby>`;
                }
            }, { // 縦中横
                name: 'tcy',
                level: 'inline',
                start(src) { return src.indexOf('^'); },
                tokenizer(src, tokens) {
                    const rule = /^((?<!\^)\^)(?=\S)(?!\1)((?:[^\^]+?|\/(?=\S)(?!\^)(.+?)(?<=\S)\^)+?)(?<=\S)\^/;
                    const match = rule.exec(src);
                    if (match) {
                        return {
                            type: 'tcy',
                            raw: match[0],
                            text: match[2],
                            tokens: this.lexer.inlineTokens(match[2]),
                        }
                    }
                },
                renderer(token) {
                    return `<span class="tcy">${this.parser.parseInline(token.tokens)}</span>`;
                }
            }, { // 自動縦書き調整
                name: 'autoAlign',
                level: 'inline',
                renderer(token) {
                    return `<span class="${token.class}">${this.parser.parseInline(token.tokens)}</span>`;
                }
            },
        ],
        walkTokens(token) {
            const opt = this.defaults.getDendenOption();
            const { autoTcy, tcyDigit, autoTextOrientation } = opt;

            // 自動縦中横
            if (autoTcy || autoTextOrientation) {
                // 数字用の縦中横、sideways、upright
                const makeInSpan = () => {
                    const span_tag = /<span class=["'](tcy|sideways|upright)["']>/;
                    let span_f = 0;
                    const inSpan = (el) => {
                        if (el.type === "html") {
                            if (span_tag.test(el.text)) { span_f = 1; }
                            if (span_f && el.text == "</span>") { span_f = 0; }
                        }
                        return span_f
                    }
                    return inSpan;
                }
                const inSpan = makeInSpan();

                const blocks = ["paragraph", "heading", "list_item", "blockquote", "list"];
                const old_token = token;

                // "table"だけは別処理(後で考える)
                if (blocks.includes(old_token.type)) {
                    if (!Object.prototype.hasOwnProperty.call(old_token, "tokens")) { return; }

                    // 文字調整
                    if (autoTextOrientation) {
                        for (const [idx, el] of old_token.tokens.entries()) {
                            if (inSpan(el)) { continue; }
                            if (el.type === "text") {
                                const side_rule = new RegExp("[÷∴≠≦≧∧∨＜＞‐－]", "g");
                                const symbol_list = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρςστυφχψωАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя¨ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹⅺⅻ♀♂∀∃∠⊥⌒∂∇√∽∝∫∬∞①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴⓵⓶⓷⓸⓹⓺⓻⓼⓽⓾▱▲△▼▽☀☁☂☃★☆☎☖☗♠♡♢♣♤♥♦♧♨♩♪♫♬♭♮♯✓〒〠¶†‡‼⁇⁈⁉№℡㏍＃＄％＆＊＠￥¢£§°‰′″℃㎎㎏㎝㎞㎡㏄Å〳〴〵〻〼ゟヿ⅓⅔⅕⇒⇔';
                                const up_rule = new RegExp(`[${symbol_list}]`, "g");
                                let side_match = el.text.matchAll(side_rule);
                                let up_match = el.text.matchAll(up_rule);
                                const q = [...side_match, ...up_match].map(match => match.index).sort((a, b) => a - b);

                                if (!q.length) { continue; }

                                const new_txt = splitTextAtIndex(el.text, q);
                                const add_el = [];

                                const auto_token = (el, classname) => {
                                    return {
                                        type: "autoAlign",
                                        raw: el,
                                        class: classname,
                                        tokens: this.Lexer.lexInline(el),
                                    }
                                }

                                for (const new_el of new_txt) {
                                    side_match = new_el.match(side_rule);
                                    up_match = new_el.match(up_rule);
                                    if (side_match) {
                                        add_el.push(auto_token(new_el, "sideways"));
                                        continue;
                                    }
                                    if (up_match) {
                                        add_el.push(auto_token(new_el, "upright"));
                                        continue;
                                    }
                                    add_el.push(...this.Lexer.lexInline(new_el));
                                }
                                token.tokens.splice(idx, 1, ...add_el);
                            }
                        }
                    }

                    // 数字
                    if (autoTcy) {
                        for (const [idx, el] of old_token.tokens.entries()) {
                            if (inSpan(el)) { continue; }
                            if (el.type === "text") {
                                const digit = new RegExp("(?<!\\d)(\\d{2," + tcyDigit + "})(?!\\d)", "g");
                                const ii = /(?<![!?])([!?][!?])(?![!?])/g;
                                const t = el.text.replace(digit, "^$1^").replace(ii, "^$&^");
                                if (t !== el.text) {
                                    const add_el = this.Lexer.lexInline(t);
                                    token.tokens.splice(idx, 1, ...add_el);
                                }
                            }
                        }
                    }
                }
            }

        },
        getDendenOption() {
            return {
                ...options,
                ...this.denden,
            };
        }
    }
}

// ソースに改行(本家のテストを通したい)
export function denSpace() {
    const break_reg = /\n+$/;
    const renderer = {
        paragraph(text) { return `<p>${text}</p>`; },
        br() { return this.options.xhtml ? '<br/>\n' : '<br>\n'; },
    }
    return {
        extensions: [{
            name: 'space',
            renderer(token) {
                return token.raw;
            }
        },
        {
            name: 'hr',
            renderer(token) {
                const br_n = token.raw.match(break_reg);
                return this.parser.options.xhtml ? '<hr/>' + br_n : '<hr>' + br_n;
            }
        },{
            name: 'heading',
            renderer(token) {
                const br_n = token.raw.match(break_reg);
                const escapedText = token.text.toLowerCase().replace(/[^\w]+/g, '-');
                if (this.parser.options.headerIds) {
                    const id = this.parser.options.headerPrefix + escapedText;
                    return `<h${token.depth} id="${id}">${token.text}</h${token.depth}>${br_n}`;
                  }
              
                  return `<h${token.depth}>${token.text}</h${token.depth}>${br_n}`;
            }
        },{
            name: 'docBreak',
            renderer(token) {
                return this.parser.options.xhtml ? `<hr class="docbreak"/>` : `<hr class="docbreak">`;
            }
        },{
            name: 'pageNumber',
            renderer(token) {
                const br_n = token.raw.match(break_reg);
                const options = this.parser.options.getDendenOption();
                const epub_tag = options.epubType ? ' epub:type="pagebreak"' : '';
                const role_tag = options.dpubRole ? ' role="doc-pagebreak"' : '';
                const show_num = token.show ? token.text : '';
                return `<div id="pagenum_${token.text}" class="pagenum" title="${token.text}"${epub_tag}${role_tag}>${show_num}</div>${br_n}`;
            }
        },

        ],
        renderer,
    }
}
