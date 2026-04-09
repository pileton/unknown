import { storage } from "@vendetta/plugin";

export interface ArchivedGuildMetadata {
    id: string;
    name: string;
    icon?: string | null;
    ownerId?: string | null;
    deletedAt: string;
    messageCount: number;
}

export interface ArchivedAttachment {
    id?: string;
    url?: string;
    proxyUrl?: string;
    filename?: string;
    size?: number;
    width?: number | null;
    height?: number | null;
    contentType?: string | null;
}

export interface ArchivedAuthor {
    id?: string;
    username?: string;
    globalName?: string | null;
    discriminator?: string;
    avatar?: string | null;
}

export interface ArchivedMessage {
    id: string;
    guildId: string;
    channelId: string;
    content: string;
    timestamp: string;
    editedTimestamp?: string | null;
    author: ArchivedAuthor;
    attachments: ArchivedAttachment[];
}

export interface OmniArchiveStorage {
    archiveAll: boolean;
    targetedGuilds: Record<string, boolean>;
    archivedGuilds: Record<string, ArchivedGuildMetadata>;
    archivedMessages: Record<string, Record<string, ArchivedMessage>>;
}

const omniArchiveStorage = storage as OmniArchiveStorage;

omniArchiveStorage.archiveAll ??= false;
omniArchiveStorage.targetedGuilds ??= {};
omniArchiveStorage.archivedGuilds ??= {};
omniArchiveStorage.archivedMessages ??= {};

export default omniArchiveStorage;

export const isGuildTracked = (guildId?: string | null) =>
    !!guildId && (omniArchiveStorage.archiveAll || !!omniArchiveStorage.targetedGuilds[String(guildId)]);

export function setGuildTargeted(guildId: string, enabled: boolean) {
    const normalizedGuildId = String(guildId);

    if (enabled) {
        omniArchiveStorage.targetedGuilds[normalizedGuildId] = true;
        return;
    }

    delete omniArchiveStorage.targetedGuilds[normalizedGuildId];
}

export function ensureArchivedGuildBucket(guildId: string) {
    omniArchiveStorage.archivedMessages[guildId] ??= {};
    return omniArchiveStorage.archivedMessages[guildId];
}

export function archiveMessage(message: ArchivedMessage) {
    ensureArchivedGuildBucket(message.guildId)[message.id] = message;
}

export function rememberDeletedGuild(metadata: ArchivedGuildMetadata) {
    omniArchiveStorage.archivedGuilds[metadata.id] = metadata;
}

export function getArchivedMessageCount(guildId: string) {
    return Object.keys(omniArchiveStorage.archivedMessages[guildId] ?? {}).length;
}

export function getTotalArchivedMessageCount() {
    return Object.values(omniArchiveStorage.archivedMessages).reduce(
        (total, guildBucket) => total + Object.keys(guildBucket ?? {}).length,
        0,
    );
}
