export const isMatchingTraffic = (trafficInfo, ruleInfo) => {
    return ruleInfo.match.host === trafficInfo.parsed.host;
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
