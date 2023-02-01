import { marked } from "npm:marked";
import { decode } from "npm:html-entities";
import { dendenMarkdown, denSpace } from '../src/index.js';
import { assertStrictEquals, assertNotMatch } from "https://deno.land/std@0.175.0/testing/asserts.ts";


Deno.test("DenDenMarkdownOreTest", async (t) => {

    // 改行コードが元ファイルは\r\nだが、markedは\nに変換しているため、\nに置き換えてテストしている
    
    marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: false,
        langPrefix:"",
        xhtml: true
    });

    marked.use(dendenMarkdown(), denSpace());

    const fixtureDir = new URL("../../DenDenMarkdown/tests/fixtures/", import.meta.url);

    function assertTransformation(fixtureName){
        const sourceFile = fixtureName + '.md';
        const transformedFile = fixtureName + '.html';
        assertTransformedFile(transformedFile, sourceFile);
    }

    function assertTransformedFile(transformedFile, sourceFile){
        const expected = fixture(transformedFile).replace(/\r\n/g, '\n');
        const actual = marked.parse(fixture(sourceFile));
        assertStrictEquals(actual.trim(), expected.trim());
    }
    
    function fixture(fileName){
        const filePath = new URL(fileName,fixtureDir)
        return Deno.readTextFileSync(filePath);
    }

    await t.step("testAbbr", () => {
        assertTransformation('abbr');
    });

    await t.step("testParagraph", () => {
        assertTransformation('paragraph');
    });

    await t.step("testBrInParagraph", () => {
        assertTransformation('br-in-paragraph');
    });

    await t.step("testIndent", () => {
        assertTransformation('indent');
    });

    await t.step("testHeadingsAtx", () => {
        assertTransformation('headings-atx');
    });

    await t.step("testHeadingsSetext", () => {
        assertTransformation('headings-setext');
    });

    await t.step("testBlockTitles", () => {
        assertTransformation('block-titles');
    });

    await t.step("testHeadingsSetextNumHyphens", () => {
        assertTransformedFile('headings-setext.html', 'headings-setext-hyphens.md');
    });

    await t.step("testBlockQuote", () => {
        assertTransformation('blockquote');
    });

    await t.step("testBlockQuoteNest", () => {
        assertTransformation('blockquote-nest');
    });

    await t.step("testUlAsterisk", () => {
        assertTransformedFile('ul.html', 'ul-asterisk.md');
    });

    await t.step("testUlPlus", () => {
        assertTransformedFile('ul.html', 'ul-plus.md');
    });

    await t.step("testUlHyphen", () => {
        assertTransformedFile('ul.html', 'ul-hyphen.md');
    });

    await t.step("testOl", () => {
        assertTransformation('ol');
    });
    
    await t.step("testOlOutOfOrder", () => {
        let enhanced_ordered_list = false;
        assertTransformedFile('ol.html', 'ol-out-of-order.md');

        enhanced_ordered_list = true;
        assertTransformation('ol-out-of-order');
    });

    await t.step("testOlEscape", () => {
        assertTransformation('ol-escape');
    });

    await t.step("testPharagraphInList", () => {
        assertTransformation('paragraph-in-list');
    });

    await t.step("testMultiParagraphsInLi", () => {
        assertTransformation('multi-paragraphs-in-li');
    });

    await t.step("testBlockquoteInList", () => {
        assertTransformation('blockquote-in-list');
    });

    await t.step("testCodeInList", () => {
        assertTransformation('code-in-list');
    });

    await t.step("testCodeBlock", () => {
        assertTransformation('code-block');
    });

    await t.step("testCodeInline", () => {
        assertTransformation('code-inline');
    });

    await t.step("testHr", () => {
        assertTransformation('hr');
    });

    await t.step("testDocBreak", () => {
        assertTransformation('docbreak');
    });

    await t.step("testPageNumber", () => {
        assertTransformation('page-number');
    });

    await t.step("testPageBreakInline", () => {
        assertTransformation('page-break-inline');
    });

    await t.step("testPageNumberText", () => {
        assertTransformation('page-number-text');
    });

    await t.step("testInlineLink", () => {
        assertTransformation('inline-link');
    });

    await t.step("testInlineLinkTitle", () => {
        assertTransformation('inline-link-title');
    });

    await t.step("testReferenceLink", () => {
        assertTransformation('reference-link');
    });

    await t.step("testReferenceLinkTitle", () => {
        assertTransformation('reference-link-title');
    });

    await t.step("testReferenceLinkNoId", () => {
        assertTransformation('reference-link-no-id');
    });

    await t.step("testAutolink", () => {
        const expected = fixture('autolink.html').replace(/\r\n/g, '\n');
        const source = fixture('autolink.md').replace(/\r\n/g, '\n');
        const actual = marked.parse(source);
        assertStrictEquals(decode(expected), decode(actual));
    });

    await t.step("testAutolinkTwitter", () => {
        assertTransformation('autolink-twitter');
    });

    await t.step("testEmphasis", () => {
        assertTransformation('emphasis');
    });

    await t.step("testEmphasisUnderscore", () => {
        assertTransformedFile('emphasis.html', 'emphasis-underscore.md');
    });

    await t.step("testUnderscoreInQuotation", () => {
        assertTransformation('underscore-in-quotation');
    });

    await t.step("testGroupRuby", () => {
        assertTransformation('group-ruby');
    });

    await t.step("testMonoRuby", () => {
        assertTransformation('mono-ruby');
    });

    await t.step("testBraceFollowingVerticalLineNotTransformedToRuby", () => {
        const source = 'これは段落です。foo{|bar| bar.buz} これは段落です。';
        const transformed = marked.parse(source);
        assertNotMatch(transformed,/<ruby>/);
    });

    await t.step("testEscapeRuby", () => {
        // JSの仕様的に一重バックスラッシュは消えるので、二重にする
        const source = 'これは段落です。\\{Info\\|Warning\\} これは段落です。';
        //const source = 'これは段落です。\{Info\|Warning\} これは段落です。';
        const transformed = marked.parse(source);
        assertNotMatch(transformed,/<ruby>/);
    });

    await t.step("testEscapeRubyVerticalLine", () => {
        const source = 'これは段落です。{Info\\|Warning} これは段落です。';
        // source = 'これは段落です。{Info\|Warning} これは段落です。';
        const transformed = marked.parse(source);
        assertNotMatch(transformed,/<ruby>/);
    });

    await t.step("testEscapeRubyBackQuotes", () => {
        const source = 'これは段落です。`{Info|Warning}` これは段落です。';
        const transformed = marked.parse(source);
        assertNotMatch(transformed,/<ruby>/);
    });

    await t.step("testTateChuYoko", () => {
        assertTransformation('tate-chu-yoko');
    });

    await t.step("testFootnote", () => {
        assertTransformation('footnote');
    });

    await t.step("testMultiParagraphsInFootnote", () => {
        assertTransformation('multi-paragraphs-in-footnote');
    });

    await t.step("testMultiParagraphsInFootnoteLineBreakAtFirst", () => {
        assertTransformedFile('multi-paragraphs-in-footnote.html', 'multi-paragraphs-in-footnote-line-break-at-first.md');
    });

    await t.step("testFootnoteCannotReferenceAnotherPage", () => {
        assertTransformation('footnote-cannot-reference-another-page');
    });

    await t.step("testImage", () => {
        assertTransformation('image');
    });

    await t.step("testImageTitle", () => {
        assertTransformation('image-title');
    });

    await t.step("testImageNoAlt", () => {
        assertTransformation('image-no-alt');
    });

    await t.step("testImageNoAltTitle", () => {
        assertTransformation('image-no-alt-title');
    });

    await t.step("testImageReferenceLink", () => {
        assertTransformation('image-reference-link');
    });

    await t.step("testImageReferenceLinkTitle", () => {
        assertTransformation('image-reference-link-title');
    });

    await t.step("testDl", () => {
        assertTransformation('dl');
    });

    await t.step("testMultiDdInDl", () => {
        assertTransformation('multi-dd-in-dl');
    });

    await t.step("testParagraphInDd", () => {
        assertTransformation('paragraph-in-dd');
    });

    await t.step("testBlockquoteListCodeInDd", () => {
        assertTransformation('blockquote-list-code-in-dd');
    });

    await t.step("testTable", () => {
        assertTransformation('table');
    });

    await t.step("testHtmlTag", () => {
        assertTransformation('html-tag');
    });

    await t.step("testNotTransformedInHtmlBlock", () => {
        assertTransformation('not-transformed-in-html-block');
    });

    await t.step("testNotTransformedInMath", () => {
        assertTransformation('not-transformed-in-math');
    });

    await t.step("testNotTransformedInScript", () => {
        assertTransformation('not-transformed-in-script');
    });

    await t.step("testNotTransformedInStyle", () => {
        assertTransformation('not-transformed-in-style');
    });

    await t.step("testNotTransformedInSvg", () => {
        assertTransformation('not-transformed-in-svg');
    });

    await t.step("testMarkdownInHtmlBlock", () => {
        assertTransformation('markdown-in-html-block');
    });

    await t.step("testBlockTagAddress", () => {
        assertTransformation('block-tag-address');
    });

    await t.step("testBlockTagArticle", () => {
        assertTransformation('block-tag-article');
    });

    await t.step("testBlockTagAside", () => {
        assertTransformation('block-tag-aside');
    });

    await t.step("testBlockTagBlockquote", () => {
        assertTransformation('block-tag-blockquote');
    });

    await t.step("testBlockTagBody", () => {
        assertTransformation('block-tag-body');
    });

    await t.step("testBlockTagCenter", () => {
        assertTransformation('block-tag-center');
    });

    await t.step("testBlockTagDd", () => {
        assertTransformation('block-tag-dd');
    });

    await t.step("testBlockTagDetails", () => {
        assertTransformation('block-tag-details');
    });

    await t.step("testBlockTagDialog", () => {
        assertTransformation('block-tag-dialog');
    });

    await t.step("testBlockTagDir", () => {
        assertTransformation('block-tag-dir');
    });

    await t.step("testBlockTagDiv", () => {
        assertTransformation('block-tag-div');
    });

    await t.step("testBlockTagDl", () => {
        assertTransformation('block-tag-dl');
    });

    await t.step("testBlockTagDt", () => {
        assertTransformation('block-tag-dt');
    });

    await t.step("testBlockTagFigcaption", () => {
        assertTransformation('block-tag-figcaption');
    });

    await t.step("testBlockTagFigure", () => {
        assertTransformation('block-tag-figure');
    });

    await t.step("testBlockTagFooter", () => {
        assertTransformation('block-tag-footer');
    });

    await t.step("testBlockTagHn", () => {
        assertTransformation('block-tag-hn');
    });

    await t.step("testBlockTagIframe", () => {
        assertTransformation('block-tag-iframe');
    });

    await t.step("testBlockTagHeader", () => {
        assertTransformation('block-tag-header');
    });

    await t.step("testBlockTagHgroup", () => {
        assertTransformation('block-tag-hgroup');
    });

    await t.step("testBlockTagHr", () => {
        assertTransformation('block-tag-hr');
    });

    await t.step("testBlockTagHtml", () => {
        assertTransformation('block-tag-html');
    });

    await t.step("testBlockTagLegend", () => {
        assertTransformation('block-tag-legend');
    });

    await t.step("testBlockTagListing", () => {
        assertTransformation('block-tag-listing');
    });

    await t.step("testBlockLTagMenu", () => {
        assertTransformation('block-tag-menu');
    });

    await t.step("testBlockLTagNav", () => {
        assertTransformation('block-tag-nav');
    });

    await t.step("testBlockTagOl", () => {
        assertTransformation('block-tag-ol');
    });

    await t.step("testBlockTagP", () => {
        assertTransformation('block-tag-p');
    });

    await t.step("testBlockTagPlaintext", () => {
        assertTransformation('block-tag-plaintext');
    });

    await t.step("testBlockTagPre", () => {
        assertTransformation('block-tag-pre');
    });

    await t.step("testBlockTagSection", () => {
        assertTransformation('block-tag-section');
    });

    await t.step("testBlockTagSummary", () => {
        assertTransformation('block-tag-summary');
    });

    await t.step("testBlockTagStyle", () => {
        assertTransformation('block-tag-style');
    });

    await t.step("testBlockTagTable", () => {
        assertTransformation('block-tag-table');
    });

    await t.step("testBlockTagUl", () => {
        assertTransformation('block-tag-ul');
    });

    await t.step("testBlockTagXmp", () => {
        assertTransformation('block-tag-xmp');
    });

    await t.step("testPhrasingContentTagAbbr", () => {
        assertTransformation('phrasing_content_tag_abbr');
    });

    await t.step("testPhrasingContentTagaAea", () => {
        assertTransformation('phrasing_content_tag_area');
    });

    await t.step("testPhrasingContentTagAudio", () => {
        assertTransformation('phrasing_content_tag_audio');
    });

    await t.step("testPhrasingContentTagB", () => {
        assertTransformation('phrasing_content_tag_b');
    });

    await t.step("testPhrasingContentTagBdi", () => {
        assertTransformation('phrasing_content_tag_bdi');
    });

    await t.step("testPhrasingContentTagBdo", () => {
        assertTransformation('phrasing_content_tag_bdo');
    });

    await t.step("testPhrasingContentTagBr", () => {
        assertTransformation('phrasing_content_tag_br');
    });

    await t.step("testPhrasingContentTagButton", () => {
        assertTransformation('phrasing_content_tag_button');
    });

    await t.step("testPhrasingContentTagCanvas", () => {
        assertTransformation('phrasing_content_tag_canvas');
    });

    await t.step("testPhrasingContentTagCite", () => {
        assertTransformation('phrasing_content_tag_cite');
    });

    await t.step("testPhrasingContentTagCode", () => {
        assertTransformation('phrasing_content_tag_code');
    });

    await t.step("testPhrasingContentTagCommand", () => {
        assertTransformation('phrasing_content_tag_command');
    });

    await t.step("testPhrasingContentTagDatalist", () => {
        assertTransformation('phrasing_content_tag_datalist');
    });

    await t.step("testPhrasingContentTagDel", () => {
        assertTransformation('phrasing_content_tag_del');
    });

    await t.step("testPhrasingContentTagDfn", () => {
        assertTransformation('phrasing_content_tag_dfn');
    });

    await t.step("testPhrasingContentTagEm", () => {
        assertTransformation('phrasing_content_tag_em');
    });

    await t.step("testPhrasingContentTagEmbed", () => {
        assertTransformation('phrasing_content_tag_embed');
    });

    await t.step("testPhrasingContentTagI", () => {
        assertTransformation('phrasing_content_tag_i');
    });

    await t.step("testPhrasingContentTagImg", () => {
        assertTransformation('phrasing_content_tag_img');
    });

    await t.step("testPhrasingContentTagInput", () => {
        assertTransformation('phrasing_content_tag_input');
    });

    await t.step("testPhrasingContentTagIns", () => {
        assertTransformation('phrasing_content_tag_ins');
    });

    await t.step("testPhrasingContentTagKbd", () => {
        assertTransformation('phrasing_content_tag_kbd');
    });

    await t.step("testPhrasingContentTagKeygen", () => {
        assertTransformation('phrasing_content_tag_keygen');
    });

    await t.step("testPhrasingContentTagLabel", () => {
        assertTransformation('phrasing_content_tag_label');
    });

    await t.step("testPhrasingContentTagMap", () => {
        assertTransformation('phrasing_content_tag_map');
    });

    await t.step("testPhrasingContentTagMark", () => {
        assertTransformation('phrasing_content_tag_mark');
    });

    await t.step("testPhrasingContentTagMath", () => {
        assertTransformation('phrasing_content_tag_math');
    });

    await t.step("testPhrasingContentTagMeter", () => {
        assertTransformation('phrasing_content_tag_meter');
    });

    await t.step("testPhrasingContentTagNoscript", () => {
        assertTransformation('phrasing_content_tag_noscript');
    });

    await t.step("testPhrasingContentTagObject", () => {
        assertTransformation('phrasing_content_tag_object');
    });

    await t.step("testPhrasingContentTagOutput", () => {
        assertTransformation('phrasing_content_tag_output');
    });

    await t.step("testPhrasingContentTagProgress", () => {
        assertTransformation('phrasing_content_tag_progress');
    });

    await t.step("testPhrasingContentTagQ", () => {
        assertTransformation('phrasing_content_tag_q');
    });

    await t.step("testPhrasingContentTagRuby", () => {
        assertTransformation('phrasing_content_tag_ruby');
    });

    await t.step("testPhrasingContentTagS", () => {
        assertTransformation('phrasing_content_tag_s');
    });

    await t.step("testPhrasingContentTagSamp", () => {
        assertTransformation('phrasing_content_tag_samp');
    });

    await t.step("testPhrasingContentTagScript", () => {
        assertTransformation('phrasing_content_tag_script');
    });

    await t.step("testPhrasingContentTagSelect", () => {
        assertTransformation('phrasing_content_tag_select');
    });

    await t.step("testPhrasingContentTagSmall", () => {
        assertTransformation('phrasing_content_tag_small');
    });

    await t.step("testPhrasingContentTagSpan", () => {
        assertTransformation('phrasing_content_tag_span');
    });

    await t.step("testPhrasingContentTagStrong", () => {
        assertTransformation('phrasing_content_tag_strong');
    });

    await t.step("testPhrasingContentTagSub", () => {
        assertTransformation('phrasing_content_tag_sub');
    });

    await t.step("testPhrasingContentTagSup", () => {
        assertTransformation('phrasing_content_tag_sup');
    });

    await t.step("testPhrasingContentTagSvg", () => {
        assertTransformation('phrasing_content_tag_svg');
    });

    await t.step("testPhrasingContentTagTextarea", () => {
        assertTransformation('phrasing_content_tag_textarea');
    });

    await t.step("testPhrasingContentTagTime", () => {
        assertTransformation('phrasing_content_tag_time');
    });

    await t.step("testPhrasingContentTagU", () => {
        assertTransformation('phrasing_content_tag_u');
    });

    await t.step("testPhrasingContentTagVar", () => {
        assertTransformation('phrasing_content_tag_var');
    });

    await t.step("testPhrasingContentTagVideo", () => {
        assertTransformation('phrasing_content_tag_video');
    });

    await t.step("testPhrasingContentTagWbr", () => {
        assertTransformation('phrasing_content_tag_wbr');
    });

    await t.step("testFencedCodeBlock", () => {
        assertTransformation('fenced-code-block');
    });

    await t.step("testFencedCodeBlockGfm", () => {
      assertTransformation('fenced-code-block-gfm');
    });

    await t.step("testFencedCodeBlockGfmWithClass", () => {
      assertTransformation('fenced-code-block-gfm-with-class');
    });

    await t.step("testWithIdAttributeHn", () => {
        assertTransformation('with-id-attribute-hn');
    });

    await t.step("testWithIdAttributeA", () => {
        assertTransformation('with-id-attribute-a');
    });

    await t.step("testWithIdAttributeARefLink", () => {
        assertTransformation('with-id-attribute-a-ref-link');
    });

    await t.step("testWithIdAttributeImg", () => {
        assertTransformation('with-id-attribute-img');
    });

    await t.step("testWithIdAttributeImgRefLink", () => {
        assertTransformation('with-id-attribute-img-ref-link');
    });

    await t.step("testWithIdAttributeFencedCodeBlock", () => {
        assertTransformation('with-id-attribute-fenced-code-block');
    });

    await t.step("testWithClassAttributeHn", () => {
        assertTransformation('with-class-attribute-hn');
    });

    await t.step("testWithClassAttributeA", () => {
        assertTransformation('with-class-attribute-a');
    });

    await t.step("testWithClassAttributeARefLink", () => {
        assertTransformation('with-class-attribute-a-ref-link');
    });

    await t.step("testWithClassAttributeImg", () => {
        assertTransformation('with-class-attribute-img');
    });

    await t.step("testWithClassAttributeImgRefLink", () => {
        assertTransformation('with-class-attribute-img-ref-link');
    });

    await t.step("testWithClassAttributeFencedCodeBlock", () => {
        assertTransformation('with-class-attribute-fenced-code-block');
    });

    await t.step("testWithMultiAttributesHn", () => {
        assertTransformation('with-multi-attributes-hn');
    });

    await t.step("testWithMultiAttributesA", () => {
        assertTransformation('with-multi-attributes-a');
    });

    await t.step("testWithMultiAttributesARefLink", () => {
        assertTransformation('with-multi-attributes-a-ref-link');
    });

    await t.step("testWithMultiAttributesImg", () => {
        assertTransformation('with-multi-attributes-img');
    });

    await t.step("testWithMultiAttributesImgRefLink", () => {
        assertTransformation('with-multi-attributes-img-ref-link');
    });

    await t.step("testWithMultiAttributesFencedCodeBlock", () => {
        assertTransformation('with-multi-attributes-fenced-code-block');
    });

    await t.step("testFootnoteWithoutEpubType", () => {
        const epubType = false;
        marked.setOptions({denden:{epubType}})
        assertTransformation('footnote-without-epub-type');
    });

    await t.step("testPageNumberWithoutEpubType", () => {
        const epubType = false;
        marked.setOptions({denden:{epubType}})
        assertTransformation('page-number-without-epub-type');
    });

    await t.step("testPageNumberTextWithoutEpubType", () => {
        const epubType = false;
        marked.setOptions({denden:{epubType}})
        assertTransformation('page-number-text-without-epub-type');
    });

    await t.step("testPageBreakInlineWithoutEpubType", () => {
        const epubType = false;
        marked.setOptions({denden:{epubType}})
        assertTransformation('page-break-inline-without-epub-type');
    });

    await t.step("testFootnoteWithoutDpubRole", () => {
        const dpubRole = false;
        marked.setOptions({denden:{dpubRole}})
        assertTransformation('footnote-without-dpub-role');
    });

    await t.step("testPageNumberWithoutDpubRole", () => {
        const dpubRole = false;
        marked.setOptions({denden:{dpubRole}})
        assertTransformation('page-number-without-dpub-role');
    });

    await t.step("testPageNumberTextWithoutDpubrole", () => {
        const dpubRole = false;
        marked.setOptions({denden:{dpubRole}})
        assertTransformation('page-number-text-without-dpub-role');
    });

    await t.step("testPageInlineBreakWithoutDpubRole", () => {
        const dpubRole = false;
        marked.setOptions({denden:{dpubRole}})
        assertTransformation('page-break-inline-without-dpub-role');
    });


})