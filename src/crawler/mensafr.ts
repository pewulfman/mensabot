
import {configs as conf} from '../configs'

import * as cheerio    from 'cheerio'
import * as needle     from 'needle'

async function getToken () : Promise<string | undefined> {
    const resp =
        await needle("get","https://auth.mensa-france.net/");

    if(resp.statusCode === 200) {
        const $ = cheerio.load(resp.body);
    const token = $('#token').attr('value');
    return token
    } 
    throw new Error ("can't access authentification portail")

}

async function getAuthCookies () {
    console.log ("geting cookie");
    const token = await getToken ();
    const resp = 
        await needle("post","https://auth.mensa-france.net/",
            {token,
             user:conf.mensa_fr_db.userid,
             password:conf.mensa_fr_db.password
            });
    return resp.cookies
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
    throw new Error("unknown color")
}

export async function getMemberInfo(mensaId:number, cookies : any | undefined) {

    console.log ("Getting info for member :" + mensaId)

    const infoPageUrl = conf.mensa_fr_db.url + mensaId;
    
    if (cookies == undefined) {
        console.log ("cookies unknown")
        cookies = await getAuthCookies();
        console.log ("new cookies " + cookies);
    }
    try {
        console.log ("Get : " + infoPageUrl);
        let resp = await needle ("get", infoPageUrl,{cookies});
        console.log ("response" + resp.statusCode)
        const $ = cheerio.load(resp.body);
        let identity = $('#identite').text().match(/(?:Monsieur|Madame) (?<name>[a-zA-Z- ]+) - [0-9]+ - (?<region>[A-Z]+)/);
        if (!identity) {
            throw new Error ()
        }
        let name = identity.groups!['name'];
        let region = identity.groups!['region'];
        let email = $('div.email a').text();
        let membership = isActive ($('#identite > span:nth-child(1)'));
        console.log('Found member info: ' + name + ' - ' + region + ' - ' + email + ' - ' + membership);
        return {name,email,region,membership}
    }
    catch (err) {
        throw err 
    }



}