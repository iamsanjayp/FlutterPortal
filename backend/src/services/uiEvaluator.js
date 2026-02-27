const GENERIC_REQUIRED = [
    { pattern: /<View/, name: 'View' },
    { pattern: /<Text/, name: 'Text' },
    { pattern: /<Image/, name: 'Image' },
    { pattern: /(<ScrollView|<FlatList)/, name: 'Scrollable List' }
];

const GENERIC_OPTIONAL = [
    { pattern: /(<TouchableOpacity|<Pressable)/, name: 'Interactive Element' },
    { pattern: /<TextInput/, name: 'TextInput' },
    { pattern: /<Button/, name: 'Button' },
    { pattern: /<LinearGradient/, name: 'LinearGradient' },
    { pattern: /<Avatar/, name: 'Avatar' } // Assuming some library or custom component
];

/**
 * Evaluate a UI problem submission using Regex heuristics
 * @param {string} code - Student's React Native code
 * @param {Array<string>} specificRequirements - List of required widget names from DB (optional)
 */
export function evaluateUIProblem(code, specificRequirements = []) {
    if (!code) return { score: 0, details: { error: "No code provided" } };

    // 1. Generic Rubric Score
    let reqMatches = 0;
    GENERIC_REQUIRED.forEach(rule => {
        if (rule.pattern.test(code)) reqMatches++;
    });
    const reqScore = (reqMatches / GENERIC_REQUIRED.length) * 70;

    let optMatches = 0;
    GENERIC_OPTIONAL.forEach(rule => {
        if (rule.pattern.test(code)) optMatches++;
    });
    const optScore = (optMatches / GENERIC_OPTIONAL.length) * 30;

    const genericScore = Math.round(Math.min(reqScore + optScore, 100));

    // 2. Specific Requirements Score
    let specificScore = 0;
    let hasSpecifics = false;

    if (Array.isArray(specificRequirements) && specificRequirements.length > 0) {
        hasSpecifics = true;
        let specificMatches = 0;
        const validReqs = specificRequirements.filter(r => r);

        validReqs.forEach(req => {
            let matched = false;
            if (typeof req === 'string') {
                try {
                    matched = new RegExp(req, 'i').test(code);
                } catch (e) {}
            } else if (typeof req === 'object') {
                let typeMatched = true;
                if (req.type) {
                    try {
                        typeMatched = new RegExp(`<${req.type}`, 'i').test(code) || new RegExp(`${req.type}`, 'i').test(code);
                    } catch (e) { typeMatched = false; }
                }
                
                let textMatched = true;
                if (req.text) {
                    try {
                        // Escape regex chars just in case text has brackets etc.
                        const safeText = req.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        textMatched = new RegExp(safeText, 'i').test(code);
                    } catch (e) { textMatched = false; }
                }
                matched = typeMatched && textMatched;
            }
            if (matched) specificMatches++;
        });
        
        if (validReqs.length > 0) {
            specificScore = Math.round((specificMatches / validReqs.length) * 100);
        } else {
            hasSpecifics = false;
        }
    }

    // 3. Final Auto Score
    let finalAutoScore = genericScore;
    if (hasSpecifics) {
        finalAutoScore = Math.round((genericScore * 0.5) + (specificScore * 0.5));
    }

    return {
        score: finalAutoScore,
        details: {
            genericScore,
            specificScore: hasSpecifics ? specificScore : null,
            reqMatches,
            optMatches,
            breakdown: {
                required: reqMatches + '/' + GENERIC_REQUIRED.length,
                optional: optMatches + '/' + GENERIC_OPTIONAL.length,
            }
        }
    };
}
