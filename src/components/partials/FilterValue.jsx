import React from 'react';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';

class FilterValue extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            value: props.value,
            suggestions: []
        };

        this.onChange = this.onChange.bind(this);
        this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
        this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
    }

    onChange(e, {newValue}) {
        const {onChange, onChangeParams} = this.props;

        this.setState({
            value: newValue
        });

        onChange(newValue, onChangeParams);
    }

    onSuggestionsFetchRequested({value}) {
        const {candidates} = this.props;
        const inputValue = value.trim().toLowerCase();
        const inputLength = inputValue.length;
        const suggestions = inputLength === 0 ? [] : candidates.filter((candidate) => {
            return candidate.indexOf(inputValue) >= 0;
        });

        this.setState({suggestions});
    }

    onSuggestionsClearRequested() {
        this.setState({
            suggestions: []
        });
    }

    render() {
        const {suggestions, value} = this.state;
        const inputProps = {
            value,
            onChange: this.onChange
        };

        return (
            <Autosuggest
                suggestions={suggestions}
                onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                getSuggestionValue={suggestion => suggestion}
                renderSuggestion={suggestion => suggestion}
                inputProps={inputProps}/>
        );
    }
}

FilterValue.propTypes = {
    candidates: PropTypes.array,
    onChange: PropTypes.func,
    onChangeParams: PropTypes.object,
    value: PropTypes.string
};

export default FilterValue;
