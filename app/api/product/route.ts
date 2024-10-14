import puppeteer from 'puppeteer';
const fs = require('fs').promises;
import translate from '@iamtraction/google-translate';

export async function POST(req: Request) {
    const body = await req.json();
    const {test} = body;

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    await page.goto(test, {
        waitUntil: "domcontentloaded",
    });

    const cookiesString = await fs.readFile('./cookies.json');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);

    await page.waitForSelector('.SkuContent--valueItemText--21q8M9E.f-els-1', { visible: true });

    const data = await page.evaluate(() => {
        const models = document.querySelector('.SkuContent--skuItem--3Nb1tMw');
        const elements = models?.querySelectorAll('.SkuContent--valueItemText--21q8M9E.f-els-1');

        // @ts-ignore
        return Array.from(elements).map(element => {
            return (element as HTMLElement).innerText.trim();
        });
    });


    //console.log(data);

    var translatedArr: string[] = [];

    const translateText = async(options: any) => {
        const translationPromises = data.map(async (item) => {
            try {
                const res = await translate(item, options);
                //console.log(res.text);
                return res.text; 
            } catch (err) {
                console.log(err);
                return '';
            }
        })

        const array = await Promise.all(translationPromises);
        return array;   
    }

    translatedArr = await translateText({to: "en"});

    console.log(translatedArr);
    return Response.json({translatedArr});
}