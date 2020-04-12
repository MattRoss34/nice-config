import * as extend from 'extend';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { logger } from '.';
import { ConfigObject, Document } from '../models';

/**
 * Determines if the given yaml document should be used with regard to the
 * given profile. This provides similar functionality to spring profiles.
 *
 * @param {Document} document The yaml doc to check.
 * @param {string[]} activeProfiles The current profile names to filter docs by.
 * @returns {boolean} True if the given yaml doc applies to the given profiles.
 */
export const shouldUseDocument = (document: Document | undefined, activeProfiles?: string[]): boolean => {
    let useThisDoc: boolean = false;
    if (document && !document.profiles) {
        useThisDoc = true; // This document applies to all profiles
    } else if (document && activeProfiles) {
        const documentProfiles: string[] = document.profiles.split(",");
        for (let i = 0; i < documentProfiles.length; i++) {
            if (documentProfiles[i][0] === "!") {
                const excludedProfile: string = documentProfiles[i].substring(1);
                if (activeProfiles.indexOf(excludedProfile) >= 0) {
                    return false; // This document should not be used
                }
            } else if (activeProfiles.indexOf(documentProfiles[i]) >= 0) {
                useThisDoc = true; // This document applies to the profiles
            }
        }
    }

    return useThisDoc;
};

/**
 * Reads the yaml file at the given relative path and merges multiple docs into a single object.
 * If 'profile' is specified then this method expects to filter the yaml for docs based on doc.profiles.
 * If no profile is specified, then only docs without an 'env' property will be read from the yaml.
 *
 * @param {string} relativePath Relative path of the file to read.
 * @param {string[]} activeProfiles Profiles to filter the yaml documents on.
 * @returns {Document} Object representation of the given yaml file.
 */
export const readYaml = (relativePath: string, activeProfiles?: string[]): Document => {
    logger.debug(`loading config file from: ${relativePath}`);
    const doc: Document = {};
    yaml.safeLoadAll(fs.readFileSync(relativePath, 'utf8'), (thisDoc) => {
        if (shouldUseDocument(thisDoc, activeProfiles)) {
            extend(true, doc, thisDoc);
        }
    });

    return doc;
};

/**
 * Turns an array of key segments and value into a nested object.
 * Example: ['spring','profiles','active'], 'dev' -> { 'spring': { 'profiles': { 'active': 'dev' }}}
 *
 * @param {string[]} propertyKeys The key segments for the given property
 * @param {*} propertyValue The value associated with the given property
 * @returns {any}
 */
// tslint:disable-next-line: no-any
export const createObjectForProperty = (propertyKeys: string[], propertyValue: any): any => {
    const thisPropertyName: string | undefined = propertyKeys.shift();
    if (thisPropertyName === undefined) {
        return propertyValue;
    }

    // tslint:disable-next-line: no-any
    const thisPropertyValue: any = createObjectForProperty(propertyKeys, propertyValue);
    var thisObject: object = {};
    thisObject[thisPropertyName] = thisPropertyValue;

    return thisObject;
};

/**
 * Parses the dot-separated key-value pairs of an object into deeply nested Objects.
 * Example: 'spring.profiles.active': 'dev' -> 'spring': 'profiles': 'active': 'dev'
 *
 * @param {object} propertiesObject Object containing properties to be parsed
 * @returns {object} Object of deeply nested properties (not dot-separated)
 */
export const parsePropertiesToObjects = (propertiesObject: object | undefined): object => {
    var object: object = {};
    if (propertiesObject) {
        for (let thisPropertyName in propertiesObject) {
            const thisPropertyObject: object =
                createObjectForProperty(thisPropertyName.split('.'), propertiesObject[thisPropertyName]);
            extend(true, object, thisPropertyObject);
        }
    }
    return object;
};

/**
 * Reads the yaml document and parses any dot-separated property keys into objects.
 *
 * @param {string} relativePath Relative path of the file to read.
 * @param {string[]} activeProfiles Profiles to filter the yaml documents on.
 * @returns {Document} Object representation of the given yaml file.
 */
export const readYamlAsDocument = (relativePath: string, activeProfiles: string[]): Document => {
    return parsePropertiesToObjects(readYaml(relativePath, activeProfiles));
};

/**
 * Takes an array of objects and merges their properties in order, from index 0 to length-1.
 * Identical properties in later objects will override those in previous objects.
 * This method does handle deeply nested property keys, like: { 'spring': { 'profiles': { 'active': 'local' }}}
 *
 * @param {object[]} objects Array of Objects containing properties to be merged
 * @returns {object} Object containing the merged properties
 */
// tslint:disable-next-line: no-any
export const mergeProperties = <T extends ConfigObject = any>(objects: object[]): T => {
    var mergedConfig: T = {} as T;
    for (var i = 0; i < objects.length; i++) {
        extend(true, mergedConfig, objects[i]);
    }

    return mergedConfig;
};