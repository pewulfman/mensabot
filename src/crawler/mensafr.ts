
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

interface UserData {
    firstname  : string,
    lastname   : string,
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

    console.log (`Getting info for member : ${mensaId}`)

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
        let identity = $('#identite').text().match(/(?:Monsieur|Madame|Mademoiselle) (?<firstname>(?:[A-ZÉÈÊËÏ][a-zàéèêëçï]+[-. ]?)+) (?<lastname>[A-ZÉÈÊËÏ -]+) - [0-9]+ - (?<region>[A-Z]+)/);
        if (!identity) {
            throw new Error (`Can't retrive identity ${$('#identite').text()}`);
        }
        let firstname = identity.groups!['firstname'];
        let lastname = identity.groups!['lastname'];
        let region = identity.groups!['region'];
        let email = $('div.email a').text();
        let membership = await checkMembershipOne (mensaId,email,cookies);
        console.log(`Found member info: + ${firstname} ${lastname} - ${region} - ${email} - ${membership}`);
        return {firstname,lastname,email,region,membership}
    }
    if (tries == maxTries) throw new Error (`Can't access member page`);
    return await getMemberInfo (mensaId,undefined,tries+1,maxTries)
}

export async function checkMembershipOne (mensaId: number,email : string, cookies? : any, tries = 0, maxTries = 3) : Promise<boolean> {
    let member = false
    if (cookies == undefined) {
        console.log ("cookies unset")
        cookies = await getAuthCookies();
        console.log ("new cookies " + cookies);
    }
    const membersSearchQuery =
        `https://mensa-france.net/membres/annuaire/?recherche=(region:all)(type_contact:mail)(contact:${email})(cotisation:oui)`

    console.log(`Fetching page : ${membersSearchQuery}`);
    let resp = await needle ("get", membersSearchQuery, {cookies});
    console.log (`response ${resp.statusCode}`);
    if (resp.statusCode === 200) {
        const $ = cheerio.load(resp.body);
        let table = $("#resultats");
        table.find('tbody > tr').each ((_idx,elem) => {
            if ($(elem).find('td:nth-child(1)').text() == mensaId.toString()) 
                member = true
        })
       return member
    }
    if (tries == maxTries) throw new Error (`Can't access member page`);
    return await checkMembershipOne (mensaId,email,undefined,tries+1,maxTries)
}