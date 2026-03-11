/* eslint-disable no-unused-vars */
export interface UserType {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  gender: "male" | "female";
  email: string;
  password: string;
  dob: Date;
  age: number;
  roles: "admin" | "user";
  isSpammer: boolean;
  race: string | null | undefined;
  starSign: string | null | undefined;
  zodiac: string | null | undefined;
  planet: string | null | undefined;
  recovery: string | null | undefined;
  profilePic: string | null | undefined;
  phone: string | null | undefined;
  countryCode: string | null | undefined;
  ip: string | null | undefined;
  socketID: string;
}

export interface Musics {
  name: string;
  url: string;
  setAsBackground: boolean;
  user: string | null | undefined;
  _id: string;
}

export interface Video {
  name: string;
  url: string;
  setAsBackground: boolean;
  user: string | null | undefined;
  _id: string;
}

export interface Picture {
  name: string;
  url: string;
  setAsBackground: boolean;
  user: string | null | undefined;
  _id: string;
}

export interface GIF {
  name: string;
  url: string;
  setAsBackground: boolean;
  user: string | null | undefined;
  _id: string;
}

export interface Message {
  createdAt: string;
  updatedAt: string;
  user: UserType | null;
  sentBy: UserType | null;
  sentTo: UserType | null;
  message: string;
  _id: string;
}

export interface DisableButton {
  _id: string;
  name: string;
  disable: boolean;
}

export interface UserWithSocketID extends UserType {
  socketID: string;
}

export enum BACKGROUN_STYLE {
  default = "bg-primary",
  image = "image",
  video = "video",
  imageFullScreen = "imageFullScreen",
  videoFullScreen = "videoFullScreen",
  imageRepeat = "imageRepeat",
  gif = "gif",
  gifFullScreen = "gifFullScreen",
  gifRepeat = "gifRepeat",
}

export interface BackgroundType {
  type: "gif" | "image" | "video";
  url: string;
  style: BACKGROUN_STYLE;
}
