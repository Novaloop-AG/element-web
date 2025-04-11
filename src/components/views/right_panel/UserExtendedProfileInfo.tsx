/*
Copyright 2025 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { useEffect, useState } from "react";
import { Text } from "@vector-im/compound-web";

import { SdkContextClass } from "../../../contexts/SDKContext";
import Spinner from "../elements/Spinner";
import { _t } from "../../../languageHandler";
// Extended profile property keys
import {
    EXT_PROFILE_KEY_TITLE,
    EXT_PROFILE_KEY_SPECIALIZATION,
    EXT_PROFILE_KEY_PRACTICE_NAME,
    EXT_PROFILE_KEY_BUSINESS_STREET,
    EXT_PROFILE_KEY_BUSINESS_STREET_NR,
    EXT_PROFILE_KEY_BUSINESS_CITY,
    EXT_PROFILE_KEY_BUSINESS_PLZ,
    EXT_PROFILE_KEY_BUSINESS_EMAIL,
    EXT_PROFILE_KEY_BUSINESS_TEL,
    EXT_PROFILE_KEY_WEBSITE,
    EXT_PROFILE_KEY_FURTHER_INFO,
} from "../settings/ExtendedProfileSettings";

// Helper function to preserve line breaks
const renderMultilineText = (text: string): React.ReactNode[] => {
    const lines = text.split("\n");
    return lines.map((line, i) => (
        <React.Fragment key={i}>
            {line}
            {i < lines.length - 1 && <br />}
        </React.Fragment>
    ));
};

interface UserExtendedProfileInfoProps {
    userId: string;
}

const UserExtendedProfileInfo: React.FC<UserExtendedProfileInfoProps> = ({ userId }) => {
    //const client = useMatrixClientContext();
    const userProfilesStore = SdkContextClass.instance.userProfilesStore;

    const [title, setTitle] = useState<string>("");
    const [specialization, setSpecialization] = useState<string>("");
    const [practiceName, setPracticeName] = useState<string>("");
    const [businessStreet, setBusinessStreet] = useState<string>("");
    const [businessStreetNr, setBusinessStreetNr] = useState<string>("");
    const [businessCity, setBusinessCity] = useState<string>("");
    const [businessPlz, setBusinessPlz] = useState<string>("");
    const [businessEmail, setBusinessEmail] = useState<string>("");
    const [businessTel, setBusinessTel] = useState<string>("");
    const [website, setWebsite] = useState<string>("");
    const [furtherInfo, setFurtherInfo] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setError(false);
                setLoading(true);

                const titleValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_TITLE);
                const specializationValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_SPECIALIZATION);
                const practiceNameValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_PRACTICE_NAME);
                const businessStreetValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_STREET);
                const businessStreetNrValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_STREET_NR);
                const businessCityValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_CITY);
                const businessPlzValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_PLZ);
                const businessEmailValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_EMAIL);
                const businessTelValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_TEL);
                const websiteValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_WEBSITE);
                const furtherInfoValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_FURTHER_INFO);

                setTitle(titleValue as string || "");
                setSpecialization(specializationValue as string || "");
                setPracticeName(practiceNameValue as string || "");
                setBusinessStreet(businessStreetValue as string || "");
                setBusinessStreetNr(businessStreetNrValue as string || "");
                setBusinessCity(businessCityValue as string || "");
                setBusinessPlz(businessPlzValue as string || "");
                setBusinessEmail(businessEmailValue as string || "");
                setBusinessTel(businessTelValue as string || "");
                setWebsite(websiteValue as string || "");
                setFurtherInfo(furtherInfoValue as string || "");
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [userId, userProfilesStore]);

    if (loading) {
        return <Spinner />;
    }

    if (error) {
        return <div className="mx_UserExtendedProfileInfo_error">{_t("user_info|extended_profile|error_loading_profile")}</div>;
    }

    // Don't render anything if there's no data
    if (!title && !specialization && !practiceName && !businessStreet && !businessStreetNr && !businessCity && !businessPlz && !businessEmail && !businessTel && !website && !furtherInfo) {
        return null;
    }

    return (
        <div className="mx_UserInfo_container mx_UserInfo_profileInfo">
            {title && (
                <div className="mx_UserInfo_profileField">
                    <div className="mx_UserInfo_fieldLabel">
                        <Text size="sm" weight="semibold">
                            {_t("user_info|extended_profile|title")}
                        </Text>
                    </div>
                    <div className="mx_UserInfo_fieldValue">
                        <Text size="sm">{title}</Text>
                    </div>
                </div>
            )}
            {specialization && (
                <div className="mx_UserInfo_profileField">
                    <div className="mx_UserInfo_fieldLabel">
                        <Text size="sm" weight="semibold">
                            {_t("user_info|extended_profile|specialization")}
                        </Text>
                    </div>
                    <div className="mx_UserInfo_fieldValue">
                        <Text size="sm">{specialization}</Text>
                    </div>
                </div>
            )}
            {practiceName && (
                <div className="mx_UserInfo_profileField">
                    <div className="mx_UserInfo_fieldLabel">
                        <Text size="sm" weight="semibold">
                            {_t("user_info|extended_profile|practice_name")}
                        </Text>
                    </div>
                    <div className="mx_UserInfo_fieldValue">
                        <Text size="sm">{practiceName}</Text>
                    </div>
                </div>
            )}
            {businessStreet && businessCity && (
                <div className="mx_UserInfo_profileField">
                    <div className="mx_UserInfo_fieldLabel">
                        <Text size="sm" weight="semibold">
                            {_t("user_info|extended_profile|address")}
                        </Text>
                    </div>
                    <div className="mx_UserInfo_fieldValue">
                        <Text size="sm">
                            {[businessStreet, businessStreetNr].filter(Boolean).join(" ")}
                            {(businessStreet || businessStreetNr) && (businessPlz || businessCity) && ", "}
                            {[businessPlz, businessCity].filter(Boolean).join(" ")}
                        </Text>
                    </div>
                </div>
            )}
            {businessEmail && (
                <div className="mx_UserInfo_profileField">
                    <div className="mx_UserInfo_fieldLabel">
                        <Text size="sm" weight="semibold">
                            {_t("user_info|extended_profile|business_email")}
                        </Text>
                    </div>
                    <div className="mx_UserInfo_fieldValue">
                        <Text size="sm">
                            <a href={`mailto:${businessEmail}`}>{businessEmail}</a>
                        </Text>
                    </div>
                </div>
            )}
            {businessTel && (
                <div className="mx_UserInfo_profileField">
                    <div className="mx_UserInfo_fieldLabel">
                        <Text size="sm" weight="semibold">
                            {_t("user_info|extended_profile|business_tel")}
                        </Text>
                    </div>
                    <div className="mx_UserInfo_fieldValue">
                        <Text size="sm">
                            <a href={`tel:${businessTel}`}>{businessTel}</a>
                        </Text>
                    </div>
                </div>
            )}
            {website && (
                <div className="mx_UserInfo_profileField">
                    <div className="mx_UserInfo_fieldLabel">
                        <Text size="sm" weight="semibold">
                            {_t("user_info|extended_profile|website")}
                        </Text>
                    </div>
                    <div className="mx_UserInfo_fieldValue">
                        <Text size="sm">
                            <a href={website.startsWith('http') ? website : `https://${website}`}
                               target="_blank"
                               rel="noreferrer noopener">
                                {website}
                            </a>
                        </Text>
                    </div>
                </div>
            )}
            {furtherInfo && (
                <div className="mx_UserInfo_profileField">
                    <div className="mx_UserInfo_fieldLabel">
                        <Text size="sm" weight="semibold">
                            {_t("user_info|extended_profile|further_info")}
                        </Text>
                    </div>
                    <div className="mx_UserInfo_fieldValue mx_UserInfo_fieldValue_multiline">
                        <Text size="sm">{renderMultilineText(furtherInfo)}</Text>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserExtendedProfileInfo;
