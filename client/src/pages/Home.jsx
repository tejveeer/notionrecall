import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const [headings, setHeadings] = useState(null);
  const [phase, setPhase] = useState(0);
  const [headingSelections, setHeadingSelections] = useState({
    selections: new Set(),
    deselections: new Set(),
  });

  const getCurrentPhase = () => {
    if (phase == 0) {
      return (
        <SearchPhase
          setHeadings={setHeadings}
          setHeadingSelections={setHeadingSelections}
          setPhase={setPhase}
        />
      );
    } else if (phase == 1) {
      return (
        <SelectionPhase
          headings={headings}
          headingSelections={headingSelections}
          setHeadingSelections={setHeadingSelections}
        />
      );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      <div className="max-w-2xl w-full flex flex-col mt-12 px-4">
        <h1 className="flex text-3xl font-bold text-white mb-4">
          Notion Recall
        </h1>
        {getCurrentPhase()}
      </div>
    </div>
  );
}

function SearchPhase({ setHeadings, setHeadingSelections, setPhase }) {
  const [pageName, setPageName] = useState("");
  const [response, setResponse] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const handleSubmit = async () => {
    setIsButtonDisabled(true);
    setHeadings(null);
    setHeadingSelections({
      selections: new Set(),
      deselections: new Set(),
    });

    try {
      const res = await fetch("http://localhost:3000/fetch-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageName }),
      });
      console.log("made the request");
      const data = await res.json();

      if (data.success) {
        setHeadings(data.headings);
        setResponse("Page fetched successfully!");
        setPhase((prev) => prev + 1);
      } else {
        setHeadings(null);
        setResponse(data.message || "Failed to fetch page");
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      setResponse("Error fetching page");
      setHeadings(null);
    } finally {
      setIsButtonDisabled(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Enter page name"
          value={pageName}
          onChange={(e) => {
            setResponse("");
            setPageName(e.target.value);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/50"
        />
        <Button
          onClick={handleSubmit}
          disabled={isButtonDisabled}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            isButtonDisabled
              ? "bg-white/20 cursor-not-allowed text-white/50"
              : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
          }`}
        >
          {isButtonDisabled ? "Fetching..." : "Fetch Page"}
        </Button>
      </div>
      {response && (
        <div className="p-4 mt-6 bg-white/10 border border-white/20 rounded-xl">
          <p className="text-white">
            <span className="font-semibold text-white/90">Response:</span>{" "}
            <span className="text-white/80">{response}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function SelectionPhase({ headings, headingSelections, setHeadingSelections }) {
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
    const { selections, deselections } = headingSelections;
    const sanitized = sanitizeHeadingSelections(selections, deselections);
    console.log("Sanitized Selections:", sanitized.selections);
    console.log("Sanitized Deselections:", sanitized.deselections);

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
      } else {
        console.log("Unsuccessful fetch");
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      setResponse("Error fetching page");
    }
  };

  return (
    <>
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
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-center">
        <Button
          onClick={handleSelectedHeadingSubmission}
          className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg transition-colors duration-200"
        >
          Submit Selected
        </Button>
      </div>
    </>
  );
}

function Heading({
  id,
  text,
  children,
  selectHeading,
  deselectHeading,
  isIdSelected,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
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
            className={`transformtransition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            size={25}
          />
        </button>
      )}
      <Card className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-colors duration-200">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
          <Checkbox
            checked={isChecked}
            onCheckedChange={handleCheckboxChange}
            className="rounded border-white/30 data-[state=checked]:bg-white/20 data-[state=checked]:border-white/50"
          />
          <CardTitle className="text-lg font-medium text-white flex-1">
            {text}
          </CardTitle>
        </CardHeader>
        {isExpanded && children?.length > 0 && (
          <CardContent className="pt-0 pb-4 px-4">
            <div className="pl-4 border-l-2 border-white/20 space-y-3">
              {children.map((child, index) => (
                <Heading
                  key={index}
                  id={child.id}
                  text={child.text}
                  children={child.children}
                  selectHeading={selectHeading}
                  deselectHeading={deselectHeading}
                  isIdSelected={isIdSelected}
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
