document.getElementById("convertButton").addEventListener("click", () => {
  const fileInput = document.getElementById("fileInput");
  const outputText = document.getElementById("outputText");
  const downloadLink = document.getElementById("downloadLink");

  if (!fileInput.files.length) {
    alert("Please select a file!");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function () {
    const content = reader.result.trim();
    let combinedText = "";

    // Detect file type (XML or SRT) based on content
    if (content.startsWith("<?xml")) {
      // Handle XML file
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, "text/xml");
      const body = xmlDoc.getElementsByTagName("body")[0];

      if (!body) {
        alert("No body tag found in the XML file!");
        return;
      }

      // Combine all text from <p> tags into a single string
      const paragraphs = Array.from(body.getElementsByTagName("p"));
      combinedText = paragraphs
        .map((p) => {
          let innerHTML = p.innerHTML.trim();
          // Replace <br xmlns="http://www.w3.org/ns/ttml"/> with a space
          innerHTML = innerHTML.replace(/<br[^>]*\/?>/gi, " ");
          return innerHTML;
        })
        .join(" <LINE_BREAK> ");
    } else if (
      content.match(
        /^\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/m
      )
    ) {
      // Handle SRT file
      const srtBlocks = content.split(/\n\s*\n/); // Split blocks of subtitles
      combinedText = srtBlocks
        .map((block) => {
          const lines = block.split("\n").slice(2); // Remove the index and timestamp lines
          return lines.join(" ").trim(); // Combine remaining subtitle lines
        })
        .join(" <LINE_BREAK> ");
    } else {
      alert("Unsupported file format! Please upload an XML or SRT file.");
      return;
    }

    const sentences = [];
    let tempLine = "";

    // Process the combined text to split into sentences based on the rules
    combinedText.split("<LINE_BREAK>").forEach((chunk) => {
      const line = chunk.trim();
      if (!line) return;

      if (tempLine) {
        if (
          tempLine.endsWith(".") || // Rule: Create a new line if the previous text ends with a period
          tempLine.endsWith("؟") || // Rule: Create a new line if the previous text ends with a question mark
          (tempLine.startsWith("-") && line.startsWith("-")) // Rule: Separate hyphenated lines
        ) {
          sentences.push(tempLine.trim());
          tempLine = line; // Start a new sentence
        } else {
          tempLine += ` ${line}`; // Combine with a space
        }
      } else {
        tempLine = line; // Initialize the tempLine
      }
    });

    // Push the last line
    if (tempLine) {
      sentences.push(tempLine.trim());
    }

    // Post-process sentences to handle hyphen groups
    const processedSentences = [];
    sentences.forEach((sentence) => {
      if (sentence.startsWith("-")) {
        // Split hyphenated sentences into separate lines but group them as a single entity
        const hyphenLines = sentence.split(/(?=- )/).map((line) => line.trim());
        processedSentences.push(hyphenLines.join("\n"));
      } else {
        processedSentences.push(sentence);
      }
    });

    // Format the output: Join sentences with blank lines between them
    const finalText = processedSentences.join("\n\n");
    outputText.value = finalText;

    // Generate downloadable TXT file
    if (finalText) {
      const blob = new Blob([finalText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = "converted.txt";
      downloadLink.style.display = "inline-block";
      downloadLink.textContent = "Download TXT File";
    } else {
      alert("No valid text content found in the file!");
      downloadLink.style.display = "none";
    }
  };

  reader.readAsText(file);
});
