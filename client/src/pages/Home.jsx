import { useState } from "react";
import SearchPhase from "./SearchPhase";
import SelectionPhase from "./SelectionPhase";
import { CardHeader, Card } from "@/components/ui/card";

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
    <div className="flex text-white flex-col justify-center items-center min-h-screen w-full">
      <div className="max-w-2xl w-full flex flex-col mt-12 px-4">
        <h1 className="flex text-3xl font-bold text-white mb-4">
          Notion Recall
        </h1>
        {getCurrentPhase()}
      </div>
      <div className="mt-6 h-15 px-4 max-w-2xl w-full flex justify-between">
        <Card
          className="bg-blue-500/20 w-30 mr-0 backdrop-blur-md border border-blue-400/30 rounded-lg p-4 cursor-pointer hover:bg-blue-500/30 hover:border-blue-400/50 transition-all duration-200"
          onClick={() => setPhase((prev) => Math.max(prev - 1, 0))}
        >
          <CardHeader className="text-center text-blue-200 sm:px-0 font-semibold">
            Previous
          </CardHeader>
        </Card>
        <Card
          className="bg-blue-500/20 w-30 mr-0 backdrop-blur-md border border-blue-400/30 rounded-lg p-4 cursor-pointer hover:bg-blue-500/30 hover:border-blue-400/50 transition-all duration-200"
          onClick={() => setPhase((prev) => prev + 1)}
        >
          <CardHeader className="text-center text-blue-200 sm:px-0 font-semibold">
            Next
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
