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
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(reader.result, "text/xml");
    const paragraphs = xmlDoc.getElementsByTagName("p");
    const convertedText = [];

    Array.from(paragraphs).forEach((p) => {
      let htmlContent = p.innerHTML.trim(); // Use innerHTML to capture <br xmlns="..."/>

      // Replace <br xmlns="..."/> with a custom marker (e.g., "<LINE_BREAK>")
      const cleanedContent = htmlContent.replace(
        /<br[^>]*\/?>/gi,
        "<LINE_BREAK>"
      );
      const lines = cleanedContent
        .split("<LINE_BREAK>")
        .map((line) => line.trim());

      console.log(lines); // Debug: Log HTML content for verification
      if (lines.length === 2) {
        // Apply rules for combining lines
        const isArabic = /[\u0600-\u06FF]/.test(lines[0]); // Check if the text is Arabic
        if (
          (isArabic && lines[0].includes("-")) || // Arabic: Hyphen at the end of the first line
          (!isArabic && lines[1].includes("-")) || // English: Hyphen at the beginning of the second line
          lines[0].endsWith(".") // Rule: Do not combine if the first line ends with a period
        ) {
          convertedText.push(lines[0]);
          convertedText.push(lines[1]);
        } else {
          convertedText.push(`${lines[0]} ${lines[1]}`);
        }
      } else {
        // If it's just a single line, push it directly
        convertedText.push(lines[0]);
      }

      // Add a blank line after each paragraph
      convertedText.push("");
    });

    // Final output with spaces between lines
    const finalText = convertedText.join("\n");
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
