import { findByDisplayName, findByName, findByProps, findByTypeName } from "@vendetta/metro";
import { ReactNative as RN } from "@vendetta/metro/common";
import { after, instead } from "@vendetta/patcher";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { findInReactTree } from "@vendetta/utils";
import omniArchiveStorage, { setGuildTargeted } from "./storage";

const { FormRow, FormIcon } = Forms;
const ChannelStore = findByProps("getChannel", "getDMFromUserId");
const actionSheetManager = findByProps("openLazy", "hideActionSheet");

const styles = RN.StyleSheet.create({
    archivedInputBanner: {
        marginHorizontal: 12,
        marginVertical: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#7f1d1d",
        borderWidth: 1,
        borderColor: "#ef4444",
    },
    archivedInputTitle: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 4,
    },
    archivedInputBody: {
        color: "rgba(255, 255, 255, 0.92)",
        fontSize: 13,
        lineHeight: 18,
    },
});

function resolveExportByName(candidates: string[]) {
    for (const candidate of candidates) {
        const resolved =
            findByName(candidate, false) ??
            findByDisplayName(candidate, false) ??
            findByTypeName(candidate, false);

        if (resolved) return resolved;
    }
}

function resolveGuildId(input: any): string | undefined {
    const directGuildId =
        input?.guildId ??
        input?.guild?.id ??
        input?.channel?.guild_id ??
        input?.channel?.guildId ??
        input?.channelRecord?.guild_id ??
        input?.channelRecord?.guildId;

    if (directGuildId) return String(directGuildId);

    const channelId = input?.channelId ?? input?.channel?.id ?? input?.channelRecord?.id;
    const channel = channelId ? ChannelStore?.getChannel?.(channelId) : undefined;
    const guildId = channel?.guild_id ?? channel?.guildId;

    return guildId ? String(guildId) : undefined;
}

function createDeletedGuildBanner(guildId: string) {
    const archivedGuild = omniArchiveStorage.archivedGuilds[guildId];
    const guildName = archivedGuild?.name ?? "This server";

    return (
        <RN.View style={styles.archivedInputBanner}>
            <RN.Text style={styles.archivedInputTitle}>{guildName} is archived locally</RN.Text>
            <RN.Text style={styles.archivedInputBody}>
                Sending is disabled because this server was marked as deleted. OmniArchive left this chat read-only so you do not type into a dead archive.
            </RN.Text>
        </RN.View>
    );
}

function patchGuildContextMenu() {
    const GuildContextMenu = resolveExportByName([
        "GuildContextMenu",
        "GuildLongPressActionSheet",
    ]);

    if (!GuildContextMenu) return;

    return after("default", GuildContextMenu, ([props], res) => {
        const guildId = resolveGuildId(props);

        if (!guildId) return;

        const sections = findInReactTree(res, (node) => Array.isArray(node) && node[0]?.key);

        if (!Array.isArray(sections) || !sections[0]?.type) return;

        const targeted = !!omniArchiveStorage.targetedGuilds[guildId];
        const globallyEnabled = omniArchiveStorage.archiveAll;
        const SectionComponent = sections[0].type;

        sections.unshift(
            <SectionComponent key="omniarchive-toggle">
                <FormRow
                    leading={
                        <FormIcon
                            style={{ opacity: 1 }}
                            source={getAssetIDByName(targeted ? "ic_message_delete" : "ic_download_24px")}
                        />
                    }
                    label={targeted ? "Stop archiving this server" : "Archive this server locally"}
                    subLabel={
                        globallyEnabled
                            ? "Global archiving is already enabled. Per-server toggles only matter after you turn that off."
                            : targeted
                                ? "New messages from this server will stop being saved."
                                : "Opt-in only. Message history and attachments can grow quickly."
                    }
                    onPress={() => {
                        if (globallyEnabled) {
                            showToast("Archive-all is enabled globally. Use settings to change that first.", getAssetIDByName("Small"));
                            actionSheetManager?.hideActionSheet?.();
                            return;
                        }

                        if (targeted) {
                            setGuildTargeted(guildId, false);
                            showToast("Stopped archiving this server.", getAssetIDByName("Small"));
                            actionSheetManager?.hideActionSheet?.();
                            return;
                        }

                        showConfirmationAlert({
                            title: "OmniArchive",
                            content: "Archiving this server can use a lot of local storage. Enable local archiving for this server?",
                            confirmText: "Archive",
                            confirmColor: "red" as any,
                            cancelText: "Cancel",
                            onConfirm: () => {
                                setGuildTargeted(guildId, true);
                                showToast("This server will now be archived locally.", getAssetIDByName("Check"));
                                actionSheetManager?.hideActionSheet?.();
                            },
                        });
                    }}
                />
            </SectionComponent>,
        );
    });
}

function patchChatInput() {
    const ChatInput = resolveExportByName([
        "ChatInput",
        "ChannelTextAreaContainer",
        "ChannelTextArea",
    ]);

    if (!ChatInput) return;

    return instead("default", ChatInput, function (this: any, args, original) {
        const props = args[0];
        const guildId = resolveGuildId(props);

        if (!guildId || !omniArchiveStorage.archivedGuilds[guildId]) {
            return original.apply(this, args);
        }

        return createDeletedGuildBanner(guildId);
    });
}

export function applyPatches() {
    return [patchGuildContextMenu(), patchChatInput()].filter(Boolean) as Array<() => void>;
}
