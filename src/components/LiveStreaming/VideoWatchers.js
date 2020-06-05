import React from 'react';
import Parse from "parse";
import ParseLiveContext from "../parse/context";

class VideoWatchers extends React.Component {
    constructor(props) {
        // props.video and props.expanded available here
        super(props);
        this.state = {
            count: 0,
            updating: 0
        };
        this._isMounted = false;
    }

    componentDidUpdate(prevProps, prevState) {
        console.log("componentDidUpdate " + prevProps.expanded + " new " + this.props.expanded);
        if (this.props.expanded !== prevProps.expanded) {
            this.changeCount(this.props.expanded);
        }
    }

    async changeCount(isIncrement) {
        const name = this.props.video.get("title");
        const WatchersCount = Parse.Object.extend("LiveVideoWatchers");
        let q = new Parse.Query(WatchersCount);
        q.equalTo("name", name);
        console.log("Changing count for " + name);
        const record = await q.first();
        if (record) {
            console.log("Changing watchers count for " + name + " " + isIncrement + " " + JSON.stringify(record));
            this.setState({updating: (isIncrement ? -1 : 1)}); // Remember that we are the ones doing the update
            if (isIncrement)
                record.increment("count");
            else
                record.decrement("count");
            record.save();
        } else {
            console.log("LiveVideoWatcher not found for " + name);
        }
    }

    componentDidMount() {
        this._isMounted = true;
        let q = new Parse.Query("LiveVideoWatchers");
        const name = this.props.video.get("title");
        q.equalTo("name", name);
        this.sub = this.props.parseLive.subscribe(q);

        this.sub.on('update', watchRecord => {
            console.log("Update received: watchers count for " + watchRecord.get("name") + " is now " + watchRecord.get("count") + ". Local count=" + this.state.count);
            const adjustedCount = watchRecord.get("count") + this.state.updating; // adjust when it's our update
            if (this._isMounted) 
                this.setState({ count: adjustedCount, updating: false});
        });
    }

    componentWillUnmount() {
        if (this.sub)
            this.sub.unsubscribe();
        this._isMounted = false;
    }

    render() {
        return (
            <div>{"Watching now: " + this.state.count}
            </div>
        )
    }
}

const LiveVideoWatchers = (props) => (
    <ParseLiveContext.Consumer>
        {value => (
            <VideoWatchers {...props} parseLive={value}/>
        )}
    </ParseLiveContext.Consumer>
);

export default LiveVideoWatchers;