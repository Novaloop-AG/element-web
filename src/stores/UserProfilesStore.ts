/*
Copyright 2024 New Vector Ltd.
Copyright 2023 The Matrix.org Foundation C.I.C.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { logger } from "matrix-js-sdk/src/logger";
import {
    type IMatrixProfile,
    type MatrixClient,
    MatrixError,
    type MatrixEvent,
    type RoomMember,
    RoomMemberEvent,
} from "matrix-js-sdk/src/matrix";

import { LruCache } from "../utils/LruCache";

const cacheSize = 500;

type StoreProfileValue = IMatrixProfile | undefined | null;
type ExtendedProfileValue = string | number | boolean | object | null;

interface GetOptions {
    /** Whether calling the function shouuld raise an Error. */
    shouldThrow: boolean;
}

/**
 * This store provides cached access to user profiles.
 * Listens for membership events and invalidates the cache for a profile on update with different profile values.
 */
export class UserProfilesStore {
    private profiles = new LruCache<string, IMatrixProfile | null>(cacheSize);
    private profileLookupErrors = new LruCache<string, MatrixError>(cacheSize);
    private knownProfiles = new LruCache<string, IMatrixProfile | null>(cacheSize);
    private extendedProfilesSupport = new Map<string, boolean>();
    private extendedProfiles = new Map<string, Map<string, ExtendedProfileValue>>();

    public constructor(private client: MatrixClient) {
        client.on(RoomMemberEvent.Membership, this.onRoomMembershipEvent);
    }

    /**
     * Synchronously get a profile from the store cache.
     *
     * @param userId - User Id of the profile to fetch
     * @returns The profile, if cached by the store.
     *          Null if the profile does not exist.
     *          Undefined if the profile is not cached by the store.
     *          In this case a profile can be fetched from the API via {@link fetchProfile}.
     */
    public getProfile(userId: string): StoreProfileValue {
        return this.profiles.get(userId);
    }

    /**
     * Async shortcut function that returns the profile from cache or
     * or fetches it on cache miss.
     *
     * @param userId - User Id of the profile to get or fetch
     * @returns The profile, if cached by the store or fetched from the API.
     *          Null if the profile does not exist or an error occurred during fetch.
     */
    public async getOrFetchProfile(userId: string, options?: GetOptions): Promise<IMatrixProfile | null> {
        const cachedProfile = this.profiles.get(userId);

        if (cachedProfile) return cachedProfile;

        return this.fetchProfile(userId, options);
    }

    /**
     * Get a profile lookup error.
     *
     * @param userId - User Id for which to get the lookup error
     * @returns The lookup error or undefined if there was no error or the profile was not fetched.
     */
    public getProfileLookupError(userId: string): MatrixError | undefined {
        return this.profileLookupErrors.get(userId);
    }

    /**
     * Synchronously get a profile from known users from the store cache.
     * Known user means that at least one shared room with the user exists.
     *
     * @param userId - User Id of the profile to fetch
     * @returns The profile, if cached by the store.
     *          Null if the profile does not exist.
     *          Undefined if the profile is not cached by the store.
     *          In this case a profile can be fetched from the API via {@link fetchOnlyKnownProfile}.
     */
    public getOnlyKnownProfile(userId: string): StoreProfileValue {
        return this.knownProfiles.get(userId);
    }

    /**
     * Asynchronousely fetches a profile from the API.
     * Stores the result in the cache, so that next time {@link getProfile} returns this value.
     *
     * @param userId - User Id for which the profile should be fetched for
     * @returns The profile, if found.
     *          Null if the profile does not exist or there was an error fetching it.
     */
    public async fetchProfile(userId: string, options?: GetOptions): Promise<IMatrixProfile | null> {
        const profile = await this.fetchProfileFromApi(userId, options);
        this.profiles.set(userId, profile);
        return profile;
    }

    /**
     * Asynchronousely fetches a profile from a known user from the API.
     * Known user means that at least one shared room with the user exists.
     * Stores the result in the cache, so that next time {@link getOnlyKnownProfile} returns this value.
     *
     * @param userId - User Id for which the profile should be fetched for
     * @returns The profile, if found.
     *          Undefined if the user is unknown.
     *          Null if the profile does not exist or there was an error fetching it.
     */
    public async fetchOnlyKnownProfile(userId: string): Promise<StoreProfileValue> {
        // Do not look up unknown users. The test for existence in knownProfiles is a performance optimisation.
        // If the user Id exists in knownProfiles we know them.
        if (!this.knownProfiles.has(userId) && !this.isUserIdKnown(userId)) return undefined;

        const profile = await this.fetchProfileFromApi(userId);
        this.knownProfiles.set(userId, profile);
        return profile;
    }

    /**
     * Check if a server supports extended profiles for a user.
     * Caches the result.
     *
     * @param userId - User Id to check
     * @returns true if the server supports extended profiles, false otherwise
     */
    public async doesServerSupportExtendedProfiles(userId: string): Promise<boolean> {
        const serverId = userId.split(":")[1];
        if (this.extendedProfilesSupport.has(serverId)) {
            return this.extendedProfilesSupport.get(serverId) ?? false;
        }

        try {
            const supported = await this.client.doesServerSupportExtendedProfiles();
            this.extendedProfilesSupport.set(serverId, supported);
            return supported;
        } catch (e) {
            logger.warn(`Error checking extended profiles support for serverId ${serverId}`, e);
            this.extendedProfilesSupport.set(serverId, false);
            return false;
        }
    }

    /**
     * Get an extended profile property from cache if available.
     *
     * @param userId - User Id for which to get the extended profile property
     * @param property - The property key to get
     * @returns The property value if cached, undefined if not cached
     */
    public getExtendedProfileProperty(userId: string, property: string): ExtendedProfileValue | undefined {
        const userExtendedProfile = this.extendedProfiles.get(userId);
        if (!userExtendedProfile) {
            return undefined;
        }

        return userExtendedProfile.get(property);
    }

    /**
     * Get or fetch an extended profile property.
     *
     * @param userId - User Id for which to get the extended profile property
     * @param property - The property key to get
     * @returns The property value, null if it doesn't exist
     */
    public async getOrFetchExtendedProfileProperty(userId: string, property: string): Promise<ExtendedProfileValue | null> {
        const cached = this.getExtendedProfileProperty(userId, property);
        if (cached !== undefined) {
            return cached;
        }

        return await this.fetchExtendedProfileProperty(userId, property);
    }

    /**
     * Fetch an extended profile property from the API.
     * Caches the result.
     *
     * @param userId - User Id for which to fetch the extended profile property
     * @param property - The property key to fetch
     * @returns The property value, null if it doesn't exist or there was an error
     */
    public async fetchExtendedProfileProperty(userId: string, property: string): Promise<ExtendedProfileValue | null> {
        // Removed server support check - assume support is always available
        try {
            const rawValue = await this.client.getExtendedProfileProperty(userId, property);
            // Ensure the value is of type ExtendedProfileValue
            const value: ExtendedProfileValue = this.validateExtendedProfileValue(rawValue);
            // Cache the value
            if (!this.extendedProfiles.has(userId)) {
                this.extendedProfiles.set(userId, new Map());
            }
            this.extendedProfiles.get(userId)?.set(property, value);

            return value;
        } catch (e) {
            logger.warn(`Error retrieving extended profile property ${property} for userId ${userId}`, e);
            return null;
        }
    }

    // Hilfsmethode, um den Rückgabewert zu validieren
    private validateExtendedProfileValue(value: unknown): ExtendedProfileValue {
        if (value === null ||
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean" ||
            (typeof value === "object" && value !== null)) {
            return value as ExtendedProfileValue;
        }

        // Fallback für ungültige Werte
        logger.warn(`Invalid extended profile value type: ${typeof value}`);
        return null;
    }

    /**
     * Set an extended profile property for the current user.
     *
     * @param property - The property key to set
     * @param value - The value to set
     * @returns true if successful, false otherwise
     */
    public async setExtendedProfileProperty(property: string, value: ExtendedProfileValue): Promise<boolean> {
        try {
            await this.client.setExtendedProfileProperty(property, value);

            const userId = this.client.getSafeUserId();
            if (!this.extendedProfiles.has(userId)) {
                this.extendedProfiles.set(userId, new Map());
            }
            this.extendedProfiles.get(userId)?.set(property, value);

            return true;
        } catch (e) {
            logger.warn(`Error setting extended profile property ${property}`, e);
            return false;
        }
    }

    /**
     * Delete an extended profile property for the current user.
     *
     * @param property - The property key to delete
     * @returns true if successful, false otherwise
     */
    public async deleteExtendedProfileProperty(property: string): Promise<boolean> {
        try {
            await this.client.deleteExtendedProfileProperty(property);

            const userId = this.client.getSafeUserId();
            if (this.extendedProfiles.has(userId)) {
                this.extendedProfiles.get(userId)?.delete(property);
            }

            return true;
        } catch (e) {
            logger.warn(`Error deleting extended profile property ${property}`, e);
            return false;
        }
    }

    public flush(): void {
        this.profiles = new LruCache<string, IMatrixProfile | null>(cacheSize);
        this.profileLookupErrors = new LruCache<string, MatrixError>(cacheSize);
        this.knownProfiles = new LruCache<string, IMatrixProfile | null>(cacheSize);
        this.extendedProfilesSupport = new Map<string, boolean>();
        this.extendedProfiles = new Map<string, Map<string, ExtendedProfileValue>>();
    }

    /**
     * Looks up a user profile via API.
     *
     * @param userId - User Id for which the profile should be fetched for
     * @returns The profile information or null on errors
     */
    private async fetchProfileFromApi(userId: string, options?: GetOptions): Promise<IMatrixProfile | null> {
        // invalidate cached profile errors
        this.profileLookupErrors.delete(userId);

        try {
            return (await this.client.getProfileInfo(userId)) ?? null;
        } catch (e) {
            logger.warn(`Error retrieving profile for userId ${userId}`, e);

            if (e instanceof MatrixError) {
                this.profileLookupErrors.set(userId, e);
            }

            if (options?.shouldThrow) {
                throw e;
            }
        }

        return null;
    }

    /**
     * Whether at least one shared room with the userId exists.
     *
     * @param userId
     * @returns true: at least one room shared with user identified by its Id, else false.
     */
    private isUserIdKnown(userId: string): boolean {
        return this.client.getRooms().some((room) => {
            return !!room.getMember(userId);
        });
    }

    /**
     * Simple cache invalidation if a room membership event is received and
     * at least one profile value differs from the cached one.
     */
    private onRoomMembershipEvent = (event: MatrixEvent, member: RoomMember): void => {
        const profile = this.profiles.get(member.userId);

        if (
            profile &&
            (profile.displayname !== member.rawDisplayName || profile.avatar_url !== member.getMxcAvatarUrl())
        ) {
            this.profiles.delete(member.userId);
        }

        const knownProfile = this.knownProfiles.get(member.userId);

        if (
            knownProfile &&
            (knownProfile.displayname !== member.rawDisplayName || knownProfile.avatar_url !== member.getMxcAvatarUrl())
        ) {
            this.knownProfiles.delete(member.userId);
        }
    };
}
