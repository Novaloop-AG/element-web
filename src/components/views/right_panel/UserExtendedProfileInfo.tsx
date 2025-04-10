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
    EXT_PROFILE_KEY_ADDRESS,
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
    const [address, setAddress] = useState<string>("");
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
                const addressValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_ADDRESS);
                const websiteValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_WEBSITE);
                const furtherInfoValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_FURTHER_INFO);

                setTitle(titleValue as string || "");
                setSpecialization(specializationValue as string || "");
                setAddress(addressValue as string || "");
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
    if (!title && !specialization && !address && !website && !furtherInfo) {
        return null;
    }

    return (
        <div className="mx_UserInfo_container mx_UserInfo_profileInfo">
{/*             <div className="mx_UserInfo_container_header">
                <Text weight="semibold">{_t("user_info|extended_profile|header")}</Text>
            </div> */}
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
            {address && (
                <div className="mx_UserInfo_profileField">
                    <div className="mx_UserInfo_fieldLabel">
                        <Text size="sm" weight="semibold">
                            {_t("user_info|extended_profile|address")}
                        </Text>
                    </div>
                    <div className="mx_UserInfo_fieldValue">
                        <Text size="sm">{renderMultilineText(address)}</Text>
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
