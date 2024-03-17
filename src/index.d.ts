export default function dendenMarkdown(_options?: {}): {
    renderer: {
        paragraph(text: any): string;
    };
    extensions: ({
        name: string;
        level: string;
        tokenizer(src: any, tokens: any): {
            type: string;
            raw: string;
            text: string;
            show: boolean;
        } | undefined;
        renderer(token: any): any;
    } | {
        name: string;
        level: string;
        start(src: any): any;
        tokenizer(src: any, tokens: any): any;
        renderer(token: any): any;
    } | {
        name: string;
        level: string;
        renderer(token: any): any;
    } | {
        name: string;
        renderer(token: any): any;
        level?: undefined;
    })[];
    walkTokens(token: any): void;
    hooks: {
        postprocess(html: any): any;
    };
    getDendenOption(): any;
};
