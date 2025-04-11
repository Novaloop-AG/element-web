/*
Copyright 2025 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { useCallback, useEffect, useState } from "react";
import { logger } from "matrix-js-sdk/src/logger";
import { Alert } from "@vector-im/compound-web";
import GlobeIcon from "@vector-im/compound-design-tokens/assets/web/icons/globe";
import LocationIcon from "@vector-im/compound-design-tokens/assets/web/icons/location";
import BadgeIcon from "@vector-im/compound-design-tokens/assets/web/icons/badge";
import StarIcon from "@vector-im/compound-design-tokens/assets/web/icons/star";

import { _t } from "../../../languageHandler";
import { SdkContextClass } from "../../../contexts/SDKContext";
import { Container } from "../right_panel/UserInfo";
import InlineSpinner from "../elements/InlineSpinner";
import {
    EXT_PROFILE_KEY_FURTHER_INFO,
    EXT_PROFILE_KEY_SPECIALIZATION,
    EXT_PROFILE_KEY_TITLE,
    EXT_PROFILE_KEY_WEBSITE,
} from "../settings/ExtendedProfileSettings";
import { Flex } from "../../utils/Flex";

interface ExtendedProfileViewProps {
    userId: string;
}

type ExtendedProfileData = {
    title: string | null;
    specialization: string | null;
    address: string | null;
    website: string | null;
    furtherInfo: string | null;
};

/**
 * Komponente zur Anzeige erweiterter Profilfelder eines anderen Benutzers
 */
const ExtendedProfileView: React.FC<ExtendedProfileViewProps> = ({ userId }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [profileData, setProfileData] = useState<ExtendedProfileData | null>(null);
    const [hasData, setHasData] = useState<boolean>(false);

    //const client = useMatrixClientContext();
    const userProfilesStore = SdkContextClass.instance.userProfilesStore;

    // Laden der erweiterten Profilfelder für den angegebenen Benutzer
    const fetchExtendedProfileData = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(false);

        try {
            const [
                titleValue,
                specializationValue,
                websiteValue,
                furtherInfoValue,
            ] = await Promise.all([
                userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_TITLE),
                userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_SPECIALIZATION),
                userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_WEBSITE),
                userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_FURTHER_INFO),
            ]);

            const data = {
                title: titleValue as string | null,
                specialization: specializationValue as string | null,
                website: websiteValue as string | null,
                furtherInfo: furtherInfoValue as string | null,
            };

            setProfileData(data);

            // Prüfen, ob mindestens ein Feld ausgefüllt ist
            const hasAnyData = Object.values(data).some((value) => value !== null && value !== "");
            setHasData(hasAnyData);
        } catch (e) {
            logger.error("Fehler beim Laden der erweiterten Profildaten", e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [userId, userProfilesStore]);

    useEffect(() => {
        fetchExtendedProfileData();
    }, [fetchExtendedProfileData]);

    // Wenn keine Daten vorhanden sind, zeigen wir nichts an
    if (!loading && !hasData && !error) {
        return null;
    }

    return (
        <Container className="mx_ExtendedProfileView">
            {loading ? (
                <Flex justify="center" align="center" className="mx_ExtendedProfileView_loading">
                    <InlineSpinner />
                </Flex>
            ) : error ? (
                <Alert
                    type="critical"
                    title={_t("common|error")}
                    className="mx_ExtendedProfileView_error"
                >
                    {_t("Fehler beim Laden der Profilinformationen")}
                </Alert>
            ) : hasData ? (
                <div className="mx_ExtendedProfileView_content">
                    {(profileData?.title || profileData?.specialization) && (
                        <div className="mx_ExtendedProfileView_section mx_ExtendedProfileView_professional">
                            {profileData.title && (
                                <div className="mx_ExtendedProfileView_field">
                                    <Flex align="center" gap="var(--cpd-space-2x)">
                                        <BadgeIcon className="mx_ExtendedProfileView_icon" />
                                        <div>
                                            <div className="mx_ExtendedProfileView_label">{_t("settings|extended_profile_settings|professional_title")}</div>
                                            <div className="mx_ExtendedProfileView_value">{profileData.title}</div>
                                        </div>
                                    </Flex>
                                </div>
                            )}

                            {profileData.specialization && (
                                <div className="mx_ExtendedProfileView_field">
                                    <Flex align="center" gap="var(--cpd-space-2x)">
                                        <StarIcon className="mx_ExtendedProfileView_icon" />
                                        <div>
                                            <div className="mx_ExtendedProfileView_label">{_t("settings|extended_profile_settings|specialization")}</div>
                                            <div className="mx_ExtendedProfileView_value">{profileData.specialization}</div>
                                        </div>
                                    </Flex>
                                </div>
                            )}
                        </div>
                    )}

                    {profileData?.address && (
                        <div className="mx_ExtendedProfileView_field">
                            <Flex align="center" gap="var(--cpd-space-2x)">
                                <LocationIcon className="mx_ExtendedProfileView_icon" />
                                <div>
                                    <div className="mx_ExtendedProfileView_label">{_t("settings|extended_profile_settings|address")}</div>
                                    <div className="mx_ExtendedProfileView_value">{profileData.address}</div>
                                </div>
                            </Flex>
                        </div>
                    )}

                    {profileData?.website && (
                        <div className="mx_ExtendedProfileView_field">
                            <Flex align="center" gap="var(--cpd-space-2x)">
                                <GlobeIcon className="mx_ExtendedProfileView_icon" />
                                <div>
                                    <div className="mx_ExtendedProfileView_label">{_t("settings|extended_profile_settings|website")}</div>
                                    <div className="mx_ExtendedProfileView_value">
                                        <a
                                            href={profileData.website.startsWith("http") ? profileData.website : `https://${profileData.website}`}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="mx_ExtendedProfileView_link"
                                        >
                                            {profileData.website}
                                        </a>
                                    </div>
                                </div>
                            </Flex>
                        </div>
                    )}

                    {profileData?.furtherInfo && (
                        <div className="mx_ExtendedProfileView_field">
                            <div className="mx_ExtendedProfileView_further_info">
                                <div className="mx_ExtendedProfileView_label">{_t("settings|extended_profile_settings|further_information")}</div>
                                <div className="mx_ExtendedProfileView_value mx_ExtendedProfileView_multiline">{profileData.furtherInfo}</div>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </Container>
    );
};

export default ExtendedProfileView;
