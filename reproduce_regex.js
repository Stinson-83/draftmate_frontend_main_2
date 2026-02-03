
const htmlContent = `
<p>Here is some text with a broken placeholder.</p>
<span class="variable">[Start of placeholder</span>
<p>Some intervening HTML content <span style="color: red">inside</span>.</p>
<span class="variable">End of placeholder]</span>
<p>Another valid placeholder [VALID_ONE]</p>
`;

const dangerousRegex = /\[([^\]]+)\]/g;
const safeRegex = /\[([^\]<>]+)\]/g;

console.log("Testing Dangerous Regex:");
let match;
while ((match = dangerousRegex.exec(htmlContent)) !== null) {
    console.log(`Found match: "${match[1]}"`);
}

console.log("\nTesting Safe Regex:");
while ((match = safeRegex.exec(htmlContent)) !== null) {
    console.log(`Found match: "${match[1]}"`);
}
