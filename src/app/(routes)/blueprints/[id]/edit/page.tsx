'use client';

/**
 * Blueprint Editor Page
 *
 * Complex 2-panel editor for managing blueprint sections, fields, and generators
 */

import { useState, useEffect, use, useRef } from 'react';
import { Rocket, Layout, Wand2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/ui/page-header';
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
  const { id } = use(params);

  const [blueprint, setBlueprint] = useState<BlueprintWithSections | null>(null);
  const [isLoadingBlueprint, setIsLoadingBlueprint] = useState(true);
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
  const [activeId, setActiveId] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection that prioritizes droppable sections for fields
  const customCollisionDetection = (args: Parameters<typeof pointerWithin>[0]) => {
    // First try pointer-based collision for better drop zone coverage
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // Fallback to closest center
    return closestCenter(args);
  };

  // Handle drag start to track what's being dragged
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Unified drag-drop handler for sections and fields
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Use data attributes to determine drag type
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'field') {
      // Field is being dragged
      if (overType === 'section') {
        // Field → Section (move to different section)
        await handleFieldMoveToSection(active.id as string, over.id as string);
      } else if (overType === 'field') {
        // Field → Field (reorder within same section)
        const oldIndex = selectedSection!.fields.findIndex((field) => field.id === active.id);
        const newIndex = selectedSection!.fields.findIndex((field) => field.id === over.id);
        const reordered = arrayMove(selectedSection!.fields, oldIndex, newIndex).map(
          (field, index) => ({
            ...field,
            order_index: index,
          })
        );
        handleFieldsReorder(reordered);
      }
    } else if (activeType === 'section' && overType === 'section') {
      // Section → Section (reorder sections)
      const oldIndex = blueprint!.sections.findIndex((s) => s.id === active.id);
      const newIndex = blueprint!.sections.findIndex((s) => s.id === over.id);

      const reordered = arrayMove(blueprint!.sections, oldIndex, newIndex).map(
        (section, index) => ({
          ...section,
          order_index: index,
        })
      );

      handleSectionsReorder(reordered);
    }
  };

  // Handle moving a field to a different section
  const handleFieldMoveToSection = async (fieldId: string, targetSectionId: string) => {
    // Find the field being moved
    const sourceSection = blueprint?.sections.find((s) => s.fields.some((f) => f.id === fieldId));
    const field = sourceSection?.fields.find((f) => f.id === fieldId);

    if (!field || !sourceSection) return;

    // Don't move if already in target section
    if (field.section_id === targetSectionId) return;

    // Get target section name for toast
    const targetSection = blueprint?.sections.find((s) => s.id === targetSectionId);

    // Optimistically update state
    setBlueprint((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        sections: prev.sections.map((section) => {
          if (section.id === sourceSection.id) {
            // Remove field from source section
            return {
              ...section,
              fields: section.fields.filter((f) => f.id !== fieldId),
            };
          } else if (section.id === targetSectionId) {
            // Add field to target section at the end
            return {
              ...section,
              fields: [...section.fields, { ...field, section_id: targetSectionId }],
            };
          }
          return section;
        }),
      };
    });

    // Call API to persist the move
    try {
      const response = await fetch(`/api/v1/fields/${fieldId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_id: targetSectionId }),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success(`Field moved to ${targetSection?.title || 'section'}`);
      } else {
        // Revert on error
        toast.error(result.error.message || 'Failed to move field');
        // Refresh blueprint to get accurate state
        const refreshResponse = await fetch(`/api/v1/blueprints/${id}`);
        const refreshResult = await refreshResponse.json();
        if (refreshResult.ok) {
          setBlueprint(refreshResult.data);
        }
      }
    } catch (error) {
      console.error('Failed to move field:', error);
      toast.error('Failed to move field');
      // Refresh blueprint to get accurate state
      try {
        const refreshResponse = await fetch(`/api/v1/blueprints/${id}`);
        const refreshResult = await refreshResponse.json();
        if (refreshResult.ok) {
          setBlueprint(refreshResult.data);
        }
      } catch (refreshError) {
        console.error('Failed to refresh blueprint:', refreshError);
      }
    }
  };

  // Fetch blueprint data
  useEffect(() => {
    const fetchBlueprint = async () => {
      setIsLoadingBlueprint(true);
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
      setIsLoadingBlueprint(false);
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
      console.error('Failed to update blueprint name:', error);
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
      console.error('Failed to publish blueprint:', error);
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
      console.error('Failed to delete section:', error);
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
      console.error('Failed to reorder sections:', error);
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
      console.error('Failed to save field:', error);
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
      console.error('Failed to delete field:', error);
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
      console.error('Failed to reorder fields:', error);
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
        <PageHeader title={name} backHref="/blueprints">
          <Separator orientation="vertical" className="h-8" />
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              className="m-0 border-none bg-transparent p-0 text-xl font-semibold outline-none focus:outline-none"
            />
          ) : (
            <h1
              className="cursor-pointer text-xl font-semibold transition-opacity hover:opacity-70"
              onClick={handleNameClick}
            >
              {name}
            </h1>
          )}
          <div className="ml-auto flex items-center gap-3">
            <Button
              variant={activeTab === 'sections' ? 'default' : 'outline'}
              onClick={() => setActiveTab('sections')}
            >
              <Layout className="h-4 w-4" />
              Sections & Fields
            </Button>
            <Button
              variant={activeTab === 'generators' ? 'default' : 'outline'}
              onClick={() => setActiveTab('generators')}
            >
              <Wand2 className="h-4 w-4" />
              Artifact Generators
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Button onClick={handlePublish} disabled={isPublishing}>
              <Rocket className="h-4 w-4" />
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </PageHeader>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === 'sections' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={customCollisionDetection}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
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
                  isLoading={isLoadingBlueprint}
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
                    isLoading={isLoadingBlueprint}
                  />
                )}
              </div>

              {/* Drag Overlay - smooth cursor following */}
              <DragOverlay>
                {activeId ? (
                  <div className="cursor-grabbing opacity-80">
                    {(() => {
                      // Determine if dragging a section or field
                      const section = blueprint.sections.find((s) => s.id === activeId);
                      if (section) {
                        return (
                          <div className="w-80 rounded-lg border-2 border-primary bg-card p-3 shadow-lg">
                            <div className="font-medium">{section.title}</div>
                            <p className="text-xs text-muted-foreground">
                              {section.fields.length} fields
                            </p>
                          </div>
                        );
                      }

                      // Check if it's a field
                      const field = blueprint.sections
                        .flatMap((s) => s.fields)
                        .find((f) => f.id === activeId);
                      if (field) {
                        return (
                          <div className="rounded-lg border bg-card p-3 shadow-lg">
                            <div className="font-medium">{field.label}</div>
                            <p className="text-xs text-muted-foreground">{field.type}</p>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            /* Generators Tab */
            <div className="flex-1 overflow-y-auto p-6">
              <GeneratorList blueprintId={id} generators={generators} onUpdate={fetchGenerators} />
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
          existingFields={selectedSection?.fields || []}
          open={isFieldModalOpen}
          onOpenChange={setIsFieldModalOpen}
          onSave={handleSaveField}
        />
      )}
    </>
  );
}
