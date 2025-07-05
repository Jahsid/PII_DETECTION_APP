import { useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [text, setText] = useState("");
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({});
  const [riskLevel, setRiskLevel] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [redactedText, setRedactedText] = useState("");

  const detectPII = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/detect-pii", { text });
      setResults(response.data);
      generateSummary(response.data);
      estimateRisk(response.data);
      setRedactedText(""); // Reset redacted text on new detection
    } catch (error) {
      console.error(error);
      alert("Error detecting PII");
    }
    setLoading(false);
  };

  const generateSummary = (data) => {
    const counts = {};
    data.forEach((item) => {
      counts[item.entity_type] = (counts[item.entity_type] || 0) + 1;
    });
    setSummary(counts);
  };

  const estimateRisk = (data) => {
    let score = 0;
    data.forEach((item) => {
      switch (item.entity_type) {
        case "EMAIL_ADDRESS":
        case "PHONE_NUMBER":
        case "PERSON":
          score += 1;
          break;
        case "CREDIT_CARD":
        case "US_SSN":
        case "US_BANK_NUMBER":
        case "PASSPORT":
          score += 3;
          break;
        default:
          score += 0.5;
      }
    });

    if (score >= 6) {
      setRiskLevel("⚠️ High");
      setSuggestion("⚠️ High risk detected. Immediately review the content and redact sensitive information.");
    } else if (score >= 3) {
      setRiskLevel("⚠️ Medium");
      setSuggestion("⚠️ Medium risk. Consider masking or redacting PII before sharing.");
    } else if (score > 0) {
      setRiskLevel("✅ Low");
      setSuggestion("✅ Low risk. Review detected PII to ensure compliance.");
    } else {
      setRiskLevel("✅ No Risk Detected");
      setSuggestion("✅ No PII detected. You can safely share the content.");
    }
  };

  const getHighlightedText = () => {
    if (!results.length) return text;

    const sortedResults = [...results].sort((a, b) => a.start - b.start);
    const parts = [];
    let lastIndex = 0;

    sortedResults.forEach((item, idx) => {
      if (item.start < lastIndex) return;
      parts.push(text.substring(lastIndex, item.start));
      parts.push(
        <span key={idx} className="highlight" title={item.entity_type}>
          {text.substring(item.start, item.end)}
        </span>
      );
      lastIndex = item.end;
    });

    parts.push(text.substring(lastIndex));
    return parts;
  };

  const redactText = () => {
    if (!results.length) return;

    const sortedResults = [...results].sort((a, b) => a.start - b.start);
    let redacted = "";
    let lastIndex = 0;

    sortedResults.forEach((item) => {
      if (item.start < lastIndex) return;
      redacted += text.substring(lastIndex, item.start);
      redacted += "[REDACTED]";
      lastIndex = item.end;
    });

    redacted += text.substring(lastIndex);
    setRedactedText(redacted);
  };

  return (
    <div className="container">
      <h1>🔍 PII Detection Tool</h1>

      <textarea
        rows="6"
        cols="60"
        placeholder="Enter text to analyze..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      ></textarea>
      <br /><br />

      <button onClick={detectPII} disabled={loading}>
        {loading ? "Analyzing..." : "Detect PII"}
      </button>

      {results.length > 0 && (
        <div className="results">
          <h2>Detected PII:</h2>

          <p className="highlighted-text">{getHighlightedText()}</p>

          {/* Redact Button */}
          <button onClick={redactText} className="redact-btn">
            Redact PII
          </button>

          {/* Show Redacted Text */}
          {redactedText && (
            <div className="redacted-section">
              <h3>Redacted Text:</h3>
              <p className="redacted-text">{redactedText}</p>
            </div>
          )}

          <h3>Estimated Risk Level: {riskLevel}</h3>
          <p><strong>Suggestion:</strong> {suggestion}</p>

          <div>
            <h3>PII Summary:</h3>
            <ul>
              {Object.entries(summary).map(([type, count]) => (
                <li key={type}>{type}: {count}</li>
              ))}
            </ul>
          </div>

          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, index) => (
                <tr key={index}>
                  <td>{item.entity_type}</td>
                  <td>{item.start}</td>
                  <td>{item.end}</td>
                  <td>{item.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
