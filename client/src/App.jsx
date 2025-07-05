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

  const detectPII = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/detect-pii", { text });
      setResults(response.data);
      generateSummary(response.data);
      estimateRisk(response.data);
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
      if (item.start < lastIndex) {
        // Overlapping entity, skip
        return;
      }
      parts.push(text.substring(lastIndex, item.start));
      parts.push(
        <span
          key={idx}
          className="highlight"
          title={item.entity_type}
        >
          {text.substring(item.start, item.end)}
        </span>
      );
      lastIndex = item.end;
    });

    parts.push(text.substring(lastIndex));
    return parts;
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

          {/* Highlighted Text */}
          <p className="highlighted-text">{getHighlightedText()}</p>

          {/* Risk Level */}
          <h3>Estimated Risk Level: {riskLevel}</h3>

          {/* Suggestion */}
          <p><strong>Suggestion:</strong> {suggestion}</p>

          {/* Summary Section */}
          <div>
            <h3>PII Summary:</h3>
            <ul>
              {Object.entries(summary).map(([type, count]) => (
                <li key={type}>
                  {type}: {count}
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Results Table */}
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
