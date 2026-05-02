import puppeteer from "puppeteer";
import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

// ---------------------------------------------------------------------------
// Reusable Puppeteer PDF generator.
//
//   • Returns a Buffer by default
//   • If `outputPath` is provided, also writes to disk and returns the path
//   • Browser is ALWAYS closed — even on error (finally block)
//   • Sandbox flags make it safe for Docker / CI environments
// ---------------------------------------------------------------------------

/** @typedef {import('puppeteer').PDFOptions} PDFOptions */

/**
 * Converts an HTML string into a PDF.
 *
 * @param {string}  html                  — Full HTML document to render
 * @param {object}  [options]             — Generation options
 * @param {string}  [options.outputPath]  — If set, writes the PDF to this absolute path
 *                                           and returns the path string instead of a Buffer
 * @param {"A4"|"Letter"|"Legal"|"Tabloid"} [options.format="A4"]
 * @param {object}  [options.margin]      — Page margins
 * @param {string}  [options.margin.top="20mm"]
 * @param {string}  [options.margin.right="15mm"]
 * @param {string}  [options.margin.bottom="20mm"]
 * @param {string}  [options.margin.left="15mm"]
 * @param {boolean} [options.printBackground=true]
 * @param {boolean} [options.landscape=false]
 * @param {string}  [options.headerTemplate]  — Puppeteer header HTML
 * @param {string}  [options.footerTemplate]  — Puppeteer footer HTML
 * @param {boolean} [options.displayHeaderFooter=false]
 *
 * @returns {Promise<Buffer|string>}  PDF Buffer, or the outputPath if a file was saved
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

    // ---- 1. Launch headless browser -----------------------------------
    let browser = null;

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--font-render-hinting=none",
            ],
        });

        // ---- 2. Create new page ---------------------------------------
        const page = await browser.newPage();

        // ---- 3. Set HTML content --------------------------------------
        await page.setContent(html, { waitUntil: "networkidle0" });

        // ---- 4. Generate PDF ------------------------------------------
        /** @type {PDFOptions} */
        const pdfOptions = {
            format,
            margin,
            printBackground,
            landscape,
        };

        if (displayHeaderFooter) {
            pdfOptions.displayHeaderFooter = true;
            pdfOptions.headerTemplate = headerTemplate;
            pdfOptions.footerTemplate = footerTemplate;
        }

        const pdfUint8 = await page.pdf(pdfOptions);
        const buffer = Buffer.from(pdfUint8);

        // ---- 5. Optionally save to disk -------------------------------
        if (outputPath) {
            await mkdir(dirname(outputPath), { recursive: true });
            await writeFile(outputPath, buffer);
            return outputPath;
        }

        return buffer;
    } finally {
        // Always close the browser — no leaked Chrome processes
        if (browser) await browser.close();
    }
};
