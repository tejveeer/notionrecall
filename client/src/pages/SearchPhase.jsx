

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
