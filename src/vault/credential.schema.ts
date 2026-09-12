import * as z from "zod";

/**
 * Runtime schema for the 008 credential contract,
 * mirroring specs/008-credential-data-contract/contracts/credential.schema.json.
 *
 * The JSON Schema is the cross-feature source of truth; this module is its
 * runtime mirror consumed by `safeParse` (007) at every boundary.
 */

export const credentialSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  username: z.string().min(1),
  domain: z.string().min(1),
  password: z.string().min(1),
  favorite: z.boolean().default(false),
  notes: z.string().default(""),
  created_at: z.iso.datetime().optional(),
  updated_at: z.iso.datetime().optional(),
});

export type Credential = z.infer<typeof credentialSchema>;

/** Input payload for the VaultStore add mutation: no id, no timestamps. */
export const credentialDraftSchema = credentialSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CredentialDraft = z.infer<typeof credentialDraftSchema>;

/** Input payload for the VaultStore update mutation: all fields optional. */
export const credentialPatchSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  domain: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  favorite: z.boolean().optional(),
  notes: z.string().optional(),
});

export type CredentialPatch = z.infer<typeof credentialPatchSchema>;
