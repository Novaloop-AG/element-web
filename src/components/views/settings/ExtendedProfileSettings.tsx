/*
Copyright 2025 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { logger } from "matrix-js-sdk/src/logger";
import { Alert, ErrorMessage } from "@vector-im/compound-web";
import classNames from "classnames";

import { _t } from "../../../languageHandler";
import { useToastContext } from "../../../contexts/ToastContext";
import InlineSpinner from "../elements/InlineSpinner";
import { useMatrixClientContext } from "../../../contexts/MatrixClientContext";
import { SdkContextClass } from "../../../contexts/SDKContext";
import Field from "../elements/Field";
import AccessibleButton from "../elements/AccessibleButton";

const SpinnerToast: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <>
        <InlineSpinner />
        {children}
    </>
);

// Extended profile property keys
export const EXT_PROFILE_KEY_TITLE = "io.element.profile.title";
export const EXT_PROFILE_KEY_SPECIALIZATION = "io.element.profile.specialization";
export const EXT_PROFILE_KEY_ADDRESS = "io.element.profile.address";
export const EXT_PROFILE_KEY_WEBSITE = "io.element.profile.website";
export const EXT_PROFILE_KEY_FURTHER_INFO = "io.element.profile.further_info";

// Unstable feature key for extended profiles
export const UNSTABLE_MSC4133_EXTENDED_PROFILES = "org.matrix.msc4133.extended_profiles";

interface ExtendedProfileSettingsProps {
    className?: string;
}

/**
 * Component for managing extended profile fields for medical professionals.
 * Allows editing title, specialization, address, website, and further information.
 */
const ExtendedProfileSettings: React.FC<ExtendedProfileSettingsProps> = ({ className }) => {
    const [title, setTitle] = useState<string>("");
    const [specialization, setSpecialization] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [website, setWebsite] = useState<string>("");
    const [furtherInfo, setFurtherInfo] = useState<string>("");

    // Store original values for cancel functionality
    const [originalTitle, setOriginalTitle] = useState<string>("");
    const [originalSpecialization, setOriginalSpecialization] = useState<string>("");
    const [originalAddress, setOriginalAddress] = useState<string>("");
    const [originalWebsite, setOriginalWebsite] = useState<string>("");
    const [originalFurtherInfo, setOriginalFurtherInfo] = useState<string>("");

    const [isModified, setIsModified] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<boolean>(false);

    const toastRack = useToastContext();
    const client = useMatrixClientContext();
    const userProfilesStore = SdkContextClass.instance.userProfilesStore;
    const userId = client.getSafeUserId();

    // Load extended profile data without checking server support
    useEffect(() => {
        const loadExtendedProfileData = async () => {
            try {
                setLoadError(false);
                // Try to get existing data
                try {
                    const titleValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_TITLE);
                    const specializationValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_SPECIALIZATION);
                    const addressValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_ADDRESS);
                    const websiteValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_WEBSITE);
                    const furtherInfoValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_FURTHER_INFO);

                    const titleStr = titleValue as string || "";
                    const specializationStr = specializationValue as string || "";
                    const addressStr = addressValue as string || "";
                    const websiteStr = websiteValue as string || "";
                    const furtherInfoStr = furtherInfoValue as string || "";

                    setTitle(titleStr);
                    setSpecialization(specializationStr);
                    setAddress(addressStr);
                    setWebsite(websiteStr);
                    setFurtherInfo(furtherInfoStr);

                    // Store original values for cancel functionality
                    setOriginalTitle(titleStr);
                    setOriginalSpecialization(specializationStr);
                    setOriginalAddress(addressStr);
                    setOriginalWebsite(websiteStr);
                    setOriginalFurtherInfo(furtherInfoStr);
                } catch (e) {
                    // Just log the error but don't set loadError to true
                    // as we want the fields to show up even when empty
                    logger.warn("Failed to fetch extended profile properties", e);
                }
            } catch (e) {
                logger.error("Failed to load extended profile data", e);
                setLoadError(true);
            }
        };

        loadExtendedProfileData();
    }, [userId, userProfilesStore, client]);

    // Check if any field has been modified
    useEffect(() => {
        const hasChanges =
            title !== originalTitle ||
            specialization !== originalSpecialization ||
            address !== originalAddress ||
            website !== originalWebsite ||
            furtherInfo !== originalFurtherInfo;

        setIsModified(hasChanges);
    }, [title, specialization, address, website, furtherInfo,
        originalTitle, originalSpecialization, originalAddress, originalWebsite, originalFurtherInfo]);

    // Field change handlers
    const onTitleChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    }, []);

    const onSpecializationChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSpecialization(e.target.value);
    }, []);

    const onAddressChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setAddress(e.target.value);
    }, []);

    const onWebsiteChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setWebsite(e.target.value);
    }, []);

    const onFurtherInfoChanged = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        setFurtherInfo(e.target.value);
    }, []);

    // Cancel handler - restore all original values
    const onCancel = useCallback(() => {
        setTitle(originalTitle);
        setSpecialization(originalSpecialization);
        setAddress(originalAddress);
        setWebsite(originalWebsite);
        setFurtherInfo(originalFurtherInfo);
    }, [originalTitle, originalSpecialization, originalAddress, originalWebsite, originalFurtherInfo]);

    // Save handler - save all fields at once
    const onSave = useCallback(async (): Promise<void> => {
        if (!isModified) return;

        setIsSaving(true);
        setSaveError(false);
        const removeToast = toastRack.displayToast(
            <SpinnerToast>{_t("settings|extended_profile_settings|saving_profile")}</SpinnerToast>
        );

        try {
            // Save all modified fields
            const savePromises = [];

            if (title !== originalTitle) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_TITLE, title));
            }

            if (specialization !== originalSpecialization) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_SPECIALIZATION, specialization));
            }

            if (address !== originalAddress) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_ADDRESS, address));
            }

            if (website !== originalWebsite) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_WEBSITE, website));
            }

            if (furtherInfo !== originalFurtherInfo) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_FURTHER_INFO, furtherInfo));
            }

            await Promise.all(savePromises);

            // Update original values after successful save
            setOriginalTitle(title);
            setOriginalSpecialization(specialization);
            setOriginalAddress(address);
            setOriginalWebsite(website);
            setOriginalFurtherInfo(furtherInfo);

        } catch (e) {
            logger.error("Failed to save profile information", e);
            setSaveError(true);
            throw e;
        } finally {
            setIsSaving(false);
            removeToast();
        }
    }, [
        isModified, title, specialization, address, website, furtherInfo,
        originalTitle, originalSpecialization, originalAddress, originalWebsite, originalFurtherInfo,
        toastRack, userProfilesStore
    ]);

    return (
        <div className={classNames("mx_ExtendedProfileSettings", className)}>
            <div className="mx_ExtendedProfileSettings_section">
                <h3 className="mx_ExtendedProfileSettings_heading">{_t("settings|extended_profile_settings|additional_information")}</h3>

                {loadError && (
                    <Alert title={_t("common|error")} type="critical">
                        {_t("settings|extended_profile_settings|failed_to_load")}
                    </Alert>
                )}

                <div className="mx_ExtendedProfileSettings_fields">
                    <div className="mx_ExtendedProfileSettings_fieldsRow">
                        <div className="mx_ExtendedProfileSettings_field mx_ExtendedProfileSettings_field_title">
                            <Field
                                label={_t("settings|extended_profile_settings|professional_title")}
                                value={title}
                                onChange={onTitleChanged}
                                disabled={isSaving}
                                autoComplete="off"
                            />
                        </div>

                        <div className="mx_ExtendedProfileSettings_field mx_ExtendedProfileSettings_field_specialization">
                            <Field
                                label={_t("settings|extended_profile_settings|specialization")}
                                value={specialization}
                                onChange={onSpecializationChanged}
                                disabled={isSaving}
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div className="mx_ExtendedProfileSettings_field">
                        <Field
                            label={_t("settings|extended_profile_settings|address")}
                            value={address}
                            onChange={onAddressChanged}
                            disabled={isSaving}
                            autoComplete="off"
                        />
                    </div>

                    <div className="mx_ExtendedProfileSettings_field">
                        <Field
                            label={_t("settings|extended_profile_settings|website")}
                            value={website}
                            onChange={onWebsiteChanged}
                            disabled={isSaving}
                            autoComplete="off"
                        />
                    </div>

                    <div className="mx_ExtendedProfileSettings_field">
                        <Field
                            className="mx_ExtendedProfileSettings_multiline"
                            label={_t("settings|extended_profile_settings|further_information")}
                            value={furtherInfo}
                            onChange={onFurtherInfoChanged}
                            disabled={isSaving}
                            element="textarea"
                            autoComplete="off"
                        />
                    </div>

                    {/* Single set of buttons for all fields */}
                    <div className="mx_ExtendedProfileSettings_buttons">
                        <AccessibleButton onClick={onCancel} kind="primary_outline" disabled={isSaving || !isModified}>
                            {_t("common|cancel")}
                        </AccessibleButton>
                        <AccessibleButton onClick={onSave} kind="primary" disabled={isSaving || !isModified}>
                            {_t("common|save")}
                        </AccessibleButton>
                    </div>
                </div>

                {saveError && (
                    <div className="mx_ExtendedProfileSettings_error">
                        <ErrorMessage>{_t("settings|extended_profile_settings|failed_to_save")}</ErrorMessage>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExtendedProfileSettings;
