export const isMatchingTraffic = (trafficInfo, ruleInfo) => {
    return ruleInfo.filters.every(({name, /*key, */value}) => {
        if (name === 'domain') {
            return testStr(trafficInfo.parsed.hostname, value);
        } else {
            return true;
        }
    });
};

export const getRandomColor = () => {
    let color = '';
    for (let i = 0; i < 3; i++) {
        const component = Math.floor(Math.random() * 85) + 85;
        const hex = component.toString(16);
        color += hex.length === 1 ? ('0' + hex) : hex;
    }
    return color;
};

export const testStr = (str, rule) => {
    if (rule.includes('*')) {
        return new RegExp('^' + rule.split('*').join('.*') + '$').test(str);
    } else {
        return str === rule;
    }
};
