import React from "react";
import { Badge, Button, Popconfirm, Popover, Skeleton, Space } from "antd";
import { AuthUserContext } from "../Session";
import { withRouter } from "react-router-dom";
import Parse from "parse";

class CollapsedChatDisplay extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            sid: this.props.sid,
            unread: this.props.unread
        }
    }

    getChatTitle(chat) {
        if (!chat) {
            console.log("No chat! " + this.state.sid)
            return <Skeleton.Input active style={{ width: '20px', height: '1em' }} />;
        }
        this.titleSet = true;
        if (!chat.attributes) {
            this.setState({ title: chat.channel.sid })
            return;
        }
        if (chat.attributes.mode === "directMessage" && chat.conversation) {
            let p1 = chat.conversation.get("member1");
            let p2 = chat.conversation.get("member2");
            let profileID = p1.id;
            if (profileID === this.props.auth.userProfile.id)
                profileID = p2.id;
            this.setState({ title: "Loading..." });
            this.props.auth.programCache.getUserProfileByProfileID(profileID).then((profile) => {
                this.setState({ title: profile.get("displayName") })
            })
        } else if (chat.attributes.category === "announcements-global") {
            this.setState({ title: "Announcements" });
        }
        else if (chat.attributes.category === "programItem"
            || chat.attributes.category === "breakoutRoom" || chat.attributes.mode === "group"
            || chat.attributes.category === "public-global"
        ) {
            if (this.state.title !== chat.channel.friendlyName)
                this.setState({ title: chat.channel.friendlyName });
        }
        else {
            this.setState({ title: chat.channel.friendlyName ? chat.channel.friendlyName : chat.channel.sid });
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.auth.chatClient.joinedChannels[this.state.sid] && !this.titleSet) {
            this.getChatTitle(this.props.auth.chatClient.joinedChannels[this.state.sid])
            if (!this.listenerActivated) {
                this.listenerActivated = true;
                this.props.auth.chatClient.joinedChannels[this.state.sid].channel.on("updated", this.updateTitle);
            }
        }
    }
    updateTitle(update) {
        if (this.mounted) {
            if (update.channel && update.channel.attributes && update.updateReasons && update.updateReasons.length > 1) {
                this.props.auth.chatClient.joinedChannels[this.state.sid].channel = update.channel;
                this.props.auth.chatClient.joinedChannels[this.state.sid].attributes = update.channel.attributes;
            }
            this.getChatTitle(this.props.auth.chatClient.joinedChannels[this.state.sid]);
        }
    }
    componentWillUnmount() {
        if (this.props.auth.chatClient.joinedChannels[this.state.sid])
            this.props.auth.chatClient.joinedChannels[this.state.sid].channel.off("updated", this.updateTitle.bind(this));
        this.props.auth.chatClient.multiChatWindow.cancelUnreadConsumer(this.props.sid, this);
    }

    async componentDidMount() {
        this.mounted = true;
        if (this.props.channel) {
            this.getChatTitle({
                attributes: this.props.channel.attributes,
                channel: this.props.channel
            });
        } else {
            this.getChatTitle(this.props.auth.chatClient.joinedChannels[this.state.sid])
            if (this.props.auth.chatClient.joinedChannels[this.state.sid]) {
                this.listenerActivated = true;
                this.props.auth.chatClient.joinedChannels[this.state.sid].channel.on("updated", this.updateTitle.bind(this));
            }
        }

        this.props.auth.chatClient.multiChatWindow.registerUnreadConsumer(this.props.sid, this.props.category, this);
        if (!this.mounted)
            return;
    }

    destroyChat() {
        let attr = this.props.auth.chatClient.joinedChannels[this.state.sid].attributes;
        if (attr.category === "announcements-global") {
        }
        else {
            this.setState({ removeInProgress: true });
            this.props.auth.chatClient.joinedChannels[this.state.sid].channel.leave();
        }
    }

    render() {
        if (!this.state.title)
            return <Skeleton.Input active style={{ width: '100px', height: '1em' }} />
        let buttons = [];
        buttons.push(<Button type="primary"
            key="leaveChat"
            className="smallButton"
            loading={this.state.removeInProgress}
            onClick={
                // this.props.toggleOpen
                this.destroyChat.bind(this)
            }
        >Leave Channel</Button>)
        if (this.props.auth.isManager) {
            buttons.push(<Popconfirm
                key="deleteChat"
                onConfirm={async () => {
                    await Parse.Cloud.run("chat-destroy", {
                        conference: this.props.auth.currentConference.id,
                        sid: this.state.sid
                    });
                }}
                title="Are you sure you want to delete this channel and all of its messages? This cannot be undone."
            ><Button type="primary"
                key="deleteChat"
                className="smallButton"
                danger
                loading={this.state.removeInProgress}
            >Delete Channel (use with care!)</Button></Popconfirm>)
        }
        let popoverContent = <Space>{buttons}</Space>;
        // BCP: All the different colors are confusing, IMO
        let color = "#fc858b";
        /*
        let color = "";
        if (this.props.category === "dm")
            color = 'red';
        else if (this.props.category === "subscriptions")
            color = '#CD2EC9';
        else if (this.props.category === "others")
            color = '#151388';
        else if (this.props.category === "papers")
            color = '#087C1D';
        */
        return <Popover key={this.state.sid} mouseEnterDelay={0.5} placement="topRight"
            content={popoverContent}><div
                className="collapsedChatDisplay"
                key={this.state.sid}
            >
                <div
                    className="userTag"
                    onClick={() => { if (!this.props.noLink) this.props.auth.chatClient.openChat(this.state.sid) }}
                ><Badge overflowCount={9} className="chat-unread-count" count={this.state.unread} style={{ backgroundColor: color }} /> {this.state.title}
                </div>
            </div></Popover>

    }
}

const AuthConsumer = (props) => (
    <AuthUserContext.Consumer>
        {value => (
            <CollapsedChatDisplay {...props} auth={value} />
        )}
    </AuthUserContext.Consumer>

);
export default withRouter(AuthConsumer);
