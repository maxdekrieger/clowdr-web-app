// BCP: (the basic structure is there, but there are a lot more details to be filled in...)
import * as Parse from 'parse';

import ProgramCache from "./components/Session/ProgramCache";
import ChatClient from "./classes/ChatClient";
import Conversation from "./classes/Conversation";
import { Channel } from "twilio-chat/lib/channel";
// Is this one needed?
// import ProgramItem from "./classes/ProgramItem";

type UserProfile = any
type ClowdrInstance = any
type SocialSpace = any
type Role = any

export type UserSessionToken = string

export type MaybeParseUser = Parse.User | null;
export type MaybeUserProfile = UserProfile | null;
export type MaybeClowdrInstance = ClowdrInstance | null;

export interface ClowdrState {
    spaces: Map<string, SocialSpace>;   // TS: Or maybe better a Record??
    user: MaybeParseUser;
    userProfile: MaybeUserProfile;
    isAdmin: boolean;
    isClowdrAdmin: boolean;
    permissions: Array<string>;
    validConferences: Array<ClowdrInstance>;
    currentConference: MaybeClowdrInstance;
    loading: boolean;
    roles: Array<Role>;
    programCache: ProgramCache;
    helpers: any;
    getChatClient: any;  // should be a function (higher-order?)
    getLiveChannel: any;
    chatClient: ChatClient;
    activeSpace: SocialSpace;
    getUserProfile(authorID: string, arg1: (u: any) => void): any;   // ???
    refreshUser(instance?: MaybeClowdrInstance, forceRefresh?: boolean): Promise<MaybeParseUser>;
    isModerator: boolean;
    isManager: boolean;
    isAdmininstrator: boolean;
}

export interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
    editing: boolean;
    dataIndex: string;
    title: string;  // could be 'any' based on Antd website
    inputType: 'number' | 'text';   // based on Antd website
    record: Parse.Object;
    index: number;
    children: React.ReactNode;
}

export interface JoinedChatChannel {
    attributes: any; //json object we store in twilio
    conversation?: Conversation;
    members: string[]; //list of userProfileIDs
    channel: Channel;
}
export interface ChatChannelConsumer {
    setJoinedChannels(channels: string[]): void;
    setAllChannels(channels: Channel[]): void;
}
export interface MultiChatApp {
    registerChannelConsumer(consumer: ChatChannelConsumer): void;
    openChat(sid: string, dontBringIntoFocus: boolean): void;
    registerUnreadConsumer(sid: string, category: string, consumer: any): void;
    cancelUnreadConsumer(sid: string, consumer: any): void;

}
