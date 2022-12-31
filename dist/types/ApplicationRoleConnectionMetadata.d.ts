export declare enum ApplicationRoleConnectionMetadataType {
    INTEGER_LESS_THAN_OR_EQUAL = 1,
    INTEGER_GREATER_THAN_OR_EQUAL = 2,
    INTEGER_EQUAL = 3,
    INTEGER_NOT_EQUAL = 4,
    DATETIME_LESS_THAN_OR_EQUAL = 5,
    DATETIME_GREATER_THAN_OR_EQUAL = 6,
    BOOLEAN_EQUAL = 7,
    BOOLEAN_NOT_EQUAL = 8
}
export interface ApplicationRoleConnectionMetadata {
    type: ApplicationRoleConnectionMetadataType;
    key: string;
    name: string;
    name_localizations?: {
        [key: string]: string;
    };
    description: string;
    description_localizations?: {
        [key: string]: string;
    };
}
//# sourceMappingURL=ApplicationRoleConnectionMetadata.d.ts.map