import { useProxy } from "@vendetta/storage";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { Forms } from "@vendetta/ui/components";
import omniArchiveStorage, { getTotalArchivedMessageCount } from "./storage";

const { FormSection, FormSwitchRow, FormText } = Forms;

export default function OmniArchiveSettings() {
    useProxy(omniArchiveStorage);

    const targetedGuildCount = Object.keys(omniArchiveStorage.targetedGuilds).length;
    const deletedGuildCount = Object.keys(omniArchiveStorage.archivedGuilds).length;
    const archivedMessageCount = getTotalArchivedMessageCount();

    return (
        <FormSection title="OmniArchive">
            <FormSwitchRow
                label="Archive every server"
                subLabel="Opt-in only. This can consume a huge amount of local storage and may slow or destabilize older phones."
                value={omniArchiveStorage.archiveAll}
                onValueChange={(enabled: boolean) => {
                    if (!enabled) {
                        omniArchiveStorage.archiveAll = false;
                        return;
                    }

                    showConfirmationAlert({
                        title: "OmniArchive",
                        content: "Are you REALLY sure you wanna turn this on?",
                        confirmText: "Yes",
                        cancelText: "No",
                        onConfirm: () => showConfirmationAlert({
                            title: "FINAL WARNING",
                            content: "FINAL WARNING: This could fry your phone storage due to high load. Proceed?",
                            confirmText: "Proceed",
                            confirmColor: "red" as any,
                            cancelText: "Cancel",
                            onConfirm: () => {
                                omniArchiveStorage.archiveAll = true;
                            },
                        }),
                    });
                }}
            />
            <FormText>Targeted servers: {targetedGuildCount}</FormText>
            <FormText>Deleted server archives: {deletedGuildCount}</FormText>
            <FormText>Saved messages: {archivedMessageCount}</FormText>
        </FormSection>
    );
}
