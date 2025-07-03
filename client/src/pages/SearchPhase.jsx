import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export default function SearchPhase({
  setHeadings,
  setHeadingSelections,
  setPhase,
}) {
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
    <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-400/20 rounded-2xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Enter page name"
          value={pageName}
          onChange={(e) => {
            setResponse("");
            setPageName(e.target.value);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="flex-1 bg-yellow-500/10 border-yellow-400/30 text-yellow-100 placeholder:text-yellow-200/50 focus:border-yellow-400/50"
        />
        <Button
          onClick={handleSubmit}
          disabled={isButtonDisabled}
          className={`px-4 py-2 cursor-pointer rounded-lg transition-colors duration-200 ${
            isButtonDisabled
              ? "bg-yellow-500/20 cursor-not-allowed text-yellow-200/50"
              : "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-100 border border-yellow-400/30"
          }`}
        >
          {isButtonDisabled ? "Fetching..." : "Fetch Page"}
        </Button>
      </div>
      {response && (
        <div className="p-4 mt-6 bg-yellow-500/10 border border-yellow-400/20 rounded-xl">
          <p className="text-yellow-100">
            <span className="font-semibold text-yellow-100/90">Response:</span>{" "}
            <span className="text-yellow-100/80">{response}</span>
          </p>
        </div>
      )}
    </div>
  );
}
