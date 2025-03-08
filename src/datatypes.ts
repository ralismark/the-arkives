export type Path = string & { readonly __tag: unique symbol }
export type GuildId = string & { readonly __tag: unique symbol }
export type ChannelId = string & { readonly __tag: unique symbol }
export type CategoryId = string & { readonly __tag: unique symbol }
export type MessageId = string & { readonly __tag: unique symbol }
export type UserId = string & { readonly __tag: unique symbol }
export type AttachmentId = string & { readonly __tag: unique symbol }
export type EmojiId = string & { readonly __tag: unique symbol }
export type RoleId = string & { readonly __tag: unique symbol }
export type Timestamp = string & { readonly __tag: unique symbol }

export type Export = {
	guild: GuildMeta,
	channel: ChannelMeta,
	messages: Message[],
}

export type GuildMeta = {
	id: GuildId,
	name: string,
	iconUrl: Path,
}

export const NullGuildMeta: GuildMeta = {
	id: "000000000000000000" as GuildId,
	name: "",
	iconUrl: "invalid" as Path,
}

export type ChannelType = "GuildPublicThread" | "GuildTextChat" | "GuildVoiceChat"

export type ChannelMeta = {
	id: ChannelId,
	type: ChannelType, // there may be more
	categoryId: CategoryId,
	category: string,
	name: string,
	topic: string | null,
	guildId?: GuildId, // TODO this is a lie
}

export const NullChannelMeta: ChannelMeta = {
	id: "0000000000000000000" as ChannelId,
	type: "GuildTextChat",
	categoryId: "0000000000000000000" as CategoryId,
	category: "",
	name: "",
	topic: null,
}

export type Message = {
	id: MessageId,
	type: string, // TODO convert to enum
	timestamp: Timestamp,
	timestampEdited: Timestamp,
	callEndedTimestamp: Timestamp,
	isPinned: boolean,
	content: string,
	author: User,
	attachments: Attachment[],
	embeds: Embed[],
	stickers: Sticker[],
	reactions: Reaction[],
	mentions: User[],
	reference?: {
		messageId: MessageId,
		channelId: ChannelId,
		guildId: GuildId,
	}
	inlineEmojis: Emoji[],
}

export type Attachment = {
	id: AttachmentId,
	url: Path,
	fileName: string,
	fileSizeBytes: number,
}

export type Embed = {
	title: string,
	url: string | null,
	timestamp: Timestamp | null,
	description: string,
	thumbnail: {
		url: Path,
		width: number,
		height: number,
	},
	video: {
		url: Path,
		width: number,
		height: number,
	},
	images: any[], // TODO
	fields: any[], // TODO
	inlineEmojis: Emoji[],
}

export type Sticker = any // TODO

export type Reaction = {
	emoji: Emoji,
	count: number,
	users: ReactionUser,
}

export type ReactionUser = Omit<User, "roles">

export type Emoji = {
	id: EmojiId,
	name: string,
	code: string,
	isAnimated: boolean,
	imageUrl: Path,
}

export type User = {
	id: UserId,
	name: string,
	discriminator: string,
	nickname: string,
	color: string,
	isBot: boolean,
	roles: Role[],
	avatarUrl: Path,
}

export type Role = {
	id: RoleId,
	name: string,
	color: string | null,
	position: number,
}

// ----------------------------------------------------------------------------

export type Index = {
	[path: Path]: {
		guild: GuildMeta,
		channel: ChannelMeta,
		first_message_id: MessageId,
		last_message_id: MessageId,
	}
}

