/*
Copyright 2025 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { logger } from "matrix-js-sdk/src/logger";
import { Alert } from "@vector-im/compound-web";
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
export const EXT_PROFILE_KEY_WEBSITE = "io.element.profile.website";
export const EXT_PROFILE_KEY_FURTHER_INFO = "io.element.profile.further_info";
export const EXT_PROFILE_KEY_PRACTICE_NAME = "io.element.profile.practice_name";
export const EXT_PROFILE_KEY_BUSINESS_STREET = "io.element.profile.business_street";
export const EXT_PROFILE_KEY_BUSINESS_STREET_NR = "io.element.profile.business_street_nr";
export const EXT_PROFILE_KEY_BUSINESS_CITY = "io.element.profile.business_city";
export const EXT_PROFILE_KEY_BUSINESS_PLZ = "io.element.profile.business_plz";
export const EXT_PROFILE_KEY_BUSINESS_EMAIL = "io.element.profile.business_email";
export const EXT_PROFILE_KEY_BUSINESS_TEL = "io.element.profile.business_tel";

// Unstable feature key for extended profiles
export const UNSTABLE_MSC4133_EXTENDED_PROFILES = "org.matrix.msc4133.extended_profiles";

interface ExtendedProfileSettingsProps {
    className?: string;
}

/**
 * Component for managing extended profile fields for medical professionals.
 * Allows editing title, specialization, website, and further information.
 */
const ExtendedProfileSettings: React.FC<ExtendedProfileSettingsProps> = ({ className }) => {
    const [title, setTitle] = useState<string>("");
    const [specialization, setSpecialization] = useState<string>("");
    const [website, setWebsite] = useState<string>("");
    const [furtherInfo, setFurtherInfo] = useState<string>("");
    const [practiceName, setPracticeName] = useState<string>("");

    // Business contact field states
    const [businessStreet, setBusinessStreet] = useState<string>("");
    const [businessStreetNr, setBusinessStreetNr] = useState<string>("");
    const [businessCity, setBusinessCity] = useState<string>("");
    const [businessPlz, setBusinessPlz] = useState<string>("");
    const [businessEmail, setBusinessEmail] = useState<string>("");
    const [businessTel, setBusinessTel] = useState<string>("");

    // Validation states for email and phone
    const [businessEmailValid, setBusinessEmailValid] = useState<boolean>(true);
    const [businessTelValid, setBusinessTelValid] = useState<boolean>(true);

    // Store original values for cancel functionality
    const [originalTitle, setOriginalTitle] = useState<string>("");
    const [originalSpecialization, setOriginalSpecialization] = useState<string>("");
    const [originalWebsite, setOriginalWebsite] = useState<string>("");
    const [originalFurtherInfo, setOriginalFurtherInfo] = useState<string>("");
    const [originalPracticeName, setOriginalPracticeName] = useState<string>("");

    // Original business contact field values
    const [originalBusinessStreet, setOriginalBusinessStreet] = useState<string>("");
    const [originalBusinessStreetNr, setOriginalBusinessStreetNr] = useState<string>("");
    const [originalBusinessCity, setOriginalBusinessCity] = useState<string>("");
    const [originalBusinessPlz, setOriginalBusinessPlz] = useState<string>("");
    const [originalBusinessEmail, setOriginalBusinessEmail] = useState<string>("");
    const [originalBusinessTel, setOriginalBusinessTel] = useState<string>("");

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
                    const websiteValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_WEBSITE);
                    const furtherInfoValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_FURTHER_INFO);
                    const practiceNameValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_PRACTICE_NAME);

                    // Fetch business contact fields
                    const businessStreetValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_STREET);
                    const businessStreetNrValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_STREET_NR);
                    const businessCityValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_CITY);
                    const businessPlzValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_PLZ);
                    const businessEmailValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_EMAIL);
                    const businessTelValue = await userProfilesStore.getOrFetchExtendedProfileProperty(userId, EXT_PROFILE_KEY_BUSINESS_TEL);

                    const titleStr = titleValue as string || "";
                    const specializationStr = specializationValue as string || "";
                    const websiteStr = websiteValue as string || "";
                    const furtherInfoStr = furtherInfoValue as string || "";
                    const practiceNameStr = practiceNameValue as string || "";

                    // Convert business contact field values to strings
                    const businessStreetStr = businessStreetValue as string || "";
                    const businessStreetNrStr = businessStreetNrValue as string || "";
                    const businessCityStr = businessCityValue as string || "";
                    const businessPlzStr = businessPlzValue as string || "";
                    const businessEmailStr = businessEmailValue as string || "";
                    const businessTelStr = businessTelValue as string || "";

                    setTitle(titleStr);
                    setSpecialization(specializationStr);
                    setWebsite(websiteStr);
                    setFurtherInfo(furtherInfoStr);
                    setPracticeName(practiceNameStr);

                    // Set business contact fields
                    setBusinessStreet(businessStreetStr);
                    setBusinessStreetNr(businessStreetNrStr);
                    setBusinessCity(businessCityStr);
                    setBusinessPlz(businessPlzStr);
                    setBusinessEmail(businessEmailStr);
                    setBusinessTel(businessTelStr);

                    // Store original values for cancel functionality
                    setOriginalTitle(titleStr);
                    setOriginalSpecialization(specializationStr);
                    setOriginalWebsite(websiteStr);
                    setOriginalFurtherInfo(furtherInfoStr);
                    setOriginalPracticeName(practiceNameStr);

                    // Store original business contact field values
                    setOriginalBusinessStreet(businessStreetStr);
                    setOriginalBusinessStreetNr(businessStreetNrStr);
                    setOriginalBusinessCity(businessCityStr);
                    setOriginalBusinessPlz(businessPlzStr);
                    setOriginalBusinessEmail(businessEmailStr);
                    setOriginalBusinessTel(businessTelStr);
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
            website !== originalWebsite ||
            furtherInfo !== originalFurtherInfo ||
            practiceName !== originalPracticeName ||
            businessStreet !== originalBusinessStreet ||
            businessStreetNr !== originalBusinessStreetNr ||
            businessCity !== originalBusinessCity ||
            businessPlz !== originalBusinessPlz ||
            businessEmail !== originalBusinessEmail ||
            businessTel !== originalBusinessTel;

        setIsModified(hasChanges);
    }, [
        title, specialization, website, furtherInfo, practiceName,
        originalTitle, originalSpecialization, originalWebsite, originalFurtherInfo, originalPracticeName,
        businessStreet, businessStreetNr, businessCity, businessPlz, businessEmail, businessTel,
        originalBusinessStreet, originalBusinessStreetNr, originalBusinessCity, originalBusinessPlz,
        originalBusinessEmail, originalBusinessTel
    ]);

    // Field change handlers
    const onTitleChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    }, []);

    const onSpecializationChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSpecialization(e.target.value);
    }, []);

    const onWebsiteChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setWebsite(e.target.value);
    }, []);

    const onFurtherInfoChanged = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        setFurtherInfo(e.target.value);
    }, []);

    const onPracticeNameChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setPracticeName(e.target.value);
    }, []);

    // Business contact field change handlers
    const onBusinessStreetChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setBusinessStreet(e.target.value);
    }, []);

    const onBusinessStreetNrChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setBusinessStreetNr(e.target.value);
    }, []);

    const onBusinessCityChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setBusinessCity(e.target.value);
    }, []);

    const onBusinessPlzChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setBusinessPlz(e.target.value);
    }, []);

    // Email validation with simple regex
    const onBusinessEmailChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setBusinessEmail(value);
        // Email format validation - basic check for something@something.something
        const emailValid = value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        setBusinessEmailValid(emailValid);
    }, []);

    // Phone validation
    const onBusinessTelChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setBusinessTel(value);
        // Phone format validation - allow digits, spaces, plus, minus, parentheses
        const phoneValid = value === "" || /^[0-9+\-() ]+$/.test(value);
        setBusinessTelValid(phoneValid);
    }, []);

    // Cancel handler - restore all original values
    const onCancel = useCallback(() => {
        setTitle(originalTitle);
        setSpecialization(originalSpecialization);
        setWebsite(originalWebsite);
        setFurtherInfo(originalFurtherInfo);
        setPracticeName(originalPracticeName);

        // Reset business contact fields to original values
        setBusinessStreet(originalBusinessStreet);
        setBusinessStreetNr(originalBusinessStreetNr);
        setBusinessCity(originalBusinessCity);
        setBusinessPlz(originalBusinessPlz);
        setBusinessEmail(originalBusinessEmail);
        setBusinessTel(originalBusinessTel);

        // Reset validation states
        setBusinessEmailValid(true);
        setBusinessTelValid(true);
    }, [
        originalTitle, originalSpecialization, originalWebsite, originalFurtherInfo, originalPracticeName,
        originalBusinessStreet, originalBusinessStreetNr, originalBusinessCity, originalBusinessPlz,
        originalBusinessEmail, originalBusinessTel
    ]);

    // Save handler - save all fields at once
    const onSave = useCallback(async (): Promise<void> => {
        if (!isModified) return;

        // Validate email and phone fields before saving
        if (!businessEmailValid || !businessTelValid) {
            setSaveError(true);
            return;
        }

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

            if (website !== originalWebsite) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_WEBSITE, website));
            }

            if (furtherInfo !== originalFurtherInfo) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_FURTHER_INFO, furtherInfo));
            }

            if (practiceName !== originalPracticeName) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_PRACTICE_NAME, practiceName));
            }

            // Save business contact fields if modified
            if (businessStreet !== originalBusinessStreet) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_BUSINESS_STREET, businessStreet));
            }

            if (businessStreetNr !== originalBusinessStreetNr) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_BUSINESS_STREET_NR, businessStreetNr));
            }

            if (businessCity !== originalBusinessCity) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_BUSINESS_CITY, businessCity));
            }

            if (businessPlz !== originalBusinessPlz) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_BUSINESS_PLZ, businessPlz));
            }

            if (businessEmail !== originalBusinessEmail) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_BUSINESS_EMAIL, businessEmail));
            }

            if (businessTel !== originalBusinessTel) {
                savePromises.push(userProfilesStore.setExtendedProfileProperty(EXT_PROFILE_KEY_BUSINESS_TEL, businessTel));
            }

            await Promise.all(savePromises);

            // Update original values after successful save
            setOriginalTitle(title);
            setOriginalSpecialization(specialization);
            setOriginalWebsite(website);
            setOriginalFurtherInfo(furtherInfo);
            setOriginalPracticeName(practiceName);

            // Update original business contact field values
            setOriginalBusinessStreet(businessStreet);
            setOriginalBusinessStreetNr(businessStreetNr);
            setOriginalBusinessCity(businessCity);
            setOriginalBusinessPlz(businessPlz);
            setOriginalBusinessEmail(businessEmail);
            setOriginalBusinessTel(businessTel);

        } catch (e) {
            logger.error("Failed to save profile information", e);
            setSaveError(true);
            throw e;
        } finally {
            setIsSaving(false);
            removeToast();
        }
    }, [
        isModified, title, specialization, website, furtherInfo, practiceName,
        originalTitle, originalSpecialization, originalWebsite, originalFurtherInfo, originalPracticeName,
        businessStreet, businessStreetNr, businessCity, businessPlz, businessEmail, businessTel,
        originalBusinessStreet, originalBusinessStreetNr, originalBusinessCity, originalBusinessPlz,
        originalBusinessEmail, originalBusinessTel, businessEmailValid, businessTelValid,
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
                            label={_t("settings|extended_profile_settings|practice_name")}
                            value={practiceName}
                            onChange={onPracticeNameChanged}
                            disabled={isSaving}
                            autoComplete="off"
                        />
                    </div>

                    {/* Street and number in one row, street takes 2/3 width */}
                    <div className="mx_ExtendedProfileSettings_fieldsRow mx_ExtendedProfileSettings_address_row">
                        <div className="mx_ExtendedProfileSettings_field mx_ExtendedProfileSettings_field_business_street">
                            <Field
                                label={_t("settings|extended_profile_settings|business_street")}
                                value={businessStreet}
                                onChange={onBusinessStreetChanged}
                                disabled={isSaving}
                                autoComplete="off"
                            />
                        </div>
                        <div className="mx_ExtendedProfileSettings_field mx_ExtendedProfileSettings_field_business_street_nr">
                            <Field
                                label={_t("settings|extended_profile_settings|business_street_nr")}
                                value={businessStreetNr}
                                onChange={onBusinessStreetNrChanged}
                                disabled={isSaving}
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {/* PLZ and City in one row, PLZ takes 1/3 width */}
                    <div className="mx_ExtendedProfileSettings_fieldsRow mx_ExtendedProfileSettings_postal_row">
                        <div className="mx_ExtendedProfileSettings_field mx_ExtendedProfileSettings_field_business_plz">
                            <Field
                                label={_t("settings|extended_profile_settings|business_plz")}
                                value={businessPlz}
                                onChange={onBusinessPlzChanged}
                                disabled={isSaving}
                                autoComplete="off"
                            />
                        </div>
                        <div className="mx_ExtendedProfileSettings_field mx_ExtendedProfileSettings_field_business_city">
                            <Field
                                label={_t("settings|extended_profile_settings|business_city")}
                                value={businessCity}
                                onChange={onBusinessCityChanged}
                                disabled={isSaving}
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {/* Email field with validation */}
                    <div className="mx_ExtendedProfileSettings_fieldsRow mx_ExtendedProfileSettings_contact_row">
                        <div className="mx_ExtendedProfileSettings_field">
                            <Field
                                label={_t("settings|extended_profile_settings|business_email")}
                                value={businessEmail}
                                onChange={onBusinessEmailChanged}
                                disabled={isSaving}
                                autoComplete="off"
                                type="email"
                            />
                        </div>

                        {/* Telephone field with validation */}
                        <div className="mx_ExtendedProfileSettings_field">
                            <Field
                                label={_t("settings|extended_profile_settings|business_tel")}
                                value={businessTel}
                                onChange={onBusinessTelChanged}
                                disabled={isSaving}
                                autoComplete="off"
                                type="tel"
                            />
                        </div>
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
                    <Alert title={_t("settings|extended_profile_settings|failed_to_save")} type="critical">
                        {businessEmailValid ? null : _t("settings|extended_profile_settings|invalid_email")}
                        <span> </span>
                        {businessTelValid ? null : _t("settings|extended_profile_settings|invalid_phone")}
                    </Alert>
                )}
            </div>
        </div>
    );
};

export default ExtendedProfileSettings;
