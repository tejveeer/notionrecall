import { useState } from "react";

// Main Quiz Component
export default function Quiz({ questions, quizType }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsQuizComplete(true);
    }
  };

  if (isQuizComplete) {
    return (
      <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-400/20 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-yellow-100 mb-4">
          Quiz Complete!
        </h2>
        <p className="text-yellow-200/80">You have completed all questions.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const renderQuestion = () => {
    switch (quizType) {
      case "mc":
        return (
          <MCQuestion
            question={currentQuestion}
            onNext={handleNextQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />
        );
      case "tf":
        return (
          <TFQuestion
            question={currentQuestion}
            onNext={handleNextQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />
        );
      case "fib":
        return (
          <FIBQuestion
            question={currentQuestion}
            onNext={handleNextQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />
        );
      default:
        return <div>Unknown question type</div>;
    }
  };

  return (
    <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-400/20 rounded-2xl p-8">
      {/* Quiz Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-yellow-100">Quiz</h2>
          <span className="text-yellow-200/70 text-sm">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-yellow-500/20 rounded-full h-3">
          <div
            className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Question */}
      {renderQuestion()}
    </div>
  );
}

// Multiple Choice Question Component
function MCQuestion({ question, onNext, questionNumber, totalQuestions }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowResult(true);
  };

  const handleNext = () => {
    onNext();
    // Reset state for next question
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowResult(false);
  };

  return (
    <div>
      {/* Question */}
      <div className="mb-5">
        <h3 className="text-lg font-medium text-white mb-5">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !isSubmitted && setSelectedOption(option)}
              disabled={isSubmitted}
              className={`w-full p-4 text-left rounded-lg border transition-all duration-200 ${
                showResult
                  ? option === question.answer
                    ? "bg-green-500/20 border-green-400/50 text-green-100"
                    : option === selectedOption && option !== question.answer
                      ? "bg-red-500/20 border-red-400/50 text-red-100"
                      : "bg-blue-500/5 border-blue-400/20 text-blue-200/70"
                  : selectedOption === option
                    ? "bg-blue-500/20 border-blue-400/50 text-blue-100"
                    : "bg-blue-500/5 border-blue-400/20 text-blue-200/70 hover:bg-blue-500/10"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Submit/Next Button */}
      <div className="flex justify-center">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
              selectedOption
                ? "bg-blue-500/30 hover:bg-blue-500/40 text-blue-100 border border-blue-400/40"
                : "bg-blue-500/10 cursor-not-allowed text-blue-200/50 border border-blue-400/20"
            }`}
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-100 border border-yellow-400/40 rounded-lg font-medium transition-all duration-200"
          >
            {questionNumber === totalQuestions
              ? "Finish Quiz"
              : "Next Question"}
          </button>
        )}
      </div>
    </div>
  );
}

// True/False Question Component
function TFQuestion({ question, onNext, questionNumber, totalQuestions }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const options = ["True", "False"];

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowResult(true);
  };

  const handleNext = () => {
    onNext();
    // Reset state for next question
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowResult(false);
  };

  return (
    <div>
      {/* Question */}
      <div className="mb-5">
        <h3 className="text-lg font-medium text-white mb-5">
          {question.question}
        </h3>

        {/* True/False Options */}
        <div className="grid grid-cols-2 gap-4">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => !isSubmitted && setSelectedOption(option)}
              disabled={isSubmitted}
              className={`p-4 rounded-lg border transition-all duration-200 font-medium ${
                showResult
                  ? option === question.answer
                    ? "bg-green-500/20 border-green-400/50 text-green-100"
                    : option === selectedOption && option !== question.answer
                      ? "bg-red-500/20 border-red-400/50 text-red-100"
                      : "bg-blue-500/5 border-blue-400/20 text-blue-200/70"
                  : selectedOption === option
                    ? "bg-blue-500/20 border-blue-400/50 text-blue-100"
                    : "bg-blue-500/5 border-blue-400/20 text-blue-200/70 hover:bg-blue-500/10"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Submit/Next Button */}
      <div className="flex justify-center">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
              selectedOption
                ? "bg-blue-500/30 hover:bg-blue-500/40 text-blue-100 border border-blue-400/40"
                : "bg-blue-500/10 cursor-not-allowed text-blue-200/50 border border-blue-400/20"
            }`}
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-100 border border-yellow-400/40 rounded-lg font-medium transition-all duration-200"
          >
            {questionNumber === totalQuestions
              ? "Finish Quiz"
              : "Next Question"}
          </button>
        )}
      </div>
    </div>
  );
}

// Fill in the Blank Question Component
function FIBQuestion({ question, onNext, questionNumber, totalQuestions }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Parse the question to find blanks and create dropdown options
  const parseQuestion = () => {
    const parts = question.question.split("_____");
    const blanks = question.question.match(/_____/g) || [];
    return { parts, blankCount: blanks.length };
  };

  const { parts, blankCount } = parseQuestion();

  const handleDropdownChange = (blankIndex, value) => {
    if (!isSubmitted) {
      setSelectedAnswers((prev) => ({
        ...prev,
        [blankIndex]: value,
      }));
    }
  };

  const allBlanksSelected =
    Object.keys(selectedAnswers).length === blankCount &&
    Object.values(selectedAnswers).every((answer) => answer !== "");

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowResult(true);
  };

  const handleNext = () => {
    onNext();
    // Reset state for next question
    setSelectedAnswers({});
    setIsSubmitted(false);
    setShowResult(false);
  };

  const isCorrectAnswer = (blankIndex) => {
    return selectedAnswers[blankIndex] === question.answers[blankIndex];
  };

  return (
    <div>
      {/* Question with Fill-in-the-Blanks */}
      <div className="mb-6">
        <div className="text-white text-lg leading-relaxed">
          {parts.map((part, index) => (
            <span key={index}>
              {part}
              {index < parts.length - 1 && (
                <select
                  value={selectedAnswers[index] || ""}
                  onChange={(e) => handleDropdownChange(index, e.target.value)}
                  disabled={isSubmitted}
                  className={`mx-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                    showResult
                      ? isCorrectAnswer(index)
                        ? "bg-green-500/20 border-green-400/50 text-green-100"
                        : "bg-red-500/20 border-red-400/50 text-red-100"
                      : selectedAnswers[index]
                        ? "bg-blue-500/20 border-blue-400/50 text-blue-100"
                        : "bg-blue-500/10 border-blue-400/30 text-blue-200"
                  }`}
                >
                  <option value="">Select...</option>
                  {question.options.map((option, optIndex) => (
                    <option
                      key={optIndex}
                      value={option}
                      className="bg-blue-900 text-blue-100"
                    >
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </span>
          ))}
        </div>

        {/* Show correct answers when submitted and there are wrong answers */}
        {showResult &&
          Object.keys(selectedAnswers).some(
            (index) => !isCorrectAnswer(parseInt(index)),
          ) && (
            <div className="mt-4 bg-green-500/10 backdrop-blur-md border border-green-400/20 rounded-lg p-4">
              <p className="text-green-100">
                Correct answers: {question.answers.join(", ")}
              </p>
            </div>
          )}
      </div>

      {/* Submit/Next Button */}
      <div className="flex justify-center">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allBlanksSelected}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
              allBlanksSelected
                ? "bg-blue-500/30 hover:bg-blue-500/40 text-blue-100 border border-blue-400/40"
                : "bg-blue-500/10 cursor-not-allowed text-blue-200/50 border border-blue-400/20"
            }`}
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-100 border border-yellow-400/40 rounded-lg font-medium transition-all duration-200"
          >
            {questionNumber === totalQuestions
              ? "Finish Quiz"
              : "Next Question"}
          </button>
        )}
      </div>
    </div>
  );
}
