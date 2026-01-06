"use client";

import { useState } from "react";
import type { ArticulationTemplate, MeasurementCadence } from "@libs/memory";
import { TemplatePicker } from "./TemplatePicker";
import { NewVariableForm } from "./NewVariableForm";

interface NewVariableWithTemplatesProps {
  templates: readonly ArticulationTemplate[];
  nodeTypes: readonly string[];
  measurementCadences: readonly string[];
}

/**
 * Initial values for the form, derived from a template or empty for scratch.
 */
export interface FormInitialValues {
  name: string;
  description: string;
  preferredRange: string;
  measurementCadence: MeasurementCadence | "";
  /** Whether these values came from a template (shows 'customize this' cues) */
  fromTemplate: boolean;
}

/**
 * Wrapper component that combines template selection with the variable form.
 * Manages template selection state and derives initial form values.
 */
export function NewVariableWithTemplates({
  templates,
  nodeTypes,
  measurementCadences,
}: NewVariableWithTemplatesProps): React.ReactNode {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ArticulationTemplate | null>(null);

  // Derive initial values from selected template
  const initialValues: FormInitialValues = selectedTemplate
    ? {
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        preferredRange: selectedTemplate.suggestedPreferredRange,
        measurementCadence: selectedTemplate.suggestedCadence,
        fromTemplate: true,
      }
    : {
        name: "",
        description: "",
        preferredRange: "",
        measurementCadence: "",
        fromTemplate: false,
      };

  return (
    <>
      <TemplatePicker
        templates={templates}
        selectedId={selectedTemplate?.id ?? null}
        onSelect={setSelectedTemplate}
      />

      {selectedTemplate && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: "4px",
            fontSize: "0.75rem",
            color: "#92400e",
            marginBottom: "1.5rem",
          }}
        >
          Starting from template — adjust the preferred range for YOUR situation
        </div>
      )}

      <NewVariableForm
        key={selectedTemplate?.id ?? "scratch"}
        nodeTypes={nodeTypes}
        measurementCadences={measurementCadences}
        initialValues={initialValues}
      />
    </>
  );
}

