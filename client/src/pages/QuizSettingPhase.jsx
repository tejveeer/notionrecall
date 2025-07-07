import { useState } from "react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";

export default function QuizSettingPhase({ nextPhase, setQuizData }) {
  const [quizType, setQuizType] = useState("mc");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [freestyle, setFreestyle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quizTypes = [
    { value: "mc", label: "Multiple Choice" },
    { value: "tf", label: "True/False" },
    { value: "fib", label: "Fill in the Blank" },
  ];

  const handleNumberChange = (increment) => {
    setNumberOfQuestions((prev) => {
      const newValue = prev + increment;
      return Math.min(Math.max(newValue, 5), 10);
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    const quizSettings = {
      quizType,
      numberOfQuestions,
      freestyle,
    };

    try {
      const response = await fetch("http://localhost:3000/get-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizSettings),
      });

      const data = await response.json();

      if (data.success) {
        nextPhase(3);
        setQuizData({
          questions: data.questions,
          quizType: quizType,
        });
      } else {
        console.log("Failed to get quiz questions");
      }
    } catch (error) {
      console.error("Error submitting quiz settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 rounded-2xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-amber-100 mb-4 sm:mb-6">
        Quiz Settings
      </h2>

      <div className="space-y-6">
        {/* Quiz Type Selection */}
        <div>
          <label className="block text-amber-200 font-medium mb-3">
            Quiz Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quizTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setQuizType(type.value)}
                className={`p-3 cursor-pointer rounded-lg border transition-all duration-200 text-sm font-medium ${
                  quizType === type.value
                    ? "bg-amber-400/20 border-amber-300/50 text-amber-100"
                    : "bg-amber-500/5 border-amber-400/20 text-amber-200/70 hover:bg-amber-400/10 hover:border-amber-300/30"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Number of Questions */}
        <div>
          <label className="block text-amber-200 font-medium mb-3">
            Number of Questions
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNumberChange(-1)}
              disabled={numberOfQuestions <= 5}
              className={`w-10 h-10 rounded-lg border transition-all duration-200 font-bold ${
                numberOfQuestions <= 5
                  ? "bg-amber-500/5 border-amber-400/20 text-amber-200/30 cursor-not-allowed"
                  : "bg-amber-400/10 cursor-pointer border-amber-300/30 text-amber-200 hover:bg-amber-400/20 hover:border-amber-300/50"
              }`}
            >
              −
            </button>

            <div className="bg-amber-400/10 border border-amber-300/30 rounded-lg px-4 py-2 min-w-[60px] text-center">
              <span className="text-amber-100 font-semibold text-lg">
                {numberOfQuestions}
              </span>
            </div>

            <button
              onClick={() => handleNumberChange(1)}
              disabled={numberOfQuestions >= 10}
              className={`w-10 h-10 rounded-lg border transition-all duration-200 font-bold ${
                numberOfQuestions >= 10
                  ? "bg-amber-500/5 border-amber-400/20 text-amber-200/30 cursor-not-allowed"
                  : "bg-amber-400/10 cursor-pointer border-amber-300/30 text-amber-200 hover:bg-amber-400/20 hover:border-amber-300/50"
              }`}
            >
              +
            </button>

            <span className="text-amber-200/70 text-sm ml-2">
              (5-10 questions)
            </span>
          </div>
        </div>

        {/* Freestyle Option */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={freestyle}
              onCheckedChange={setFreestyle}
              className="rounded cursor-pointer border-amber-300/30 data-[state=checked]:bg-amber-400/20 data-[state=checked]:border-amber-300/50"
            />
            <div>
              <span className="text-amber-200 font-medium">Freestyle Mode</span>
              <p className="text-amber-200/60 text-sm mt-1">
                Allow open-ended questions and creative responses
              </p>
            </div>
          </label>
        </div>

        {/* Settings Summary */}
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 mt-6">
          <h3 className="text-amber-200 font-medium mb-2">Quiz Preview</h3>
          <div className="space-y-1 text-sm">
            <p className="text-amber-200/80">
              <span className="font-medium">Type:</span>{" "}
              {quizTypes.find((t) => t.value === quizType)?.label}
            </p>
            <p className="text-amber-200/80">
              <span className="font-medium">Questions:</span>{" "}
              {numberOfQuestions}
            </p>
            <p className="text-amber-200/80">
              <span className="font-medium">Freestyle:</span>{" "}
              {freestyle ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-8 py-3 cursor-pointer rounded-lg font-medium transition-all duration-200 ${
              isSubmitting
                ? "bg-amber-500/20 cursor-not-allowed text-amber-200/50 border border-amber-400/20"
                : "bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 border border-amber-400/40 hover:border-amber-400/60"
            }`}
          >
            {isSubmitting ? "Creating Quiz..." : "Create Quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
}
