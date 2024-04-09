import puppeteer from 'puppeteer';
import NodeCache from 'node-cache';
import { createTransport } from 'nodemailer'

import dotenv from 'dotenv';

let cache = new NodeCache();
dotenv.config();
const transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
    },
});


async function sendEmail(to, subject, text) {
    try {
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: to,
            subject: subject,
            text: text
        }
        await transporter.sendMail(mailOptions);
        console.log(`enviado`);
    } catch (error) {
        console.error(' error al enviar el gmail:', error);
    }
}

async function checkNewVideo() {
    const channel = "https://www.youtube.com/@duki/videos";

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(channel);
        const videoElement = await page.waitForSelector('.style-scope ytd-rich-grid-row');
        const latestVideoTitle = await page.evaluate(() => {
            const titleElement = document.querySelector('.style-scope ytd-rich-grid-media #video-title');
            return titleElement ? titleElement.textContent.trim() : "";
        });
        const videoUrl = await videoElement.evaluate(el => el.querySelector('a').href);

        const previousVideoTitle = cache.get('previousVideoTitle');
        if (latestVideoTitle !== previousVideoTitle) {
            console.log("SE CAMBIO EL NOMBRE DEL VIDEO!", videoUrl);
            cache.set('previousVideoTitle', latestVideoTitle);
            await sendEmail("savarinomarco50@gmail.com", "Nuevo Tema Del duko!", `Name: ${latestVideoTitle} url: ${videoUrl}`)
        }
        await browser.close();
    } catch (error) {
        console.error("Error checking for new video:", error);
        return null;
    }
}





async function main() {
    while (true) {
        try {
            await checkNewVideo();
            console.log("Waiting for the next check...");
            await new Promise(resolve => setTimeout(resolve, 60 * 1000));
        } catch (error) {
            console.error("Error in main loop:", error);
        }
    }
}


main()