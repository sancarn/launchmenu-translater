import React, {FC} from "react";
import {useDataHook} from "model-react";
import {
    Box,
    createContextAction,
    createKeyPatternSetting,
    createOptionSetting,
    createSettings,
    createSettingsFolder,
    createStandardMenuItem,
    createStandardSearchPatternMatcher,
    createStringSetting,
    declare,
    highlightTags,
    IHighlightNode,
    KeyPattern,
    Menu,
    Priority,
    searchAction,
    UILayer,
    useIOContext,
} from "@launchmenu/core";
import execWithIndices from "regexp-match-indices";
import {tokenList} from "@launchmenu/core/build/textFields/syntax/_tests/MathInterpreter.helper";

const info = {
    name: "Translator",
    description: "A simple translator for LaunchMenu",
    version: "0.0.0",
    icon: "applets" as const,
    tags: ["translator", "translate"],
};

/*
 
API query params: 
 - `sl` - source language code (`auto` for autodetection)
 - `tl` - translation language
 - `q`  - source text / word
 - `ie` - input encoding (a guess)
 - `oe` - output encoding (a guess)
 - `dj` - Json response with names. (dj=1)
 - `dt` - may be included more than once and specifies what to return in the reply.
 
Here are some values for `dt`. If the value is set, the following data will be returned:

 - `t` - translation of source text
 - `at` - alternate translations
 - `rm` - transcription / transliteration of source and translated texts
 - `bd` - dictionary, in case source text is one word (you get translations with articles, reverse translations, etc.)
 - `md` - definitions of source text, if it's one word
 - `ss` - synonyms of source text, if it's one word
 - `ex` - examples
 - `rw` - *See also* list.
 
 */

export const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&dj=1`;
export const languages = {
    "??": {code: "auto", name: "Auto"},
    ar: {code: "ar", name: "Arab"},
    be: {code: "be", name: "Belarusian"},
    ca: {code: "ca", name: "Catalan"},
    cs: {code: "cs", name: "Czech"},
    da: {code: "da", name: "Danish"},
    de: {code: "de", name: "German"},
    en: {code: "en", name: "English"},
    eo: {code: "eo", name: "Esperanto"},
    es: {code: "es", name: "Spanish"},
    et: {code: "et", name: "Estonian"},
    fa: {code: "fa", name: "Persian"},
    fi: {code: "fi", name: "Finnish"},
    fr: {code: "fr", name: "French"},
    ga: {code: "ga", name: "Irish"},
    he: {code: "he", name: "Hebrew"},
    hi: {code: "hi", name: "Hindi"},
    hu: {code: "hu", name: "Hungarian"},
    id: {code: "id", name: "Indonesian"},
    is: {code: "is", name: "Icelandic"},
    it: {code: "it", name: "Italian"},
    ja: {code: "ja", name: "Japanese"},
    kk: {code: "kk", name: "Kazakh"},
    ko: {code: "ko", name: "Korean"},
    ky: {code: "ky", name: "Kyrgyz"},
    lt: {code: "lt", name: "Lithuanian"},
    lv: {code: "lv", name: "Latvian"},
    nl: {code: "nl", name: "Dutch"},
    no: {code: "no", name: "Norwegian"},
    pl: {code: "pl", name: "Polish"},
    pt: {code: "pt", name: "Portuguese"},
    ro: {code: "ro", name: "Romanian"},
    ru: {code: "ru", name: "Russian"},
    sk: {code: "sk", name: "Slovak"},
    sl: {code: "sl", name: "Slovenian"},
    sv: {code: "sv", name: "Swedish"},
    th: {code: "th", name: "Thai"},
    tr: {code: "tr", name: "Turkish"},
    uk: {code: "uk", name: "Ukrainian"},
    vi: {code: "vi", name: "Vietnamese"},
    yi: {code: "yi", name: "Yiddish"},
    zh: {code: "zh", name: "Chinese"},
};
//Bind toString() method to all objects
Object.values(languages).forEach(e => (e.toString = () => e.name));

export const settings = createSettings({
    version: "0.0.0",
    settings: () =>
        createSettingsFolder({
            ...info,
            children: {
                defaultSourceLanguage: createOptionSetting({
                    name: "Default Source Language",
                    init: languages["??"],
                    options: Object.values(languages),
                    createOptionView: option => createStandardMenuItem(option),
                }),
                defaultToLanguage: createOptionSetting({
                    name: "Default Destination Language",
                    init: languages["??"],
                    options: Object.values(languages),
                    createOptionView: option => createStandardMenuItem(option),
                }),
            },
        }),
});

// const alertCombined = createContextAction({
//     name: "Alert",
//     contextItem: {
//         icon: "send",
//         priority: [Priority.HIGH],
//         shortcut: context => context.settings.get(settings).alert.get(),
//     },
//     core: (texts: string[]) => ({
//         execute: ({context}) => {
//             const name = context?.settings.get(settings).username.get();
//             const prefix = texts.reduce((total, text, i) => {
//                 const dist = texts.length - i - 1;
//                 const spacer = dist == 0 ? "" : dist == 1 ? " and " : ", ";
//                 return total + (i > 0 ? text.toLowerCase() : text) + spacer;
//             }, "");
//             alert(`${prefix} ${name}`);
//         },
//     }),
// });

// const Content: FC<{text: string}> = ({text}) => {
//     const context = useIOContext();
//     const [hook] = useDataHook();
//     const name = context?.settings.get(settings).username.get(hook);
//     return (
//         <Box color="primary">
//             {text} {name}!
//         </Box>
//     );
// };

// const items = [
//     createStandardMenuItem({
//         name: "Hello world",
//         onExecute: () => alert("Hello!"),
//         content: <Content text="Hello" />,
//         searchPattern: helloWorldPattern,
//         actionBindings: [alertCombined.createBinding("Hello")],
//     }),
//     createStandardMenuItem({
//         name: "Bye world",
//         onExecute: () => alert("Bye!"),
//         content: <Content text="Bye" />,
//         searchPattern: helloWorldPattern,
//         actionBindings: [alertCombined.createBinding("Bye")],
//     }),
// ];

export const translationRegexTl = /^(?<h>tr(?:anslate)?)\s*(?<tl>\w{2})?\s*:\s*(?<q>.*)/i;
export const translationRegexSlTl =
    /^(?<h>tr(?:anslate)?)\s*(?<sl>\w{2})\s*(?<tl>\w{2})\s*:\s*(?<q>.*)/i;

type IMatcherHelper = {
    type: string;
    value?: string;
    indices?: number[];
    valid?: boolean;
    token?: keyof typeof highlightTags;
};

const searchPatternMatcher = createStandardSearchPatternMatcher({
    name: "Translator",
    matcher: ({search, context}, hook) => {
        const s = context.settings.get(settings);
        const getMatcherHelper = (
            code: string,
            defaultCode: string,
            indices?: number[] | undefined
        ) => {
            return {
                value: code in languages ? code : defaultCode,
                valid: code in languages,
                indices,
            };
        };

        let searchSettings: IMatcherHelper[] | undefined;

        let pt: execWithIndices.RegExpExecArray | null;
        if ((pt = execWithIndices(translationRegexTl, search))) {
            searchSettings = [
                {
                    type: "header",
                    value: pt.groups?.h,
                    indices: pt?.indices?.groups?.h,
                    token: highlightTags.patternMatch,
                    valid: true,
                },
                {
                    type: "srcLang",
                    ...getMatcherHelper("", s.defaultSourceLanguage.get(hook).code),
                },
                {
                    type: "toLang",
                    token: highlightTags.patternMatch,
                    ...(pt.groups?.tl
                        ? getMatcherHelper(
                              pt.groups.tl,
                              s.defaultSourceLanguage.get(hook).code,
                              pt?.indices?.groups?.tl
                          )
                        : getMatcherHelper("", s.defaultToLanguage.get(hook).code)),
                },
                {
                    type: "query",
                    value: pt.groups?.q,
                    indices: undefined,
                },
            ];
        } else if ((pt = execWithIndices(translationRegexSlTl, search))) {
            if (pt.groups?.sl && pt.groups?.tl) {
                searchSettings = [
                    {
                        type: "header",
                        value: pt.groups?.h,
                        indices: pt?.indices?.groups?.h,
                        token: highlightTags.patternMatch,
                        valid: true,
                    },
                    {
                        type: "srcLang",
                        token: highlightTags.operator,
                        ...getMatcherHelper(
                            pt.groups?.sl,
                            s.defaultSourceLanguage.get(hook).code,
                            pt?.indices?.groups?.sl
                        ),
                    },
                    {
                        type: "toLang",
                        token: highlightTags.literal,
                        ...getMatcherHelper(
                            pt.groups?.tl,
                            s.defaultToLanguage.get(hook).code,
                            pt?.indices?.groups?.tl
                        ),
                    },
                    {
                        type: "query",
                        value: pt.groups?.q,
                        indices: undefined,
                    },
                ];
            }
        }

        if (searchSettings) {
            const highlight = searchSettings
                .filter(e => e.indices)
                .map(e => {
                    return {
                        start: e.indices![0],
                        end: e.indices![1],
                        tags: e.valid
                            ? e.token
                                ? [e.token]
                                : []
                            : [highlightTags.error],
                        text: "", //TODO: Required parameter at the time of writing
                    };
                });
            const query = searchSettings.find(e => e.type == "query");
            return {
                name: "Translator",
                query: query ? query.value : "",
                search: search,
                metadata: searchSettings,
                highlight,
            };
        }
    },
});

const cache: any = {};
export default declare({
    info,
    settings,
    async search(query, hook) {
        const patternMatch = searchPatternMatcher(query, hook);
        if (patternMatch?.metadata) {
            const searchSettings = patternMatch.metadata;
            const settings = Object.fromEntries(
                searchSettings.map(e => [e.type, e.value])
            );
            const {srcLang, toLang, query} = settings;
            if (query) {
                const id = [srcLang, toLang, query].join(",");
                if (!cache[id]) {
                    console.log("Querying google");
                    cache[id] = await (
                        await fetch(
                            `${googleTranslateUrl}&sl=${srcLang}&tl=${toLang}&q=${query}`,
                            {
                                method: "GET",
                                headers: {
                                    "content-type": "application/json",
                                },
                            }
                        )
                    ).json();
                }

                //Get response from cache
                const response = cache[id];

                // const response = {sentences: [{trans: "poop"}]};
                // console.log(response);
                return {
                    patternMatch,
                    item: {
                        //Top priority
                        priority: Priority.HIGH,

                        //Create returned item
                        item: createStandardMenuItem({
                            name: response?.sentences.reduce(
                                (
                                    a: string,
                                    b: {trans: string; orig: string; backend: number}
                                ) => a + b.trans,
                                ""
                            ),
                            onExecute: () => {},
                            icon: "applets",
                        }),
                    },
                };
            }
        }
        return {};
    },
});
