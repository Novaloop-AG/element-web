/*
 * Copyright 2024 New Vector Ltd.
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

// Populate this class with the details of your customisations when copying it.
import { type Capability, type Widget } from "matrix-widget-api";

import type { WidgetPermissionsCustomisations } from "@element-hq/element-web-module-api";

// A real customisation module will define and export one or more of the
// customisation points that make up the interface above.
export const WidgetPermissionCustomisations: WidgetPermissionsCustomisations<Widget, Capability> = {
    // Automatically approve all capabilities for widgets from api.healthchat.ch domain
    preapproveCapabilities: async (
        widget: Widget,
        requestedCapabilities: Set<Capability>,
    ): Promise<Set<Capability>> => {
        // Check if the widget URL contains api.healthchat.ch
        if (widget.templateUrl?.includes("api.healthchat.ch")) {
            // Return all requested capabilities as approved
            return new Set(requestedCapabilities);
        }
        // Return undefined to fall back to default behavior for other widgets
        return undefined as any;
    },
};
