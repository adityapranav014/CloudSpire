import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

// ---------------------------------------------------------------------------
// Reusable PDF generator — CloudSpire
//
//   • Tries Puppeteer (headless Chrome) first
//   • If Chrome is unavailable (e.g. Render free tier), gracefully falls back
//     to returning the styled HTML buffer directly. The controller will send
//     it as an .html attachment; users can Ctrl+P → Save as PDF in the browser.
//   • Returns a Buffer. Buffer._isHtmlFallback = true when using the fallback.
//   • Browser is ALWAYS closed — even on error (finally block)
// ---------------------------------------------------------------------------

/**
 * Converts an HTML string into a PDF.
 *
 * @param {string}  html         — Full HTML document to render
 * @param {object}  [options]    — Generation options
 * @returns {Promise<Buffer>}      PDF Buffer, or HTML Buffer as graceful fallback
 */
export const generatePDF = async (html, options = {}) => {
    const {
        outputPath = null,
        format = "A4",
        margin = { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
        printBackground = true,
        landscape = false,
        headerTemplate = "",
        footerTemplate = "",
        displayHeaderFooter = false,
    } = options;

    let browser = null;

    try {
        // Dynamic import so missing module doesn't crash the whole server
        const puppeteer = await import("puppeteer").then(m => m.default || m);

        browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--font-render-hinting=none",
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "domcontentloaded" });

        const pdfOptions = { format, margin, printBackground, landscape };
        if (displayHeaderFooter) {
            pdfOptions.displayHeaderFooter = true;
            pdfOptions.headerTemplate = headerTemplate;
            pdfOptions.footerTemplate = footerTemplate;
        }

        const pdfUint8 = await page.pdf(pdfOptions);
        const buffer = Buffer.from(pdfUint8);

        if (outputPath) {
            await mkdir(dirname(outputPath), { recursive: true });
            await writeFile(outputPath, buffer);
            return outputPath;
        }

        return buffer;
    } catch (puppeteerErr) {
        // ---- Graceful fallback: return styled HTML buffer ----
        // Render free tier has no Chrome. We return the HTML so the controller
        // can send it as a downloadable .html file. Users open it and Ctrl+P → PDF.
        console.warn("[pdfGenerator] Puppeteer/Chrome unavailable, using HTML fallback:", puppeteerErr.message);

        const htmlBuffer = Buffer.from(html, "utf-8");
        // Tag the buffer so the controller can set the correct Content-Type/filename
        htmlBuffer._isHtmlFallback = true;

        if (outputPath) {
            const htmlPath = outputPath.replace(/\.pdf$/i, ".html");
            await mkdir(dirname(htmlPath), { recursive: true });
            await writeFile(htmlPath, htmlBuffer);
            return htmlPath;
        }

        return htmlBuffer;
    } finally {
        if (browser) {
            try { await browser.close(); } catch (_) {}
        }
    }
};
