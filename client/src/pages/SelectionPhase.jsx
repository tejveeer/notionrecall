import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { ChevronRight } from "lucide-react";

export default function SelectionPhase({
  headings,
  headingSelections,
  setHeadingSelections,
  nextPhase,
  resetPhase,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initializeExpansionStatus = (headings) => {
    const status = {};
    const traverse = (node) => {
      status[node.id] = false;
      node.children.forEach(traverse);
    };
    headings.forEach(traverse);
    return status;
  };

  const initialExpansionStatus = initializeExpansionStatus(headings);
  const [headingExpansionStatus, setHeadingExpansionStatus] = useState(
    initialExpansionStatus,
  );

  const setHeadingExpansion = (id, isExpanded) => {
    const findParentId = (id) => id.split(".").slice(0, -1).join(".");
    const findSiblings = (parentId) => {
      const parent = headings.find((node) => node.id === parentId);
      return parent ? parent.children.map((child) => child.id) : [];
    };

    if (isExpanded) {
      const newStatus = { ...initialExpansionStatus };
      newStatus[id] = true;

      const parentId = findParentId(id);
      if (parentId) {
        newStatus[parentId] = true; // Keep the parent expanded
        const siblings = findSiblings(parentId);
        siblings.forEach((siblingId) => {
          if (siblingId !== id) newStatus[siblingId] = false; // Close siblings
        });
      } else {
        // If no parent, handle as a top-level element
        const immediateChildren =
          headings.find((node) => node.id === id)?.children || [];
        immediateChildren.forEach((child) => {
          newStatus[child.id] = false; // Close all children
        });
      }

      setHeadingExpansionStatus(newStatus);
    } else {
      const newStatus = { ...initialExpansionStatus };
      newStatus[id] = false;

      const parentId = findParentId(id);
      if (parentId) {
        const siblings = findSiblings(parentId);
        siblings.forEach((siblingId) => {
          newStatus[siblingId] = false; // Close siblings
        });
      }

      setHeadingExpansionStatus(newStatus);
    }
  };

  const getIdOfHeadingChildren = (heading) => {
    const ids = [];
    const traverse = (node) => {
      ids.push(node.id);
      node.children.forEach(traverse);
    };
    traverse(heading);
    return ids;
  };

  const selectHeading = (id) => {
    const ids = getIdOfHeadingChildren(id);
    setHeadingSelections((prev) => ({
      selections: new Set([...prev.selections, ...ids]),
      deselections: new Set(
        [...prev.deselections].filter((id) => !ids.includes(id)),
      ),
    }));
  };

  const deselectHeading = (id) => {
    const ids = getIdOfHeadingChildren(id);
    setHeadingSelections((prev) => ({
      deselections: new Set([...prev.deselections, ...ids]),
      selections: new Set(
        [...prev.selections].filter((id) => !ids.includes(id)),
      ),
    }));
  };

  const isIdSelected = (id) => {
    return (
      headingSelections.selections.has(id) &&
      !headingSelections.deselections.has(id)
    );
  };

  const handleSelectedHeadingSubmission = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    resetPhase(1);
    const { selections, deselections } = headingSelections;
    const sanitized = sanitizeHeadingSelections(selections, deselections);

    try {
      const res = await fetch("http://localhost:3000/get-heading-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptList: sanitized.selections,
          rejectList: sanitized.deselections,
        }),
      });
      const data = await res.json();

      if (data.success) {
        console.log(data.content);
        nextPhase(2);
      } else {
        console.log("Unsuccessful fetch");
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isSubmitting) {
      handleSelectedHeadingSubmission();
    }
  };

  return (
    <div onKeyDown={handleKeyDown} tabIndex={-1}>
      {headings && (
        <div className="mb-6">
          <div className="space-y-4">
            {headings.map((node, index) => (
              <Heading
                key={index}
                id={node.id}
                text={node.text}
                children={node.children}
                selectHeading={selectHeading}
                deselectHeading={deselectHeading}
                isIdSelected={isIdSelected}
                headingExpansionStatus={headingExpansionStatus}
                isExpanded={headingExpansionStatus[node.id]}
                setHeadingExpansion={setHeadingExpansion}
                setIsExpanded={(isExpanded) =>
                  setHeadingExpansion(node.id, isExpanded)
                }
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-center">
        <Button
          onClick={handleSelectedHeadingSubmission}
          disabled={isSubmitting}
          className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
            isSubmitting
              ? "bg-yellow-500/10 cursor-not-allowed text-yellow-200/50 border border-yellow-400/20"
              : "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-100 border border-yellow-400/30"
          }`}
        >
          {isSubmitting ? "Fetching..." : "Submit Selected"}
        </Button>
      </div>
    </div>
  );
}

function Heading({
  id,
  text,
  children,
  selectHeading,
  deselectHeading,
  setIsExpanded,
  headingExpansionStatus,
  setHeadingExpansion,
  isIdSelected,
  isExpanded,
}) {
  const isChecked = isIdSelected(id);

  const handleCheckboxChange = () => {
    const newValue = !isChecked;
    const map = { id, children };
    if (newValue) {
      selectHeading(map);
    } else {
      deselectHeading(map);
    }
  };

  return (
    <div className="flex items-start gap-3 mb-4">
      {children?.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors mt-4.5 text-white/70 hover:text-white"
        >
          <ChevronRight
            className={`transform transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            size={25}
          />
        </button>
      )}
      <Card className="flex-1 bg-yellow-500/10 backdrop-blur-md border border-yellow-400/20 hover:bg-yellow-500/15 transition-colors duration-200">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
          <Checkbox
            checked={isChecked}
            onCheckedChange={handleCheckboxChange}
            className="rounded border-yellow-400/30 data-[state=checked]:bg-yellow-500/20 data-[state=checked]:border-yellow-400/50"
          />
          <CardTitle className="text-lg font-medium text-yellow-100 flex-1">
            {text}
          </CardTitle>
        </CardHeader>
        {isExpanded && children?.length > 0 && (
          <CardContent className="pt-0 pb-4 px-4">
            <div className="pl-4 border-l-2 border-yellow-400/20 space-y-3">
              {children.map((child, index) => (
                <Heading
                  key={index}
                  id={child.id}
                  text={child.text}
                  children={child.children}
                  selectHeading={selectHeading}
                  deselectHeading={deselectHeading}
                  isIdSelected={isIdSelected}
                  headingExpansionStatus={headingExpansionStatus}
                  setHeadingExpansion={setHeadingExpansion}
                  isExpanded={headingExpansionStatus[child.id]}
                  setIsExpanded={(isExpanded) =>
                    setHeadingExpansion(child.id, isExpanded)
                  }
                />
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// First sanitization: Remove deselections whose parents are not selected
function removeDeselectionsWithoutSelectedParents(selections, deselections) {
  const sanitizedDeselections = new Set(
    [...deselections].filter((id) => {
      const parentId = id.split(".").slice(0, -1).join(".");
      return selections.has(parentId);
    }),
  );
  return sanitizedDeselections;
}

// Second sanitization: Remove child elements if their parent is in the set
function removeChildElementsWithSelectedParents(set) {
  const sanitizedSet = new Set(
    [...set].filter((id) => {
      const parentId = id.split(".").slice(0, -1).join(".");
      return !set.has(parentId);
    }),
  );
  return sanitizedSet;
}

// Sanitizes the selections and deselections sets
function sanitizeHeadingSelections(selections, deselections) {
  const sanitizedDeselections = removeDeselectionsWithoutSelectedParents(
    selections,
    deselections,
  );
  const sanitizedSelections =
    removeChildElementsWithSelectedParents(selections);
  const finalDeselections = removeChildElementsWithSelectedParents(
    sanitizedDeselections,
  );

  return {
    selections: Array.from(sanitizedSelections),
    deselections: Array.from(finalDeselections),
  };
}
