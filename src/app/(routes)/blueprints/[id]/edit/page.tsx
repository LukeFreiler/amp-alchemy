'use client';

/**
 * Blueprint Editor Page
 *
 * Complex 2-panel editor for managing blueprint sections, fields, and generators
 */

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toaster';
import { SectionList } from '@/features/blueprints/components/section-list';
import { FieldList } from '@/features/blueprints/components/field-list';
import { FieldConfigModal } from '@/features/blueprints/components/field-config-modal';
import { SectionModal } from '@/features/blueprints/components/section-modal';
import { GeneratorList } from '@/features/blueprints/components/generator-list';
import {
  BlueprintWithSections,
  SectionWithFields,
  Field,
} from '@/features/blueprints/types/blueprint';
import { BlueprintArtifactGenerator } from '@/features/blueprints/types/generator';

export default function BlueprintEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [blueprint, setBlueprint] = useState<BlueprintWithSections | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | undefined>(undefined);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionModalMode, setSectionModalMode] = useState<'create' | 'edit'>('create');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sections' | 'generators'>('sections');
  const [generators, setGenerators] = useState<BlueprintArtifactGenerator[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fetch blueprint data
  useEffect(() => {
    const fetchBlueprint = async () => {
      const response = await fetch(`/api/v1/blueprints/${id}`);
      const result = await response.json();
      if (result.ok) {
        setBlueprint(result.data);
        setName(result.data.name);
        setDescription(result.data.description || '');
        if (result.data.sections.length > 0) {
          setSelectedSectionId(result.data.sections[0].id);
        }
      }
    };

    fetchBlueprint();
  }, [id]);

  const selectedSection = blueprint?.sections.find((s) => s.id === selectedSectionId);

  const fetchGenerators = async () => {
    const response = await fetch(`/api/v1/blueprints/${id}/generators`);
    const result = await response.json();
    if (result.ok) {
      setGenerators(result.data);
    }
  };

  useEffect(() => {
    if (activeTab === 'generators') {
      fetchGenerators();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  const handleNameClick = () => {
    setTempName(name);
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!tempName.trim()) {
      toast.error('Blueprint name is required');
      setTempName(name);
      setIsEditingName(false);
      return;
    }

    if (tempName === name) {
      setIsEditingName(false);
      return;
    }

    try {
      const response = await fetch(`/api/v1/blueprints/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempName, description }),
      });

      const result = await response.json();
      if (result.ok) {
        setName(tempName);
        setBlueprint((prev) => (prev ? { ...prev, ...result.data } : null));
        toast.success('Blueprint name updated');
      } else {
        toast.error(result.error.message || 'Failed to update blueprint name');
        setTempName(name);
      }
    } catch (error) {
      toast.error('Failed to update blueprint name');
      setTempName(name);
    } finally {
      setIsEditingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameSave();
    } else if (e.key === 'Escape') {
      setTempName(name);
      setIsEditingName(false);
    }
  };

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/v1/blueprints/${id}/publish`, {
        method: 'POST',
      });

      const result = await response.json();
      if (result.ok) {
        toast.success('Blueprint published successfully!');
        setBlueprint((prev) => (prev ? { ...prev, ...result.data } : null));
      } else {
        toast.error(result.error.message || 'Failed to publish blueprint');
      }
    } catch (error) {
      toast.error('Failed to publish blueprint');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddSection = () => {
    setSectionModalMode('create');
    setEditingSectionId(null);
    setEditingSectionTitle('');
    setIsSectionModalOpen(true);
  };

  const handleEditSection = (sectionId: string) => {
    const section = blueprint?.sections.find((s) => s.id === sectionId);
    if (!section) return;

    setSectionModalMode('edit');
    setEditingSectionId(sectionId);
    setEditingSectionTitle(section.title);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (title: string) => {
    if (sectionModalMode === 'create') {
      try {
        const response = await fetch(`/api/v1/blueprints/${id}/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });

        const result = await response.json();
        if (result.ok) {
          const newSection: SectionWithFields = { ...result.data, fields: [] };
          setBlueprint((prev) =>
            prev ? { ...prev, sections: [...prev.sections, newSection] } : null
          );
          setSelectedSectionId(result.data.id);
          toast.success('Section added');
        } else {
          toast.error(result.error.message || 'Failed to add section');
          throw new Error(result.error.message);
        }
      } catch (error) {
        if (error instanceof Error && error.message) {
          // Already shown toast above
        } else {
          toast.error('Failed to add section');
        }
        throw error;
      }
    } else if (sectionModalMode === 'edit' && editingSectionId) {
      try {
        const response = await fetch(`/api/v1/sections/${editingSectionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });

        const result = await response.json();
        if (result.ok) {
          setBlueprint((prev) =>
            prev
              ? {
                  ...prev,
                  sections: prev.sections.map((s) =>
                    s.id === editingSectionId ? { ...s, ...result.data } : s
                  ),
                }
              : null
          );
          toast.success('Section updated');
        } else {
          toast.error(result.error.message || 'Failed to update section');
          throw new Error(result.error.message);
        }
      } catch (error) {
        if (error instanceof Error && error.message) {
          // Already shown toast above
        } else {
          toast.error('Failed to update section');
        }
        throw error;
      }
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/v1/sections/${sectionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.ok) {
        setBlueprint((prev) => {
          if (!prev) return null;
          const newSections = prev.sections.filter((s) => s.id !== sectionId);
          if (selectedSectionId === sectionId) {
            const firstSection = newSections[0];
            if (firstSection) {
              setSelectedSectionId(firstSection.id);
            } else {
              setSelectedSectionId(null);
            }
          }
          return { ...prev, sections: newSections };
        });
        toast.success('Section deleted');
      } else {
        toast.error(result.error.message || 'Failed to delete section');
      }
    } catch (error) {
      toast.error('Failed to delete section');
    }
  };

  const handleSectionsReorder = async (reordered: SectionWithFields[]) => {
    setBlueprint((prev) => (prev ? { ...prev, sections: reordered } : null));

    try {
      await fetch('/api/v1/sections/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: reordered.map((s) => ({ id: s.id, order_index: s.order_index })),
        }),
      });
    } catch (error) {
      toast.error('Failed to reorder sections');
    }
  };

  const handleAddField = () => {
    setEditingField(undefined);
    setIsFieldModalOpen(true);
  };

  const handleEditField = (fieldId: string) => {
    const field = selectedSection?.fields.find((f) => f.id === fieldId);
    if (field) {
      setEditingField(field);
      setIsFieldModalOpen(true);
    }
  };

  const handleSaveField = async (data: Partial<Field>) => {
    if (!selectedSectionId) return;

    try {
      if (editingField) {
        // Update existing field
        const response = await fetch(`/api/v1/fields/${editingField.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (result.ok) {
          setBlueprint((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              sections: prev.sections.map((s) =>
                s.id === selectedSectionId
                  ? {
                      ...s,
                      fields: s.fields.map((f) => (f.id === editingField.id ? result.data : f)),
                    }
                  : s
              ),
            };
          });
          toast.success('Field updated');
        } else {
          toast.error(result.error.message || 'Failed to update field');
        }
      } else {
        // Create new field
        const response = await fetch(`/api/v1/sections/${selectedSectionId}/fields`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (result.ok) {
          setBlueprint((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              sections: prev.sections.map((s) =>
                s.id === selectedSectionId ? { ...s, fields: [...s.fields, result.data] } : s
              ),
            };
          });
          toast.success('Field added');
        } else {
          toast.error(result.error.message || 'Failed to add field');
        }
      }
    } catch (error) {
      toast.error('Failed to save field');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      const response = await fetch(`/api/v1/fields/${fieldId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.ok) {
        setBlueprint((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === selectedSectionId
                ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
                : s
            ),
          };
        });
        toast.success('Field deleted');
      } else {
        toast.error(result.error.message || 'Failed to delete field');
      }
    } catch (error) {
      toast.error('Failed to delete field');
    }
  };

  const handleFieldsReorder = async (reordered: Field[]) => {
    if (!selectedSectionId) return;

    setBlueprint((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === selectedSectionId ? { ...s, fields: reordered } : s
        ),
      };
    });

    try {
      await fetch('/api/v1/fields/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: reordered.map((f) => ({ id: f.id, order_index: f.order_index })),
        }),
      });
    } catch (error) {
      toast.error('Failed to reorder fields');
    }
  };

  if (!blueprint) {
    return (
      <div className="flex h-[calc(100vh-var(--topbar-height,4rem))] items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-var(--topbar-height,4rem))] flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/blueprints')}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                {isEditingName ? (
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={handleNameKeyDown}
                    className="m-0 border-none bg-transparent p-0 text-xl font-bold outline-none focus:outline-none"
                  />
                ) : (
                  <h1
                    className="cursor-pointer text-xl font-bold transition-opacity hover:opacity-70"
                    onClick={handleNameClick}
                  >
                    {name}
                  </h1>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{blueprint.status}</Badge>
                  <span>{blueprint.sections.length} sections</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
                <Rocket className="h-4 w-4" />
                {isPublishing ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-t border-border px-6">
            <button
              onClick={() => setActiveTab('sections')}
              className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                activeTab === 'sections'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Sections & Fields
            </button>
            <button
              onClick={() => setActiveTab('generators')}
              className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                activeTab === 'generators'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Generators
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === 'sections' ? (
            <>
              {/* Left Panel - Sections */}
              <div className="w-80 overflow-y-auto border-r border-border bg-card p-4">
                <SectionList
                  sections={blueprint.sections}
                  selectedSectionId={selectedSectionId}
                  onSectionSelect={setSelectedSectionId}
                  onSectionsReorder={handleSectionsReorder}
                  onAddSection={handleAddSection}
                  onEditSection={handleEditSection}
                  onDeleteSection={handleDeleteSection}
                />
              </div>

              {/* Right Panel - Fields */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedSection && (
                  <FieldList
                    fields={selectedSection.fields}
                    onFieldsReorder={handleFieldsReorder}
                    onAddField={handleAddField}
                    onEditField={handleEditField}
                    onDeleteField={handleDeleteField}
                  />
                )}
              </div>
            </>
          ) : (
            /* Generators Tab */
            <div className="flex-1 overflow-y-auto p-6">
              <GeneratorList
                blueprintId={id}
                blueprint={blueprint}
                generators={generators}
                onUpdate={fetchGenerators}
              />
            </div>
          )}
        </div>
      </div>

      {/* Section Modal */}
      <SectionModal
        open={isSectionModalOpen}
        onOpenChange={setIsSectionModalOpen}
        onSave={handleSaveSection}
        initialTitle={editingSectionTitle}
        mode={sectionModalMode}
      />

      {/* Field Config Modal */}
      {selectedSectionId && (
        <FieldConfigModal
          field={editingField}
          sectionId={selectedSectionId}
          open={isFieldModalOpen}
          onOpenChange={setIsFieldModalOpen}
          onSave={handleSaveField}
        />
      )}
    </>
  );
}
