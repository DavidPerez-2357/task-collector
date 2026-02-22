export type Migration = {
  version: number;
  sqlAssetPath?: string;
  sqlInline?: string;
  description?: string;
};
