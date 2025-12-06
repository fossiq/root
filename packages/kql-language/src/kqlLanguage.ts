import { StreamLanguage } from "@codemirror/language";
import { kqlOperators, kqlFunctions, kqlKeywords } from "./kqlData";

// optimize lookup
const operatorSet = new Set(kqlOperators);
const functionSet = new Set(kqlFunctions);
const keywordSet = new Set(kqlKeywords);

export const kqlLanguage = StreamLanguage.define({
    token: (stream) => {
        // Eat whitespace
        if (stream.eatSpace()) return null;

        // Comments
        if (stream.match("//")) {
            stream.skipToEnd();
            return "comment";
        }

        // Strings (double and single quoted)
        if (stream.match('"') || stream.match("'")) {
            const quote = stream.current();
            stream.eat(quote); // eat opening
            while (!stream.eol()) {
                const next = stream.next();
                if (next === quote) break;
                // escape handling could be added here
            }
            return "string";
        }

        // Numbers (integers, decimals, scientific)
        if (stream.match(/^-?\d*\.?\d+(?:[eE][+\-]?\d+)?/)) return "number";

        // Timespan / Datetime literals (basic)
        if (stream.match(/^(datetime|time)\(.*\)/)) return "string.special";

        // Punctuation / Operators
        // pipe is special in KQL
        if (stream.eat("|")) return "operator";
        if (stream.match(/^(==|!=|<=|>=|<|>|=|\+|-|\*|\/|in|!in|has|!has|contains|!contains|startswith|!startswith|endswith|!endswith)/)) return "operator";
        if (stream.match(/^[\(\)\{\}\[\],]/)) return "punctuation";

        // Identifiers / Keywords
        stream.eatWhile(/[\w\d_\-]/);
        const word = stream.current();

        if (operatorSet.has(word)) return "keyword"; // tabular operators
        if (functionSet.has(word)) return "builtin"; // scalar functions
        if (keywordSet.has(word)) return "variableName.special"; // syntax keywords
        if (word === "and" || word === "or" || word === "not") return "logic";

        // Bracketed identifier
        if (stream.match(/^\[['"].*?['"]\]/)) return "variableName";

        return "variableName";
    }
});
