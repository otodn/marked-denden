import { marked } from "npm:marked";
import { dendenMarkdown, denSpace } from '../src/index.js';
import { assertStrictEquals } from "https://deno.land/std@0.175.0/testing/asserts.ts";


Deno.test("DenDenMarkdownTest", async (t) => {
    
    marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: false,
        langPrefix:"",
        xhtml: true
        });

    String.prototype.rtrim = function () {return this.replace(/\s+$/, "");}

    await t.step("testRubyFallback", () => {
        marked.use(dendenMarkdown({ rubyParenthesisOpen : "(", rubyParenthesisClose : ")" }),denSpace());
        
        let source = "{電子書籍|でんししょせき}";
        let expected = `<p><ruby>電子書籍<rp>(</rp><rt>でんししょせき</rt><rp>)</rp></ruby></p>
`;
        let actual = marked.parse(source);
        assertStrictEquals(expected.rtrim(), actual);

        source = "{電子書籍|でん|し|しょ|せき}";
        expected = `<p><ruby>電<rp>(</rp><rt>でん</rt><rp>)</rp>子<rp>(</rp><rt>し</rt><rp>)</rp>書<rp>(</rp><rt>しょ</rt><rp>)</rp>籍<rp>(</rp><rt>せき</rt><rp>)</rp></ruby></p>`
        
        actual = marked.parse(source);
        assertStrictEquals(expected.rtrim(), actual);
        
    });

    await t.step("testRubyParenthesisEscape", () => {
        marked.use(dendenMarkdown({ rubyParenthesisOpen : "<h1>&", rubyParenthesisClose : "&</h1>" }),denSpace());
        
        const source = "{電子書籍|でんししょせき}";
        const expected = `<p><ruby>電子書籍<rp>&lt;h1&gt;&amp;</rp><rt>でんししょせき</rt><rp>&amp;&lt;/h1&gt;</rp></ruby></p>`;
        const actual = marked.parse(source);
        assertStrictEquals(expected.rtrim(), actual);
    });

})