import React from 'react';
import classnames from 'classnames';
import Traffics from './Traffics.jsx';
import RawTraffics from './RawTraffics.jsx';
import InfoPane from './InfoPane.jsx';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            infoPaneOpened: false
        };
        this.openInfoPane = this.toggleInfoPane.bind(this, true);
        this.closeInfoPane = this.toggleInfoPane.bind(this, false);
    }

    toggleInfoPane(open) {
        this.setState({
            infoPaneOpened: open
        });
    }

    render() {
        const {infoPaneOpened} = this.state;

        return (
            <div className={classnames('diver', {'info-pane-opened': infoPaneOpened})}>
                <div className='traffic-pane'>
                    <Traffics onInfo={this.openInfoPane} onDeselect={this.closeInfoPane}/>
                    <RawTraffics onInfo={this.openInfoPane}/>
                </div>
                <div className='info-pane'>
                    <InfoPane onClose={this.closeInfoPane}/>
                </div>
            </div>
        );
    }
}

export default App;
