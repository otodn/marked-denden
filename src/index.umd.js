(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.dendenMarkdown = factory());
})(this, (function () { 'use strict';

    function dendenMarkdown(_options = {}) {
        const default_options = {
            rubyParenthesisOpen: "",
            rubyParenthesisClose: "",
            autoTcy: true,
            tcyDigit: 2,
            autoTextOrientation: true,
            epubType: true,
            dpubRole: true,
            aozoraRuby: false,
            footnoteIdPrefix: "",
            footnoteLinkClass: "noteref",
            footnoteBacklinkClass: "",
            footnoteBacklinkContent: "&#9166;",
            pageNumberClass: "pagenum",
        };

        const options = {
            ...default_options,
            ..._options
        };


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
                splitText.push(text.substring(indexes[i], indexes[i] + 1));
                prevIndex = indexes[i] + 1;
            }
            splitText.push(text.substring(prevIndex));
            return splitText;
        }

        // スペース反映の相殺分
        const renderer = {
            paragraph(text) { return `<p>${text}</p>`; },
        };

        return {
            renderer,
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
                                type: "docBreak",
                                raw: match[0],
                            }
                        }
                    },
                    renderer(_) {
                        return `<hr class="docbreak"/>`;
                    }
                },
                {// ページ番号(行)
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

                        return `<div id="pagenum_${token.text}" class="${options.pageNumberClass}" title="${token.text}"${epub_tag}${role_tag}>${show_num}</div>\n`;
                    }
                },
                {// ページ番号(インライン)
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

                        return `<span id="pagenum_${token.text}" class="${options.pageNumberClass}" title="${token.text}"${epub_tag}${role_tag}>${show_num}</span>`;
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
                            const rtarray = rt.split("|");
                            const rt_tokens = [];
                            for (const obj of rtarray) {
                                rt_tokens.push(this.lexer.inlineTokens(obj));
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
                            }).join("");
                            return `<ruby>${ruby_tag}</ruby>`;
                        }
                        return `<ruby>${this.parser.parseInline(token.tokens)}${rpOpen}<rt>${this.parser.parseInline(token.rt)}</rt>${rpClose}</ruby>`;
                    }

                },
                { // 脚注拡張機能レンダー上書き
                    name: 'footnotes',
                    renderer({ items = [] }) {
                        const { footnoteIdPrefix, footnoteBacklinkContent } = options;
                        const epub_fn_tag = options.epubType ? ' epub:type="footnote"' : '';
                        const role_fn_tag = options.dpubRole ? ' role="doc-footnote"' : '';
                        const role_bl_tag = options.dpubRole ? ' role="doc-backlink"' : '';
                        const fn_bl_class = options.footnoteBacklinkClass ? ` class="${footnoteBacklinkClass}"` : '';
                        const fn_bl_attr = `${fn_bl_class}${role_bl_tag}`;
                        if (items.length === 0) return "";
                        const footnotesItemsHTML = items.reduce(
                            (acc, { label, content, refs }) => {
                                const encodedLabel = encodeURIComponent(label);
                                const parsedContent = this.parser.parse(content).trimEnd();
                                const isEndsWithP = parsedContent.endsWith('</p>');
                                let footnoteItem = '<li>\n';
                                footnoteItem += `<div id="fn_${footnoteIdPrefix + encodedLabel}" class="footnote"${epub_fn_tag}${role_fn_tag}>`;
                                footnoteItem += isEndsWithP ? parsedContent.replace(/<\/p>$/, '') : parsedContent;
                                refs.forEach((_, i) => {
                                    footnoteItem += ` <a href="#fnref_${encodedLabel}"${fn_bl_attr}>${i > 0 ? `${footnoteBacklinkContent}${i + 1}` : `${footnoteBacklinkContent}`}</a>`;
                                });
                                footnoteItem += isEndsWithP ? '</p>\n' : '\n';
                                footnoteItem += '</div>\n';
                                footnoteItem += '</li>\n';

                                return acc + footnoteItem;
                            }, "" // 初期値
                        );

                        const epub_fns_tag = options.epubType ? ' epub:type="footnotes"' : '';
                        let footnotesHTML = `\n<div class="footnotes"${epub_fns_tag}>\n`;
                        footnotesHTML += '<hr/>\n';
                        footnotesHTML += `<ol>\n\n${footnotesItemsHTML}</ol>\n\n`;
                        footnotesHTML += '</div>\n';
                        return footnotesHTML;
                    }
                },
                { // 脚注拡張機能レンダー上書き(参照)
                    name: 'footnoteRef',
                    renderer({ id, label }) {
                        const epub_fnr_tag = options.epubType ? ' epub:type="noteref"' : '';
                        const role_fnr_tag = options.dpubRole ? ' role="doc-noteref"' : '';
                        const fnr_class_tag = options.footnoteLinkClass ? ` class="${options.footnoteLinkClass}"` : '';
                        const encodedLabel = encodeURIComponent(label);
                        return `<a id="fnref_${encodedLabel}" href="#fn_${encodedLabel}" rel="footnote"${fnr_class_tag}${epub_fnr_tag}${role_fnr_tag}>${id}</a>`;
                    }
                },
                { // 縦中横
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
                },
                { // 自動縦書き調整
                    name: 'autoAlign',
                    level: 'inline',
                    renderer(token) {
                        return `<span class="${token.class}">${this.parser.parseInline(token.tokens)}</span>`;
                    }
                },
                { // スペース反映
                    name: 'space',
                    renderer(token) {
                        return token.raw;
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
                        };
                        return inSpan;
                    };
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
                                    };

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
            // 最後にコード整形
            hooks: {
                postprocess(html) {
                    const br_reg = /(?<!\n)<br\/?>(?!\n)/g;
                    const hr_reg = /(<hr.*?>)(?!\n)/g;
                    const p__cloce_reg = /(?<!\n)<\/p>(?!\n)/g;
                    let re_html = html.replaceAll(br_reg, "<br/>\n").replaceAll(hr_reg, "$1\n").replaceAll(p__cloce_reg,"</p>\n");
                    return re_html;
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

    return dendenMarkdown;

}));