import { logger } from "@vendetta";
import { applyPatches } from "./patches";
import Settings from "./settings";
import { startFluxInterceptor } from "./flux";
import "./storage";

let patchUnloads: Array<() => void> = [];
let stopFluxInterceptor: (() => void) | undefined;

export default {
    onLoad() {
        stopFluxInterceptor?.();
        patchUnloads.forEach((unpatch) => unpatch());

        patchUnloads = applyPatches();
        stopFluxInterceptor = startFluxInterceptor();

        logger.log("OmniArchive loaded.");
    },
    onUnload() {
        stopFluxInterceptor?.();
        stopFluxInterceptor = undefined;

        patchUnloads.splice(0).reverse().forEach((unpatch) => unpatch());

        logger.log("OmniArchive unloaded.");
    },
    settings: Settings,
};
