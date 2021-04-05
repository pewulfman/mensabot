
import {configs as conf} from '../configs'

import * as cheerio    from 'cheerio'
import * as needle     from 'needle'

async function getToken (tries = 0, maxTries = 3) : Promise<string> {
    const resp =
        await needle("get","https://auth.mensa-france.net/");

    if(resp.statusCode === 200) {
        const $ = cheerio.load(resp.body);
        const token = $('#token').attr('value');
        if (!token) throw new Error (`cannot get csrf token`)
        return token
    }
    if (tries == maxTries) throw new Error ("can't access authentification portail")
    return await getToken (tries + 1, maxTries);
}

async function getAuthCookies (tries = 0, maxTries = 3) : Promise <{[name : string] : any} > {
    console.log ("geting cookie");
    const token = await getToken ();
    const resp = 
        await needle("post","https://auth.mensa-france.net/",
            {token,
             user:conf.mensa_fr_db.userid,
             password:conf.mensa_fr_db.password
            });
    if (resp.statusCode === 302 && resp.cookies) return resp.cookies
    if (tries = maxTries) throw new Error ("cant't authentify to mensaFr");
    return await getAuthCookies (tries+1,maxTries);
}

function isActive (html : cheerio.Cheerio) {

    const redcolor = "#C6006A";
    const greencolor = "#006A96";

    let style = html.attr('style');
    if (! style) throw new Error ("The html doesn't have a style attribute");
    let match = style.match(/color:(#[0-9A-F]{6})/);
    if (! match) throw new Error ("Cannot find color in syle");
    let color = match[1];
    if (color == redcolor) return false
    if (color == greencolor) return true
    throw new Error("unknown color, cannot estimate membership");
}

interface UserData {
    name       : string,
    email      : string,
    region     : string,
    membership : boolean
}
/**
 * throws errors
 * @param mensaId 
 * @param cookies 
 * @returns 
 */
export async function getMemberInfo(mensaId:number, cookies? : any, tries = 0, maxTries = 3) : Promise<UserData> {

    console.log ("Getting info for member :" + mensaId)

    const infoPageUrl = conf.mensa_fr_db.url + mensaId;
    
    if (cookies == undefined) {
        console.log ("cookies unset")
        cookies = await getAuthCookies();
        console.log ("new cookies " + cookies);
    }
    console.log (`Fetching page : ${infoPageUrl}`);
    let resp = await needle ("get", infoPageUrl,{cookies});
    console.log (`response ${resp.statusCode}`)
    if (resp.statusCode === 200) {
        const $ = cheerio.load(resp.body);
        let identity = $('#identite').text().match(/(?:Monsieur|Madame) (?<name>[a-zA-Z- ]+) - [0-9]+ - (?<region>[A-Z]+)/);
        if (!identity) {
            throw new Error (`Can't retrive identity`);
        }
        let name = identity.groups!['name'];
        let region = identity.groups!['region'];
        let email = $('div.email a').text();
        let membership = isActive ($('#identite > span:nth-child(1)'));
        console.log('Found member info: ' + name + ' - ' + region + ' - ' + email + ' - ' + membership);
        return {name,email,region,membership}
    }
    if (tries == maxTries) throw new Error (`Can't access member page`);
    return await getMemberInfo (mensaId,undefined,tries+1,maxTries)
}