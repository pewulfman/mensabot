const conf       = require('./configs');
const log        = require('./mods/log');
const puppeteer  = require('puppeteer');
const cheerio    = require('cheerio');



async function getInfo(menid) {
	let browser, page;
	let rowUser = {};
	rowUser.mid = menid;

	try {
        log.debug("Launching web browser");
        browser = await puppeteer.launch({
            headless: conf.web.headless,
    //        executablePath: 'chromium-browser',
            userDataDir: 'puppetdir'
        });
        log.debug("Opening new page");
        page = await browser.newPage();
        page.setDefaultTimeout(50 * 1000);
    } catch (err) {
        log.error("Failed to launch Web Browser with: " + err.message);
        return;
    }

    const infoPageUrl = conf.web.url + rowUser.mid;
    log.debug("  Going to " + infoPageUrl);
    try {
        await page.goto(infoPageUrl);
    } catch(err) {
        log.error(err.message);
        return;
    }
    log.debug('  Current page is ' + page.url());

    // need authentification?
    if (page.url().startsWith('https://auth')) {
        try {
            await page.type("input[name='user']",     conf.web.userid);
            await page.type("input[name='password']", conf.web.password);
            await page.click('.form > .btn');
        } catch(err) {
            log.error("Error while login: " + err.message);
            return;
        }

        try {
            await page.waitForNavigation();
        } catch(err) {
            log.error("Error after login: " + err.message);
        }
        log.debug('  New page url: ' + page.url());
    }

    // we get the content of the page
    // let bodyHTML = await page.evaluate(() => document.documentElement.outerHTML);
    let bodyHTML = await page.evaluate(() => document.body.innerHTML);
    browser.close();

    // get rid of all the trash
    bodyHTML = bodyHTML.slice(bodyHTML.indexOf('<div id="identite">'));
    bodyHTML = bodyHTML.slice(0, bodyHTML.indexOf('<!-- #content'));
    log.debug(bodyHTML);

    // parse as xml tree
    const menxml = cheerio.load(bodyHTML);
    log.debug(menxml('#identite').text());
    

    return;

    // get data
    try {
        let identite = await page.$eval('#identite', el => el.innerText);
        identite = identite.split('\n')[0].split('-');
        rowUser.region = identite.pop().trim();
        identite.pop();
        rowUser.real_name = identite.join('-').trim();
    } catch (err) {
        log.warning("Mensa member does not seem to have a name. We probably don't have a good Mensa id");
        log.error(err.message);

        return;
    }

    try {
        rowUser.email = await page.$eval('div.email a', el => el.innerText);
        rowUser.email = rowUser.email.trim().split(' ').join('');
    } catch (err) {
        console.log("Mensa member does not seem to have an email address.");
        console.log(err.message);
    }

    console.log('Found member info: ' + rowUser.real_name + ' - ' + rowUser.region + ' - ' + rowUser.email);
    browser.close();

}


getInfo('11248');

