import { InspectorMessage } from "../utils";

const PROCESSING_MODULE_CONFIG = ["ophys", "ecephys", "icephys", "behavior", "misc", "ogen", "retinotopy"]

export function checkProcessingModuleName(processing_module: any) {
    if (!PROCESSING_MODULE_CONFIG.includes(processing_module.name)) {
        return new InspectorMessage({
            message: `Processing module is named ${processing_module.name}. It is recommended to use the schema module names: ${PROCESSING_MODULE_CONFIG.join(', ')}`
        })
    }
}

