/**
 * Example types for the feature module
 *
 * Define all TypeScript types and interfaces specific to this feature.
 */

export type Item = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ItemStatus = 'draft' | 'published' | 'archived';

export type CreateItemInput = {
  name: string;
  description: string;
};

export type UpdateItemInput = Partial<CreateItemInput>;
