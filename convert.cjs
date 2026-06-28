const fs = require('fs');
const https = require('https');
const path = require('path');

const htmlPath = path.join(__dirname, 'downloaded_screen.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

// Find all img tags and download images
const imgRegex = /<img[^>]+src="([^">]+)"/g;
let match;
let imgUrls = [];
while ((match = imgRegex.exec(html)) !== null) {
    if (match[1].startsWith('http')) {
        imgUrls.push(match[1]);
    }
}

// deduplicate
imgUrls = [...new Set(imgUrls)];

const publicImagesDir = path.join(__dirname, 'public', 'images', 'main');
if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
}

async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function run() {
    let newHtml = html;
    let imgCounter = 1;
    for (const url of imgUrls) {
        const ext = 'png';
        const filename = `main-img-${imgCounter}.${ext}`;
        const dest = path.join(publicImagesDir, filename);
        console.log(`Downloading ${url} to ${dest}`);
        await downloadImage(url, dest);
        newHtml = newHtml.split(url).join(`/images/main/${filename}`);
        imgCounter++;
    }

    // Extract body content
    const bodyMatch = newHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let bodyContent = bodyMatch ? bodyMatch[1] : newHtml;

    // Convert HTML to JSX
    bodyContent = bodyContent.replace(/class="/g, 'className="');
    bodyContent = bodyContent.replace(/stroke-width="/g, 'strokeWidth="');
    bodyContent = bodyContent.replace(/stroke-linecap="/g, 'strokeLinecap="');
    bodyContent = bodyContent.replace(/stroke-linejoin="/g, 'strokeLinejoin="');
    bodyContent = bodyContent.replace(/fill-rule="/g, 'fillRule="');
    bodyContent = bodyContent.replace(/clip-rule="/g, 'clipRule="');
    bodyContent = bodyContent.replace(/<!--/g, '{/*');
    bodyContent = bodyContent.replace(/-->/g, '*/}');
    bodyContent = bodyContent.replace(/<img(.*?)>/g, '<img$1 />');
    bodyContent = bodyContent.replace(/<br>/g, '<br />');
    bodyContent = bodyContent.replace(/<input(.*?)>/g, '<input$1 />');
    bodyContent = bodyContent.replace(/style="(.*?)"/g, (match, p1) => {
        return `style={{}}`; // Simplify styles
    });

    // Replace a href="/" with Link to="/"
    bodyContent = bodyContent.replace(/<a ([^>]*)href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g, (match, p1, p2, p3, p4) => {
        return `<Link ${p1}to="${p2}"${p3}>${p4}</Link>`;
    });

    const jsx = `import { Link } from 'react-router-dom';

export default function HomePage() {
    return (
        <div className="text-on-surface smooth-scroll font-body-md overflow-x-hidden bg-surface-dim">
            ${bodyContent}
        </div>
    );
}
`;

    fs.writeFileSync(path.join(__dirname, 'src', 'pages', 'HomePage.tsx'), jsx);
    console.log('Conversion complete.');
}

run().catch(console.error);
