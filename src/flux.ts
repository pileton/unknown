import { findByProps } from "@vendetta/metro";
import { FluxDispatcher } from "@vendetta/metro/common";
import omniArchiveStorage, {
    archiveMessage,
    getArchivedMessageCount,
    rememberDeletedGuild,
} from "./storage";

const GuildStore = findByProps("getGuild", "getGuildCount");

function serializeAttachments(attachments: any[] = []) {
    return attachments.map((attachment) => ({
        id: attachment?.id,
        url: attachment?.url,
        proxyUrl: attachment?.proxy_url ?? attachment?.proxyUrl,
        filename: attachment?.filename,
        size: attachment?.size,
        width: attachment?.width,
        height: attachment?.height,
        contentType: attachment?.content_type ?? attachment?.contentType ?? null,
    }));
}

const onMessageCreate = (payload: any) => {
    if (!omniArchiveStorage.archiveAll && !omniArchiveStorage.targetedGuilds[payload?.guildId ?? payload?.guild_id ?? payload?.message?.guild_id ?? payload?.message?.guildId ?? ""]) return;

    const message = payload?.message ?? payload;
    const guildId = String(message?.guild_id ?? message?.guildId ?? payload?.guildId ?? payload?.guild_id ?? "");

    if (!guildId || !message?.id) return;

    archiveMessage({
        id: String(message.id),
        guildId,
        channelId: String(message.channel_id ?? message.channelId ?? ""),
        content: message.content ?? "",
        timestamp: message.timestamp ?? new Date().toISOString(),
        editedTimestamp: message.edited_timestamp ?? message.editedTimestamp ?? null,
        author: {
            id: message.author?.id,
            username: message.author?.username,
            globalName: message.author?.global_name ?? message.author?.globalName ?? null,
            discriminator: message.author?.discriminator,
            avatar: message.author?.avatar ?? null,
        },
        attachments: serializeAttachments(message.attachments),
    });
};

const onGuildDelete = (payload: any) => {
    if (!omniArchiveStorage.archiveAll && !omniArchiveStorage.targetedGuilds[payload?.guild?.id ?? payload?.guildId ?? payload?.guild_id ?? payload?.id ?? ""]) return;

    const guildId = String(payload?.guild?.id ?? payload?.guildId ?? payload?.guild_id ?? payload?.id ?? "");

    if (!guildId) return;

    const guild = payload?.guild ?? GuildStore?.getGuild?.(guildId);

    rememberDeletedGuild({
        id: guildId,
        name: guild?.name ?? `Deleted Server ${guildId}`,
        icon: guild?.icon ?? null,
        ownerId: guild?.ownerId ?? guild?.owner_id ?? null,
        deletedAt: new Date().toISOString(),
        messageCount: getArchivedMessageCount(guildId),
    });
};

export function startFluxInterceptor() {
    FluxDispatcher.subscribe("MESSAGE_CREATE", onMessageCreate);
    FluxDispatcher.subscribe("GUILD_DELETE", onGuildDelete);

    return () => {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessageCreate);
        FluxDispatcher.unsubscribe("GUILD_DELETE", onGuildDelete);
    };
}
