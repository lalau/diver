import Ajv from 'ajv';
import ruleSchema from '../../src/lib/schema/rule.json';

const ajv = new Ajv();
const validateRule = ajv.compile(ruleSchema);

window.addEventListener('message', function(event) {
    const type = event.data.type;
    const payload = event.data.payload;

    if (type === 'VALIDATE_RULE') {
        validateRule(payload.ruleInfo);
        event.source.postMessage({
            type: 'VALIDATE_RULE_RESULT',
            result: {
                errors: validateRule.errors
            }
        }, event.origin);
    }
});
