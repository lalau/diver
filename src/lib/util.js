import get from 'lodash/get';

export const isMatchingTraffic = (trafficInfo, ruleInfo) => {
    return ruleInfo.filters.length > 0 && ruleInfo.filters.every(({name, value}) => {
        if (!value) {
            return true;
        }

        if (name === 'domain') {
            return testStr(trafficInfo.parsed.hostname, value);
        } else if (name ==='method') {
            return testStr(trafficInfo.traffic.request.method, value);
        } else if (name === 'mime-type') {
            return testStr(trafficInfo.traffic.response.content.mimeType, value);
        } else if (name === 'status-code') {
            return testStr(trafficInfo.traffic.response.status + '', value);
        } else if (name === 'larger-than') {
            return trafficInfo.traffic.response.bodySize > translateSize(value);
        } else if (name === 'has-response-header') {
            return isMatchingHeader(trafficInfo.traffic.response.headers, value);
        }

        return true;
    });
};

const isMatchingHeader = (headers, value) => {
    const separatorIndex = value.indexOf(':');
    const headerName = (separatorIndex <= 0 ? value : value.substring(0, separatorIndex)).trim();
    const headerValue = separatorIndex <= 0 ? null : (value.substring(separatorIndex + 1, value.length)).trim();

    return headers.some((header) => {
        return testStr(header.name, headerName) && (headerValue === null || testStr(header.value, headerValue));
    });
};

const translateSize = (s) => {
    if (typeof s === 'number') {
        return s;
    }

    if (!s || typeof s !== 'string') {
        return NaN;
    }

    const unit = s.toLowerCase().charAt(s.length - 1);

    if (unit !== 'k' && unit !== 'm') {
        if (isNaN(s)) {
            return NaN;
        } else {
            return parseInt(s);
        }
    }

    const number = s.substring(0, s.length - 1);

    if (isNaN(number)) {
        return NaN;
    }

    if (unit === 'k') {
        return Math.floor(number * 1024);
    }

    if (unit === 'm') {
        return Math.floor(number * 1024 * 1024);
    }

    return NaN;
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
    if (typeof str !== 'string') {
        return false;
    }

    if (rule.includes('*')) {
        return new RegExp('^' + rule.split('*').join('.*') + '$', 'i').test(str);
    } else {
        return str.toLowerCase() === rule.toLowerCase();
    }
};

export const getColumnWidth = (data, accessor, headerText, columnPadding = 0, headerPadding = 0) => {
    let maxWidth = getWidthOfTableText(headerText) + (columnPadding > headerPadding ? columnPadding : headerPadding);

    for (let i = 0; i < data.length; i++) {
        maxWidth = Math.max(maxWidth, getWidthOfTableText(get(data, i + '.' + accessor, '')) + columnPadding);
    }

    return maxWidth;
};

export const getWidthOfTableText = (txt) => {
    if (getWidthOfTableText.c === undefined){
        getWidthOfTableText.c = document.createElement('canvas');
        getWidthOfTableText.ctx = getWidthOfTableText.c.getContext('2d');
    }
    getWidthOfTableText.ctx.font = '12px sans-serif';
    return getWidthOfTableText.ctx.measureText(txt).width;
};

export const getRuleDataIndex = (ruleInfo, type, name) => {
    return ruleInfo.dataOrder.findIndex((orderItem) => {
        return orderItem.type === type && orderItem.name === name;
    });
};

export const getTrafficLabel = (trafficInfo, labels) => {
    let label = '';

    labels.some(({name, matches}) => {
        if (matches.length > 0 && matches.every(({type, name, value}) => { return testStr(trafficInfo.parsed[type][name], value); })) {
            label = name;
            return true;
        }
    });

    return label;
};
